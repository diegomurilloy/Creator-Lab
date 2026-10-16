// Piezas compartidas para reels con video (probadas en reels reales): tiempos, la edición con video continuo
// (cortes, punch-in, zooms, etalonaje, efectos de sonido y subtítulos) y overlays reusables.
// Las escenas se escriben en segundos de la TOMA; la edición recorta y reordena.
import React from "react";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio, Video } from "@remotion/media";
import { FUENTES } from "../marca";
import { LogoMarca } from "./logos";
import { MARCA } from "./paletas";
import type { Palabra } from "./subtitulos";
import { SubtitulosVideo } from "./subtitulos-video";
import { C, FONT, easeInOut, easeOut } from "./tema";

export const FPS = 30;
export const fr = (t: number) => Math.round(t * FPS);
export const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeIn = (x: number) => x * x * x;
/** Progreso 0→1 entre los segundos a y a+dur (tiempos absolutos de la toma). */
export const pr = (t: number, a: number, dur = 10 / FPS, easing = easeOut) =>
  interpolate(t, [a, a + dur], [0, 1], { ...cl, easing });
export const tiembla = (t: number, a: number, dur = 0.6, amp = 8) => {
  if (t < a || t > a + dur) return 0;
  const k = (t - a) / dur;
  return Math.sin(k * Math.PI * 7) * amp * (1 - k);
};
/** Segundo de la toma dentro de una escena que arranca en `desde`. */
export const useT = (desde: number) => desde + useCurrentFrame() / FPS;

// Colores del tema oscuro: el destacado vivo de tu marca para acentos y el rojo de error.
export const CIAN = C.cian;
export const ROJO = C.rojo;
export const INTER = FUENTES.texto;

// ── Edición ──────────────────────────────────────────────────────────────────
export type OpcionesEdicion = {
  /** Tramos [desde, hasta] de la toma, en orden de salida. */
  tramos: [number, number][];
  /** mp4 continuo con los tramos ya pegados (ffmpeg): un solo video evita saltos entre cortes. */
  video: string;
  /** Momentos (s de la toma) donde además cambia el punch-in dentro de un tramo largo. */
  punchExtra?: number[];
  /** Índices de tramos en «pantalla flotante». */
  flotantes?: number[];
  /** Acercamientos lentos [desde, hasta] (s de la toma). */
  zooms?: [number, number][];
  /** Sacudidas de cámara (s de la toma). */
  sacudidas?: number[];
  /** Empuje lento de cámara dentro de cada tramo con cara (p. ej. 0.03 = +3 % al final del tramo). */
  deriva?: number;
  /** Escalas del punch-in alternado (por defecto suaves: 1, 1.07, 1, 1.1). */
  punch?: number[];
  /** Etalonaje sobre la cara: «calido» (cine) o «cosy» (ámbar de foco cálido, paredes crema, lámpara, viñeta y grano). */
  etalonaje?: boolean | "calido" | "cosy" | "suave";
  /** Efectos de sonido sutiles: archivo en public/, segundo de la toma y volumen. */
  sonidos?: { src: string; en: number; volumen?: number }[];
};

// Capas del look «cosy»: tinte ámbar que vuelve crema las paredes, lámpara cálida a un lado, brillo suave
// en la cara, viñeta cálida y grano de película que cambia cada cuadro.
const CapaCosy: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <AbsoluteFill style={{ background: "rgba(255,206,150,.22)", mixBlendMode: "multiply" }} />
    <AbsoluteFill style={{ background: "radial-gradient(60% 45% at 12% 20%, rgba(255,150,60,.55) 0%, rgba(255,150,60,0) 70%)", mixBlendMode: "soft-light" }} />
    <AbsoluteFill style={{ background: "radial-gradient(45% 30% at 50% 36%, rgba(255,190,130,.16) 0%, rgba(255,190,130,0) 70%)", mixBlendMode: "screen" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 78% 68% at 50% 42%, rgba(40,18,6,0) 50%, rgba(40,18,6,.6) 100%)" }} />
    <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%">
        <filter id="grano">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 97} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grano)" />
      </svg>
    </AbsoluteFill>
  </>
);

