// Registro de gastos: ticket gigante que se imprime, post-it que se borra, emoji de recibo, pantalla de
// inicio de iOS, chat oscuro de WhatsApp con VARIOS mensajes (hilo con scroll) y cuadrícula de cien puntos.
// Todo en segundos de `t`.
import React from "react";
import { INTER, MONO, SERIF, pe, sp } from "./base";
import { Lapiz } from "./objetos";
import { MARCA, MARCA_APP, WA_OSCURO } from "./paletas";
import { AppWA, IconoLinea, Palomitas, WA_OSC_GEO } from "./whatsapp";
import { LogoMarca } from "./logos";

// ── Ticket gigante (la renta) ────────────────────────────────────────────────
/**
 * Ticket de w×h que sale impreso desde una ranura arriba (`imprime` 0→1). `titulo` en serif; renglones grises
 * (sin cifras inventadas) y el renglón TOTAL. `mal` 0→1: el total se pone rojo, se tacha y aparece un «?».
 */
export const TicketGrande: React.FC<{ w?: number; h?: number; titulo: string; etiqueta?: string; imprime: number; mal?: number; renglones?: number; ranura?: boolean; tiembla?: number; cuenta?: number }> = ({
  w = 760,
  h = 1120,
  titulo,
  etiqueta = "Pago mensual",
  imprime,
  mal = 0,
  renglones = 5,
  ranura = true,
  tiembla = 0,
  cuenta = 0,
}) => {
  const A = MARCA_APP;
  const dientes = Math.round(w / 38);
  const sierra = Array.from({ length: dientes }, (_, i) => `L ${((i + 0.5) * w) / dientes} ${h - 4} L ${((i + 1) * w) / dientes} ${h - 22}`).join(" ");
  const rojo = MARCA.error;
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      {ranura ? <div style={{ position: "absolute", left: -40, top: -26, width: w + 80, height: 40, borderRadius: 20, background: A.primario, zIndex: 3, boxShadow: "0 10px 24px rgba(26,46,53,.25)" }} /> : null}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transform: `translateY(${-(1 - imprime) * h}px)` }}>
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 30px 40px rgba(26,46,53,.16))" }}>
            <path d={`M 0 0 H ${w} V ${h - 22} ${sierra} L 0 ${h - 22} Z`} fill="#FFFFFF" />
          </svg>
          <div style={{ position: "absolute", left: 70, right: 70, top: 86, textAlign: "center" }}>
            <div style={{ fontFamily: SERIF, fontSize: w * 0.19, lineHeight: 1, color: A.texto }}>{titulo}</div>
            <div style={{ marginTop: 18, fontFamily: MONO, fontWeight: 500, fontSize: w * 0.036, letterSpacing: "0.16em", textTransform: "uppercase", color: A.sec }}>{etiqueta}</div>
          </div>
          <div style={{ position: "absolute", left: 70, right: 70, top: h * 0.36, borderTop: `4px dashed ${A.borde}` }} />
          {Array.from({ length: renglones }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: 70, right: 70, top: h * 0.4 + i * (h * 0.075), height: 26, display: "flex", justifyContent: "space-between" }}>
              <div style={{ width: [300, 240, 330, 210, 280][i % 5] * (w / 760), height: 22, borderRadius: 11, background: cuenta * renglones > i + 0.5 ? MARCA.dorado : A.borde, transform: `scaleY(${cuenta * renglones > i + 0.5 && cuenta * renglones < i + 1 ? 1.4 : 1})` }} />
              <div style={{ width: [120, 150, 100, 140, 110][i % 5] * (w / 760), height: 22, borderRadius: 11, background: A.borde }} />
            </div>
          ))}
          <div style={{ position: "absolute", left: 70, right: 70, top: h * 0.4 + renglones * (h * 0.075) + 20, borderTop: `4px dashed ${A.borde}` }} />
          <div style={{ position: "absolute", left: 70, right: 70, top: h * 0.4 + renglones * (h * 0.075) + 64, display: "flex", alignItems: "center", justifyContent: "space-between", transform: `translateX(${tiembla}px)` }}>
            <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: w * 0.05, letterSpacing: "0.14em", color: mal > 0.5 ? rojo : A.texto }}>TOTAL</span>
            <div style={{ position: "relative", width: 230 * (w / 760), height: 44, borderRadius: 14, background: mal > 0.02 ? rojo : A.primario, opacity: 1 }}>
              {mal > 0 ? <div style={{ position: "absolute", left: -16, top: 18, height: 8, width: (230 * (w / 760) + 32) * Math.min(1, mal * 1.4), borderRadius: 4, background: A.texto }} /> : null}
            </div>
          </div>
          {mal > 0 ? (
            <div style={{ position: "absolute", right: 30, top: h * 0.4 + renglones * (h * 0.075) - 40, width: 96, height: 96, borderRadius: 48, background: rojo, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 80, lineHeight: 1, transform: `scale(${0.4 + 0.6 * Math.min(1, mal * 1.6)})` }}>?</div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ── Post-it que se borra ─────────────────────────────────────────────────────
/**
 * Nota cuadrada con texto en serif itálica. `borrado` 0→1: la goma pasa de izquierda a derecha y se lleva el
 * texto (queda una mancha tenue). `vacio` 0→1: el papel se desvanece y queda solo el contorno punteado.
 */
export const PostIt: React.FC<{ texto: string; size?: number; borrado?: number; vacio?: number; color?: string; tinta?: string; contorno?: string }> = ({ texto, size = 280, borrado = 0, vacio = 0, color = "#EFE0BC", tinta = MARCA_APP.texto, contorno = MARCA_APP.sec }) => (
  <div style={{ position: "relative", width: size, height: size }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: 10, border: `4px dashed ${contorno}`, opacity: vacio * 0.7 }} />
    <div style={{ position: "absolute", inset: 0, opacity: 1 - vacio, transform: `scale(${1 - 0.06 * vacio})` }}>
      <div style={{ position: "absolute", inset: 0, background: color, borderRadius: "6px 6px 6px 34px", boxShadow: "0 18px 30px rgba(26,46,53,.16)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: size * 0.14, background: "rgba(26,46,53,.06)", borderRadius: "6px 6px 0 0" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: size * 0.27, color: tinta, clipPath: `inset(0 0 0 ${borrado * 100}%)` }}>{texto}</div>
      {/* Mancha que deja la goma */}
      {borrado > 0 ? <div style={{ position: "absolute", left: size * 0.12, top: size * 0.42, height: size * 0.16, width: size * 0.76 * borrado, borderRadius: size * 0.08, background: "rgba(26,46,53,.07)", filter: "blur(4px)" }} /> : null}
    </div>
  </div>
);

/** Lápiz con la goma hacia abajo (para borrar). La punta de la goma queda en (0, 0) del contenedor. */
export const Goma: React.FC<{ w?: number; giro?: number }> = ({ w = 300, giro = 12 }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0 }}>
    <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `rotate(${-90 + giro}deg) translate(${-0.02 * w}px, ${-0.11 * w}px)`, filter: "drop-shadow(0 14px 16px rgba(26,46,53,.22))" }}>
      <Lapiz w={w} />
    </div>
  </div>
);

