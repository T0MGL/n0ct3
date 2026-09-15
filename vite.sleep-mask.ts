import type { Plugin } from "vite";
import {
  SLEEP_MASK_DESCRIPTION,
  SLEEP_MASK_OG_IMAGE,
  SLEEP_MASK_TITLE,
  SLEEP_MASK_URL,
  sleepMaskJsonLd,
} from "./src/components/sleep-mask/seo";

// dist/sleep-mask.html: el mismo index.html que sale del build, con los mismos
// bundles y el mismo preloader, pero con el head del antifaz en lugar del de los
// lentes. vercel.json reescribe /sleep-mask a este archivo. No es un entry
// aparte de Vite porque copiar index.html dejaria dos preloaders y dos pixeles
// que mantener; derivarlo del HTML ya construido garantiza que el body sea
// identico. index.html no se toca.

const escapeAttr = (value: string | number) =>
  String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Dentro de <script> un "</script>" en un string cerraria el tag.
const safeJson = (value: unknown) => JSON.stringify(value, null, 2).replace(/</g, "\\u003c");

// Todo lo que en el head de index.html describe a los lentes. Cada patron tiene
// que encontrar algo: si index.html cambia de forma y uno deja de matchear, el
// build se cae antes de publicar un /sleep-mask con el preview de los lentes.
const LENS_HEAD: readonly { label: string; pattern: RegExp }[] = [
  { label: "title", pattern: /<title>[\s\S]*?<\/title>\s*/g },
  { label: "meta title/description/keywords", pattern: /<meta\s+name="(?:title|description|keywords|DC\.title)"[^>]*>\s*/g },
  { label: "canonical", pattern: /<link\s+rel="canonical"[^>]*>\s*/g },
  { label: "og:*", pattern: /<meta\s+property="og:[^"]*"[^>]*>\s*/g },
  { label: "twitter:*", pattern: /<meta\s+name="twitter:[^"]*"[^>]*>\s*/g },
  { label: "JSON-LD", pattern: /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/g },
  {
    label: "comentarios de seccion",
    pattern: /<!--\s*(?:Primary Meta Tags|Open Graph \/ Facebook|Twitter|Structured Data \(JSON-LD\))\s*-->\s*/g,
  },
];

const sleepMaskHead = () => {
  const og = SLEEP_MASK_OG_IMAGE;
  const meta = (attr: "name" | "property", key: string, content: string | number) =>
    `<meta ${attr}="${key}" content="${escapeAttr(content)}" />`;

  return [
    `<title>${escapeAttr(SLEEP_MASK_TITLE)}</title>`,
    meta("name", "description", SLEEP_MASK_DESCRIPTION),
    `<link rel="canonical" href="${SLEEP_MASK_URL}" />`,
    meta("property", "og:type", "product"),
    meta("property", "og:url", SLEEP_MASK_URL),
    meta("property", "og:site_name", "NOCTE"),
    meta("property", "og:title", SLEEP_MASK_TITLE),
    meta("property", "og:description", SLEEP_MASK_DESCRIPTION),
    meta("property", "og:image", og.url),
    meta("property", "og:image:type", og.type),
    meta("property", "og:image:width", og.width),
    meta("property", "og:image:height", og.height),
    meta("property", "og:image:alt", og.alt),
    meta("property", "og:locale", "es_PY"),
    meta("name", "twitter:card", "summary_large_image"),
    meta("name", "twitter:title", SLEEP_MASK_TITLE),
    meta("name", "twitter:description", SLEEP_MASK_DESCRIPTION),
    meta("name", "twitter:image", og.url),
    meta("name", "twitter:image:alt", og.alt),
    `<script type="application/ld+json">\n${safeJson(sleepMaskJsonLd())}\n</script>`.replace(/\n/g, "\n    "),
  ]
    .map((line) => `    ${line}`)
    .join("\n");
};

export const renderSleepMaskHtml = (indexHtml: string): string => {
  const headEnd = indexHtml.indexOf("</head>");
  if (headEnd === -1) throw new Error("sleep-mask.html: index.html no tiene </head>");

  let head = indexHtml.slice(0, headEnd);
  for (const { label, pattern } of LENS_HEAD) {
    const stripped = head.replace(pattern, "");
    if (stripped === head) throw new Error(`sleep-mask.html: no encontre ${label} en el head de index.html`);
    head = stripped;
  }

  const anchor = head.indexOf('<meta name="viewport"');
  const insertAt = head.indexOf("\n", anchor) + 1;
  if (anchor === -1 || insertAt === 0) throw new Error("sleep-mask.html: no encontre el meta viewport");

  return `${head.slice(0, insertAt)}${sleepMaskHead()}\n${head.slice(insertAt)}${indexHtml.slice(headEnd)}`;
};

export const sleepMaskHtml = (): Plugin => ({
  name: "nocte:sleep-mask-html",
  apply: "build",
  enforce: "post",
  generateBundle(_options, bundle) {
    const index = bundle["index.html"];
    if (!index || index.type !== "asset") {
      this.error("sleep-mask.html: el build no produjo index.html");
    }
    this.emitFile({
      type: "asset",
      fileName: "sleep-mask.html",
      source: renderSleepMaskHtml(String(index.source)),
    });
  },
});
