// Piezas «pro» (probadas en reels reales): curvas de movimiento, vidrio, entradas 3D con resorte, texto palabra
// por palabra con máscara, íconos rellenos, moneda 3D y transición zoom-blur a los tramos sin cara.
// Todo en segundos de la toma (t = useT(desde)).
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring } from "remotion";
import { CIAN, FPS, FondoPleno, cl, easeIn } from "./comun";
import { C, FONT, sombraTexto } from "./tema";

/** Resorte 0→1 (con un poco de rebote) que arranca en `en`. */
export const sp = (t: number, en: number, o: { damping?: number; mass?: number; stiffness?: number } = {}) =>
  t < en ? 0 : spring({ frame: (t - en) * FPS, fps: FPS, config: { damping: o.damping ?? 15, mass: o.mass ?? 0.7, stiffness: o.stiffness ?? 150 } });

/** Salida rápida 0→1. */
export const fuera = (t: number, en: number, dur = 0.18) => interpolate(t, [en, en + dur], [0, 1], { ...cl, easing: easeIn });

/** Superficie de vidrio oscuro con bisel de luz arriba. */
export const vidrio = (acento?: string, radio = 36): React.CSSProperties => ({
  background: "linear-gradient(160deg, rgba(42,60,96,.84) 0%, rgba(13,21,39,.92) 100%)",
  border: `1.5px solid ${acento ?? "rgba(255,255,255,.12)"}`,
  boxShadow: `0 30px 80px rgba(0,0,0,.5), inset 0 1.5px 0 rgba(255,255,255,.16)${acento ? `, 0 0 46px ${acento}40` : ""}`,
  backdropFilter: "blur(22px) saturate(1.4)",
  borderRadius: radio,
});

/** Entrada 3D: se inclina hacia atrás, sube y se enfoca. `s` = salida 0→1. */
export const entrada3D = (p: number, s = 0, dy = 50): React.CSSProperties => ({
  opacity: Math.min(1, Math.max(0, p) * 1.6) * (1 - s),
  transform: `perspective(1400px) translateY(${(1 - p) * dy - s * 24}px) rotateX(${(1 - p) * 28}deg) scale(${0.9 + 0.1 * p - s * 0.06})`,
  filter: p < 0.97 || s > 0 ? `blur(${Math.max(0, (1 - p) * 10) + s * 8}px)` : undefined,
  transformOrigin: "50% 0%",
});

/** Titular que sale palabra por palabra desde su máscara. Las palabras entre *asteriscos* van en el color clave. */
export const Palabras: React.FC<{ t: number; en: number; texto: string; paso?: number; colorClave?: string; style?: React.CSSProperties }> = ({ t, en, texto, paso = 0.07, colorClave = CIAN, style }) => (
  <div style={{ fontFamily: FONT, fontWeight: 800, color: C.blanco, textShadow: sombraTexto, textAlign: "center", lineHeight: 1.18, ...style }}>
    <TextoMascara t={t} en={en} texto={texto} paso={paso} colorClave={colorClave} />
  </div>
);

/**
 * Tramo sin cara con transición zoom-blur: el fondo entra desde 118 % y desenfocado, con un barrido de luz.
 * Si el tramo arranca en un corte, el primer cuadro es la cara y en 8 cuadros ya es pantalla completa.
 */
