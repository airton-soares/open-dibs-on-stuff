import type { Catalog } from "./catalog.ts";
import { ptBR } from "./locales/pt-BR.ts";
import { en } from "./locales/en.ts";

// Para registrar um idioma novo: importe o catalogo acima e adicione uma linha aqui.
// O codigo usado aqui e o mesmo que vai em `./setup.sh --locale <codigo>`.
export const CATALOGS = {
  "pt-BR": ptBR,
  "en": en,
} satisfies Record<string, Catalog>;

// Locale so aceita codigo registrado acima, entao um `--locale` invalido quebra no `deno check`
// em vez de virar mensagem faltando em producao.
export type Locale = keyof typeof CATALOGS;

export const DEFAULT_LOCALE: Locale = "pt-BR";

export const LOCALES = Object.keys(CATALOGS) as Locale[];
