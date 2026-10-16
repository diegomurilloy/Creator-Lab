// Style Lab · ronda 1: texto con máscara, movimientos encadenados y objetos que se transforman.
// Criterio «premium»: curvas expo largas (0.5–0.8 s), nada aparece de golpe (sale de una máscara o de otro
// elemento), desfases cortos, rebote solo donde hay un impacto real. Mismo fondo y mismas palabras por sección.
import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Video } from "@remotion/media";
import { C, FONT } from "../kit";
import { CIAN, IconoWhatsApp, TonoSuave } from "../reels/comun";
import { Icono, vidrio } from "../reels/pro";

const FPS = 30;
const expo = Easing.bezier(0.16, 1, 0.3, 1);
const suave = Easing.bezier(0.65, 0, 0.35, 1);
const entra = Easing.bezier(0.55, 0, 1, 0.45);
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** Progreso 0→1 entre `a` y `a + d` segundos. */
const p = (t: number, a: number, d: number, e = expo) => interpolate(t, [a, a + d], [0, 1], { ...cl, easing: e });
const useT = () => useCurrentFrame() / FPS;

const Fondo: React.FC<{ oscuro?: number }> = ({ oscuro = 0 }) => (
  <AbsoluteFill>
    <Video src={staticFile("stylelab/fondo.mp4")} volume={0} style={{ filter: "url(#tono-suave)" }} />
    <TonoSuave />
    {oscuro ? <AbsoluteFill style={{ background: `rgba(8,12,22,${oscuro})` }} /> : null}
  </AbsoluteFill>
);

// ── A · Texto con máscara ────────────────────────────────────────────────────
type Modo = "renglon" | "palabra" | "letra" | "blur" | "inclinado";
const RENGLONES: { w: string; c?: boolean }[][] = [[{ w: "Pagaba" }], [{ w: "$5,000", c: true }, { w: "al" }, { w: "mes" }]];
const ENTRA = 0.3;
const SALE = 2.75;

/** Una caja que recorta: lo de adentro sube desde abajo del borde. */
const Mascara: React.FC<{ children: React.ReactNode; inline?: boolean }> = ({ children, inline }) => (
  <span style={{ display: inline ? "inline-block" : "block", overflow: "hidden", paddingBottom: "0.14em", marginBottom: "-0.14em", verticalAlign: "top" }}>{children}</span>
);