// Look «suave»: curva de tonos que baja las altas luces (las paredes dejan de verse blancas y quemadas) con una
// calidez muy leve, sin teñir de naranja. Es ajuste de tonos, no una capa de color encima.
export const TonoSuave: React.FC = () => (
  <>
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <filter id="tono-suave" colorInterpolationFilters="sRGB">
        <feComponentTransfer>
          <feFuncR type="table" tableValues="0 0.135 0.28 0.425 0.565 0.69 0.795 0.885" />
          <feFuncG type="table" tableValues="0 0.13 0.27 0.41 0.55 0.67 0.775 0.865" />
          <feFuncB type="table" tableValues="0 0.125 0.258 0.39 0.522 0.636 0.737 0.825" />
        </feComponentTransfer>
      </filter>
    </svg>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 75% at 50% 42%, rgba(0,0,0,0) 60%, rgba(20,14,8,.22) 100%)" }} />
  </>
);

export const crearEdicion = (o: OpcionesEdicion) => {
  let acc = 0;
  const SALIDA = o.tramos.map(([a, b]) => {
    const dur = fr(b) - fr(a);
    const r = { a, b, desde: acc, dur };
    acc += dur;
    return r;
  });
  const DURACION = acc;
  const salidaDeToma = (s: number) => {
    const t = SALIDA.find((x) => s >= x.a && s < x.b);
    return t ? (t.desde + fr(s) - fr(t.a)) / FPS : null;
  };
  const remapear = (ps: Palabra[], ocultar: [number, number][] = []) =>
    ps
      .filter((w) => !ocultar.some(([a, b]) => w.startMs >= a * 1000 && w.startMs < b * 1000))
      .flatMap((w) => {
        const s = salidaDeToma(w.startMs / 1000);
        if (s === null) return [];
        return [{ text: w.text, startMs: Math.round(s * 1000), endMs: Math.round(s * 1000 + (w.endMs - w.startMs)) }];
      })
      .sort((x, y) => x.startMs - y.startMs);

  const pasos = o.punch ?? [1, 1.07, 1, 1.1];
  const escalaPunch = (i: number) => pasos[i % pasos.length];

  const VideoCorte: React.FC = () => {
    const frame = useCurrentFrame();
    const i = Math.max(0, SALIDA.findIndex((x) => frame >= x.desde && frame < x.desde + x.dur));
    const s = SALIDA[i];
    const t = s.a + (frame - s.desde) / FPS;
    const extra = (o.punchExtra ?? []).filter((p) => p > s.a && p < s.b && t >= p).length;
    // Acercamiento lento: sube a +10 % y regresa.
    let zoom = 0;
    for (const [a, b] of o.zooms ?? []) {
      if (t >= a - 0.1 && t <= b + 0.6) zoom = Math.max(zoom, pr(t, a, 0.7, easeInOut) * (1 - pr(t, b, 0.6, easeInOut)));
    }
    let sx = 0;
    let sy = 0;
    for (const a of o.sacudidas ?? []) {
      if (t >= a && t < a + 0.45) {
        const k = (t - a) / 0.45;
        sx += Math.sin(k * 40) * 14 * (1 - k);
        sy += Math.cos(k * 33) * 9 * (1 - k);
      }
    }
    const fl = o.flotantes ?? [];
    const inicioFlota = fl.includes(i) && !fl.includes(i - 1);
    const flota = fl.includes(i) ? (inicioFlota ? interpolate(frame - s.desde, [0, 9], [0, 1], { ...cl, easing: easeOut }) : 1) : 0;
    const deriva = (o.deriva ?? 0) * Math.min(1, (frame - s.desde) / Math.max(1, s.dur));
    const esc = flota > 0 ? 1 - 0.28 * flota : escalaPunch(i * 3 + extra) * (1 + 0.1 * zoom) * (1 + deriva);
    return (
      <AbsoluteFill>
        {flota > 0 ? (
          <AbsoluteFill
            style={{
              backgroundImage: `radial-gradient(rgba(255,255,255,.07) 2px, transparent 2px), radial-gradient(120% 80% at 50% 20%, ${MARCA.pet} 0%, ${C.fondo} 70%)`,
              backgroundSize: "36px 36px, 100% 100%",
            }}
          />
        ) : null}
        <AbsoluteFill
          style={{
            transform: `translate(${sx}px, ${sy + 400 * flota}px) scale(${esc})`,
            transformOrigin: flota > 0 ? "50% 0%" : "50% 30%",
            borderRadius: flota > 0 ? (56 / esc) * flota : 0,
            overflow: "hidden",
            boxShadow: flota > 0 ? "0 40px 90px rgba(0,0,0,.55)" : "none",
          }}
        >
          {/* @remotion/media decodifica en el navegador: OffthreadVideo fallaba al azar con «No frame found». */}
          <Video
            src={staticFile(o.video)}
            style={
              o.etalonaje === "suave"
                ? { filter: "url(#tono-suave)" }
                : o.etalonaje === "cosy"
                ? { filter: "brightness(0.93) contrast(1.05) saturate(1.2) sepia(0.17) hue-rotate(-5deg)" }
                : o.etalonaje
                  ? { filter: "contrast(1.12) saturate(1.14) brightness(0.96) sepia(0.06)" }
                  : undefined
            }
          />
          {o.etalonaje === "suave" ? <TonoSuave /> : o.etalonaje === "cosy" ? <CapaCosy frame={frame} /> : o.etalonaje ? (
            <>
              {/* Luz cálida que entra de arriba a la izquierda, como lámpara de escritorio. */}
              <AbsoluteFill style={{ background: "radial-gradient(70% 55% at 22% 18%, rgba(255,176,96,.22) 0%, rgba(255,176,96,0) 70%)", mixBlendMode: "soft-light" }} />
              <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,190,120,.08) 0%, rgba(20,40,60,.14) 100%)", mixBlendMode: "soft-light" }} />
              <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 70% at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,.42) 100%)" }} />
            </>
          ) : null}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  };

  const Edicion: React.FC<{ motion: React.FC; palabras: Palabra[]; claves: string[]; ocultar?: [number, number][] }> = ({
    motion: Motion,
    palabras,
    claves,
    ocultar,
  }) => (
    <AbsoluteFill style={{ background: "#000" }}>
      <VideoCorte />
      {SALIDA.map((s, i) => (
        <Sequence key={i} from={s.desde} durationInFrames={s.dur}>
          {/* El motion se monta en su tiempo de la toma: el tramo ve el cuadro fr(a) + local. */}
          <Sequence from={-fr(s.a)} layout="none">
            <Motion />
          </Sequence>
        </Sequence>
      ))}
      {(o.sonidos ?? []).map((sn, i) => {
        const s = salidaDeToma(sn.en);
        return s === null ? null : (
          <Sequence key={`sfx${i}`} from={Math.round(s * FPS)} layout="none">
            <Audio src={staticFile(sn.src)} volume={sn.volumen ?? 0.35} />
          </Sequence>
        );
      })}
      <SubtitulosVideo words={remapear(palabras, ocultar)} keywords={claves} colorClave={CIAN} />
    </AbsoluteFill>
  );

  return { SALIDA, DURACION, salidaDeToma, VideoCorte, Edicion };
};

