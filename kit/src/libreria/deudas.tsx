// Deudas entre amigos: contador de la deuda (se reúsa en cada capítulo),
// calendario con los viernes, billete genérico, comprobante de transferencia, pastilla tachada, pantalla de
// bloqueo, ojitos que miran, gota de sudor y el emoji ✅ dibujado. Todo en segundos de `t`. Paleta de la marca.
import React from "react";
import { INTER, MONO, SERIF, expo, pe, sp, suave } from "./base";
import { MARCA, MARCA_APP, WA_OSCURO } from "./paletas";
import { WA_OSC_GEO } from "./whatsapp";
import { CirculoMano } from "./hoja";

const A = MARCA_APP;

// ── Contador de la deuda (cap. 1 «día 1», cap. 2 «día 7 · $800», cap. 3 «día 22 · saldada») ────────────────
/**
 * Bloque tipográfico centrado (ancho 1080): etiqueta mono «DEUDA DE <PERSONA>», «Día N» gigante en serif con el
 * número que rueda por su máscara desde `desde` y, opcional, la pastilla del monto. `estado` «saldada» tacha el
 * monto y pone la palomita dorada. Tiempos: `en` (etiqueta), `enDia` (rueda el número), `enMonto` (pastilla).
 * Va sobre fondo obsidiana; los colores se cambian con `colores`.
 */
