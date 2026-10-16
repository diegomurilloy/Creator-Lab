// ─────────────────────────────────────────────────────────────────────────────
// SELECTOR DE MARCA. Todo el kit (librería, demos y reel de ejemplo) usa la marca que elijas aquí.
//
//   · Cambia la marca de siempre en MARCA_POR_DEFECTO (abajo).
//   · O elige una sin tocar código, solo para un comando:
//       REMOTION_MARCA=producto npx remotion studio
//       REMOTION_MARCA=producto npx remotion render ejemplo-reel out/reel-producto.mp4
//     (en PowerShell: $env:REMOTION_MARCA="producto"; npx remotion studio)
//
// Las marcas viven en src/marcas/<id>.ts. Para crear una, copia src/marcas/ejemplo.ts.
// ─────────────────────────────────────────────────────────────────────────────
import { marcas, type IdMarca } from "./marcas";
import { resolverMarca } from "./marcas/tipos";

/** ← Cambia aquí tu marca por defecto. */
const MARCA_POR_DEFECTO: IdMarca = "ejemplo";

const pedida = process.env.REMOTION_MARCA as string | undefined;
const id: IdMarca = pedida && pedida in marcas ? (pedida as IdMarca) : MARCA_POR_DEFECTO;

export const MARCA_ACTIVA = id;
export const { MARCA, MARCA_APP, COLORES, FUENTES, NOMBRES } = resolverMarca(marcas[id]);
