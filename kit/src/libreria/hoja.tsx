// Mundo de hoja de cálculo: hoja ficticia, cámara virtual, monitor de signos vitales, círculo a mano,
// comentario de celda, pestañas que se empujan, telaraña, cursor, carpeta y contador de señales.
// Todo en segundos de `t`; las piezas se colocan en coordenadas del mundo con `En`.
import React from "react";
import { AbsoluteFill } from "remotion";
import { INTER, MONO, SERIF, expo, pe, sp, suave, tiembla } from "./base";
import { MARCA } from "./paletas";

/** Colores propios de la hoja (verde de hoja apagado + amarillo de nota) sobre la paleta de la marca. */
export const HOJA = {
  verde: "#4E7D5B",
  verdeTexto: "#2F5E3E",
  barra: "#EFEADF",
  barraTexto: "#8F887D",
  rejilla: "#E4DED2",
  sel: "#3F7A55",
  nota: "#F4E29A",
  notaBorde: "#D9BE5C",
  ecg: "#8BD0A6",
  pantalla: "#0F1A1D",
};

// ── Cámara virtual ───────────────────────────────────────────────────────────
export type Cam = { x: number; y: number; s: number; r: number };
/** Una toma: desde `en`, en `dur` segundos, la cámara llega a mirar el punto (x, y) del mundo con escala `s`. */
export type Toma = { en: number; dur: number; x: number; y: number; s: number; r?: number; curva?: (x: number) => number };

/** Posición de la cámara en `t`: encadena las tomas (la escala se interpola en log para que el zoom sea parejo). */
export const camaraEn = (t: number, inicio: Cam, tomas: Toma[]): Cam => {
  let c = { ...inicio };
  for (const k of tomas) {
    if (t <= k.en) break;
    const p = pe(t, k.en, k.dur, k.curva ?? suave);
    c = { x: c.x + (k.x - c.x) * p, y: c.y + (k.y - c.y) * p, s: c.s * Math.pow(k.s / c.s, p), r: c.r + ((k.r ?? c.r) - c.r) * p };
  }
  return c;
};

/** Curva de «scroll que frena en seco»: acelera, va a tope y frena de golpe con un rebote corto hacia atrás. */
export const freno: (x: number) => number = (() => {
  const N = 400;
  const v = (x: number) => (x < 0.4 ? x / 0.4 : x < 0.86 ? 1 : x < 0.9 ? 1 - ((x - 0.86) / 0.04) * 1.25 : -0.25 * (1 - (x - 0.9) / 0.1));
  const acc: number[] = [0];
  for (let i = 1; i <= N; i++) acc.push(acc[i - 1] + v((i - 0.5) / N) / N);
  const total = acc[N];
  return (x: number) => {
    const c = Math.max(0, Math.min(1, x)) * N;
    const i = Math.floor(c);
    const a = acc[i] / total;
    const b = acc[Math.min(N, i + 1)] / total;
    return a + (b - a) * (c - i);
  };
})();

/**
 * El mundo visto por la cámara: el punto (cam.x, cam.y) queda en `centro` de la pantalla.
 * Con `previa` (la cámara un cuadro antes) agrega desenfoque de movimiento en los traslados rápidos.
 */
