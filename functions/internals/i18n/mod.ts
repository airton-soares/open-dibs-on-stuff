import type { MessageKey, Params } from "./catalog.ts";
import { CATALOGS, DEFAULT_LOCALE, type Locale } from "./registry.ts";
import { LOCALE } from "./locale.ts";

export type { Catalog, MessageKey, Params } from "./catalog.ts";
export { CATALOGS, DEFAULT_LOCALE, type Locale, LOCALES } from "./registry.ts";
export { LOCALE } from "./locale.ts";

const PLACEHOLDER = /\{(\w+)\}/g;

// Placeholder sem valor fica visivel no texto de proposito: um `{resource}` aparecendo no Slack
// mostra o erro sem derrubar a reserva. O teste de paridade em i18n_test.ts pega isso antes.
export function t(key: MessageKey, params: Params = {}, locale: Locale = LOCALE): string {
  const template = CATALOGS[locale][key] ?? CATALOGS[DEFAULT_LOCALE][key];
  return template.replace(
    PLACEHOLDER,
    (match, name) => name in params ? String(params[name]) : match,
  );
}
