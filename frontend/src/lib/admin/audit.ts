import fs from "fs";
import path from "path";
import { AuditLogEntry } from "./types";

const CONFIG_DIR = path.join(process.cwd(), "public", "forecasts", "config");
const AUDIT_FILE = path.join(CONFIG_DIR, "audit_log.json");

let inMemoryAuditLogs: AuditLogEntry[] = [
  {
    id: "audit-init-1",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    username: "system",
    action: "System Initialization",
    target: "ForecastPH Admin",
    result: "success",
    details: "Initialized default administrative configuration",
  },
];

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      const data = await fs.promises.readFile(AUDIT_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        inMemoryAuditLogs = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[audit] Failed to read audit log file, using memory logs.", err);
  }
  return inMemoryAuditLogs;
}

export async function recordAudit(
  username: string,
  action: string,
  target: string,
  result: "success" | "failed" = "success",
  details?: string
): Promise<AuditLogEntry> {
  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    username: username || "anonymous",
    action,
    target,
    result,
    details,
  };

  const logs = await getAuditLogs();
  const updatedLogs = [entry, ...logs].slice(0, 500); // Keep last 500 records

  inMemoryAuditLogs = updatedLogs;

  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      await fs.promises.mkdir(CONFIG_DIR, { recursive: true });
    }
    await fs.promises.writeFile(AUDIT_FILE, JSON.stringify(updatedLogs, null, 2), "utf-8");
  } catch (err) {
    console.warn("[audit] Could not persist audit log to disk, saved in memory.", err);
  }

  return entry;
}
