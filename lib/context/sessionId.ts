const SESSION_ID_KEY = "lifegift:sessionId";

/**
 * The anonymous session identifier sent with every /api/chat request so the
 * server can upsert a PatientSession row per browser — a UUID in
 * localStorage, never a login. Created lazily on first use and then stable
 * for the lifetime of that browser's data (cleared only if the patient
 * clears site data, same as the rest of PatientContext).
 */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(SESSION_ID_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(SESSION_ID_KEY, created);
  return created;
}