const TextoMascara: React.FC<{ modo: Modo }> = ({ modo }) => {
  const t = useT();
  let indice = 0;
  // Velocidad de la entrada para el desenfoque de movimiento (solo en «blur»).
  const desplaz = (tt: number, a: number, d: number) => (1 - p(tt, a, d)) * 110 - p(tt, SALE + (a - ENTRA) * 0.6, 0.45, suave) * 110;
  return (
    <div style={{ position: "absolute", top: 300, left: 90, right: 90, fontFamily: FONT, fontWeight: 800, fontSize: 108, lineHeight: 1.04, letterSpacing: -2.5, color: C.blanco, textShadow: "0 8px 34px rgba(0,0,0,.45)" }}>
      {modo === "blur" ? (
        <svg width="0" height="0" style={{ position: "absolute" }}>
          {RENGLONES.flat().map((_, i) => {
            const a = ENTRA + i * 0.07;
            const v = Math.abs(desplaz(t, a, 0.62) - desplaz(t - 1 / FPS, a, 0.62));
            return (
              <filter key={i} id={`mb${i}`} x="-10%" y="-50%" width="120%" height="200%">
                <feGaussianBlur stdDeviation={`0 ${Math.min(14, v * 0.9)}`} />
              </filter>
            );
          })}
        </svg>
      ) : null}
      {RENGLONES.map((renglon, r) => {
        if (modo === "renglon" || modo === "inclinado") {
          const a = ENTRA + r * 0.12;
          const k = p(t, a, 0.72);
          const s = p(t, SALE + r * 0.06, 0.45, suave);
          const giro = modo === "inclinado" ? (1 - k) * 7 : 0;
          return (
            <Mascara key={r}>
              <span style={{ display: "block", transform: `translateY(${(1 - k) * 110 - s * 110}%) rotate(${giro}deg)`, transformOrigin: "0% 100%" }}>
                {renglon.map((x, j) => (
                  <span key={j} style={{ color: x.c ? CIAN : undefined }}>
                    {x.w}
                    {j < renglon.length - 1 ? " " : ""}
                  </span>
                ))}
              </span>
            </Mascara>
          );
        }
        return (
          <div key={r}>
            {renglon.map((x, j) => {
              const i = indice++;
              if (modo === "letra") {
                return (
                  <React.Fragment key={j}>
                    <Mascara inline>
                      {[...x.w].map((ch, q) => {
                        const a = ENTRA + (i * 4 + q) * 0.022;
                        const k = p(t, a, 0.55);
                        const s = p(t, SALE + (i * 4 + q) * 0.012, 0.4, suave);
                        return (
                          <span key={q} style={{ display: "inline-block", color: x.c ? CIAN : undefined, transform: `translateY(${(1 - k) * 105 - s * 105}%) rotate(${(1 - k) * 8}deg)` }}>
                            {ch}
                          </span>
                        );
                      })}
                    </Mascara>
                    {j < renglon.length - 1 ? " " : ""}
                  </React.Fragment>
                );
              }
              const a = ENTRA + i * 0.07;
              const y = desplaz(t, a, 0.62);
              return (
                <React.Fragment key={j}>
                  <Mascara inline>
                    <span style={{ display: "inline-block", color: x.c ? CIAN : undefined, transform: `translateY(${y}%)`, filter: modo === "blur" ? `url(#mb${i})` : undefined }}>{x.w}</span>
                  </Mascara>
                  {j < renglon.length - 1 ? " " : ""}
                </React.Fragment>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
const opA = (modo: Modo): React.FC => () => (
  <AbsoluteFill>
    <Fondo />
    <TextoMascara modo={modo} />
  </AbsoluteFill>
);

// ── B · Movimientos encadenados ──────────────────────────────────────────────
const Pastilla: React.FC<{ icono: React.ReactNode; titulo: string; sub: string; style?: React.CSSProperties }> = ({ icono, titulo, sub, style }) => (
  <div style={{ ...vidrio(undefined, 30), display: "flex", alignItems: "center", gap: 20, padding: "22px 30px 22px 22px", width: 780, ...style }}>
    <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(51,204,255,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icono}</div>
    <div style={{ fontFamily: FONT }}>
      <div style={{ color: C.blanco, fontWeight: 800, fontSize: 38, lineHeight: 1.1 }}>{titulo}</div>
      <div style={{ color: "#AFC0D6", fontWeight: 600, fontSize: 28, marginTop: 4 }}>{sub}</div>
    </div>
  </div>
);
const PIEZAS = [
  { icono: <Icono n="cartera" size={42} />, titulo: "Cargo de $3,999", sub: "Tarjeta · ChatGPT Pro" },
  { icono: <Icono n="calendario" size={40} />, titulo: "Fecha de corte", sub: "Día 3 de cada mes" },
  { icono: <Icono n="alerta" size={40} color="#FBBF24" />, titulo: "Te aviso 2 días antes", sub: "Para que no te agarre" },
];

// B1 · Pila: cada pastilla nueva entra por abajo y empuja a las anteriores hacia arriba.
const B1: React.FC = () => {
  const t = useT();
  const H = 140;
  const llegadas = [0.3, 1.05, 1.8];
  const sale = p(t, 3.2, 0.5, suave);
  return (
    <AbsoluteFill>
      <Fondo />
      {PIEZAS.map((pz, i) => {
        const k = p(t, llegadas[i], 0.7);
        if (k === 0) return null;
        // Cuántas llegaron después de esta: cada una la sube un escalón.
        const sube = llegadas.slice(i + 1).reduce((s, a) => s + p(t, a, 0.7), 0);
        const y = 640 - sube * H + (1 - k) * 90;
        return (
          <div key={i} style={{ position: "absolute", left: 150, top: y - sale * 60, opacity: Math.min(1, k * 1.6) * (1 - 0.28 * Math.min(1, sube)) * (1 - sale), transform: `scale(${(0.94 + 0.06 * k) * (1 - 0.035 * Math.min(1, sube))})`, transformOrigin: "50% 0%" }}>
            <Pastilla {...pz} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// B2 · Dominó: la tarjeta entra de lado, golpea a la siguiente y esta, al acomodarse, suelta el aviso.
const B2: React.FC = () => {
  const t = useT();
  const golpe = 0.85;
  const a = p(t, 0.25, golpe - 0.25, entra); // entra acelerando y frena en seco al golpear
  const rebote = Math.sin(Math.max(0, t - golpe) * 22) * Math.exp(-Math.max(0, t - golpe) * 9) * (t > golpe ? 1 : 0);
  const b = p(t, golpe, 0.75); // la segunda sale empujada
  const c = p(t, golpe + 0.6, 0.7); // al asentarse, suelta el aviso
  const sale = p(t, 3.25, 0.5, suave);
  const base = { position: "absolute" as const, left: 150 };
  return (
    <AbsoluteFill style={{ opacity: 1 - sale }}>
      <Fondo />
      <div style={{ ...base, top: 360 + b * 150, opacity: p(t, 0, 0.35), transform: `rotate(${b * 2 - b * b * 2}deg)` }}>
        <Pastilla {...PIEZAS[1]} />
      </div>
      <div style={{ ...base, top: 360, transform: `translateX(${(1 - a) * -1000 - rebote * 18}px) scaleX(${1 - rebote * 0.03})`, transformOrigin: "100% 50%" }}>
        <Pastilla {...PIEZAS[0]} />
      </div>
      {c > 0 ? (
        <div style={{ ...base, top: 510 + 150 + (1 - c) * -70, opacity: Math.min(1, c * 1.6), clipPath: `inset(${(1 - c) * 100}% 0 0 0 round 30px)` }}>
          <Pastilla {...PIEZAS[2]} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// B3 · Cadena de palomitas: cada palomita, al cerrarse, saca el siguiente renglón desde su máscara.
const LISTA = ["Validar que alguien lo quiera", "Ajustar cada semana", "Salir a prospectar"];
const B3: React.FC = () => {
  const t = useT();
  const sale = p(t, 3.3, 0.5, suave);
  const panel = p(t, 0.15, 0.6);
  return (
    <AbsoluteFill>
      <Fondo />
      <div style={{ position: "absolute", left: 110, right: 110, top: 300, ...vidrio(undefined, 34), padding: "30px 34px", opacity: panel * (1 - sale), transform: `translateY(${(1 - panel) * 40 - sale * 30}px)` }}>
        {LISTA.map((txt, i) => {
          const linea = p(t, 0.35 + i * 0.85, 0.6);
          const check = p(t, 0.75 + i * 0.85, 0.38, suave);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, padding: "14px 0", overflow: "hidden" }}>
              <svg width="56" height="56" viewBox="0 0 56 56" style={{ flexShrink: 0, opacity: linea }}>
                <circle cx="28" cy="28" r="24" fill={check > 0.99 ? CIAN : "none"} stroke={CIAN} strokeWidth="3" style={{ transition: "none" }} />
                <path d="M17 29l7 7 15-15" fill="none" stroke={check > 0.99 ? C.fondo : CIAN} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="34" strokeDashoffset={34 * (1 - check)} />
              </svg>
              <span style={{ display: "block", overflow: "hidden" }}>
                <span style={{ display: "block", transform: `translateY(${(1 - linea) * 110}%)`, color: check > 0.99 ? "#AFC0D6" : C.blanco, fontFamily: FONT, fontWeight: 700, fontSize: 42 }}>{txt}</span>
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── C · Objetos que se transforman ───────────────────────────────────────────
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// C1 · La pastilla del precio se abre y se vuelve el panel de cientos de mensajes.
const C1: React.FC = () => {
  const t = useT();
  const aparece = p(t, 0.2, 0.6);
  const m = p(t, 1.05, 0.85, suave);
  const sale = p(t, 3.45, 0.45, suave);
  const caja = { x: lerp(280, 80, m), y: lerp(380, 300, m), w: lerp(520, 920, m), h: lerp(104, 470, m), r: lerp(52, 40, m) };
  return (
    <AbsoluteFill>
      <Fondo oscuro={0.25 * m} />
      <div style={{ position: "absolute", left: caja.x, top: caja.y, width: caja.w, height: caja.h, borderRadius: caja.r, ...vidrio(`${CIAN}66`, caja.r), overflow: "hidden", opacity: Math.min(1, aparece * 1.5) * (1 - sale), transform: `scale(${0.9 + 0.1 * aparece})` }}>
        <div style={{ position: "absolute", left: lerp(0, 34, m), right: lerp(0, 34, m), top: lerp(0, 26, m), height: 104 * lerp(1, 0.62, m), display: "flex", alignItems: "center", justifyContent: m < 0.5 ? "center" : "flex-start", fontFamily: FONT, fontWeight: 900, fontSize: lerp(46, 34, m), color: C.blanco, whiteSpace: "nowrap" }}>
          <span style={{ color: CIAN }}>$0.50</span>&nbsp;por mensaje
          <span style={{ opacity: p(t, 1.6, 0.5), marginLeft: 12, color: "#AFC0D6", fontWeight: 700 }}>× cientos al mes</span>
        </div>
        <div style={{ position: "absolute", left: 34, top: 120, display: "grid", gridTemplateColumns: "repeat(10, 72px)", gap: 12 }}>
          {Array.from({ length: 40 }, (_, i) => {
            const k = p(t, 1.55 + ((i % 10) + Math.floor(i / 10)) * 0.028, 0.55);
            const mia = (i * 7) % 3 === 0;
            return <div key={i} style={{ width: 72, height: 46, borderRadius: 13, borderTopLeftRadius: mia ? 13 : 4, borderTopRightRadius: mia ? 4 : 13, background: mia ? "#005C4B" : "#24323B", opacity: k, transform: `translateY(${(1 - k) * 18}px) scale(${0.85 + 0.15 * k})` }} />;
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// C2 · El ícono de WhatsApp crece y se vuelve el chat.
const C2: React.FC = () => {
  const t = useT();
  const aparece = p(t, 0.2, 0.6);
  const m = p(t, 1.0, 0.9, suave);
  const sale = p(t, 3.45, 0.45, suave);
  const caja = { x: lerp(460, 90, m), y: lerp(500, 290, m), w: lerp(160, 900, m), h: lerp(160, 760, m), r: lerp(40, 36, m) };
  const burbujas = [
    { de: "yo", txt: "Hola, ¿tienen cita mañana a las 6?", en: 1.75 },
    { de: "ellos", txt: "¡Claro! Te aparto mañana a las 6:00 pm ✓", en: 2.25 },
  ];
  return (
    <AbsoluteFill>
      <Fondo oscuro={0.3 * m} />
      <div style={{ position: "absolute", left: caja.x, top: caja.y, width: caja.w, height: caja.h, borderRadius: caja.r, background: "#0B141A", overflow: "hidden", boxShadow: "0 40px 90px rgba(0,0,0,.5)", opacity: Math.min(1, aparece * 1.5) * (1 - sale), transform: `scale(${0.85 + 0.15 * aparece})` }}>
        {/* El ícono se encoge hacia el avatar del encabezado */}
        <div style={{ position: "absolute", left: lerp(0, 30, m), top: lerp(0, 22, m), transform: `scale(${lerp(1, 0.45, m)})`, transformOrigin: "0 0" }}>
          <IconoWhatsApp size={160} />
        </div>
        <div style={{ position: "absolute", left: 120, top: 34, opacity: p(t, 1.55, 0.45), fontFamily: FONT, color: "#E9EDEF" }}>
          <div style={{ fontWeight: 700, fontSize: 34 }}>Pilates para Guapos</div>
          <div style={{ fontSize: 24, color: "#8696A0" }}>en línea</div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 118, height: 1, background: "rgba(255,255,255,.08)", opacity: m }} />
        {burbujas.map((b, i) => {
          const k = p(t, b.en, 0.5);
          return (
            <div key={i} style={{ position: "absolute", top: 170 + i * 150, [b.de === "yo" ? "right" : "left"]: 30, maxWidth: 620, padding: "16px 22px", borderRadius: 22, background: b.de === "yo" ? "#005C4B" : "#202C33", color: "#E9EDEF", fontFamily: FONT, fontSize: 32, lineHeight: 1.25, opacity: k, transform: `translateY(${(1 - k) * 24}px) scale(${0.92 + 0.08 * k})`, transformOrigin: b.de === "yo" ? "100% 100%" : "0% 100%" }}>
              {b.txt}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// C3 · El número gigante se encoge y viaja a ser el título del panel de la línea de tiempo.
const C3: React.FC = () => {
  const t = useT();
  const entra1 = p(t, 0.25, 0.7);
  const m = p(t, 1.15, 0.85, suave);
  const panel = p(t, 1.35, 0.8);
  const sale = p(t, 3.45, 0.45, suave);
  const meses = "EFMAMJJASOND".split("");
  return (
    <AbsoluteFill style={{ opacity: 1 - sale }}>
      <Fondo oscuro={0.2 * m} />
      <div style={{ position: "absolute", left: 90, right: 90, top: 300, height: 380, ...vidrio(undefined, 36), clipPath: `inset(0 0 ${(1 - panel) * 100}% 0 round 36px)` }}>
        <div style={{ position: "absolute", left: 60, right: 60, top: 200, height: 4, borderRadius: 2, background: "rgba(255,255,255,.12)" }} />
        <div style={{ position: "absolute", left: 60, top: 200, height: 4, borderRadius: 2, background: CIAN, width: `${p(t, 1.9, 1.1, suave) * 780}px`, boxShadow: `0 0 16px ${CIAN}` }} />
        {meses.map((mm, i) => {
          const k = p(t, 1.9 + i * 0.08, 0.4);
          return (
            <div key={i} style={{ position: "absolute", left: 60 + i * 71 - 10, top: 228, width: 20, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 24, color: "#AFC0D6", opacity: k, transform: `translateY(${(1 - k) * 10}px)` }}>
              {mm}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 60, top: 290, fontFamily: FONT, fontWeight: 700, fontSize: 26, color: "#AFC0D6", opacity: p(t, 2.6, 0.5) }}>Primera línea de código → primer cliente</div>
      </div>
      {/* El número: del centro de la pantalla al título del panel */}
      <div style={{ position: "absolute", left: lerp(0, 150, m), right: lerp(0, 150, m), top: lerp(760, 330, m), textAlign: m < 0.6 ? "center" : "left", fontFamily: FONT, fontWeight: 900, fontSize: lerp(230, 76, m), lineHeight: 1, color: CIAN, letterSpacing: lerp(-8, -2, m), textShadow: "0 10px 40px rgba(0,0,0,.4)" }}>
        <span style={{ display: "inline-block", overflow: "hidden", paddingBottom: "0.1em" }}>
          <span style={{ display: "inline-block", transform: `translateY(${(1 - entra1) * 110}%)` }}>13 meses</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};

// C4 · El estado de cuenta se separa: cada cargo se vuelve su propia tarjeta.
const CARGOS = [
  { n: "ChatGPT Pro", m: "-$3,999" },
  { n: "Claude Pro", m: "-$420" },
  { n: "Captions AI", m: "-$499" },
  { n: "Netflix", m: "-$299" },
];
const C4: React.FC = () => {
  const t = useT();
  const aparece = p(t, 0.2, 0.65);
  const s = p(t, 1.15, 0.9);
  const sale = p(t, 3.45, 0.45, suave);
  const destinos = [
    { x: 90, y: 290, r: -4 },
    { x: 580, y: 330, r: 5 },
    { x: 110, y: 450, r: 3 },
    { x: 600, y: 490, r: -5 },
  ];
  return (
    <AbsoluteFill style={{ opacity: 1 - sale }}>
      <Fondo />
      {/* La hoja: se desvanece mientras los renglones se vuelven tarjetas */}
      <div style={{ position: "absolute", left: 240, top: 300, width: 600, height: 520, borderRadius: 18, background: "#FFFFFF", boxShadow: "0 30px 70px rgba(0,0,0,.35)", opacity: aparece * (1 - p(t, 1.15, 0.45)), transform: `translateY(${(1 - aparece) * 40}px) scale(${1 + 0.04 * s})` }}>
        <div style={{ padding: "30px 34px", fontFamily: FONT }}>
          <div style={{ fontWeight: 900, fontSize: 30, color: C.fondo, letterSpacing: 1 }}>ESTADO DE CUENTA</div>
          <div style={{ fontWeight: 600, fontSize: 20, color: "#64748B" }}>Cargos recurrentes del periodo</div>
        </div>
      </div>
      {CARGOS.map((c, i) => {
        const k = p(t, 1.15 + i * 0.07, 0.9);
        const o = { x: 274, y: 420 + i * 92, r: 0 };
        const d = destinos[i];
        const x = lerp(o.x, d.x, k);
        const y = lerp(o.y, d.y, k);
        const tarjeta = k; // el renglón gana fondo, sombra y esquinas al separarse
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: lerp(532, 380, k), display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${lerp(14, 26, tarjeta)}px ${lerp(0, 28, tarjeta)}px`, borderRadius: lerp(0, 24, tarjeta), background: `rgba(255,255,255,${tarjeta})`, boxShadow: `0 ${20 * tarjeta}px ${46 * tarjeta}px rgba(0,0,0,${0.3 * tarjeta})`, borderBottom: tarjeta < 0.3 ? "1px solid #E2E8F0" : "none", transform: `rotate(${d.r * k}deg)`, opacity: aparece, fontFamily: FONT }}>
            <span style={{ fontWeight: 700, fontSize: lerp(24, 32, k), color: C.fondo }}>{c.n}</span>
            <span style={{ fontWeight: 900, fontSize: lerp(24, 34, k), color: "#DC2626" }}>{c.m}</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const OPCIONES_R1: { id: string; seccion: string; label: string; desc: string; comp: React.FC; segundos: number; sonido?: { archivo: string; en: number[]; volumen: number } }[] = [
  { id: "r1-a1", seccion: "mascara", label: "Por renglón", desc: "Cada renglón sube desde su borde en 0.7 s, con 0.12 s entre renglones.", comp: opA("renglon"), segundos: 3.6 },
  { id: "r1-a2", seccion: "mascara", label: "Por palabra", desc: "Cada palabra sale de su propia máscara, 70 ms una tras otra.", comp: opA("palabra"), segundos: 3.6 },
  { id: "r1-a3", seccion: "mascara", label: "Por letra", desc: "Letra por letra (22 ms) con un giro leve que se endereza.", comp: opA("letra"), segundos: 3.6 },
  { id: "r1-a4", seccion: "mascara", label: "Palabra + desenfoque", desc: "Igual que «por palabra», con desenfoque de movimiento vertical mientras sube.", comp: opA("blur"), segundos: 3.6 },
  { id: "r1-a5", seccion: "mascara", label: "Renglón inclinado", desc: "El renglón sube girado 7° y se endereza al llegar.", comp: opA("inclinado"), segundos: 3.6 },
  { id: "r1-b1", seccion: "encadenado", label: "Pila que empuja", desc: "Cada pastilla entra por abajo y sube a las anteriores un escalón.", comp: B1, segundos: 3.8, sonido: { archivo: "pop", en: [0.55, 1.3, 2.05], volumen: 0.12 } },
  { id: "r1-b2", seccion: "encadenado", label: "Dominó", desc: "La tarjeta entra de lado, golpea a la siguiente y esta suelta el aviso al acomodarse.", comp: B2, segundos: 3.8, sonido: { archivo: "golpe", en: [0.85], volumen: 0.12 } },
  { id: "r1-b3", seccion: "encadenado", label: "Cadena de palomitas", desc: "Cada palomita, al cerrarse, saca el siguiente renglón.", comp: B3, segundos: 3.8, sonido: { archivo: "tic", en: [1.1, 1.95, 2.8], volumen: 0.12 } },
  { id: "r1-c1", seccion: "transforma", label: "Pastilla → panel", desc: "La pastilla del precio se abre y se vuelve el panel de cientos de mensajes.", comp: C1, segundos: 3.9, sonido: { archivo: "whoosh", en: [1.05], volumen: 0.1 } },
  { id: "r1-c2", seccion: "transforma", label: "Ícono → chat", desc: "El ícono de WhatsApp crece y se vuelve el chat; el ícono queda de avatar.", comp: C2, segundos: 3.9, sonido: { archivo: "whoosh", en: [1.0], volumen: 0.1 } },
  { id: "r1-c3", seccion: "transforma", label: "Número → título", desc: "«13 meses» se encoge y viaja a ser el título de la línea de tiempo.", comp: C3, segundos: 3.9, sonido: { archivo: "whoosh", en: [1.15], volumen: 0.1 } },
  { id: "r1-c4", seccion: "transforma", label: "Hoja → tarjetas", desc: "El estado de cuenta se separa y cada cargo se vuelve su propia tarjeta.", comp: C4, segundos: 3.9, sonido: { archivo: "whoosh", en: [1.15], volumen: 0.1 } },
];
