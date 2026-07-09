import { getRequestConfig } from "next-intl/server";

/**
 * Hebrew-only for now, per the plan's Localization section — English
 * (messages/en.json) is kept structurally in sync but dormant, so reviving
 * it later is flipping this constant, not a second rewrite. No locale
 * routing/switcher exists yet.
 */
const ACTIVE_LOCALE = "he";

export default getRequestConfig(async () => {
  return {
    locale: ACTIVE_LOCALE,
    messages: (await import(`../messages/${ACTIVE_LOCALE}.json`)).default,
  };
});