/** Monta las escenas en su tiempo de la toma, con fondo transparente. */
export const montarEscenas = (escenas: readonly { id: string; desde: number; hasta: number }[], comps: Record<string, React.FC>) => {
  const Motion: React.FC = () => (
    <AbsoluteFill>
      {escenas.map((e) => {
        const Comp = comps[e.id];
        return (
          <Sequence key={e.id} from={fr(e.desde)} durationInFrames={fr(e.hasta) - fr(e.desde)}>
            <Comp />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
  return Motion;
};

// ── Overlays reusables ───────────────────────────────────────────────────────

/** Notificación tipo iPhone que baja, se queda y se va. */
export const NotificacionIOS: React.FC<{
  t: number;
  en: number;
  sale: number;
  titulo: string;
  cuerpo: string;
  hora?: string;
  icono: React.ReactNode;
  colorIcono?: string;
  top?: number;
}> = ({ t, en, sale, titulo, cuerpo, hora = "ahora", icono, colorIcono = CIAN, top = 262 }) => {
  const baja = pr(t, en, 0.35, easeOut);
  const sube = pr(t, sale, 0.25, easeIn);
  if (baja === 0 || sube === 1) return null;
  const y = interpolate(baja, [0, 1], [top - 440, top]) - sube * 440;
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        right: 64,
        top: y,
        height: 148,
        borderRadius: 40,
        background: "rgba(44,48,58,.95)",
        boxShadow: "0 24px 60px rgba(0,0,0,.45)",
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "0 30px",
        fontFamily: INTER,
        opacity: top > 600 ? baja * (1 - sube) : 1,
      }}
    >
      <div style={{ width: 84, height: 84, borderRadius: 20, background: colorIcono, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icono}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ color: C.blanco, fontWeight: 700, fontSize: 31 }}>{titulo}</span>
          <span style={{ color: "#A3A8B3", fontWeight: 500, fontSize: 24 }}>{hora}</span>
        </div>
        <span style={{ color: "rgba(255,255,255,.9)", fontWeight: 400, fontSize: 29 }}>{cuerpo}</span>
      </div>
    </div>
  );
};

export type Contacto = { nombre: string; inicial: string; color: string };

/** Hoja de «Enviar a» estilo Instagram: aparece, se elige el primer contacto y se envía. */
export const HojaEnviar: React.FC<{
  t: number;
  en: number;
  elige: number;
  envia: number;
  sale: number;
  titulo: React.ReactNode;
  contactos: Contacto[];
  top?: number;
  /** Colores de la hoja (por defecto, la de Instagram oscura con cian). */
  colores?: { fondo: string; texto: string; apagado: string; boton: string; acento: string; textoBoton: string };
}> = ({ t, en, elige: eligeEn, envia, sale: saleEn, titulo, contactos, top = 270, colores }) => {
  const col = colores ?? { fondo: "#262626", texto: C.blanco, apagado: "#A8A8A8", boton: "#3A3A3A", acento: CIAN, textoBoton: C.fondo };
  const entra = pr(t, en, 0.35);
  const sale = pr(t, saleEn, 0.28, easeIn);
  if (entra === 0 || sale === 1) return null;
  const elige = pr(t, eligeEn, 0.2);
  const presiona = interpolate(t, [envia - 0.1, envia, envia + 0.15], [1, 0.93, 1], cl);
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        top,
        borderRadius: 40,
        background: col.fondo,
        padding: "34px 36px 30px",
        boxShadow: "0 30px 70px rgba(0,0,0,.5)",
        fontFamily: INTER,
        opacity: entra * (1 - sale),
        transform: `translateY(${(1 - entra) * 80 - sale * 40}px)`,
      }}
    >
      <div style={{ width: 80, height: 8, borderRadius: 4, background: "#555", margin: "-14px auto 22px" }} />
      <div style={{ color: col.texto, fontWeight: 700, fontSize: 38, lineHeight: 1.2, fontFamily: FONT }}>{titulo}</div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 30 }}>
        {contactos.map((c, i) => {
          const sel = i === 0 ? elige : 0;
          return (
            <div key={c.nombre} style={{ width: 190, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: 128,
                    height: 128,
                    borderRadius: 64,
                    background: c.color,
                    color: C.blanco,
                    fontWeight: 700,
                    fontSize: 54,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: sel > 0 ? `0 0 0 ${6 * sel}px ${col.fondo}, 0 0 0 ${10 * sel}px ${col.acento}` : "none",
                    transform: `scale(${1 - 0.06 * sel})`,
                  }}
                >
                  {c.inicial}
                </div>
                {sel > 0 ? (
                  <div style={{ position: "absolute", right: -4, bottom: -4, width: 46, height: 46, borderRadius: 23, background: col.acento, border: `4px solid ${col.fondo}`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${sel})` }}>
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={C.fondo} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ) : null}
              </div>
              <span style={{ color: i === 0 && sel > 0.5 ? col.texto : col.apagado, fontWeight: 500, fontSize: 25, textAlign: "center" }}>{c.nombre}</span>
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 28,
          height: 84,
          borderRadius: 18,
          background: elige > 0.5 ? col.acento : col.boton,
          color: elige > 0.5 ? col.textoBoton : col.apagado,
          fontWeight: 700,
          fontSize: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${presiona})`,
        }}
      >
        {t >= envia ? "Enviado ✓" : "Enviar"}
      </div>
    </div>
  );
};

/** Burbuja suelta de chat (gris, estilo WhatsApp oscuro) que hace pop. */
export const BurbujaSuelta: React.FC<{ t: number; en: number; sale: number; texto: string; x: number; y: number; rot?: number }> = ({
  t,
  en,
  sale: saleEn,
  texto,
  x,
  y,
  rot = 0,
}) => {
  const p = pr(t, en, 0.2, easeOut);
  const sale = pr(t, saleEn, 0.18, easeIn);
  if (p === 0 || sale === 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        padding: "16px 24px",
        borderRadius: 22,
        borderTopLeftRadius: 4,
        background: "#202C33",
        color: "#E9EDEF",
        fontFamily: INTER,
        fontSize: 34,
        fontWeight: 500,
        whiteSpace: "nowrap",
        boxShadow: "0 14px 34px rgba(0,0,0,.45)",
        transform: `rotate(${rot}deg) scale(${(0.6 + 0.4 * p) * (1 - 0.4 * sale)})`,
        transformOrigin: "top left",
        opacity: p * (1 - sale),
      }}
    >
      {texto}
    </div>
  );
};

// ── Íconos de canales ─────────────────────────────────────────────────────────
export const IconoWhatsApp: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="12" fill="#25D366" />
    <path d="M12 4.6a7.4 7.4 0 0 0-6.3 11.2L4.7 19.3l3.6-.95A7.4 7.4 0 1 0 12 4.6z" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
    <path
      d="M9.3 8.4c.2-.4.4-.4.6-.4h.5c.2 0 .4.1.5.3l.6 1.5c.1.2 0 .4-.1.6l-.4.5c-.1.1-.1.3 0 .4.5.9 1.3 1.7 2.2 2.2.1.1.3.1.4 0l.5-.4c.2-.1.4-.2.6-.1l1.5.6c.2.1.3.3.3.5v.5c0 .2-.1.5-.4.7-.5.3-1.1.5-1.8.4-1.3-.2-2.8-1.1-3.8-2.1s-1.9-2.5-2.1-3.8c-.1-.7.1-1.3.4-1.8z"
      fill="#fff"
    />
  </svg>
);

