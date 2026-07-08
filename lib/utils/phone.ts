/** Builds a `tel:` href from a phone number, stripping display formatting. */
export function toTelHref(phoneNumber: string): string {
  const digitsAndPlus = phoneNumber.replace(/[^\d+]/g, "");
  return `tel:${digitsAndPlus}`;
}

export const EMERGENCY_NUMBER = "999";