export const Mundo: React.FC<{ cam: Cam; previa?: Cam; centro?: { x: number; y: number }; children: React.ReactNode; blurMax?: number }> = ({ cam, previa, centro = { x: 540, y: 800 }, children, blurMax = 9 }) => {
  let blur = 0;
  if (previa) {
    const vel = Math.hypot(cam.x - previa.x, cam.y - previa.y) * cam.s + Math.abs(Math.log(cam.s / previa.s)) * 900;
    blur = Math.min(blurMax, Math.max(0, (vel - 8) * 0.09));
  }
  return (
    <AbsoluteFill style={{ filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
      <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${centro.x}px, ${centro.y}px) rotate(${cam.r}deg) scale(${cam.s}) translate(${-cam.x}px, ${-cam.y}px)` }}>{children}</div>
    </AbsoluteFill>
  );
};

/** Coloca algo en (x, y) del mundo (esquina superior izquierda). */
export const En: React.FC<{ x: number; y: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ x, y, children, style }) => (
  <div style={{ position: "absolute", left: x, top: y, ...style }}>{children}</div>
);

// ── Hoja de cálculo ficticia ─────────────────────────────────────────────────
export type Columna = { letra: string; ancho: number; titulo: string; alinea?: "left" | "right" | "center" };
export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Geometría de la hoja. Filas numeradas desde 1 (la 1 es el encabezado). Arriba: barra de título (0–190),
 * herramientas (190–270), barra de fórmula (270–340) y letras de columna (340–y0). Abajo: barra de pestañas.
 */
export const geoHoja = (columnas: Columna[], filas: number, o: { rotulo?: number; y0?: number; fila?: number; barra?: number } = {}) => {
  const RH = o.rotulo ?? 100;
  const Y0 = o.y0 ?? 400;
  const FILA = o.fila ?? 110;
  const BARRA = o.barra ?? 130;
  const xs: number[] = [];
  let x = RH;
  columnas.forEach((c) => {
    xs.push(x);
    x += c.ancho;
  });
  const yFila = (f: number) => Y0 + (f - 1) * FILA;
  const celda = (f: number, c: number): Rect => ({ x: xs[c], y: yFila(f), w: columnas[c].ancho, h: FILA });
  const pestanasY = Y0 + filas * FILA;
  return { RH, Y0, FILA, BARRA, xs, ancho: x, alto: pestanasY + BARRA, pestanasY, yFila, celda, columnas, filas };
};
export type GeoHoja = ReturnType<typeof geoHoja>;

/**
 * Hoja de cálculo genérica (sin logos de marcas). `datos[0]` es la fila 2.
 * `encabezado`: color del encabezado; con `nuevo` y `cambio` se repinta solo de izquierda a derecha en ese segundo.
 * `celda(f, c)` permite reemplazar el contenido de una celda; `fondo(f, c)` su relleno. `sel`: celda activa.
 * `pestanas`: lo que va en la barra de abajo. `children`: capas encima, en coordenadas de la hoja.
 */
export const HojaCalculo: React.FC<{
  t: number;
  geo: GeoHoja;
  titulo: string;
  modificado?: React.ReactNode;
  datos: string[][];
  encabezado?: { color: string; nuevo?: string; cambio?: number; tintaNueva?: string };
  celda?: (f: number, c: number) => React.ReactNode | undefined;
  fondo?: (f: number, c: number) => string | undefined;
  sel?: { f: number; c: number } | null;
  formula?: string;
  pestanas?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ t, geo, titulo, modificado, datos, encabezado = { color: HOJA.verde }, celda, fondo, sel, formula = "", pestanas, children }) => {
  const { RH, Y0, FILA, xs, ancho, alto, columnas, filas, pestanasY } = geo;
  const barridoK = encabezado.nuevo && encabezado.cambio !== undefined ? pe(t, encabezado.cambio, 0.55, suave) : 0;
  const filaEnc = (color: string, tinta: string) => (
    <div style={{ position: "absolute", left: RH, top: Y0, width: ancho - RH, height: FILA, background: color }}>
      {columnas.map((c, i) => (
        <div key={i} style={{ position: "absolute", left: xs[i] - RH, top: 0, width: c.ancho, height: FILA, display: "flex", alignItems: "center", justifyContent: c.alinea === "right" ? "flex-end" : "flex-start", padding: "0 26px", boxSizing: "border-box", fontFamily: INTER, fontWeight: 700, fontSize: 40, color: tinta, borderRight: `2px solid rgba(255,255,255,.18)` }}>
          {c.titulo}
        </div>
      ))}
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: ancho, height: alto, background: MARCA.hoja, borderRadius: 30, overflow: "hidden", boxShadow: "0 60px 140px rgba(22,25,28,.18), 0 0 0 2px rgba(22,25,28,.06)" }}>
      {/* Barra de título: ícono de hoja genérico, nombre y menú */}
      <div style={{ position: "absolute", left: 0, top: 0, width: ancho, height: 190, background: MARCA.hoja }}>
        <svg width="88" height="108" viewBox="0 0 88 108" style={{ position: "absolute", left: 50, top: 38 }}>
          <path d="M8 0 H60 L88 28 V100 a8 8 0 0 1 -8 8 H8 a8 8 0 0 1 -8 -8 V8 a8 8 0 0 1 8 -8 Z" fill={HOJA.verde} />
          <path d="M60 0 V28 H88 Z" fill="#7FA98A" />
          <rect x="18" y="48" width="52" height="40" rx="3" fill="none" stroke={MARCA.hoja} strokeWidth="5" />
          <path d="M18 61 H70 M18 75 H70 M38 48 V88" stroke={MARCA.hoja} strokeWidth="5" />
        </svg>
        <div style={{ position: "absolute", left: 170, top: 30, fontFamily: INTER, fontWeight: 600, fontSize: 56, color: MARCA.tinta, letterSpacing: "-0.01em" }}>{titulo}</div>
        <div style={{ position: "absolute", left: 172, top: 112, display: "flex", gap: 40, fontFamily: INTER, fontWeight: 500, fontSize: 32, color: MARCA.sec }}>
          {["Archivo", "Editar", "Ver", "Insertar"].map((m) => (
            <span key={m}>{m}</span>
          ))}
          {modificado}
        </div>
      </div>
      {/* Herramientas: glifos abstractos */}
      <div style={{ position: "absolute", left: 30, top: 196, width: ancho - 60, height: 66, borderRadius: 33, background: HOJA.barra, display: "flex", alignItems: "center", gap: 26, padding: "0 36px", boxSizing: "border-box" }}>
        {[46, 46, 30, 70, 30, 30, 30, 90, 40, 40, 40, 30, 120, 30, 30].map((w, i) => (
          <div key={i} style={{ width: w, height: 22, borderRadius: 8, background: i % 4 === 3 ? "#D9D2C4" : "#CFC8BA" }} />
        ))}
      </div>
      {/* Barra de fórmula */}
      <div style={{ position: "absolute", left: 0, top: 276, width: ancho, height: 62, borderTop: `2px solid ${HOJA.rejilla}`, borderBottom: `2px solid ${HOJA.rejilla}`, display: "flex", alignItems: "center" }}>
        <div style={{ width: RH + 60, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 38, color: MARCA.sec }}>fx</div>
        <div style={{ fontFamily: INTER, fontSize: 32, color: MARCA.tinta }}>{formula}</div>
      </div>
      {/* Letras de columna */}
      <div style={{ position: "absolute", left: 0, top: 340, width: ancho, height: Y0 - 340, background: HOJA.barra, borderBottom: `2px solid ${HOJA.rejilla}` }}>
        {columnas.map((c, i) => (
          <div key={i} style={{ position: "absolute", left: xs[i], top: 0, width: c.ancho, height: Y0 - 340, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 600, fontSize: 28, color: sel?.c === i ? HOJA.verdeTexto : HOJA.barraTexto, background: sel?.c === i ? "#DCE6DC" : undefined, borderRight: `2px solid ${HOJA.rejilla}` }}>
            {c.letra}
          </div>
        ))}
      </div>
      {/* Números de fila */}
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: 0, top: Y0 + i * FILA, width: RH, height: FILA, background: sel?.f === i + 1 ? "#DCE6DC" : HOJA.barra, borderBottom: `2px solid ${HOJA.rejilla}`, borderRight: `2px solid ${HOJA.rejilla}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 600, fontSize: 28, color: sel?.f === i + 1 ? HOJA.verdeTexto : HOJA.barraTexto, boxSizing: "border-box" }}>
          {i + 1}
        </div>
      ))}
      {/* Celdas */}
      {Array.from({ length: filas - 1 }, (_, i) => {
        const f = i + 2;
        return columnas.map((c, j) => {
          const propio = celda?.(f, j);
          const txt = datos[i]?.[j] ?? "";
          return (
            <div key={`${f}-${j}`} style={{ position: "absolute", left: xs[j], top: Y0 + (f - 1) * FILA, width: c.ancho, height: FILA, background: fondo?.(f, j), borderRight: `2px solid ${HOJA.rejilla}`, borderBottom: `2px solid ${HOJA.rejilla}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: c.alinea === "right" ? "flex-end" : c.alinea === "center" ? "center" : "flex-start", padding: "0 26px", fontFamily: INTER, fontWeight: 500, fontSize: 42, color: MARCA.tinta, whiteSpace: "nowrap", overflow: "hidden", fontVariantNumeric: "tabular-nums" }}>
              {propio ?? txt}
            </div>
          );
        });
      })}
      {/* Encabezado (fila 1), con repintado que barre */}
      {filaEnc(encabezado.color, MARCA.hoja)}
      {encabezado.nuevo ? <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - barridoK) * 100}% 0 0)` }}>{filaEnc(encabezado.nuevo, encabezado.tintaNueva ?? MARCA.obs)}</div> : null}
      {/* Celda activa */}
      {sel ? (
        <div style={{ position: "absolute", left: xs[sel.c] - 3, top: Y0 + (sel.f - 1) * FILA - 3, width: columnas[sel.c].ancho + 4, height: FILA + 4, border: `5px solid ${HOJA.sel}`, boxSizing: "border-box", borderRadius: 3 }}>
          <div style={{ position: "absolute", right: -10, bottom: -10, width: 16, height: 16, background: HOJA.sel, border: `3px solid ${MARCA.hoja}` }} />
        </div>
      ) : null}
      {/* Barra de pestañas */}
      <div style={{ position: "absolute", left: 0, top: pestanasY, width: ancho, height: alto - pestanasY, background: HOJA.barra, borderTop: `2px solid ${HOJA.rejilla}`, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 40, top: 30, fontFamily: INTER, fontWeight: 400, fontSize: 58, lineHeight: "60px", color: MARCA.sec }}>+</div>
        <svg width="44" height="40" viewBox="0 0 44 40" style={{ position: "absolute", left: 130, top: 44 }}>
          <path d="M4 6 H40 M4 20 H40 M4 34 H40" stroke={MARCA.sec} strokeWidth="5" strokeLinecap="round" />
        </svg>
        {pestanas}
      </div>
      {children}
    </div>
  );
};

// ── Pestañas que se multiplican y se empujan ─────────────────────────────────
export type Pestana = { texto: string; en: number };
/** Ancho estimado de una pestaña (Inter 38 px). */
export const anchoPestana = (texto: string) => Math.round(texto.length * 21 + 96);
/**
 * Barra de pestañas: cada pestaña nueva entra a la izquierda (en `x0`) y empuja a las demás.
 * `resalta`: índice que se marca en rojo desde `enResalta`. La más nueva queda activa.
 */
export const Pestanas: React.FC<{ t: number; lista: Pestana[]; x0?: number; alto?: number; resalta?: number; enResalta?: number }> = ({ t, lista, x0 = 230, alto = 130, resalta, enResalta = 0 }) => {
  const visibles = lista.map((p, i) => ({ ...p, i, k: p.en < 0 ? 1 : sp(t, p.en, { damping: 14, stiffness: 190 }) }));
  const activa = visibles.reduce((m, p) => (p.k > 0.5 ? p.i : m), 0);
  return (
    <>
      {visibles.map((p) => {
        if (p.k <= 0) return null;
        // Lo que empujan todas las más nuevas que ya entraron.
        const empuje = visibles.filter((q) => q.i > p.i).reduce((s, q) => s + Math.max(0, q.k) * (anchoPestana(q.texto) + 10), 0);
        const w = anchoPestana(p.texto);
        const esActiva = p.i === activa;
        const roja = resalta === p.i && t >= enResalta;
        const pulso = roja ? 1 + 0.06 * Math.max(0, 1 - (t - enResalta) / 0.25) : 1;
        return (
          <div key={p.i} style={{ position: "absolute", left: x0 + empuje, top: 14, width: w, height: alto - 28, transformOrigin: "left center", transform: `scaleX(${Math.min(1, p.k)}) scale(${pulso})`, opacity: Math.min(1, p.k * 2), borderRadius: 18, background: esActiva || roja ? MARCA.hoja : "transparent", border: `3px solid ${roja ? MARCA.error : esActiva ? HOJA.rejilla : "transparent"}`, boxShadow: esActiva ? "0 6px 18px rgba(22,25,28,.08)" : undefined, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: esActiva || roja ? 700 : 500, fontSize: 38, color: roja ? MARCA.error : esActiva ? HOJA.verdeTexto : MARCA.sec, whiteSpace: "nowrap", boxSizing: "border-box" }}>
            {p.texto}
          </div>
        );
      })}
    </>
  );
};

// ── Monitor de signos vitales (gráfica insertada en la hoja) ─────────────────
const latido = (p: number) => {
  const g = (c: number, w: number, a: number) => a * Math.exp(-(((p - c) / w) ** 2));
  return g(0.12, 0.035, 0.12) + g(0.27, 0.012, -0.15) + g(0.3, 0.013, 1) + g(0.335, 0.014, -0.32) + g(0.56, 0.05, 0.24);
};
const PERIODO = 0.82;
/** Valor del trazo en el instante τ: late normal hasta `plano`; después, plano salvo los `bips`. */
const senal = (tau: number, plano: number, bips: { en: number; amp: number }[]) => {
  if (tau < plano) {
    const p = (((tau / PERIODO) % 1) + 1) % 1;
    return latido(p);
  }
  return bips.reduce((s, b) => {
    const q = (tau - b.en) / PERIODO + 0.3;
    return q >= 0 && q < 1 ? s + b.amp * latido(q) : s;
  }, 0);
};
/** Solo el trazo (sin tarjeta), para etiquetas o íconos: misma lógica que el monitor. */
export const TrazoVital: React.FC<{ t: number; plano: number; bips?: { en: number; amp: number }[]; w?: number; h?: number; color?: string; grosor?: number; ventana?: number }> = ({ t, plano, bips = [], w = 140, h = 56, color = MARCA.error, grosor = 4, ventana = 1.6 }) => {
  const N = 160;
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const tau = t - (1 - i / N) * ventana;
    pts.push(`${((i / N) * w).toFixed(1)},${(h * 0.62 - senal(tau, plano, bips) * h * 0.55).toFixed(1)}`);
  }
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={grosor} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

/**
 * Monitor de w×h: el trazo corre de izquierda a derecha, se aplana en `plano` (se pone rojo, LPM a 0)
 * y da un bip en cada `bips` (amp 0–1). `oscuro`: tarjeta en noche (para apagones).
 */
export const MonitorVital: React.FC<{ t: number; plano: number; bips?: { en: number; amp: number }[]; w?: number; h?: number; titulo?: string }> = ({ t, plano, bips = [], w = 720, h = 680, titulo = "Signos vitales" }) => {
  const muerto = t >= plano;
  const sx = 24;
  const sy = 96;
  const sw = w - 48;
  const sh = h - 96 - 170;
  const N = 420;
  const ventana = 2.3;
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * sw;
    const tau = t - (1 - i / N) * ventana;
    const v = senal(tau, plano, bips);
    pts.push(`${x.toFixed(1)},${(sh * 0.62 - v * sh * 0.5).toFixed(1)}`);
  }
  const vFin = senal(t, plano, bips);
  const color = muerto ? MARCA.error : HOJA.ecg;
  const bipActivo = bips.some((b) => t >= b.en - 0.05 && t < b.en + 0.25);
  return (
    <div style={{ position: "relative", width: w, height: h, borderRadius: 28, background: MARCA.hoja, boxShadow: "0 30px 70px rgba(22,25,28,.16), 0 0 0 2px rgba(22,25,28,.07)" }}>
      <div style={{ position: "absolute", left: 30, top: 30, fontFamily: MONO, fontWeight: 500, fontSize: 26, letterSpacing: "0.14em", textTransform: "uppercase", color: MARCA.sec }}>{titulo}</div>
      <div style={{ position: "absolute", right: 30, top: 24, display: "flex", alignItems: "center", gap: 12, padding: "6px 18px", borderRadius: 30, background: muerto ? "rgba(200,97,63,.12)" : "rgba(78,125,91,.12)", fontFamily: INTER, fontWeight: 700, fontSize: 26, color: muerto ? MARCA.error : HOJA.verdeTexto }}>
        <div style={{ width: 14, height: 14, borderRadius: 7, background: muerto ? MARCA.error : HOJA.verde, opacity: muerto && Math.floor(t * 4) % 2 ? 0.3 : 1 }} />
        {muerto ? "Sin pulso" : "Estable"}
      </div>
      <div style={{ position: "absolute", left: sx, top: sy, width: sw, height: sh, borderRadius: 18, background: HOJA.pantalla, overflow: "hidden" }}>
        <svg width={sw} height={sh} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: Math.floor(sw / 48) }, (_, i) => (
            <line key={`v${i}`} x1={i * 48 + 24} y1={0} x2={i * 48 + 24} y2={sh} stroke="rgba(139,208,166,.09)" strokeWidth={2} />
          ))}
          {Array.from({ length: Math.floor(sh / 48) + 1 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 48 + 12} x2={sw} y2={i * 48 + 12} stroke="rgba(139,208,166,.09)" strokeWidth={2} />
          ))}
          <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
          <circle cx={sw} cy={sh * 0.62 - vFin * sh * 0.5} r={bipActivo ? 13 : 9} fill={color} style={{ filter: `drop-shadow(0 0 12px ${color})` }} />
        </svg>
      </div>
      <div style={{ position: "absolute", left: 34, bottom: 28, display: "flex", alignItems: "baseline", gap: 14 }}>
        <span style={{ fontFamily: SERIF, fontSize: 130, lineHeight: 1, color: muerto ? MARCA.error : MARCA.tinta, fontVariantNumeric: "tabular-nums" }}>{muerto ? "0" : "72"}</span>
        <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 26, letterSpacing: "0.14em", color: MARCA.sec }}>LPM</span>
      </div>
      <svg width="70" height="62" viewBox="0 0 24 21" style={{ position: "absolute", right: 40, bottom: 52, transform: `scale(${muerto ? 1 : 1 + 0.12 * Math.max(0, 1 - ((((t - 0.25) / PERIODO) % 1) + 1) % 1 * 5)})` }}>
        <path d="M12 21 L2.4 11.2 A6 6 0 0 1 12 3.6 A6 6 0 0 1 21.6 11.2 Z" fill={muerto ? MARCA.linea : MARCA.error} />
      </svg>
    </div>
  );
};

