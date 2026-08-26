import crypto from "crypto";
import fs from "fs";
import path from "path";
import { AuditLogEntry } from "./types";
import { isDatabaseConfigured, ensureDatabaseInitialized, query } from "@/lib/db";

const CONFIG_DIR = path.join(process.cwd(), "public", "forecasts", "config");
const AUDIT_FILE = path.join(CONFIG_DIR, "audit_log.json");
const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

export interface DbAuditRecord {
  id: string;
  eventId: string;
  occurredAt: string;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  result: "success" | "failed";
  details?: string;
  previousHash: string;
  recordHash: string;
}

export function computeRecordHash(record: {
  eventId: string;
  occurredAt: string;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  result: string;
  details?: string;
  previousHash: string;
}): string {
  const canonical = [
    record.eventId,
    record.occurredAt,
    record.actor,
    record.action,
    record.targetType,
    record.targetId,
    record.result,
    record.details || "",
    record.previousHash,
  ].join("|");

  return crypto.createHash("sha256").update(canonical, "utf-8").digest("hex");
}

let inMemoryAuditLogs: DbAuditRecord[] = [];

/**
 * Initializes genesis record in memory if empty
 */
function getInMemoryLogs(): DbAuditRecord[] {
  if (inMemoryAuditLogs.length === 0) {
    const genesisTime = new Date("2026-08-19T08:00:00.000Z").toISOString();
    const genesisEventId = "evt-genesis-00001";
    const genesisHash = computeRecordHash({
      eventId: genesisEventId,
      occurredAt: genesisTime,
      actor: "system",
      action: "ADMIN_INITIALIZATION",
      targetType: "System",
      targetId: "ForecastPH Admin",
      result: "success",
      details: "Initialized default configuration and security hash chain",
      previousHash: GENESIS_HASH,
    });

    inMemoryAuditLogs = [
      {
        id: "audit-init-1",
        eventId: genesisEventId,
        occurredAt: genesisTime,
        actor: "system",
        action: "ADMIN_INITIALIZATION",
        targetType: "System",
        targetId: "ForecastPH Admin",
        result: "success",
        details: "Initialized default configuration and security hash chain",
        previousHash: GENESIS_HASH,
        recordHash: genesisHash,
      },
    ];
  }
  return inMemoryAuditLogs;
}

/**
 * Retrieves audit logs from PostgreSQL (or memory fallback), mapped to AuditLogEntry.
 */
export async function getAuditLogs(limit = 200): Promise<AuditLogEntry[]> {
  if (isDatabaseConfigured()) {
    try {
      await ensureDatabaseInitialized();
      const rows = await query(
        `SELECT id, event_id, occurred_at, actor, action, target_type, target_id,
                result, details, previous_hash, record_hash
         FROM audit_logs
         ORDER BY occurred_at DESC
         LIMIT $1`,
        [limit]
      );

      if (rows.length > 0) {
        return rows.map((r: any): AuditLogEntry => ({
          id: r.id,
          timestamp: r.occurred_at ? new Date(r.occurred_at).toISOString() : new Date().toISOString(),
          username: r.actor,
          action: r.action,
          target: r.target_type && r.target_id ? `${r.target_type}: ${r.target_id}` : r.target_type || r.target_id || "System",
          result: r.result,
          details: r.details || undefined,
        }));
      }
    } catch (err) {
      console.error("[audit] Failed to query audit logs from DB:", err);
    }
  }

  // File / memory fallback
  const memLogs = getInMemoryLogs();
  return memLogs.slice(0, limit).map((r) => ({
    id: r.id,
    timestamp: r.occurredAt,
    username: r.actor,
    action: r.action,
    target: `${r.targetType}: ${r.targetId}`,
    result: r.result,
    details: r.details,
  }));
}

/**
 * Appends an immutable audit log record with cryptographic SHA-256 hash chaining.
 */
