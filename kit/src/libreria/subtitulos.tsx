// Subtítulos: frases cortas, la palabra que suena se ilumina en una pastilla.
import React, { useMemo } from "react";
import { INTER, pe } from "./base";
import { MARCA } from "./paletas";

export type Palabra = { text: string; startMs: number; endMs: number };

/** Junta las palabras en frases de hasta 4: corta en coma/punto o en pausas de más de 250 ms. */
export const frasesDe = (palabras: Palabra[], corrige: Record<string, string> = {}): Palabra[][] => {
  const ws = palabras.map((w) => ({ ...w, text: corrige[w.text] ?? w.text }));
  const out: Palabra[][] = [];
  let cur: Palabra[] = [];
  ws.forEach((w, i) => {
    cur.push(w);
    const sig = ws[i + 1];
    if (/[,.]$/.test(w.text) || cur.length >= 4 || !sig || sig.startMs - w.endMs > 250) {
      out.push(cur);
      cur = [];
    }
  });
  return out;
};

/**
 * `oscuro`: el fondo de atrás es oscuro (texto claro). `colores.tinta` es el texto sobre fondo claro,
 * `colores.fondo` el texto sobre oscuro y `colores.activo` la pastilla de la palabra que suena.
 */
export const Subtitulos: React.FC<{
  t: number;
  palabras: Palabra[];
  oscuro: boolean;
  corrige?: Record<string, string>;
  top?: number;
  colores?: { tinta: string; fondo: string; activo: string };
  /** Opcional: palabras juntas, con espacio normal entre ellas (no repartidas a lo ancho). */
  compacto?: boolean;
  /** Opcional: colores fijos de la pastilla activa (fondo y texto), en claro y en oscuro. */
  pastilla?: { fondo: string; texto: string };
}> = ({ t, palabras, oscuro, corrige, top = 1420, colores = { tinta: MARCA.tinta, fondo: MARCA.fondo, activo: MARCA.pet }, compacto = false, pastilla }) => {
  const frases = useMemo(() => frasesDe(palabras, corrige), [palabras, corrige]);
  const ms = t * 1000;
  const i = frases.findIndex((f, j) => ms >= f[0].startMs - 50 && (j === frases.length - 1 || ms < frases[j + 1][0].startMs - 50));
  if (i < 0) return null;
  const f = frases[i];
  if (ms > f[f.length - 1].endMs + 450) return null;
  const en = (f[0].startMs - 50) / 1000;
  const base = oscuro ? colores.fondo : colores.tinta;
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: compacto ? "4px 5px" : "6px 4px", opacity: Math.min(1, pe(t, en, 0.2) * 1.5), transform: `translateY(${(1 - pe(t, en, 0.35)) * 18}px)` }}>
      {f.map((w, j) => {
        const activa = ms >= w.startMs && (j === f.length - 1 ? ms < w.endMs + 200 : ms < f[j + 1].startMs);
        const dicha = ms >= w.startMs;
        return (
          <span key={j} style={{ fontFamily: INTER, fontWeight: 800, fontSize: 62, lineHeight: 1.15, padding: compacto ? "2px 8px" : "2px 14px", borderRadius: compacto ? 14 : 16, background: activa ? (pastilla ? pastilla.fondo : oscuro ? colores.fondo : colores.activo) : "transparent", color: activa ? (pastilla ? pastilla.texto : oscuro ? colores.activo : colores.fondo) : base, opacity: dicha ? 1 : 0.45 }}>
            {w.text.replace(/[,.]$/, "")}
          </span>
        );
      })}
    </div>
  );
};