// ── Círculo rojo a mano ──────────────────────────────────────────────────────
/** Trazo irregular de w×h que se dibuja en `dur` s desde `en` y se pasa de largo (como a mano). */
export const CirculoMano: React.FC<{ t: number; en: number; w: number; h: number; color?: string; grosor?: number; dur?: number; semilla?: number }> = ({ t, en, w, h, color = MARCA.error, grosor = 11, dur = 0.34, semilla = 1 }) => {
  if (t < en) return null;
  const k = pe(t, en, dur, expo);
  const pts: string[] = [];
  const N = 70;
  const a0 = -2.2 + semilla * 0.3;
  for (let i = 0; i <= N; i++) {
    const q = i / N;
    const a = a0 + q * Math.PI * 2 * 1.13;
    const j = 1 + 0.035 * Math.sin(3 * a + semilla) + 0.025 * Math.sin(5 * a + semilla * 2) + q * 0.07;
    pts.push(`${(w / 2 + (w / 2) * j * Math.cos(a)).toFixed(1)},${(h / 2 + (h / 2) * j * Math.sin(a) * (1 - q * 0.04)).toFixed(1)}`);
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", transform: `rotate(${-3 + semilla}deg)` }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} />
    </svg>
  );
};

// ── Comentario de celda (nota amarilla) ──────────────────────────────────────
/**
 * Nota que brota desde su esquina inferior izquierda en `en`; el texto se teclea y la fecha entra
 * por su máscara en `enFecha`.
 */
