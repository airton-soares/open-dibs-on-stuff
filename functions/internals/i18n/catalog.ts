import { ptBR } from "./locales/pt-BR.ts";

export type MessageKey = keyof typeof ptBR;

// Anotar um catalogo com este tipo faz o `deno check` reclamar de chave faltando, chave sobrando
// ou nome de chave errado, entao uma traducao incompleta nao passa no CI.
export type Catalog = Record<MessageKey, string>;

export type Params = Record<string, string | number>;
