// WhatsApp (iOS, claro): piezas probadas en reels reales.
import React from "react";
import { INTER, pe, sp } from "./base";
import { LogoMarca } from "./logos";
import { MARCA, WA, WA_OSCURO } from "./paletas";

/** Glifo de WhatsApp (bocadillo con teléfono). */
export const GlifoWA: React.FC<{ size: number; color?: string }> = ({ size, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 3.6a8.3 8.3 0 0 0-7.1 12.6L3.8 20.3l4.2-1.1A8.3 8.3 0 1 0 12 3.6z" fill="none" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
    <path
      d="M9.1 7.9c.2-.4.4-.4.6-.4h.5c.2 0 .4.1.5.3l.7 1.6c.1.2 0 .4-.1.6l-.4.5c-.1.1-.1.3 0 .4.5.9 1.3 1.7 2.2 2.2.1.1.3.1.4 0l.5-.4c.2-.1.4-.2.6-.1l1.6.7c.2.1.3.3.3.5v.5c0 .2-.1.5-.4.7-.5.3-1.1.5-1.8.4-1.3-.2-2.8-1.1-3.8-2.1s-1.9-2.5-2.1-3.8c-.1-.7.1-1.3.4-1.8z"
      fill={color}
    />
  </svg>
);

/** Ícono de la app (cuadrito verde con degradado). */
export const AppWA: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.225, background: "linear-gradient(180deg,#5FFC7B,#28D146)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(0,0,0,.18)" }}>
    <GlifoWA size={size * 0.68} />
  </div>
);

