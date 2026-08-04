import { assertEquals, assertStringIncludes } from "@std/assert";
import { CATALOGS, DEFAULT_LOCALE, LOCALE, LOCALES, t } from "./mod.ts";
import { ptBR } from "./locales/pt-BR.ts";
import { TRIGGER_NAME_KEYS } from "../../../scripts/trigger_names.ts";

const REFERENCE_KEYS = Object.keys(ptBR).sort();

function placeholders(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

Deno.test("todo idioma registrado tem exatamente as chaves do catalogo de referencia", () => {
  for (const locale of LOCALES) {
    assertEquals(
      Object.keys(CATALOGS[locale]).sort(),
      REFERENCE_KEYS,
      `catalogo de ${locale} divergente do pt-BR`,
    );
  }
});

Deno.test("nenhuma traducao vem vazia", () => {
  for (const locale of LOCALES) {
    for (const [key, value] of Object.entries(CATALOGS[locale])) {
      assertEquals(value.trim().length > 0, true, `${locale} tem ${key} vazio`);
    }
  }
});

Deno.test("cada chave usa os mesmos placeholders em todos os idiomas", () => {
  for (const locale of LOCALES) {
    for (const key of REFERENCE_KEYS) {
      assertEquals(
        placeholders(CATALOGS[locale][key as keyof typeof ptBR]),
        placeholders(ptBR[key as keyof typeof ptBR]),
        `${locale} mudou os placeholders de ${key}`,
      );
    }
  }
});

Deno.test("t interpola os parametros informados", () => {
  assertStringIncludes(t("msg.queue.left", { resource: "cards-stg" }), "cards-stg");
  assertStringIncludes(
    t("msg.queue.position", { position: 2, total: 5 }, "en"),
    "number 2 in a queue of 5",
  );
});

Deno.test("t deixa o placeholder visivel quando o parametro nao vem", () => {
  assertStringIncludes(t("msg.queue.left", {}), "{resource}");
});

Deno.test("t usa o idioma pedido e cai no LOCALE da instalacao por padrao", () => {
  assertEquals(t("field.service", {}, "pt-BR"), "Serviço");
  assertEquals(t("field.service", {}, "en"), "Service");
  assertEquals(t("field.service"), t("field.service", {}, LOCALE));
});

Deno.test("t cai no idioma padrao quando a traducao nao tem a chave", () => {
  const catalog = CATALOGS.en as Record<string, string>;
  const saved = catalog["msg.expired"];
  delete catalog["msg.expired"];
  try {
    assertEquals(
      t("msg.expired", { resource: "cards-stg" }, "en"),
      t("msg.expired", { resource: "cards-stg" }, DEFAULT_LOCALE),
    );
  } finally {
    catalog["msg.expired"] = saved;
  }
});

Deno.test("o LOCALE da instalacao e um idioma registrado", () => {
  assertEquals(LOCALES.includes(LOCALE), true);
});

Deno.test("todo arquivo em locales/ esta registrado no registry", async () => {
  const found: string[] = [];
  for await (const entry of Deno.readDir(new URL("./locales", import.meta.url))) {
    if (entry.isFile && entry.name.endsWith(".ts")) found.push(entry.name.replace(/\.ts$/, ""));
  }
  assertEquals(found.sort(), [...LOCALES].sort());
});

Deno.test("todo link trigger tem chave de nome para o setup encontrar", async () => {
  const found: string[] = [];
  for await (const entry of Deno.readDir(new URL("../../../triggers", import.meta.url))) {
    if (entry.isFile && entry.name.endsWith("_link.ts")) found.push(entry.name);
  }
  assertEquals(found.sort(), Object.keys(TRIGGER_NAME_KEYS).sort());
});
