// Renderiza opciones de una ronda de Style Lab: video completo mudo (1080x1920) por id.
// Uso: node scripts/render_ronda.mjs <carpeta_salida> <id> [<id>...] [--kit RUTA] [--chrome RUTA]
//   --kit: tu proyecto de Remotion; si no se pasa, `kit` de personal/config.md.
//   --chrome: navegador para renderizar; si no se pasa, `chrome` de la config (o el que trae Remotion).
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function leerConfig() {
  const ruta = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "personal", "config.md");
  if (!existsSync(ruta)) return {};
  const texto = readFileSync(ruta, "utf8");
  const bloque = (texto.match(/```[^\n]*\n([\s\S]*?)```/) || [, texto])[1];
  const datos = {};
  for (const r of bloque.split(/\r?\n/)) {
    const linea = r.trim().startsWith("#") ? "" : r.split(" #")[0].trim();
    const m = linea.match(/^([a-z_]+):\s*(.*)$/);
    if (m) datos[m[1]] = m[2].trim();
  }
  return datos;
}

const args = process.argv.slice(2);
function opcion(nombre) {
  const i = args.indexOf(nombre);
  if (i < 0) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
}
const cfg = leerConfig();
const K = opcion("--kit") || cfg.kit;
const browserExecutable = opcion("--chrome") || cfg.chrome || undefined;
const [OUT, ...ids] = args;
if (!K || !OUT || !ids.length) {
  console.error("Uso: node scripts/render_ronda.mjs <carpeta_salida> <id> [<id>...] [--kit RUTA] [--chrome RUTA]\n(sin --kit se usa `kit` de personal/config.md)");
  process.exit(1);
}
const require = createRequire(path.join(K, "package.json"));
const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition } = require("@remotion/renderer");
const serveUrl = await bundle({ entryPoint: path.join(K, "src/index.ts"), publicDir: path.join(K, "public") });
for (const id of ids) {
  const composition = await selectComposition({ serveUrl, id, browserExecutable, logLevel: "error" });
  await renderMedia({ serveUrl, composition, codec: "h264", crf: 16, muted: true, outputLocation: path.join(OUT, `${id}.mp4`), browserExecutable, logLevel: "error", concurrency: 4 });
  console.log("ok", id);
}
