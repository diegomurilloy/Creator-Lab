// Cobros entre amigos: campo de texto que se teclea y se
// borra (la pena de volver a preguntar), pastillas de montos que nadie recuerda, emoji 👋 dibujado, pastilla de
// contacto que recibe un mensaje reenviado y rótulos grandes para reels SIN voz. Paleta de la marca.
import React from "react";
import { INTER, MONO, SERIF, pe, sp } from "./base";
import { MARCA, MARCA_APP } from "./paletas";

const A = MARCA_APP;

/** Texto que se teclea entre `[a, b]` y se borra (retroceso) entre `[c, d]`. Devuelve lo que se ve en `t`. */
export const tecleaYBorra = (t: number, texto: string, [a, b]: [number, number], borra?: [number, number]) => {
  if (t < a) return "";
  const n = texto.length;
  let k = Math.min(n, 1 + Math.floor(((t - a) / (b - a)) * (n - 1)));
  if (borra && t >= borra[0]) k = Math.max(0, n - Math.floor(((t - borra[0]) / (borra[1] - borra[0])) * n));
  return texto.slice(0, k);
};

// ── Campo de texto claro (iOS) con cursor y botón de enviar que nunca se toca ──────────────────────────────
/**
 * Campo de mensaje claro de `w` px con lo que va escrito (`texto`) y el cursor obsidiana que parpadea.
 * `duda` 0→1 encoge un poco el botón de enviar (no te animas a mandarlo).
 */
export const CampoTecleo: React.FC<{ t: number; texto: string; w?: number; placeholder?: string; duda?: number }> = ({ t, texto, w = 760, placeholder = "Mensaje", duda = 0 }) => {
  const h = 112;
  return (
    <div style={{ position: "relative", width: w, height: h, display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ flex: 1, height: h, borderRadius: h / 2, background: "#FFFFFF", boxShadow: "0 22px 44px rgba(26,46,53,.14)", display: "flex", alignItems: "center", padding: "0 40px", boxSizing: "border-box", fontFamily: INTER, fontSize: 46, color: A.texto, whiteSpace: "nowrap", overflow: "hidden" }}>
        {texto ? texto : <span style={{ color: A.sec }}>{placeholder}</span>}
        <span style={{ display: "inline-block", width: 4, height: 54, marginLeft: 3, background: A.primario, opacity: Math.floor(t * 3.2) % 2 ? 1 : 0.15 }} />
      </div>
      <div style={{ width: h, height: h, borderRadius: h / 2, background: texto ? A.primario : A.borde, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 - 0.18 * duda})`, boxShadow: "0 18px 34px rgba(26,46,53,.18)" }}>
        <svg width="50" height="50" viewBox="0 0 24 24">
          <path d="M4 12l16-8-6 16-2.5-6.5z" fill={texto ? A.crema : "#FFFFFF"} />
        </svg>
      </div>
    </div>
  );
};

// ── Pastilla de monto con duda («¿$500?») que flota ────────────────────────────────────────────────────
/** Pastilla crema con un monto entre signos de interrogación. Entra con resorte en `en` y flota sola. */
export const PastillaDuda: React.FC<{ t: number; en: number; texto: string; semilla?: number; sale?: number }> = ({ t, en, texto, semilla = 0, sale = 1e9 }) => {
  if (t < en) return null;
  const k = sp(t, en, { damping: 11, stiffness: 180 });
  const s = pe(t, sale, 0.25);
  return (
    <div style={{ display: "inline-block", padding: "12px 30px", borderRadius: 60, background: A.fondo, border: `4px dashed ${A.sec}`, boxShadow: "0 18px 34px rgba(26,46,53,.12)", fontFamily: SERIF, fontStyle: "italic", fontSize: 72, lineHeight: 1.1, color: A.sec, transform: `translateY(${Math.sin(t * 2.4 + semilla) * 12}px) rotate(${(semilla % 2 ? 5 : -5) + 3 * Math.sin(t * 1.7 + semilla)}deg) scale(${(0.4 + 0.6 * k) * (1 - s)})`, opacity: Math.min(1, k * 2) * (1 - s) }}>
      {texto}
    </div>
  );
};

// ── Emoji 👋 dibujado (Chrome en Windows no trae los de iOS) ─────────────────────────────────────────────
export const EmojiSaludo: React.FC = () => (
  <svg width="1.1em" height="1.1em" viewBox="0 0 64 64" style={{ verticalAlign: "-0.2em", marginLeft: "0.15em" }}>
    <g transform="rotate(-18 32 36)">
      <rect x="15" y="12" width="8.5" height="28" rx="4.25" fill="#F7C04A" />
      <rect x="24.5" y="6" width="8.5" height="32" rx="4.25" fill="#F7C04A" />
      <rect x="34" y="8" width="8.5" height="30" rx="4.25" fill="#F7C04A" />
      <rect x="43.5" y="14" width="8" height="25" rx="4" fill="#F7C04A" />
      <path d="M15 32 h37 v8 c0 11 -8 18 -18.5 18 C23 58 15 50 15 40 z" fill="#F7C04A" />
      <rect x="6" y="30" width="16" height="8" rx="4" transform="rotate(38 14 34)" fill="#F7C04A" />
      <path d="M24 46 q6 5 14 1" fill="none" stroke="#D99A2B" strokeWidth="2.5" strokeLinecap="round" />
    </g>
    <path d="M8 10 q-3 5 0 10 M56 6 q4 5 1 11" fill="none" stroke="#B9B3A8" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// ── Pastilla de contacto (a quien le reenvías algo) ──────────────────────────────────────────────────────
/** Avatar con inicial + nombre + etiqueta mono. `recibe` 0→1: late y se le enciende un anillo dorado. */
export const PastillaContacto: React.FC<{ nombre: string; etiqueta?: string; recibe?: number; inicial?: string }> = ({ nombre, etiqueta, recibe = 0, inicial }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "12px 30px 12px 12px", borderRadius: 60, background: A.crema, boxShadow: `0 20px 40px rgba(16,19,22,.28), 0 0 0 ${6 * recibe}px ${MARCA.dorado}`, transform: `scale(${1 + 0.08 * Math.sin(Math.PI * Math.min(1, recibe))})` }}>
    <div style={{ width: 64, height: 64, borderRadius: 32, background: A.primario, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 40, color: A.crema }}>{inicial ?? nombre[0]}</div>
    <div>
      <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 34, color: A.primario, lineHeight: 1.1 }}>{nombre}</div>
      {etiqueta ? <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 20, letterSpacing: "0.16em", color: MARCA.arena }}>{etiqueta}</div> : null}
    </div>
  </div>
);

// ── Rótulos grandes de un reel sin voz ───────────────────────────────────────────────────────────────────
/** Un rótulo: entra en `en` (por su máscara, lo pinta quien lo use) y sale en `sale`. */
export type RotuloTexto = { en: number; sale: number; texto: string };
/** El rótulo vigente en `t` (o null). */
export const rotuloEn = (t: number, lista: RotuloTexto[]) => lista.find((r) => t >= r.en - 0.02 && t < r.sale + 0.6) ?? null;