export const IconoInstagram: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <defs>
      <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
        <stop offset="0%" stopColor="#FDF497" />
        <stop offset="10%" stopColor="#FDF497" />
        <stop offset="50%" stopColor="#FD5949" />
        <stop offset="68%" stopColor="#D6249F" />
        <stop offset="100%" stopColor="#285AEB" />
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="24" height="24" rx="6" fill="url(#ig-grad)" />
    <rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="#fff" strokeWidth="1.7" />
    <circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" strokeWidth="1.7" />
    <circle cx="16.2" cy="7.8" r="1" fill="#fff" />
  </svg>
);

export const IconoMessenger: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <defs>
      <radialGradient id="ms-grad" cx="19%" cy="99%" r="109%">
        <stop offset="0%" stopColor="#0099FF" />
        <stop offset="61%" stopColor="#A033FF" />
        <stop offset="93%" stopColor="#FF5280" />
        <stop offset="100%" stopColor="#FF7061" />
      </radialGradient>
    </defs>
    <path
      d="M12 1.6C6.2 1.6 1.7 5.9 1.7 11.6c0 3 1.2 5.6 3.3 7.4.2.2.3.4.3.7l.1 1.9c0 .6.7 1 1.2.7l2.1-.9c.2-.1.4-.1.6-.1 1 .3 2 .4 3 .4 5.8 0 10.3-4.2 10.3-9.9S17.8 1.6 12 1.6z"
      fill="url(#ms-grad)"
    />
    <path
      d="M5.8 14.5l3.4-5.4c.4-.6 1.2-.7 1.7-.3l2.7 2c.2.2.6.2.8 0l3.6-2.8c.5-.4 1.1.2.8.7l-3.4 5.4c-.4.6-1.2.7-1.7.3l-2.7-2c-.2-.2-.6-.2-.8 0l-3.6 2.8c-.5.4-1.1-.2-.8-.7z"
      fill="#fff"
    />
  </svg>
);

