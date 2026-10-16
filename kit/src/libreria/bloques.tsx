// Bloques de color a pantalla completa (capítulos y énfasis).
import React from "react";
import { AbsoluteFill } from "remotion";
import { CY, SERIF, pe, sp, suave } from "./base";
import { Centro, Mono } from "./escena";
import { MARCA } from "./paletas";

/** Un bloque: de `a` a `b` segundos, número grande y etiqueta abajo. */
export type BloqueColor = { a: number; b: number; color: string; grande: string; etiqueta: string; wipe?: boolean; tinta?: string };

/** `wipe`: entra barriendo de abajo hacia arriba (si no, aparece de golpe). `tinta`: color del texto. */
export const Bloque: React.FC<{ t: number } & BloqueColor> = ({ t, a, b, color, grande, etiqueta, wipe = true, tinta = MARCA.fondo }) => {
  if (t < a || t > b + 0.02) return null;
  const k = wipe ? pe(t, a, 0.34) : 1;
  const s = pe(t, b - 0.26, 0.26, suave);
  const n = sp(t, a + 0.02, { damping: 13 });
  return (
    <AbsoluteFill style={{ background: color, clipPath: `inset(${(1 - k) * 100}% 0 ${s * 100}% 0)` }}>
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(245,241,235,.12) 2px, transparent 2px)", backgroundSize: "44px 44px" }} />
      <Centro y={CY - 60} style={{ transform: `translateY(${(1 - k) * 160 - s * 200}px) scale(${0.6 + 0.4 * n})` }}>
        <div style={{ fontFamily: SERIF, fontSize: 560, lineHeight: 0.8, color: tinta, letterSpacing: "-0.03em" }}>{grande}</div>
      </Centro>
      <Centro y={CY + 280} style={{ opacity: pe(t, a + 0.15, 0.25), transform: `translateY(${(1 - pe(t, a + 0.15, 0.4)) * 30 - s * 200}px)` }}>
        <Mono color={tinta} size={40}>{etiqueta}</Mono>
      </Centro>
    </AbsoluteFill>
  );
};

/** Pinta la lista de bloques del reel. */
export const Bloques: React.FC<{ t: number; lista: BloqueColor[] }> = ({ t, lista }) => (
  <>
    {lista.map((b) => (
      <Bloque key={b.a} t={t} {...b} />
    ))}
  </>
);

/** ¿Hay un bloque oscuro cubriendo la pantalla en `t`? (para poner los subtítulos en claro). */
export const enBloque = (t: number, lista: BloqueColor[], claros: string[] = [MARCA.dorado]) => lista.some((b) => t >= b.a + 0.15 && t < b.b - 0.1 && !claros.includes(b.color));
