// Tema oscuro de las piezas «pro» y de la edición con video (vidrio, fondos sin cara, subtítulos sobre video).
// Toma sus colores y su fuente de src/marca.ts.
import { Easing, interpolate } from "remotion";
import { COLORES, FUENTES } from "../marca";

export const C = {
  fondo: COLORES.noche,
  cian: COLORES.vivo,
  blanco: "#FFFFFF",
  gris: "#94A3B8",
  rojo: COLORES.error,
  superficie: "#1E2633",
  linea: "#334155",
} as const;

export const W = 1080;
export const H = 1920;

/** Altura de los subtítulos sobre video (debajo de la barbilla), como fracción de la altura. */
export const SUBTITULO_Y = 0.68;

export const FONT = FUENTES.titular;

export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Progreso 0→1 con ease-out entre `start` y `start + dur` cuadros. */
export const entrada = (frame: number, start: number, dur = 10) => interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: easeOut });

export const sombraTexto = "0 4px 14px rgba(0,0,0,.65)";
