import type { Locale } from "./registry.ts";

// Idioma da instalacao. Fonte unica: `./setup.sh --locale <codigo>` reescreve esta linha e
// redeploya, entao mensagem, formulario e nome de atalho saem todos no mesmo idioma.
// Editar na mao tambem funciona; depois rode ./setup.sh.
export const LOCALE: Locale = "pt-BR";