/** Fondo de los tramos SIN cara: azul con retícula que deriva (nunca un cuadro congelado). Entra con cortina. */
export const FondoPleno: React.FC<{ p: number; t: number; children?: React.ReactNode }> = ({ p, t, children }) =>
  p > 0 ? (
    <AbsoluteFill
      style={{
        clipPath: `inset(${(1 - p) * 100}% 0 0 0 round ${(1 - p) * 60}px)`,
        backgroundImage: `radial-gradient(rgba(255,255,255,.06) 2px, transparent 2px), radial-gradient(110% 70% at ${50 + Math.sin(t * 0.7) * 8}% ${35 + Math.cos(t * 0.5) * 6}%, ${MARCA.pet} 0%, ${C.fondo} 70%)`,
        backgroundSize: "40px 40px, 100% 100%",
        backgroundPosition: `${t * 14}px ${t * 22}px, 0 0`,
      }}
    >
      <AbsoluteFill style={{ transform: `scale(${1 + 0.012 * Math.sin(t * 0.9)}) translateY(${Math.sin(t * 1.1) * 4}px)` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  ) : null;

/** CTA «Comenta PALABRA»: título grande + caja de comentario que teclea la palabra, se publica y llega la respuesta. */
export const ComentarioCTA: React.FC<{ t: number; en: number; sale: number; palabra: string; tecleaEn: number; respuestaEn: number; respuesta: string; top?: number; firma?: string }> = ({
  t,
  en,
  sale: saleEn,
  palabra,
  tecleaEn,
  respuestaEn,
  respuesta,
  top = 270,
  firma = MARCA.firma,
}) => {
  const entra = pr(t, en, 0.3);
  const sale = pr(t, saleEn, 0.3, easeIn);
  if (entra === 0 || sale === 1) return null;
  const n = palabra.length;
  const texto = palabra.slice(0, Math.round(interpolate(t, [tecleaEn, tecleaEn + 0.08 * n], [0, n], cl)));
  const publicado = pr(t, tecleaEn + 0.08 * n + 0.1, 0.25);
  const resp = pr(t, respuestaEn, 0.3);
  const corazon = interpolate(t, [tecleaEn + 0.08 * n + 0.15, tecleaEn + 0.08 * n + 0.27, tecleaEn + 0.08 * n + 0.45], [0, 1.3, 1], cl);
  const avatar = (letra: string, color: string, s = 62) => (
    <div style={{ width: s, height: s, borderRadius: s / 2, background: color, color: C.blanco, fontWeight: 700, fontSize: s * 0.45, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{letra}</div>
  );
  return (
    <AbsoluteFill style={{ fontFamily: INTER, opacity: entra * (1 - sale) }}>
      <div style={{ position: "absolute", top, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 22, transform: `scale(${0.85 + entra * 0.15})` }}>
        <span style={{ color: C.blanco, fontWeight: 800, fontSize: 84, textShadow: "0 4px 14px rgba(0,0,0,.65)", fontFamily: FONT }}>Comenta</span>
        <span style={{ background: CIAN, color: C.fondo, fontWeight: 900, fontSize: 84, padding: "2px 26px", borderRadius: 22, fontFamily: FONT }}>{palabra}</span>
      </div>
      <div style={{ position: "absolute", left: 70, right: 70, top: top + 140, borderRadius: 34, background: "rgba(38,38,38,.96)", padding: "24px 28px", boxShadow: "0 24px 60px rgba(0,0,0,.45)", display: "flex", flexDirection: "column", gap: 20, transform: `translateY(${(1 - entra) * 40}px)` }}>
        {publicado > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: publicado }}>
            {avatar("T", "#8B5CF6")}
            <div style={{ flex: 1 }}>
              <div style={{ color: "#A8A8A8", fontWeight: 600, fontSize: 23 }}>tú · ahora</div>
              <div style={{ color: C.blanco, fontWeight: 600, fontSize: 34 }}>{palabra}</div>
            </div>
            <svg width="40" height="40" viewBox="0 0 24 24" style={{ transform: `scale(${corazon})` }}>
              <path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.3 5 6.6 5c2 0 3.4 1.1 4.4 2.5C12 6.1 13.4 5 15.4 5c3.3 0 5.6 3.3 4.1 6.8C19.5 16.4 12 21 12 21z" fill="#ED4956" />
            </svg>
          </div>
        ) : null}
        {resp > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: 80, opacity: resp, transform: `translateY(${(1 - resp) * 14}px)` }}>
            <LogoMarca size={52} />
            <div>
              <div style={{ color: "#A8A8A8", fontWeight: 600, fontSize: 22 }}>{firma}</div>
              <div style={{ color: C.blanco, fontWeight: 500, fontSize: 30 }}>{respuesta}</div>
            </div>
          </div>
        ) : null}
        {publicado < 1 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: 1 - publicado }}>
            {avatar("T", "#8B5CF6")}
            <div style={{ flex: 1, height: 70, borderRadius: 35, border: "2px solid #3A3A3A", display: "flex", alignItems: "center", padding: "0 26px", fontSize: 31, color: texto ? C.blanco : "#8A8A8A" }}>
              {texto || "Agrega un comentario…"}
            </div>
            <span style={{ color: texto.length === n ? "#0095F6" : "#2C5A80", fontWeight: 700, fontSize: 30 }}>Publicar</span>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