export const ContadorDeuda: React.FC<{
  t: number;
  en: number;
  dia: number;
  persona?: string;
  desde?: number;
  enDia?: number;
  /** Segundo en que rueda el número (por defecto 0.1 s después de «Día»). */
  enNumero?: number;
  monto?: string;
  enMonto?: number;
  estado?: "pendiente" | "saldada";
  enEstado?: number;
  colores?: { texto: string; acento: string; etiqueta: string; fondo: string };
}> = ({ t, en, dia, persona = MARCA.persona, desde, enDia, enNumero, monto, enMonto, estado = "pendiente", enEstado, colores = { texto: A.crema, acento: MARCA.dorado, etiqueta: A.arena, fondo: A.primario } }) => {
  const d0 = desde ?? Math.max(0, dia - 1);
  const tDia = enDia ?? en + 0.5;
  const tMonto = enMonto ?? (enNumero ?? tDia) + 0.4;
  const tEstado = enEstado ?? tMonto + 0.5;
  const kEt = pe(t, en, 0.5);
  const kDia = pe(t, tDia, 0.55, expo);
  const kNum = pe(t, enNumero ?? tDia + 0.1, 0.5, expo);
  const kMonto = sp(t, tMonto, { damping: 13 });
  const kTacha = estado === "saldada" ? pe(t, tEstado, 0.35) : 0;
  const mascara: React.CSSProperties = { display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: "0.08em" };
  return (
    <div style={{ width: 1080, textAlign: "center" }}>
      <div style={mascara}>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 40, letterSpacing: "0.22em", color: colores.etiqueta, transform: `translateY(${(1 - kEt) * 110}%)` }}>DEUDA DE {persona.toUpperCase()}</div>
      </div>
      <div style={{ marginTop: 6, fontFamily: SERIF, fontSize: 330, lineHeight: 0.95, color: colores.texto, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
        <span style={mascara}>
          <span style={{ display: "inline-block", transform: `translateY(${(1 - kDia) * 105}%)` }}>Día</span>
        </span>{" "}
        <span style={{ ...mascara, position: "relative", minWidth: "0.6em" }}>
          {/* El número anterior sale hacia arriba y el nuevo entra desde abajo (odómetro de una sola cifra). */}
          <span style={{ display: "inline-block", color: colores.acento, transform: `translateY(${(1 - kDia) * 105 - kNum * 105}%)`, opacity: d0 === dia ? 0 : 1 }}>{d0}</span>
          <span style={{ position: "absolute", left: 0, right: 0, top: 0, color: colores.acento, transform: `translateY(${(1 - kNum) * 105}%)` }}>{dia}</span>
        </span>
      </div>
      {monto ? (
        <div style={{ marginTop: 18, display: "flex", justifyContent: "center", opacity: Math.min(1, kMonto * 2) }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16, padding: "14px 34px", borderRadius: 60, background: colores.acento, transform: `scale(${0.6 + 0.4 * kMonto})` }}>
            <span style={{ fontFamily: INTER, fontWeight: 800, fontSize: 52, color: colores.fondo }}>{monto}</span>
            {estado === "saldada" ? <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 30, letterSpacing: "0.14em", color: colores.fondo, opacity: kTacha }}>SALDADA</span> : null}
            {kTacha > 0 ? <div style={{ position: "absolute", left: 24, top: "50%", height: 7, marginTop: -3, width: 150 * kTacha, borderRadius: 4, background: colores.fondo }} /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

// ── Calendario del mes con una columna (los viernes) ─────────────────────────
/**
 * Tarjeta de calendario de `w` px. `inicio`: columna del día 1 (lunes = 0). `columna`: el día de la semana que
 * importa (viernes = 4); `resalta` 0→1 lo pinta. `saltos`: segundos en que un círculo a mano brinca de un viernes al
 * siguiente con «?» (no se decide cuál); `todos`: segundo en que todos los viernes se llenan de dorado.
 */
export const Calendario: React.FC<{ t: number; mes: string; anio?: string; inicio: number; dias: number; columna?: number; resalta?: number; saltos?: number[]; todos?: number; w?: number }> = ({
  t,
  mes,
  anio = "",
  inicio,
  dias,
  columna = 4,
  resalta = 0,
  saltos = [],
  todos = 1e9,
  w = 600,
}) => {
  const celda = (w - 60) / 7;
  const filas = Math.ceil((inicio + dias) / 7);
  const h = 170 + filas * celda + 30;
  const kTodos = pe(t, todos, 0.35);
  const marcados = Array.from({ length: dias }, (_, i) => i + 1).filter((d) => (inicio + d - 1) % 7 === columna);
  const activo = saltos.reduce((m, s, i) => (t >= s ? i : m), -1);
  return (
    <div style={{ position: "relative", width: w, height: h, borderRadius: 34, background: A.fondo, boxShadow: "0 40px 80px rgba(16,19,22,.35)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 108, background: A.primario, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 36px", boxSizing: "border-box" }}>
        <span style={{ fontFamily: SERIF, fontSize: 64, color: A.crema }}>{mes}</span>
        <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 24, letterSpacing: "0.16em", color: A.arena }}>{anio}</span>
      </div>
      {/* Columna resaltada */}
      <div style={{ position: "absolute", left: 30 + columna * celda + 4, top: 118, width: celda - 8, height: h - 140, borderRadius: 18, background: MARCA.dorado, opacity: 0.22 * resalta }} />
      {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
        <div key={i} style={{ position: "absolute", left: 30 + i * celda, top: 126, width: celda, textAlign: "center", fontFamily: MONO, fontWeight: 500, fontSize: 24, color: i === columna && resalta > 0.5 ? MARCA.arena : A.sec }}>{d}</div>
      ))}
      {Array.from({ length: dias }, (_, i) => {
        const d = i + 1;
        const pos = inicio + i;
        const col = pos % 7;
        const fila = Math.floor(pos / 7);
        const es = col === columna;
        const lleno = es ? kTodos : 0;
        return (
          <div key={d} style={{ position: "absolute", left: 30 + col * celda + 6, top: 170 + fila * celda + 6, width: celda - 12, height: celda - 12, borderRadius: (celda - 12) / 2, background: lleno > 0 ? MARCA.dorado : "transparent", transform: `scale(${es ? 0.7 + 0.3 * Math.max(lleno, 1 - lleno) : 1})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: es ? 700 : 500, fontSize: celda * 0.36, color: lleno > 0.5 ? A.primario : es && resalta > 0.5 ? A.texto : A.sec }}>
            {d}
          </div>
        );
      })}
      {/* El círculo que no se decide */}
      {activo >= 0 && kTodos < 1
        ? (() => {
            const d = marcados[activo % marcados.length];
            const pos = inicio + d - 1;
            const x = 30 + (pos % 7) * celda;
            const y = 170 + Math.floor(pos / 7) * celda;
            return (
              <div style={{ position: "absolute", left: x - 6, top: y - 4, opacity: 1 - kTodos }}>
                <CirculoMano t={t} en={saltos[activo]} w={celda + 12} h={celda + 8} color={MARCA.error} grosor={5} dur={0.22} semilla={activo + 1} />
                <div style={{ position: "absolute", left: celda - 6, top: -26, width: 40, height: 40, borderRadius: 20, background: MARCA.error, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 34, transform: `scale(${sp(t, saltos[activo] + 0.05, { damping: 11 })})` }}>?</div>
              </div>
            );
          })()
        : null}
    </div>
  );
};

// ── Billete genérico (sin banco ni país: arena y dorado) ────────────────────
export const Billete: React.FC<{ w?: number; monto?: string }> = ({ w = 420, monto = "500" }) => {
  const h = w * 0.48;
  return (
    <div style={{ position: "relative", width: w, height: h, borderRadius: w * 0.04, background: "#E7D9BC", boxShadow: "0 24px 46px rgba(16,19,22,.35)", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: w * 0.03, borderRadius: w * 0.025, border: `${w * 0.008}px solid ${MARCA.dorado}` }} />
      <div style={{ position: "absolute", left: w * 0.36, top: h * 0.16, width: w * 0.28, height: h * 0.68, borderRadius: "50%", background: "#D8C29A", border: `${w * 0.006}px solid ${MARCA.dorado}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: w * 0.15, color: MARCA.arena }}>$</div>
      <div style={{ position: "absolute", left: w * 0.07, top: h * 0.08, fontFamily: SERIF, fontSize: w * 0.12, color: MARCA.arena }}>{monto}</div>
      <div style={{ position: "absolute", right: w * 0.07, bottom: h * 0.06, fontFamily: SERIF, fontSize: w * 0.12, color: MARCA.arena }}>{monto}</div>
      <div style={{ position: "absolute", left: w * 0.07, bottom: h * 0.14, width: w * 0.2, height: h * 0.05, borderRadius: 4, background: "rgba(128,105,58,.35)" }} />
      <div style={{ position: "absolute", right: w * 0.07, top: h * 0.2, width: w * 0.16, height: h * 0.05, borderRadius: 4, background: "rgba(128,105,58,.35)" }} />
    </div>
  );
};

// ── Comprobante de transferencia (contenido de una burbuja que llega; sin marca de banco) ──────────────
export const ComprobanteTransferencia: React.FC<{ t: number; en: number; monto: string; texto?: string }> = ({ t, en, monto, texto = "Transferencia enviada" }) => {
  const k = pe(t, en + 0.15, 0.35);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg width="34" height="34" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill={MARCA.dorado} />
          <path d="M28 52 L44 67 L73 36" fill="none" stroke={A.primario} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - k} />
        </svg>
        <span style={{ fontFamily: INTER, fontSize: 21, color: WA_OSCURO.sub }}>{texto}</span>
      </div>
      <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 52, lineHeight: 1.1, color: WA_OSCURO.texto, letterSpacing: "-0.01em" }}>{monto}</div>
    </div>
  );
};