export const ComentarioCelda: React.FC<{ t: number; en: number; texto: string; fecha?: string; enFecha?: number; autor?: string; w?: number }> = ({ t, en, texto, fecha, enFecha = en + 1, autor = "Tú", w = 600 }) => {
  if (t < en) return null;
  const k = sp(t, en, { damping: 13, stiffness: 170 });
  const n = Math.max(0, Math.min(texto.length, Math.floor((t - en - 0.12) / 0.04)));
  const kf = pe(t, enFecha, 0.45);
  return (
    <div style={{ width: w, transformOrigin: "0% 100%", transform: `scale(${0.3 + 0.7 * k}) rotate(${(1 - k) * -6}deg)`, opacity: Math.min(1, k * 2), borderRadius: 22, background: HOJA.nota, boxShadow: "0 30px 60px rgba(22,25,28,.18), 0 0 0 3px rgba(217,190,92,.6)", padding: "26px 32px 30px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 58, height: 58, borderRadius: 29, background: MARCA.obs, color: MARCA.crema, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 700, fontSize: 30 }}>{autor.slice(0, 1)}</div>
        <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 34, color: MARCA.tinta }}>{autor}</div>
        {fecha ? (
          <div style={{ marginLeft: "auto", overflow: "hidden", height: 48 }}>
            <div style={{ transform: `translateY(${(1 - kf) * 52}px)`, filter: kf < 0.9 ? `blur(${(1 - kf) * 4}px)` : undefined, display: "flex", alignItems: "center", gap: 10, padding: "4px 16px", borderRadius: 24, background: "rgba(22,25,28,.08)", fontFamily: INTER, fontWeight: 600, fontSize: 30, color: MARCA.tinta }}>
              <svg width="26" height="26" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke={MARCA.tinta} strokeWidth="2.6" />
                <path d="M12 6 V12 L16 14" fill="none" stroke={MARCA.tinta} strokeWidth="2.6" strokeLinecap="round" />
              </svg>
              {fecha}
            </div>
          </div>
        ) : null}
      </div>
      <div style={{ marginTop: 18, fontFamily: SERIF, fontStyle: "italic", fontSize: 72, lineHeight: 1.05, color: MARCA.tinta, minHeight: 76 }}>
        {texto.slice(0, n)}
        <span style={{ opacity: n < texto.length && Math.floor(t * 4) % 2 === 0 ? 1 : 0 }}>|</span>
      </div>
    </div>
  );
};

