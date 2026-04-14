/**
 * Structured audit logger.
 * Writes JSON-formatted log entries to stdout so Cloud Logging can pick them up.
 * Replaces bare console.error() calls throughout the server.
 */
export function auditLog(
  event: string,
  data: Record<string, unknown> = {}
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    severity: "INFO",
    event,
    ...data,
  };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

export function auditError(
  event: string,
  err: unknown,
  data: Record<string, unknown> = {}
): void {
  const message =
    err instanceof Error ? err.message : "Unknown error";
  const entry = {
    timestamp: new Date().toISOString(),
    severity: "ERROR",
    event,
    error: message,
    ...data,
  };
  process.stderr.write(JSON.stringify(entry) + "\n");
}