export const Pleno: React.FC<{ t: number; en: number; sale: number; children?: React.ReactNode }> = ({ t, en, sale, children }) => {
  const p = interpolate(t, [en, en + 0.27], [0, 1], { ...cl, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const s = interpolate(t, [sale - 0.2, sale], [0, 1], { ...cl, easing: easeIn });
  if (p === 0 || s === 1) return null;
  const barrido = interpolate(t, [en, en + 0.5], [-60, 160], cl);
  return (
    <AbsoluteFill style={{ opacity: Math.min(1, p * 2) * (1 - s), transform: `scale(${1.18 - 0.18 * p + 0.08 * s})`, filter: p < 1 || s > 0 ? `blur(${(1 - p) * 18 + s * 14}px)` : undefined }}>
      <FondoPleno p={1} t={t}>
        {children}
      </FondoPleno>
      {barrido < 160 ? (
        <AbsoluteFill style={{ background: `linear-gradient(115deg, transparent ${barrido - 18}%, rgba(255,255,255,.13) ${barrido}%, transparent ${barrido + 18}%)`, pointerEvents: "none" }} />
      ) : null}
    </AbsoluteFill>
  );
};

// ── Íconos rellenos (24×24) ──────────────────────────────────────────────────
export type NombreIcono = "chat" | "robot" | "chip" | "escudo" | "candado" | "alerta" | "moneda" | "tienda" | "cartera" | "persona" | "check" | "cruz" | "abajo" | "calendario" | "reloj" | "silencio";
export const Icono: React.FC<{ n: NombreIcono; size?: number; color?: string; fondo?: string }> = ({ n, size = 48, color = CIAN, fondo = "#0E1A30" }) => {
  const c = color;
  const b = fondo;
  const cuerpo: Record<NombreIcono, React.ReactNode> = {
    chat: (
      <>
        <path d="M4 3.5h16a2.5 2.5 0 0 1 2.5 2.5v9.5A2.5 2.5 0 0 1 20 18H10l-5 4v-4H4A2.5 2.5 0 0 1 1.5 15.5V6A2.5 2.5 0 0 1 4 3.5z" fill={c} />
        <circle cx="7.5" cy="10.8" r="1.4" fill={b} />
        <circle cx="12" cy="10.8" r="1.4" fill={b} />
        <circle cx="16.5" cy="10.8" r="1.4" fill={b} />
      </>
    ),
    robot: (
      <>
        <rect x="11" y="1.5" width="2" height="4" rx="1" fill={c} />
        <circle cx="12" cy="2.2" r="1.7" fill={c} />
        <rect x="3.5" y="6" width="17" height="13.5" rx="4.5" fill={c} />
        <rect x="1" y="10.5" width="2" height="5" rx="1" fill={c} />
        <rect x="21" y="10.5" width="2" height="5" rx="1" fill={c} />
        <circle cx="9" cy="12" r="2" fill={b} />
        <circle cx="15" cy="12" r="2" fill={b} />
        <rect x="9" y="15.6" width="6" height="1.6" rx=".8" fill={b} />
      </>
    ),
    chip: (
      <>
        {[7, 10.5, 14, 17].map((v) => (
          <React.Fragment key={v}>
            <rect x={v - 0.8} y="1.5" width="1.6" height="4" rx=".8" fill={c} />
            <rect x={v - 0.8} y="18.5" width="1.6" height="4" rx=".8" fill={c} />
            <rect x="1.5" y={v - 0.8} width="4" height="1.6" rx=".8" fill={c} />
            <rect x="18.5" y={v - 0.8} width="4" height="1.6" rx=".8" fill={c} />
          </React.Fragment>
        ))}
        <rect x="4.5" y="4.5" width="15" height="15" rx="3" fill={c} />
        <rect x="8.5" y="8.5" width="7" height="7" rx="1.5" fill={b} />
      </>
    ),
    escudo: (
      <>
        <path d="M12 1.5l8.5 3.2v6.4c0 5.3-3.6 9.9-8.5 11.4-4.9-1.5-8.5-6.1-8.5-11.4V4.7L12 1.5z" fill={c} />
        <path d="M8 12l2.8 2.8L16.5 9" fill="none" stroke={b} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    candado: (
      <>
        <path d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10" fill="none" stroke={c} strokeWidth="2.6" />
        <rect x="4" y="10" width="16" height="12" rx="3" fill={c} />
        <circle cx="12" cy="15.4" r="1.8" fill={b} />
        <rect x="11.1" y="15.4" width="1.8" height="3.4" rx=".9" fill={b} />
      </>
    ),
    alerta: (
      <>
        <path d="M10.3 3.2a2 2 0 0 1 3.4 0l8.6 15a2 2 0 0 1-1.7 3H3.4a2 2 0 0 1-1.7-3l8.6-15z" fill={c} />
        <rect x="10.8" y="8.5" width="2.4" height="6.5" rx="1.2" fill={b} />
        <circle cx="12" cy="18" r="1.4" fill={b} />
      </>
    ),
    moneda: (
      <>
        <circle cx="12" cy="12" r="10.5" fill={c} />
        <circle cx="12" cy="12" r="7.6" fill="none" stroke={b} strokeOpacity=".35" strokeWidth="1.4" />
        <text x="12" y="16.6" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="13" fill={b}>$</text>
      </>
    ),
    tienda: (
      <>
        <path d="M3 9.5L4.6 3.5h14.8L21 9.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" fill={c} />
        <path d="M4.5 13.2V21h15v-7.8a4.6 4.6 0 0 1-3.6-.7 4.6 4.6 0 0 1-3.9.9 4.6 4.6 0 0 1-3.9-.9 4.6 4.6 0 0 1-3.6.7z" fill={c} />
        <rect x="9.6" y="15.5" width="4.8" height="5.5" rx="1" fill={b} />
      </>
    ),
    cartera: (
      <>
        <rect x="2" y="5" width="20" height="15" rx="3.5" fill={c} />
        <path d="M5 5l9.5-3a2 2 0 0 1 2.5 1.6L17.2 5" fill={c} />
        <rect x="14" y="10.5" width="8" height="5" rx="2.5" fill={b} />
        <circle cx="17" cy="13" r="1.2" fill={c} />
      </>
    ),
    persona: (
      <>
        <circle cx="12" cy="7.5" r="4.5" fill={c} />
        <path d="M3 21.5c0-5 4-8 9-8s9 3 9 8z" fill={c} />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="10.5" fill={c} />
        <path d="M7 12.3l3.3 3.3L17 9" fill="none" stroke={b} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    cruz: (
      <>
        <circle cx="12" cy="12" r="10.5" fill={c} />
        <path d="M8.2 8.2l7.6 7.6M15.8 8.2l-7.6 7.6" stroke={b} strokeWidth="2.6" strokeLinecap="round" />
      </>
    ),
    abajo: (
      <>
        <circle cx="12" cy="12" r="10.5" fill={c} />
        <path d="M12 6.5v10M7.5 12.5l4.5 4.5 4.5-4.5" fill="none" stroke={b} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    calendario: (
      <>
        <rect x="2.5" y="4" width="19" height="17.5" rx="3.5" fill={c} />
        <rect x="6.5" y="1.5" width="2.4" height="5" rx="1.2" fill={c} />
        <rect x="15.1" y="1.5" width="2.4" height="5" rx="1.2" fill={c} />
        <rect x="2.5" y="8.5" width="19" height="1.6" fill={b} />
        <rect x="6" y="12.5" width="3.4" height="3" rx=".8" fill={b} />
        <rect x="10.3" y="12.5" width="3.4" height="3" rx=".8" fill={b} />
        <rect x="14.6" y="12.5" width="3.4" height="3" rx=".8" fill={b} />
      </>
    ),
    reloj: (
      <>
        <circle cx="12" cy="12.5" r="9.5" fill={c} />
        <path d="M12 7.5v5.2l3.4 2.2" fill="none" stroke={b} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    silencio: (
      <>
        <path d="M3 9.5h3.5L12 5v14l-5.5-4.5H3z" fill={c} />
        <path d="M15.5 9l5 6M20.5 9l-5 6" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
      </>
    ),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, overflow: "visible" }}>
      {cuerpo[n]}
    </svg>
  );
};

/** Moneda 3D que gira (el canto se ve al girar). */
export const Moneda3D: React.FC<{ size: number; giro: number }> = ({ size, giro }) => {
  const k = Math.cos(giro);
  return (
    <div style={{ width: size, height: size, position: "relative", transform: `scaleX(${Math.max(0.12, Math.abs(k))})` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#9A5B0B", transform: `translateX(${k > 0 ? 4 : -4}px)` }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at 34% 30%, #FFF3C4 0%, #FCD34D 32%, #D97706 100%)", border: `${size * 0.06}px solid #B45309`, display: "flex", alignItems: "center", justifyContent: "center", color: "#7C2D12", fontFamily: FONT, fontWeight: 900, fontSize: size * 0.5, boxShadow: "inset 0 -4px 10px rgba(0,0,0,.25)" }}>
        $
      </div>
    </div>
  );
};


// ── Movimiento «premium»: máscara por palabra, pila que empuja, cajas que se transforman ──
/** Curvas «premium»: salida expo larga y entrada/salida suave. Nada de rebotes salvo un impacto real. */
export const expo = Easing.bezier(0.16, 1, 0.3, 1);
export const suave = Easing.bezier(0.65, 0, 0.35, 1);
/** Progreso 0→1 entre `a` y `a + d` segundos con curva expo (por defecto). */
export const pe = (t: number, a: number, d = 0.62, e: (x: number) => number = expo) => interpolate(t, [a, a + d], [0, 1], { ...cl, easing: e });

/**
 * Texto que sale palabra por palabra desde su propia máscara (cada palabra sube desde abajo de su borde),
 * 70 ms entre palabras y 0.62 s por palabra, con desenfoque de movimiento vertical mientras sube.
 * `sale`: segundo en que las palabras se van hacia arriba por la misma máscara. *palabra* = color clave.
 */
export const TextoMascara: React.FC<{ t: number; en: number; texto: string; sale?: number; paso?: number; dur?: number; blur?: boolean; colorClave?: string; style?: React.CSSProperties }> = ({ t, en, texto, sale, paso = 0.07, dur = 0.62, blur = true, colorClave = CIAN, style }) => {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const palabras = texto.split(" ");
  const y = (tt: number, i: number) => (1 - pe(tt, en + i * paso, dur)) * 110 + (sale === undefined ? 0 : pe(tt, sale + i * paso * 0.6, 0.45, suave) * -110);
  return (
    <span style={{ display: "inline-block", ...style }}>
      {blur ? (
        <svg width="0" height="0" style={{ position: "absolute" }}>
          {palabras.map((_, i) => (
            <filter key={i} id={`${id}m${i}`} x="-10%" y="-50%" width="120%" height="200%">
              <feGaussianBlur stdDeviation={`0 ${Math.min(14, Math.abs(y(t, i) - y(t - 1 / FPS, i)) * 0.9)}`} />
            </filter>
          ))}
        </svg>
      ) : null}
      {palabras.map((w, i) => {
        const clave = w.startsWith("*");
        return (
          <React.Fragment key={i}>
            <span style={{ display: "inline-block", overflow: "hidden", paddingBottom: "0.14em", marginBottom: "-0.14em", verticalAlign: "top" }}>
              <span style={{ display: "inline-block", color: clave ? colorClave : undefined, transform: `translateY(${y(t, i)}%)`, filter: blur ? `url(#${id}m${i})` : undefined }}>{w.replace(/\*/g, "")}</span>
            </span>
            {i < palabras.length - 1 ? " " : ""}
          </React.Fragment>
        );
      })}
    </span>
  );
};

/**
 * Pila que empuja: la pieza `i` entra en `llegadas[i]` y cada pieza que llega después la sube un escalón.
 * Devuelve `k` (su propia entrada 0→1) y `sube` (cuántos escalones lleva subidos, fraccionario).
 */
export const pila = (t: number, llegadas: number[], i: number, d = 0.7) => ({ k: pe(t, llegadas[i], d), sube: llegadas.slice(i + 1).reduce((s, a) => s + pe(t, a, d), 0) });

/** Caja que se transforma en otra (posición, tamaño y esquinas), para pasar de un objeto a la siguiente escena. */
export type Caja = { x: number; y: number; w: number; h: number; r: number };
export const morph = (a: Caja, b: Caja, k: number): Caja => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, w: a.w + (b.w - a.w) * k, h: a.h + (b.h - a.h) * k, r: a.r + (b.r - a.r) * k });