/** Palomitas azules de leído. */
export const Palomitas: React.FC<{ color?: string }> = ({ color = WA.palomita }) => (
  <svg width="26" height="16" viewBox="0 0 26 16" style={{ marginLeft: 6 }}>
    <path d="M1 8.5l4 4L13 3" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 12.5L17 3M12.5 12.5" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Ícono de línea en 24×24 (le pasas el `d`). */
export const IconoLinea: React.FC<{ d: string; size?: number; color?: string }> = ({ d, size = 34, color = "#000" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Burbuja con cola. `sale`: mensaje tuyo (verde, a la derecha). */
export const Burbuja: React.FC<{ sale?: boolean; children: React.ReactNode; hora: string; palomitas?: boolean; style?: React.CSSProperties }> = ({ sale, children, hora, palomitas, style }) => (
  <div style={{ position: "absolute", [sale ? "right" : "left"]: 22, maxWidth: 420, ...style }}>
    <div style={{ position: "relative", padding: "12px 16px 10px", borderRadius: 20, [sale ? "borderBottomRightRadius" : "borderBottomLeftRadius"]: 6, background: sale ? WA.sale : "#FFFFFF", boxShadow: "0 1px 1.5px rgba(11,20,26,.13)", fontFamily: INTER, fontSize: 26, lineHeight: 1.3, color: "#111B21" }}>
      {children}
      <span style={{ display: "inline-flex", alignItems: "center", float: "right", marginLeft: 14, marginTop: 10, fontSize: 16, color: WA.gris }}>
        {hora}
        {palomitas ? <Palomitas /> : null}
      </span>
      {/* Cola */}
      <svg width="14" height="18" viewBox="0 0 14 18" style={{ position: "absolute", bottom: 0, [sale ? "right" : "left"]: -8, transform: sale ? undefined : "scaleX(-1)" }}>
        <path d="M0 0 C 2 10, 6 15, 14 18 L 0 18 Z" fill={sale ? WA.sale : "#FFFFFF"} />
      </svg>
    </div>
  </div>
);

/**
 * Pantalla de un chat de WhatsApp. Coordenadas internas de una pantalla de 568×1148 (va dentro de `Celular` 600×1180).
 * - `abre` 0→1: la pantalla se abre en círculo desde `origen` (donde está el ícono de la app).
 * - `tecleo`: lo que va escrito en la barra; `tecleoEn`: cuándo empezó a teclear (salta el botón de enviar).
 * - `enviado`/`enviadoEn`: el mensaje ya salió y en qué segundo (sube la burbuja).
 * - `resp` 0→1 entra la respuesta; `respSale` 0→1 se desvanece.
 */
export const ChatWA: React.FC<{
  t: number;
  abre: number;
  tecleo: string;
  enviado: boolean;
  enviadoEn: number;
  tecleoEn?: number;
  escribiendo: boolean;
  resp: number;
  respSale: number;
  contacto?: string;
  avatar?: React.ReactNode;
  mensaje: string;
  respuesta: React.ReactNode;
  hora?: string;
  origen?: string;
}> = ({ t, abre, tecleo, enviado, enviadoEn, tecleoEn, escribiendo, resp, respSale, contacto = MARCA.contacto, avatar, mensaje, respuesta, hora = "9:41", origen = "41% 43%" }) => {
  const botonEn = (tecleoEn ?? enviadoEn - 1) + 0.08;
  const sube = pe(t, enviadoEn, 0.35);
  return (
    <div style={{ position: "absolute", inset: 0, background: WA.fondo, clipPath: `circle(${abre * 130}% at ${origen})` }}>
      {/* Fondo con «doodles» tenues */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.07, backgroundImage: "radial-gradient(circle at 20% 30%, #000 2px, transparent 3px), radial-gradient(circle at 70% 60%, #000 1.5px, transparent 2.5px), radial-gradient(circle at 45% 85%, #000 2px, transparent 3px)", backgroundSize: "120px 120px" }} />
      {/* Barra de estado */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 74, background: WA.barra, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 44px 0", boxSizing: "border-box" }}>
        <span style={{ fontFamily: INTER, fontWeight: 600, fontSize: 24, color: "#000" }}>{hora}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <svg width="30" height="20" viewBox="0 0 30 20">{[0, 1, 2, 3].map((i) => <rect key={i} x={i * 8} y={14 - i * 4} width="5.5" height={6 + i * 4} rx="1.5" fill="#000" />)}</svg>
          <svg width="40" height="20" viewBox="0 0 40 20"><rect x="1" y="2" width="33" height="16" rx="5" fill="none" stroke="#000" strokeOpacity=".4" strokeWidth="2" /><rect x="4" y="5" width="26" height="10" rx="3" fill="#000" /><rect x="36" y="7" width="3" height="6" rx="1.5" fill="#000" fillOpacity=".4" /></svg>
        </div>
      </div>
      {/* Encabezado del chat */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 74, height: 92, background: WA.barra, borderBottom: `1px solid ${WA.linea}`, display: "flex", alignItems: "center", gap: 14, padding: "0 18px", boxSizing: "border-box" }}>
        <IconoLinea d="M15 5l-7 7 7 7" size={38} color="#000" />
        {avatar ?? <LogoMarca size={62} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 27, color: "#111B21" }}>{contacto}</div>
          <div style={{ fontFamily: INTER, fontSize: 19, color: escribiendo ? WA.envio : WA.gris }}>{escribiendo ? "escribiendo…" : "en línea"}</div>
        </div>
        <IconoLinea d="M3 7h12v10H3zM15 10l6-3v10l-6-3" size={38} />
        <div style={{ width: 8 }} />
        <IconoLinea d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" size={34} />
      </div>
      {/* Píldora de fecha */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 196, textAlign: "center" }}>
        <span style={{ padding: "6px 16px", borderRadius: 10, background: "#FFFFFF", fontFamily: INTER, fontSize: 18, color: "#54656F", boxShadow: "0 1px 1px rgba(11,20,26,.1)" }}>Hoy</span>
      </div>
      {enviado ? (
        <Burbuja sale hora={hora} palomitas style={{ top: 270, transform: `translateY(${(1 - sube) * 60}px) scale(${0.9 + 0.1 * sube})`, transformOrigin: "100% 100%", opacity: Math.min(1, pe(t, enviadoEn, 0.2) * 2) }}>
          {mensaje}
        </Burbuja>
      ) : null}
      {resp > 0 ? (
        <Burbuja hora={hora} style={{ top: 380, transform: `scale(${0.85 + 0.15 * resp})`, transformOrigin: "0 100%", opacity: Math.min(1, resp * 2) * (1 - respSale) }}>
          {respuesta}
        </Burbuja>
      ) : null}
      {/* Barra para escribir */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 128, background: WA.barra, borderTop: `1px solid ${WA.linea}`, display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px 0", boxSizing: "border-box" }}>
        <IconoLinea d="M12 5v14M5 12h14" size={40} />
        <div style={{ flex: 1, height: 52, borderRadius: 26, background: "#FFFFFF", border: `1px solid ${WA.linea}`, display: "flex", alignItems: "center", padding: "0 18px", fontFamily: INTER, fontSize: 25, color: "#111B21", whiteSpace: "nowrap", overflow: "hidden" }}>
          {tecleo}
          {tecleo && !enviado ? <span style={{ width: 3, height: 30, marginLeft: 2, background: WA.envio, opacity: Math.floor(t * 4) % 2 ? 1 : 0 }} /> : null}
        </div>
        {tecleo && !enviado ? (
          <div style={{ width: 52, height: 52, borderRadius: 26, background: WA.envio, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${sp(t, botonEn)})` }}>
            <svg width="28" height="28" viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-2.5-6.5z" fill="#fff" /></svg>
          </div>
        ) : (
          <>
            <IconoLinea d="M4 8h3l2-2h6l2 2h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" size={40} />
            <IconoLinea d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3" size={40} />
          </>
        )}
        <div style={{ position: "absolute", left: "50%", bottom: 14, width: 180, height: 7, marginLeft: -90, borderRadius: 4, background: "#000" }} />
      </div>
    </div>
  );
};

// ── WhatsApp iOS en modo oscuro ────────────────────────────────────────

/** Geometría de la pantalla oscura (coordenadas internas de 508×1068, la pantalla de un celular 540×1100). */
export const WA_OSC_GEO = { w: 508, h: 1068, header: 150, hoyY: 176, saleTop: 226, respTop: 330, barra: 968, campo: { x: 66, y: 992, w: 336, h: 52, r: 26 }, enviar: { cx: 458, cy: 1018, r: 28 } };

const PATRON_OSC = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150' fill='none' stroke='#FFFFFF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
  <circle cx='24' cy='26' r='9'/><path d='M64 14l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z'/>
  <path d='M110 22c8 0 14 6 14 14s-6 14-14 14'/><rect x='16' y='76' width='24' height='17' rx='4'/>
  <path d='M66 84c0-8 12-8 12 0s-12 14-12 14-12-6-12-14 12-8 12 0z'/>
  <path d='M106 82h24M118 70v24'/><path d='M22 124l10-10 10 10'/><circle cx='74' cy='126' r='5'/><path d='M106 120q10-12 20 0'/>
</svg>`,
);

/** Emoji de carrito del súper dibujado (Chrome en Windows no trae los emojis de iOS). Mide 1.15 em. */
export const EmojiCarrito: React.FC = () => (
  <svg width="1.15em" height="1.15em" viewBox="0 0 64 64" style={{ verticalAlign: "-0.22em", marginLeft: "0.12em" }}>
    <path d="M4 10h9l3 6" fill="none" stroke="#D9443A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 16h44l-6 24H20z" fill="#C9D3DA" stroke="#8C9AA5" strokeWidth="3" strokeLinejoin="round" />
    <path d="M25 17l2 22M36 17v22M47 17l-2 22M16 26h40M18 34h36" stroke="#8C9AA5" strokeWidth="2.4" />
    <path d="M20 40l-2 7h36" fill="none" stroke="#8C9AA5" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="23" cy="54" r="5" fill="#3B4248" />
    <circle cx="49" cy="54" r="5" fill="#3B4248" />
  </svg>
);

const ColaOsc: React.FC<{ sale?: boolean; color: string }> = ({ sale, color }) => (
  <svg width="14" height="18" viewBox="0 0 14 18" style={{ position: "absolute", bottom: 0, [sale ? "right" : "left"]: -8, transform: sale ? undefined : "scaleX(-1)" }}>
    <path d="M0 0 C 2 10, 6 15, 14 18 L 0 18 Z" fill={color} />
  </svg>
);

/**
 * Chat de WhatsApp iOS en modo oscuro, en coordenadas internas de 508×1068 (`WA_OSC_GEO`).
 * - `tecleo`: lo que va escrito en la barra (aparece el botón verde de enviar).
 * - `enviado`/`enviadoEn`: la burbuja verde sube; `leidoEn`: las palomitas se ponen azules.
 * - `escribiendo`: el subtítulo del encabezado dice «escribiendo…»; `puntos` 0→1: burbuja de tres puntos.
 * - `resp` 0→1: entra la respuesta (ancho `respAncho`, alto `respAlto` fijos para poder transformarla después).
 */
export const ChatWAOscuro: React.FC<{
  t: number;
  contacto?: string;
  avatar?: React.ReactNode;
  tecleo: string;
  enviado: boolean;
  enviadoEn: number;
  leidoEn?: number;
  escribiendo?: boolean;
  puntos?: number;
  resp: number;
  mensaje: string;
  respuesta: React.ReactNode;
  respAncho?: number;
  respAlto?: number;
  hora?: string;
}> = ({ t, contacto = MARCA.contacto, avatar, tecleo, enviado, enviadoEn, leidoEn = 1e9, escribiendo = false, puntos = 0, resp, mensaje, respuesta, respAncho = 404, respAlto = 112, hora = "9:41" }) => {
  const G = WA_OSC_GEO;
  const C = WA_OSCURO;
  const sube = pe(t, enviadoEn, 0.35);
  const hHora = { fontFamily: INTER, fontSize: 15, color: "rgba(233,237,239,.6)" };
  const escribe = tecleo !== "" && !enviado;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: G.w, height: G.h, background: C.fondo, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: `url("data:image/svg+xml,${PATRON_OSC}")`, backgroundSize: "150px 150px" }} />
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
      {/* Píldora de fecha */}
      <div style={{ position: "absolute", left: 0, right: 0, top: G.hoyY, textAlign: "center" }}>
        <span style={{ padding: "6px 16px", borderRadius: 10, background: C.chip, fontFamily: INTER, fontSize: 17, color: C.sub }}>Hoy</span>
      </div>
      {/* Mensaje del usuario */}
      {enviado ? (
        <div style={{ position: "absolute", right: 18, top: G.saleTop, maxWidth: 400, transform: `translateY(${(1 - sube) * 70}px) scale(${0.9 + 0.1 * sube})`, transformOrigin: "100% 100%", opacity: Math.min(1, pe(t, enviadoEn, 0.2) * 2) }}>
          <div style={{ position: "relative", padding: "11px 14px 9px 16px", borderRadius: 18, borderBottomRightRadius: 6, background: C.sale, fontFamily: INTER, fontSize: 25, lineHeight: 1.3, color: C.texto }}>
            {mensaje}
            <span style={{ display: "inline-flex", alignItems: "center", float: "right", marginLeft: 12, marginTop: 10, ...hHora }}>
              {hora}
              <Palomitas color={t >= leidoEn ? C.palomita : C.sub} />
            </span>
            <ColaOsc sale color={C.sale} />
          </div>
        </div>
      ) : null}
      {/* Tres puntos de «escribiendo» */}
      {puntos > 0 ? (
        <div style={{ position: "absolute", left: 18, top: G.respTop, width: 96, height: 54, borderRadius: 18, borderBottomLeftRadius: 6, background: C.entra, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transformOrigin: "0 100%", transform: `scale(${0.6 + 0.4 * puntos})`, opacity: puntos }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 11, height: 11, borderRadius: 6, background: C.sub, transform: `translateY(${-5 * Math.max(0, Math.sin(t * 9 - i * 0.9))}px)` }} />
          ))}
          <ColaOsc color={C.entra} />
        </div>
      ) : null}
      {/* Respuesta */}
      {resp > 0 ? (
        <div style={{ position: "absolute", left: 18, top: G.respTop, width: respAncho, height: respAlto, boxSizing: "border-box", padding: "12px 16px 10px", borderRadius: 18, borderBottomLeftRadius: 6, background: C.entra, fontFamily: INTER, fontSize: 25, lineHeight: 1.36, color: C.texto, transformOrigin: "0 100%", transform: `scale(${0.85 + 0.15 * resp})`, opacity: Math.min(1, resp * 2) }}>
          {respuesta}
          <span style={{ position: "absolute", right: 14, bottom: 8, ...hHora }}>{hora}</span>
          <ColaOsc color={C.entra} />
        </div>
      ) : null}
      {/* Barra para escribir */}
      <div style={{ position: "absolute", left: 0, top: G.barra, width: G.w, height: G.h - G.barra, background: C.barra }} />
      <div style={{ position: "absolute", left: 16, top: G.campo.y + 6 }}>
        <IconoLinea d="M12 5v14M5 12h14" size={40} color={C.texto} />
      </div>
      <div style={{ position: "absolute", left: G.campo.x, top: G.campo.y, width: G.campo.w, height: G.campo.h, borderRadius: G.campo.r, background: C.campo, display: "flex", alignItems: "center", padding: "0 18px", boxSizing: "border-box", fontFamily: INTER, fontSize: 24, color: C.texto, whiteSpace: "nowrap", overflow: "hidden" }}>
        {escribe ? tecleo : ""}
        {escribe ? <span style={{ width: 3, height: 28, marginLeft: 2, background: C.verde, opacity: Math.floor(t * 4) % 2 ? 1 : 0 }} /> : null}
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
