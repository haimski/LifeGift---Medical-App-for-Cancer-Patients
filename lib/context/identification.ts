const IDENTIFICATION_ASKED_KEY = "lifegift:identificationAsked";

/**
 * Whether the progressive-identification prompt has already been shown
 * (filled in or explicitly skipped) this session — so it's asked at most
 * once, per the plan's "Once identified in a session, don't ask again" rule.
 * Deliberately tracks only "asked", not the answer itself: the name/contact
 * number the patient enters lives server-side on the PatientSession row
 * (see app/api/patient-session/identify/route.ts), not in localStorage.
 */
export function hasBeenAskedToIdentify(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(IDENTIFICATION_ASKED_KEY) === "true";
}

export function markAskedToIdentify(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(IDENTIFICATION_ASKED_KEY, "true");
}