// ── Emoji 🧾 dibujado (Chrome en Windows no trae los de iOS) ─────────────────
export const EmojiRecibo: React.FC = () => (
  <svg width="1.1em" height="1.1em" viewBox="0 0 64 64" style={{ verticalAlign: "-0.2em", marginLeft: "0.12em" }}>
    <path d="M14 6h36v52l-6-4-6 4-6-4-6 4-6-4-6 4z" fill="#F4F1EA" stroke="#B9B3A8" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M20 16h24M20 24h18M20 32h22M20 40h14" stroke="#8C8578" strokeWidth="3" strokeLinecap="round" />
    <path d="M38 40h6" stroke="#3B4248" strokeWidth="3.4" strokeLinecap="round" />
  </svg>
);

// ── Pantalla de inicio de iOS (fondo de marca, 16 apps, WhatsApp en `slot`) ───
/** Centro del ícono `i` en coordenadas internas de la pantalla de 508×1068. */
export const iconoInicio = (i: number) => ({ x: 36 + 109 * (i % 4) + 54.5, y: 130 + 128 * Math.floor(i / 4) + 44 });

export const PantallaInicio: React.FC<{ t: number; slot?: number; toque?: number; entra?: number; hora?: string }> = ({ t, slot = 9, toque = 1e9, entra = -1, hora = "9:41" }) => {
  const hundido = t > toque - 0.05 && t < toque + 0.12 ? 0.86 : 1;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: WA_OSC_GEO.w, height: WA_OSC_GEO.h, background: `radial-gradient(circle at 30% 18%, #3B5A66, ${MARCA.obs} 72%)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 40, top: 16, fontFamily: INTER, fontWeight: 600, fontSize: 22, color: "#FFFFFF" }}>{hora}</div>
      {Array.from({ length: 16 }, (_, i) => {
        const c = iconoInicio(i);
        const k = entra < 0 ? 1 : sp(t, entra + i * 0.02, { damping: 14 });
        return (
          <div key={i} style={{ position: "absolute", left: c.x - 44, top: c.y - 44, width: 88, height: 88, transform: `scale(${k * (i === slot ? hundido : 1)})` }}>
            {i === slot ? <AppWA size={88} /> : <div style={{ width: 88, height: 88, borderRadius: 21, background: "rgba(255,255,255,.14)" }} />}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 24, right: 24, bottom: 26, height: 120, borderRadius: 40, background: "rgba(255,255,255,.16)" }} />
    </div>
  );
};

// ── Chat oscuro con varios mensajes (hilo) ───────────────────────────────────
/** Un mensaje del hilo. `alto`: alto que ocupa en el acomodo (fijo en las respuestas para poder transformarlas). */
export type MensajeHilo = { de: "yo" | "marca"; en: number; contenido: React.ReactNode; alto: number; ancho?: number; leidoEn?: number };

const GAP_MISMO = 10;
const GAP_CAMBIO = 16;
const LIMITE = WA_OSC_GEO.barra - 18;

/**
 * Acomodo del hilo en `t`: `y` (arriba de cada mensaje, ya con scroll, coordenadas internas de 508×1068),
 * `puntosY` (burbuja de «escribiendo») y `scroll`. Úsalo también para apuntar la cámara.
 */
export const acomodoHilo = (t: number, mensajes: MensajeHilo[], puntos = 0) => {
  let y = WA_OSC_GEO.saleTop;
  const ys: number[] = [];
  let previo: MensajeHilo["de"] | null = null;
  mensajes.forEach((m) => {
    const k = pe(t, m.en, 0.3);
    if (previo !== null) y += (previo === m.de ? GAP_MISMO : GAP_CAMBIO) * k;
    ys.push(y);
    y += m.alto * k;
    if (k > 0) previo = m.de;
  });
  const puntosY = y + (puntos > 0 ? GAP_CAMBIO * puntos : 0);
  const fondo = puntosY + 54 * puntos;
  const scroll = Math.max(0, fondo - LIMITE);
  return { y: ys.map((v) => v - scroll), puntosY: puntosY - scroll, scroll };
};

/**
 * Chat de WhatsApp iOS oscuro con un HILO de mensajes (el otro chat solo trae uno). Mismas coordenadas internas
 * de 508×1068 (`WA_OSC_GEO`). Cada mensaje entra en su `en`; si ya no caben, el hilo se recorre hacia arriba.
 * `tecleo`: lo que va escrito en la barra. `puntos` 0→1: burbuja de «escribiendo» al final del hilo.
 */
export const ChatHiloOscuro: React.FC<{ t: number; mensajes: MensajeHilo[]; tecleo?: string; escribiendo?: boolean; puntos?: number; contacto?: string; avatar?: React.ReactNode; hora?: string }> = ({
  t,
  mensajes,
  tecleo = "",
  escribiendo = false,
  puntos = 0,
  contacto = MARCA.contacto,
  avatar,
  hora = "9:41",
}) => {
  const G = WA_OSC_GEO;
  const C = WA_OSCURO;
  const ac = acomodoHilo(t, mensajes, puntos);
  const hHora = { fontFamily: INTER, fontSize: 15, color: "rgba(233,237,239,.6)" };
  const escribe = tecleo !== "";
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: G.w, height: G.h, background: C.fondo, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: "radial-gradient(#FFFFFF 1.6px, transparent 1.6px)", backgroundSize: "34px 34px" }} />
      {/* Hilo (se recorre hacia arriba) */}
      <div style={{ position: "absolute", left: 0, top: G.header, width: G.w, height: G.barra - G.header, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: -G.header, width: G.w, height: G.h }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: G.hoyY - ac.scroll, textAlign: "center" }}>
            <span style={{ padding: "6px 16px", borderRadius: 10, background: C.chip, fontFamily: INTER, fontSize: 17, color: C.sub }}>Hoy</span>
          </div>
          {mensajes.map((m, i) => {
            if (t < m.en) return null;
            const k = pe(t, m.en, 0.35);
            const yo = m.de === "yo";
            const fondo = yo ? C.sale : C.entra;
            const comun: React.CSSProperties = { position: "absolute", top: ac.y[i], fontFamily: INTER, fontSize: 25, lineHeight: 1.34, color: C.texto, borderRadius: 18, boxSizing: "border-box", opacity: Math.min(1, k * 2.5) };
            return yo ? (
              <div key={i} style={{ ...comun, right: 18, maxWidth: 400, minHeight: m.alto, padding: "11px 14px 9px 16px", background: fondo, borderBottomRightRadius: 6, transform: `translateY(${(1 - k) * 60}px) scale(${0.9 + 0.1 * k})`, transformOrigin: "100% 100%" }}>
                {m.contenido}
                <span style={{ display: "inline-flex", alignItems: "center", float: "right", marginLeft: 12, marginTop: 10, ...hHora }}>
                  {hora}
                  <Palomitas color={t >= (m.leidoEn ?? m.en + 0.3) ? C.palomita : C.sub} />
                </span>
                <Cola sale color={fondo} />
              </div>
            ) : (
              <div key={i} style={{ ...comun, left: 18, width: m.ancho ?? 404, height: m.alto, padding: "12px 16px 10px", background: fondo, borderBottomLeftRadius: 6, transform: `scale(${0.85 + 0.15 * sp(t, m.en, { damping: 14, stiffness: 170 })})`, transformOrigin: "0 100%" }}>
                {m.contenido}
                <span style={{ position: "absolute", right: 14, bottom: 8, ...hHora }}>{hora}</span>
                <Cola color={fondo} />
              </div>
            );
          })}
          {puntos > 0 ? (
            <div style={{ position: "absolute", left: 18, top: ac.puntosY, width: 96, height: 54, borderRadius: 18, borderBottomLeftRadius: 6, background: C.entra, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transformOrigin: "0 100%", transform: `scale(${0.6 + 0.4 * puntos})`, opacity: puntos }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 11, height: 11, borderRadius: 6, background: C.sub, transform: `translateY(${-5 * Math.max(0, Math.sin(t * 9 - i * 0.9))}px)` }} />
              ))}
              <Cola color={C.entra} />
            </div>
          ) : null}
        </div>
      </div>
      {/* Barra de estado + encabezado */}
      <div style={{ position: "absolute", left: 0, top: 0, width: G.w, height: G.header, background: C.barra }} />
      <div style={{ position: "absolute", left: 40, top: 16, fontFamily: INTER, fontWeight: 600, fontSize: 22, color: C.texto }}>{hora}</div>
      <div style={{ position: "absolute", right: 34, top: 20, display: "flex", gap: 8, alignItems: "center" }}>
        <svg width="28" height="18" viewBox="0 0 30 20">
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 8} y={14 - i * 4} width="5.5" height={6 + i * 4} rx="1.5" fill={C.texto} />
          ))}
        </svg>
        <svg width="38" height="18" viewBox="0 0 40 20">
          <rect x="1" y="2" width="33" height="16" rx="5" fill="none" stroke={C.texto} strokeOpacity=".45" strokeWidth="2" />
          <rect x="4" y="5" width="26" height="10" rx="3" fill={C.texto} />
          <rect x="36" y="7" width="3" height="6" rx="1.5" fill={C.texto} fillOpacity=".45" />
        </svg>
      </div>
      <div style={{ position: "absolute", left: 0, top: 62, width: G.w, height: G.header - 62, display: "flex", alignItems: "center", gap: 12, padding: "0 16px", boxSizing: "border-box" }}>
        <IconoLinea d="M15 5l-7 7 7 7" size={34} color={C.texto} />
        {avatar ?? <LogoMarca size={56} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 26, color: C.texto }}>{contacto}</div>
          <div style={{ fontFamily: INTER, fontSize: 18, color: escribiendo ? C.verde : C.sub }}>{escribiendo ? "escribiendo…" : "en línea"}</div>
        </div>
        <IconoLinea d="M3 7h12v10H3zM15 10l6-3v10l-6-3" size={34} color={C.texto} />
        <div style={{ width: 6 }} />
        <IconoLinea d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" size={30} color={C.texto} />
      </div>
      {/* Barra para escribir */}
      <div style={{ position: "absolute", left: 0, top: G.barra, width: G.w, height: G.h - G.barra, background: C.barra }} />
      <div style={{ position: "absolute", left: 16, top: G.campo.y + 6 }}>
        <IconoLinea d="M12 5v14M5 12h14" size={40} color={C.texto} />
      </div>
      <div style={{ position: "absolute", left: G.campo.x, top: G.campo.y, width: G.campo.w, height: G.campo.h, borderRadius: G.campo.r, background: C.campo, display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 18px", boxSizing: "border-box", fontFamily: INTER, fontSize: 24, color: C.texto, whiteSpace: "nowrap", overflow: "hidden" }}>
        <span style={{ flexShrink: 0, display: "flex", alignItems: "center", marginRight: "auto" }}>
          {tecleo}
          {escribe ? <span style={{ display: "inline-block", width: 3, height: 28, marginLeft: 2, background: C.verde, opacity: Math.floor(t * 4) % 2 ? 1 : 0 }} /> : null}
        </span>
      </div>
      {escribe ? (
        <div style={{ position: "absolute", left: G.enviar.cx - G.enviar.r, top: G.enviar.cy - G.enviar.r, width: G.enviar.r * 2, height: G.enviar.r * 2, borderRadius: G.enviar.r, background: C.verde, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="28" height="28" viewBox="0 0 24 24">
            <path d="M4 12l16-8-6 16-2.5-6.5z" fill="#fff" />
          </svg>
        </div>
      ) : (
        <div style={{ position: "absolute", left: 412, top: G.campo.y + 7, display: "flex", gap: 8 }}>
          <IconoLinea d="M4 8h3l2-2h6l2 2h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" size={38} color={C.texto} />
          <IconoLinea d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3" size={38} color={C.texto} />
        </div>
      )}
      <div style={{ position: "absolute", left: G.w / 2 - 80, top: G.h - 14, width: 160, height: 6, borderRadius: 3, background: C.texto }} />
    </div>
  );
};

const Cola: React.FC<{ sale?: boolean; color: string }> = ({ sale, color }) => (
  <svg width="14" height="18" viewBox="0 0 14 18" style={{ position: "absolute", bottom: 0, [sale ? "right" : "left"]: -8, transform: sale ? undefined : "scaleX(-1)" }}>
    <path d="M0 0 C 2 10, 6 15, 14 18 L 0 18 Z" fill={color} />
  </svg>
);

// ── Cien puntos: casi nadie… (una se enciende y la cámara entra en ella) ─────
/**
 * Cuadrícula de 10×10 burbujitas que entra en ola desde `entra`; en `enciende` una (`elegida`) se pinta de
 * `acento` con brillo y las demás se apagan; en `zoom` la vista entra en ella (×`zoomMax`) hasta llenar la pantalla
 * con `relleno`. Coordenadas de pantalla (1080×1920), centro en (cx, cy).
 */
export const CienPuntos: React.FC<{ t: number; entra: number; enciende: number; zoom?: number; elegida?: number; cx?: number; cy?: number; paso?: number; acento?: string; base?: string; relleno?: string; zoomMax?: number }> = ({
  t,
  entra,
  enciende,
  zoom = 1e9,
  elegida = 64,
  cx = 540,
  cy = 820,
  paso = 84,
  acento = MARCA.dorado,
  base = MARCA.crema,
  relleno = WA_OSCURO.fondo,
  zoomMax = 46,
}) => {
  const enc = pe(t, enciende, 0.25);
  const z = pe(t, zoom, 0.45, (x) => x * x * x);
  const gx = cx - paso * 4.5;
  const gy = cy - paso * 4.5;
  const ex = gx + (elegida % 10) * paso;
  const ey = gy + Math.floor(elegida / 10) * paso;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${ex}px ${ey}px`, transform: `scale(${1 + z * zoomMax})` }}>
      {Array.from({ length: 100 }, (_, i) => {
        const x = gx + (i % 10) * paso;
        const y = gy + Math.floor(i / 10) * paso;
        const d = Math.hypot(x - cx, y - cy);
        const k = pe(t, entra + d / 2000, 0.4);
        const es = i === elegida;
        const r = es ? 24 + 8 * enc : 22;
        return (
          <div key={i} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: `${r}px ${r}px ${r}px ${r * 0.25}px`, background: es && enc > 0 ? relleno : base, border: es && enc > 0 ? `${5 * enc}px solid ${acento}` : undefined, boxSizing: "border-box", opacity: k * (es ? 0.35 + 0.65 * enc : 0.35 - 0.2 * enc), transform: `scale(${k})`, boxShadow: es && enc > 0 ? `0 0 ${50 * enc * (1 - z)}px ${acento}` : undefined }}>
            {es && enc > 0 ? <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 30, color: acento, opacity: enc * (1 - z) }}>?</div> : null}
          </div>
        );
      })}
    </div>
  );
};