// ── Telaraña de esquina ──────────────────────────────────────────────────────
/** Telaraña que crece (k 0→1) desde la esquina superior izquierda de un cuadro de `size`. Gírala con `rot`. */
export const Telarana: React.FC<{ k: number; size?: number; color?: string; rot?: number }> = ({ k, size = 200, color = "rgba(119,114,106,.75)", rot = 0 }) => {
  if (k <= 0) return null;
  const rayos = [0, 22, 45, 68, 90].map((d) => (d * Math.PI) / 180);
  const anillos = [0.28, 0.5, 0.72, 0.94];
  const kr = Math.min(1, k * 1.6);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible", transform: `rotate(${rot}deg)`, transformOrigin: "0 0" }}>
      {rayos.map((a, i) => (
        <line key={i} x1={0} y1={0} x2={Math.cos(a) * size * kr} y2={Math.sin(a) * size * kr} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      ))}
      {anillos.map((r, j) => {
        const kj = Math.max(0, Math.min(1, (k - 0.25 - j * 0.15) / 0.25));
        if (kj <= 0) return null;
        const d = rayos
          .slice(1)
          .map((a, i) => {
            const a0 = rayos[i];
            const p0 = [Math.cos(a0) * size * r, Math.sin(a0) * size * r];
            const p1 = [Math.cos(a) * size * r, Math.sin(a) * size * r];
            const m = (a0 + a) / 2;
            const c = [Math.cos(m) * size * r * 0.86, Math.sin(m) * size * r * 0.86];
            return `${i === 0 ? `M ${p0[0]} ${p0[1]}` : ""} Q ${c[0]} ${c[1]} ${p1[0]} ${p1[1]}`;
          })
          .join(" ");
        return <path key={j} d={d} fill="none" stroke={color} strokeWidth={2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - kj} />;
      })}
    </svg>
  );
};