// ── Pastilla tachada (una promesa o excusa que se cae) ───────────────────────
/** Serif itálica en pastilla; en `tacha` la raya roja la cruza, tiembla y en `cae` se va hacia abajo girando. */
export const PastillaTachada: React.FC<{ t: number; en: number; tacha: number; cae?: number; texto: string; fondo?: string; tinta?: string; size?: number }> = ({ t, en, tacha, cae = 1e9, texto, fondo = A.crema, tinta = A.primario, size = 84 }) => {
  if (t < en) return null;
  const k = sp(t, en, { damping: 12, stiffness: 170 });
  const kt = pe(t, tacha, 0.22);
  const tiembla = t > tacha && t < tacha + 0.35 ? Math.sin((t - tacha) * 70) * 8 * (1 - (t - tacha) / 0.35) : 0;
  const caida = t < cae ? 0 : 0.5 * 5200 * (t - cae) ** 2;
  return (
    <div style={{ position: "relative", display: "inline-block", padding: `${size * 0.12}px ${size * 0.45}px`, borderRadius: size, background: fondo, transform: `translate(${tiembla}px, ${caida}px) rotate(${-4 + (t > cae ? (t - cae) * 60 : 0)}deg) scale(${0.5 + 0.5 * k})`, opacity: Math.min(1, k * 2), boxShadow: "0 20px 40px rgba(16,19,22,.3)" }}>
      <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: size, lineHeight: 1.1, color: tinta }}>{texto}</span>
      <div style={{ position: "absolute", left: "8%", top: "52%", height: size * 0.1, width: `${84 * kt}%`, borderRadius: 6, background: MARCA.error, transform: "rotate(-6deg)", transformOrigin: "0 50%" }} />
    </div>
  );
};

// ── Pantalla de bloqueo (508×1068) ───────────────────────────────────────────
/** `luz` 0→1: la pantalla se enciende. Hora grande y fondo de marca. */
export const PantallaBloqueo: React.FC<{ luz: number; hora?: string; fecha?: string }> = ({ luz, hora = "9:41", fecha }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: WA_OSC_GEO.w, height: WA_OSC_GEO.h, background: `radial-gradient(circle at 50% 30%, #3B5A66, ${MARCA.obs} 70%)`, opacity: luz }}>
    {fecha ? <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: INTER, fontWeight: 500, fontSize: 26, color: "rgba(255,255,255,.85)" }}>{fecha}</div> : null}
    <div style={{ position: "absolute", left: 0, right: 0, top: 180, textAlign: "center", fontFamily: INTER, fontWeight: 300, fontSize: 150, letterSpacing: "-0.02em", color: "#FFFFFF" }}>{hora}</div>
    <div style={{ position: "absolute", left: WA_OSC_GEO.w / 2 - 80, top: WA_OSC_GEO.h - 14, width: 160, height: 6, borderRadius: 3, background: "#FFFFFF" }} />
  </div>
);