export async function recordAudit(
  actor: string,
  action: string,
  target: string,
  result: "success" | "failed" = "success",
  details?: string
): Promise<AuditLogEntry> {
  const occurredAt = new Date().toISOString();
  const eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  let previousHash = GENESIS_HASH;

  // 1. Determine previous hash from PostgreSQL
  if (isDatabaseConfigured()) {
    try {
      await ensureDatabaseInitialized();
      const lastRows = await query(
        `SELECT record_hash FROM audit_logs ORDER BY occurred_at DESC, created_at DESC LIMIT 1`
      );
      if (lastRows.length > 0 && lastRows[0].record_hash) {
        previousHash = lastRows[0].record_hash;
      }
    } catch (err) {
      console.warn("[audit] Could not get latest previous hash from DB, checking memory:", err);
    }
  } else {
    const memLogs = getInMemoryLogs();
    if (memLogs.length > 0) {
      previousHash = memLogs[0].recordHash;
    }
  }

  const [targetType, ...targetIdParts] = target.includes(":") ? target.split(":") : ["System", target];
  const targetId = targetIdParts.join(":").trim() || target;

  const recordHash = computeRecordHash({
    eventId,
    occurredAt,
    actor: actor || "system",
    action,
    targetType: targetType.trim(),
    targetId: targetId.trim(),
    result,
    details,
    previousHash,
  });

  const record: DbAuditRecord = {
    id,
    eventId,
    occurredAt,
    actor: actor || "system",
    action,
    targetType: targetType.trim(),
    targetId: targetId.trim(),
    result,
    details,
    previousHash,
    recordHash,
  };

  // 2. Insert into PostgreSQL (strictly append-only)
  if (isDatabaseConfigured()) {
    try {
      await ensureDatabaseInitialized();
      await query(
        `INSERT INTO audit_logs (
          id, event_id, occurred_at, actor, action, target_type, target_id,
          result, details, previous_hash, record_hash, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
        [
          record.id,
          record.eventId,
          new Date(record.occurredAt),
          record.actor,
          record.action,
          record.targetType,
          record.targetId,
          record.result,
          record.details || null,
          record.previousHash,
          record.recordHash,
        ]
      );
    } catch (err) {
      console.error("[audit] Failed to append audit record to DB:", err);
    }
  }

  // Update in-memory & file cache
  inMemoryAuditLogs = [record, ...getInMemoryLogs()].slice(0, 500);

  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      await fs.promises.mkdir(CONFIG_DIR, { recursive: true });
    }
    const publicList = inMemoryAuditLogs.map((r) => ({
      id: r.id,
      timestamp: r.occurredAt,
      username: r.actor,
      action: r.action,
      target: `${r.targetType}: ${r.targetId}`,
      result: r.result,
      details: r.details,
    }));
    await fs.promises.writeFile(AUDIT_FILE, JSON.stringify(publicList, null, 2), "utf-8");
  } catch (err) {
    // Ignore file write errors
  }

  return {
    id: record.id,
    timestamp: record.occurredAt,
    username: record.actor,
    action: record.action,
    target: `${record.targetType}: ${record.targetId}`,
    result: record.result,
    details: record.details,
  };
}

/**
 * Validates the complete cryptographic SHA-256 hash chain of all audit records.
 * Returns valid = true if every record matches its expected hash and links to the previous record.
 */
export async function verifyAuditIntegrity(): Promise<{
  valid: boolean;
  totalRecords: number;
  message: string;
  brokenIndex?: number;
}> {
  let records: DbAuditRecord[] = [];

  if (isDatabaseConfigured()) {
    try {
      await ensureDatabaseInitialized();
      const rows = await query(
        `SELECT id, event_id, occurred_at, actor, action, target_type, target_id,
                result, details, previous_hash, record_hash
         FROM audit_logs
         ORDER BY occurred_at ASC, created_at ASC`
      );

      records = rows.map((r: any): DbAuditRecord => ({
        id: r.id,
        eventId: r.event_id,
        occurredAt: new Date(r.occurred_at).toISOString(),
        actor: r.actor,
        action: r.action,
        targetType: r.target_type,
        targetId: r.target_id,
        result: r.result,
        details: r.details || undefined,
        previousHash: r.previous_hash,
        recordHash: r.record_hash,
      }));
    } catch (err) {
      console.error("[audit] Failed to query audit chain for verification:", err);
      return { valid: false, totalRecords: 0, message: "Database query failed during verification." };
    }
  } else {
    records = [...getInMemoryLogs()].reverse();
  }

  if (records.length === 0) {
    return { valid: true, totalRecords: 0, message: "Audit log is empty. Integrity verified." };
  }

  let priorHash = GENESIS_HASH;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];

    // Verify link to previous record
    if (r.previousHash !== priorHash) {
      return {
        valid: false,
        totalRecords: records.length,
        brokenIndex: i,
        message: `Hash link mismatch at record #${i + 1} (${r.id}): expected previous hash ${priorHash}, found ${r.previousHash}`,
      };
    }

    // Recalculate and verify record hash
    const expectedHash = computeRecordHash({
      eventId: r.eventId,
      occurredAt: r.occurredAt,
      actor: r.actor,
      action: r.action,
      targetType: r.targetType,
      targetId: r.targetId,
      result: r.result,
      details: r.details,
      previousHash: r.previousHash,
    });

    if (r.recordHash !== expectedHash) {
      return {
        valid: false,
        totalRecords: records.length,
        brokenIndex: i,
        message: `Record hash tampering detected at record #${i + 1} (${r.id}): expected hash ${expectedHash}, found ${r.recordHash}`,
      };
    }

    priorHash = r.recordHash;
  }

  return {
    valid: true,
    totalRecords: records.length,
    message: `All ${records.length} audit records cryptographically verified with zero discrepancies.`,
  };
}
