// Escena con paneo vertical, centrador, etiqueta mono y onda expansiva.
import React from "react";
import { AbsoluteFill } from "remotion";
import { CX, CY, MONO, pe, suave } from "./base";
import { MARCA } from "./paletas";

/** Lo que dura el paneo entre escenas, en segundos. */
export const PANEO = 0.46;

/**
 * Escena dentro de un mundo vertical continuo. `entrada`/`salida`:
 * - "pan": la cámara baja (la escena sube 1920 px) junto con la vecina, con desenfoque de movimiento.
 * - "nada": aparece/desaparece en su segundo exacto (cuando otra pieza la tapa o se transforma en ella).
 * - "fade" (solo salida): se desvanece mientras otra pieza toma su lugar.
 * Devuelve null fuera de su ventana.
 */
export const Escena: React.FC<{ t: number; a: number; b: number; children: React.ReactNode; sin?: boolean; entrada?: "pan" | "nada"; salida?: "pan" | "nada" | "fade" }> = ({ t, a, b, children, sin, entrada = "pan", salida = "pan" }) => {
  const ent = sin ? "nada" : entrada;
  const ini = ent === "pan" ? a - PANEO / 2 : a;
  const fin = salida === "nada" ? b : b + PANEO / 2;
  if (t < ini || t > fin) return null;
  const k = ent === "pan" ? pe(t, a - PANEO / 2, PANEO, suave) : 1;
  const s = salida === "pan" ? pe(t, b - PANEO / 2, PANEO, suave) : 0;
  const f = salida === "fade" ? pe(t, b - 0.1, 0.3, suave) : 0;
  const vel = k < 1 ? Math.sin(Math.PI * k) : s > 0 ? Math.sin(Math.PI * s) : 0;
  return (
    <AbsoluteFill style={{ opacity: 1 - f, transform: `translateY(${(1 - k) * 1920 - s * 1920}px)`, filter: vel > 0.02 ? `blur(${vel * 6}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
};

/** Renglón de alto cero centrado en `y`: lo que va adentro queda centrado en ese punto. */
export const Centro: React.FC<{ y?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ y = CY, children, style }) => (
  <div style={{ position: "absolute", left: 0, top: y, width: 1080, height: 0, display: "flex", justifyContent: "center", alignItems: "center", ...style }}>{children}</div>
);

/** Etiqueta en mono, mayúsculas y espaciada. */
export const Mono: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = MARCA.sec, size = 30 }) => (
  <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: size, letterSpacing: "0.14em", textTransform: "uppercase", color }}>{children}</span>
);

/** Onda que se abre y se desvanece desde (x, y). Por defecto sale del centro del lienzo. */
export const Onda: React.FC<{ t: number; en: number; color?: string; r?: number; x?: number; y?: number }> = ({ t, en, color = MARCA.pet, r = 260, x = CX, y = CY }) => {
  const k = pe(t, en, 0.7);
  if (t < en || k >= 1) return null;
  return <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `${8 * (1 - k)}px solid ${color}`, transform: `scale(${0.4 + k})`, opacity: 1 - k }} />;
};