// ── Ojitos que miran (para que un objeto «vea» a otro) ───────────────────────
/** Par de ojos de `w` px. `mira` −1→1 mueve las pupilas en x (−1 = izquierda); `parpadeo` 0→1 cierra los párpados. */
export const Ojitos: React.FC<{ w?: number; mira?: number; miraY?: number; parpadeo?: number; color?: string; pupila?: string }> = ({ w = 220, mira = 0, miraY = 0, parpadeo = 0, color = "#FFFFFF", pupila = MARCA.obs }) => {
  const ow = w * 0.44;
  const oh = ow * 1.25;
  return (
    <div style={{ position: "relative", width: w, height: oh, display: "flex", justifyContent: "space-between" }}>
      {[0, 1].map((i) => (
        <div key={i} style={{ position: "relative", width: ow, height: oh, borderRadius: "50%", background: color, overflow: "hidden", boxShadow: "0 10px 20px rgba(16,19,22,.25)", transform: `scaleY(${1 - 0.92 * parpadeo})` }}>
          <div style={{ position: "absolute", left: ow / 2 - ow * 0.22 + mira * ow * 0.22, top: oh / 2 - ow * 0.22 + miraY * oh * 0.18, width: ow * 0.44, height: ow * 0.44, borderRadius: "50%", background: pupila }}>
            <div style={{ position: "absolute", left: "22%", top: "18%", width: "30%", height: "30%", borderRadius: "50%", background: "#FFFFFF", opacity: 0.85 }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Gota de sudor (nervios) ──────────────────────────────────────────────────
/** Gota que aparece en `en`, resbala y se desvanece. Crema con brillo (nada de azul). */
export const GotaSudor: React.FC<{ t: number; en: number; size?: number; color?: string }> = ({ t, en, size = 70, color = A.crema }) => {
  if (t < en) return null;
  const k = sp(t, en, { damping: 10, stiffness: 180 });
  const baja = pe(t, en + 0.35, 0.9, suave) * size * 0.9;
  const sale = pe(t, en + 1.0, 0.35);
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 50 70" style={{ overflow: "visible", transform: `translateY(${baja}px) scale(${k})`, transformOrigin: "50% 0", opacity: 1 - sale }}>
      <path d="M25 2 C 25 2, 46 34, 46 46 A 21 21 0 0 1 4 46 C 4 34, 25 2, 25 2 Z" fill={color} stroke={MARCA.obs} strokeWidth="3" />
      <path d="M14 44 Q 14 36 19 30" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
};

// ── Emoji ✅ dibujado (Chrome en Windows no trae los de iOS) ──────────────────
export const EmojiPalomita: React.FC = () => (
  <svg width="1.05em" height="1.05em" viewBox="0 0 64 64" style={{ verticalAlign: "-0.17em", marginRight: "0.2em" }}>
    <rect x="4" y="4" width="56" height="56" rx="13" fill="#3DAA4E" />
    <path d="M18 33 L28 43 L47 22" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Corazón que late (cierre «Con cariño») ───────────────────────────────────
/**
 * Corazón plano de `size` px (dorado con brillo crema; nada de rojo). Entra en `en` con un latido doble y luego
 * late suave cada `ritmo` segundos. `color`/`brillo` cambian la paleta.
 */
export const Corazon: React.FC<{ t: number; en: number; size?: number; ritmo?: number; color?: string; brillo?: string }> = ({ t, en, size = 110, ritmo = 0.9, color = MARCA.dorado, brillo = A.crema }) => {
  if (t < en) return null;
  const entra = sp(t, en, { damping: 9, stiffness: 220 });
  const late = (x: number, a: number) => (x > 0 ? a * x * Math.exp(1 - x) : 0);
  const fase = (t - en) % ritmo;
  const pulso = t - en < 0.45 ? 0 : late(fase / 0.08, 0.07) + late((fase - 0.18) / 0.08, 0.045);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", transform: `scale(${entra * (1 + pulso)})`, filter: `drop-shadow(0 0 ${8 + 40 * pulso}px rgba(201,167,122,.45))` }}>
      <path d="M50 88 C 20 66, 6 50, 6 32 A 21 21 0 0 1 50 22 A 21 21 0 0 1 94 32 C 94 50, 80 66, 50 88 Z" fill={color} />
      <path d="M24 26 Q 16 32 18 42" fill="none" stroke={brillo} strokeWidth="6" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
};