// ── Cursor del mouse ─────────────────────────────────────────────────────────
/** Flecha del mouse (punta en 0,0). `clic`: segundo del clic (se encoge y suelta una onda). */
export const Cursor: React.FC<{ t: number; size?: number; clic?: number }> = ({ t, size = 70, clic }) => {
  const kc = clic !== undefined ? pe(t, clic, 0.5) : 0;
  const hunde = clic !== undefined && t >= clic && t < clic + 0.14 ? 0.86 : 1;
  return (
    <div style={{ position: "relative", width: 0, height: 0 }}>
      {clic !== undefined && t >= clic && kc < 1 ? <div style={{ position: "absolute", left: -50, top: -50, width: 100, height: 100, borderRadius: 50, border: `${6 * (1 - kc)}px solid ${HOJA.sel}`, transform: `scale(${0.3 + kc * 1.2})`, opacity: 1 - kc }} /> : null}
      <svg width={size} height={size * 1.4} viewBox="0 0 20 28" style={{ position: "absolute", left: -size * 0.08, top: -size * 0.05, transform: `scale(${hunde})`, transformOrigin: "0 0", filter: "drop-shadow(0 6px 10px rgba(22,25,28,.3))" }}>
        <path d="M1.5 1.5 L1.5 22 L6.6 17.4 L10 25.5 L13.6 24 L10.3 16 L17.2 16 Z" fill={MARCA.tinta} stroke={MARCA.hoja} strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// ── Carpeta (atrás y frente por separado para meter algo en medio) ────────────
/** Parte de atrás de la carpeta (con pestaña) de w×h. */
export const CarpetaAtras: React.FC<{ w?: number; h?: number; color?: string }> = ({ w = 760, h = 520, color = "#B48F60" }) => (
  <div style={{ position: "relative", width: w, height: h }}>
    <div style={{ position: "absolute", left: 0, top: -54, width: w * 0.38, height: 90, borderRadius: "26px 26px 0 0", background: color }} />
    <div style={{ position: "absolute", inset: 0, borderRadius: "0 28px 28px 28px", background: color, boxShadow: "0 50px 100px rgba(22,25,28,.2)" }} />
  </div>
);
/** Frente de la carpeta: `abre` 0→1 lo inclina hacia el frente. `children` va en el frente (p. ej. etiqueta). */
export const CarpetaFrente: React.FC<{ w?: number; h?: number; abre?: number; color?: string; children?: React.ReactNode }> = ({ w = 760, h = 400, abre = 0, color = MARCA.dorado, children }) => (
  <div style={{ position: "relative", width: w, height: h, perspective: 1400 }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: 28, background: `linear-gradient(180deg, #D4B68C 0%, ${color} 100%)`, transformOrigin: "50% 100%", transform: `rotateX(${abre * 32}deg)`, boxShadow: "0 -8px 30px rgba(22,25,28,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
  </div>
);

// ── Contador de señales (pegado a la cámara) ─────────────────────────────────
/**
 * «Señales n/total»: cada casilla se llena en su segundo de `marcas`. Con `censura` la siguiente casilla
 * sale roja con «?» y la cifra como «?/total». `extra`: segundo en que aparece una casilla de más (n/total en rojo).
 */
export const ContadorSenales: React.FC<{ t: number; marcas: number[]; censura?: { a: number; b: number }; extra?: number; etiqueta?: string }> = ({ t, marcas, censura, extra, etiqueta = "Señales" }) => {
  const total = marcas.length;
  const n = marcas.filter((m) => t >= m).length + (extra !== undefined && t >= extra ? 1 : 0);
  const censurado = censura && t >= censura.a && t < censura.b;
  const pasado = extra !== undefined && t >= extra;
  // La cifra cambia por máscara (sube la nueva), nunca rebota.
  const ultimo = [...marcas, ...(extra !== undefined ? [extra] : [])].filter((m) => t >= m).pop() ?? -10;
  const cambio = censura && t >= censura.a ? Math.max(ultimo, censurado ? censura.a : censura.b) : ultimo;
  const kc = pe(t, cambio, 0.32);
  const cifra = censurado ? "?" : String(n);
  const slots = [...marcas.map((m, i) => ({ m, i, extra: false })), ...(extra !== undefined && t >= extra ? [{ m: extra, i: total, extra: true }] : [])];
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 26, padding: "18px 28px 18px 30px", borderRadius: 30, background: MARCA.hoja, boxShadow: "0 20px 50px rgba(22,25,28,.14), 0 0 0 2px rgba(22,25,28,.06)" }}>
      <div>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 22, letterSpacing: "0.16em", textTransform: "uppercase", color: MARCA.sec }}>{etiqueta}</div>
        <div style={{ height: 64, overflow: "hidden", fontFamily: SERIF, fontSize: 66, lineHeight: "66px", color: censurado || pasado ? MARCA.error : MARCA.tinta, fontVariantNumeric: "tabular-nums" }}>
          <span style={{ display: "inline-block", transform: `translateY(${(1 - kc) * 60}px)`, filter: kc < 0.9 ? `blur(${(1 - kc) * 3}px)` : undefined }}>{cifra}</span>
          <span style={{ color: pasado ? MARCA.error : MARCA.sec }}>/{total}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {slots.map(({ m, i, extra: esExtra }) => {
          const lleno = t >= m;
          const k = lleno ? sp(t, m, { damping: 11, stiffness: 200 }) : 0;
          const esCensura = censurado && i === marcas.filter((x) => t >= x).length;
          const w = esExtra ? 62 * Math.min(1, sp(t, m, { damping: 14 })) : 62;
          return (
            <div key={i} style={{ position: "relative", width: w, height: 62, borderRadius: 16, border: `3px solid ${esCensura ? MARCA.error : lleno ? "transparent" : MARCA.linea}`, background: esCensura ? MARCA.error : "transparent", boxSizing: "border-box", overflow: "hidden", boxShadow: esCensura ? `0 0 ${24 + 10 * Math.sin(t * 9)}px rgba(200,97,63,.8)` : undefined }}>
              {lleno ? (
                <div style={{ position: "absolute", inset: -3, borderRadius: 16, background: esExtra ? MARCA.error : MARCA.obs, transform: `scale(${k})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 800, fontSize: 32, color: MARCA.crema }}>{i + 1}</div>
              ) : null}
              {esCensura ? (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 800, fontSize: 36, color: MARCA.hoja, transform: `translateX(${tiembla(t, censura!.a, 10, 2)}px)` }}>?</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Araña que baja por su hilo ───────────────────────────────────────────────
/**
 * Araña plana y simpática (paleta de la marca) colgada de un hilo cuyo extremo de arriba está en (x, y) del mundo.
 * Desde `en` baja `largo` px con un rebote de resorte en el hilo; luego se queda columpiándose y mueve las patas.
 * `size`: ancho del cuerpo con patas.
 */
export const Arana: React.FC<{ t: number; en: number; x: number; y: number; largo: number; size?: number; color?: string }> = ({ t, en, x, y, largo, size = 110, color = MARCA.obs }) => {
  if (t < en) return null;
  const k = sp(t, en, { damping: 6, stiffness: 55, mass: 1 });
  const baja = largo * k;
  const columpio = Math.sin((t - en) * 2.6) * 5 * Math.min(1, (t - en) / 0.6);
  const s = size / 110;
  const patas = [-1, 1].flatMap((lado) =>
    [0, 1, 2, 3].map((i) => {
      const a = ((-40 + i * 27) * Math.PI) / 180;
      const mueve = Math.sin(t * 15 + i * 1.7 + (lado > 0 ? 0 : 1.3)) * 0.18;
      const r1 = 30;
      const r2 = 26;
      const x1 = lado * Math.cos(a + mueve) * r1;
      const y1 = Math.sin(a + mueve) * r1 - 10;
      const x2 = x1 + lado * Math.cos(a + 0.9 + mueve) * r2;
      const y2 = y1 + Math.sin(a + 0.9 + mueve) * r2 + 8;
      return `M 0 4 Q ${x1 * 0.6} ${y1 - 14} ${x1} ${y1} L ${x2} ${y2}`;
    }),
  );
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, transformOrigin: "0 0", transform: `rotate(${columpio}deg)` }}>
      <div style={{ position: "absolute", left: -1.5, top: 0, width: 3, height: baja, background: "rgba(119,114,106,.8)" }} />
      <svg width={110 * s} height={110 * s} viewBox="-55 -55 110 110" style={{ position: "absolute", left: -55 * s, top: baja - 30 * s, overflow: "visible" }}>
        <path d={patas.join(" ")} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx={0} cy={6} rx={24} ry={27} fill={color} />
        <circle cx={-8} cy={14} r={4} fill={MARCA.dorado} />
        <circle cx={9} cy={20} r={3} fill={MARCA.dorado} />
        <circle cx={0} cy={-18} r={16} fill={color} />
        <circle cx={-6.5} cy={-20} r={6.5} fill={MARCA.crema} />
        <circle cx={6.5} cy={-20} r={6.5} fill={MARCA.crema} />
        <circle cx={-5.5 + Math.sin(t * 1.3) * 1.2} cy={-18.5} r={3} fill={MARCA.tinta} />
        <circle cx={7.5 + Math.sin(t * 1.3) * 1.2} cy={-18.5} r={3} fill={MARCA.tinta} />
        <path d="M -4 -10 Q 0 -7 4 -10" fill="none" stroke={MARCA.crema} strokeWidth={2} strokeLinecap="round" />
      </svg>
    </div>
  );
};
