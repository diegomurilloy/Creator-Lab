// Objetos planos probados en reels reales: medidor, lápiz, ticket, carrito, persona, palomita, celular y batería.
import React from "react";
import { spring } from "remotion";
import { FPS, SERIF, caida, pe, suave } from "./base";
import { Mono } from "./escena";
import { MARCA } from "./paletas";

const TRAZO = 12;

// ── Medidor de «ganas» ───────────────────────────────────────────────────────
/**
 * Medidor de 900×820: se llena en 0.8 s, late en `pulso`, se desploma en `baja` (se pone rojo
 * y parpadea el testigo) y se agrieta en `grieta`. Todo en segundos de `t`.
 */
export const Medidor: React.FC<{ t: number; baja?: number; grieta?: number; pulso?: number; etiqueta?: string }> = ({ t, baja: enBaja = 2.36, grieta: enGrieta = 3.0, pulso: enPulso = 1.95, etiqueta = "Ganas" }) => {
  const K = MARCA;
  const llena = pe(t, 0, 0.8);
  const baja = t < enBaja ? 0 : spring({ frame: (t - enBaja) * FPS, fps: FPS, config: { damping: 9, stiffness: 150, mass: 0.7 } });
  const aguja = Math.max(0, Math.min(1, llena * (1 - baja)));
  const nivel = llena * (1 - pe(t, enBaja, 0.32));
  const R = 360;
  const sw = 62;
  const cx = 450;
  const cy = 470;
  const roja = t > enBaja;
  const arco = Math.PI * R;
  const pulso = 1 + 0.05 * Math.max(0, 1 - Math.abs(t - enPulso) / 0.2);
  const th = Math.PI * (1 - Math.min(1, Math.abs(aguja)));
  const L = R - 40;
  const grieta = pe(t, enGrieta, 0.25, suave);
  const arcoD = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`;
  return (
    <div style={{ position: "relative", width: 900, height: 820, transform: `scale(${pulso})` }}>
      <svg width={900} height={820} viewBox="0 0 900 820" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path d={arcoD} fill="none" stroke={K.linea} strokeWidth={sw} strokeLinecap="round" />
        <path d={arcoD} fill="none" stroke={roja ? K.error : K.pet} strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${arco * Math.min(1, nivel)} ${arco * 2}`} />
        {Array.from({ length: 11 }, (_, i) => {
          const a = Math.PI * (1 - i / 10);
          const r1 = R - sw / 2 - 26;
          const r2 = r1 - (i % 5 === 0 ? 44 : 24);
          return <line key={i} x1={cx + r1 * Math.cos(a)} y1={cy - r1 * Math.sin(a)} x2={cx + r2 * Math.cos(a)} y2={cy - r2 * Math.sin(a)} stroke={K.tinta} strokeWidth={i % 5 === 0 ? 7 : 4} strokeLinecap="round" />;
        })}
        <line x1={cx} y1={cy} x2={cx + L * Math.cos(th)} y2={cy - L * Math.sin(th)} stroke={K.tinta} strokeWidth={16} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={40} fill={K.tinta} />
        <circle cx={cx} cy={cy} r={14} fill={K.dorado} />
        {/* Grietas cuando ya perdiste */}
        <path d="M 210 140 L 300 260 L 270 330 L 380 420 M 300 260 L 360 230" fill="none" stroke={K.tinta} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - grieta} />
        <path d="M 700 170 L 610 280 L 650 350 L 560 430" fill="none" stroke={K.tinta} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - grieta} />
      </svg>
      <div style={{ position: "absolute", left: cx - R - 20, top: cy + 50 }}>
        <Mono color={K.sec} size={26}>Vacío</Mono>
      </div>
      <div style={{ position: "absolute", right: 900 - cx - R - 20, top: cy + 50 }}>
        <Mono color={K.sec} size={26}>Lleno</Mono>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: cy + 90, textAlign: "center", fontFamily: SERIF, fontSize: 210, lineHeight: 1, color: roja ? K.error : K.tinta, fontVariantNumeric: "tabular-nums" }}>
        {Math.round(Math.min(1, nivel) * 100)}
        <span style={{ fontSize: 110 }}>%</span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: cy + 310, textAlign: "center" }}>
        <Mono color={K.tinta} size={34}>{etiqueta}</Mono>
      </div>
      {/* Testigo que parpadea en rojo */}
      <div style={{ position: "absolute", right: 60, top: 20, width: 44, height: 44, borderRadius: 22, background: roja && Math.floor(t * 6) % 2 === 0 ? K.error : K.linea, boxShadow: roja && Math.floor(t * 6) % 2 === 0 ? `0 0 40px ${K.error}` : undefined }} />
    </div>
  );
};

// ── Lápiz plano con facetas ──────────────────────────────────────────────────
/** Lápiz horizontal con la punta a la derecha (punta en x = 294/300 del ancho). */
export const Lapiz: React.FC<{ w?: number }> = ({ w = 300 }) => (
  <svg width={w} height={w * 0.22} viewBox="0 0 300 66">
    <rect x="0" y="12" width="44" height="42" rx="14" fill={MARCA.error} />
    <rect x="32" y="10" width="34" height="46" fill="#BDB6AA" />
    <path d="M43 10v46M55 10v46" stroke="#948D82" strokeWidth="3" />
    <rect x="66" y="10" width="166" height="46" fill={MARCA.dorado} />
    <rect x="66" y="10" width="166" height="14" fill="#DCC29C" />
    <rect x="66" y="42" width="166" height="14" fill="#AE8D61" />
    <path d="M232 10 L286 33 L232 56 Z" fill="#EFDDBF" />
    <path d="M232 10 L286 33 L232 24 Z" fill="#F7EBD6" />
    <path d="M266 24.5 L294 33 L266 41.5 Z" fill={MARCA.tinta} />
  </svg>
);

// ── Ticket de compra con orilla de sierra ────────────────────────────────────
export const Ticket: React.FC<{ w?: number }> = ({ w = 220 }) => (
  <svg width={w} height={w * 1.35} viewBox="0 0 100 135">
    <path d="M4 4 H96 V124 L88 131 L80 124 L72 131 L64 124 L56 131 L48 124 L40 131 L32 124 L24 131 L16 124 L8 131 L4 127 Z" fill={MARCA.hoja} stroke={MARCA.tinta} strokeWidth="3.5" strokeLinejoin="round" />
    {[22, 36, 50, 64].map((y, i) => (
      <rect key={y} x="14" y={y} width={i % 2 ? 50 : 66} height="6" rx="3" fill={MARCA.linea} />
    ))}
    <rect x="14" y="92" width="72" height="9" rx="4" fill={MARCA.tinta} />
  </svg>
);

// ── Carrito del súper (las ruedas giran con `giro` en grados) ────────────────
export const Carrito: React.FC<{ giro: number }> = ({ giro }) => (
  <svg width="420" height="360" viewBox="0 0 120 100">
    <path d="M4 10 H20 L30 64 H96 L108 24 H24" fill="none" stroke={MARCA.tinta} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M27 36 H102 M29 50 H98" stroke={MARCA.linea} strokeWidth="4" />
    {[42, 86].map((x) => (
      <g key={x} transform={`rotate(${giro} ${x} 82)`}>
        <circle cx={x} cy="82" r="9" fill={MARCA.hoja} stroke={MARCA.tinta} strokeWidth="5" />
        <path d={`M${x - 6} 82 H${x + 6}`} stroke={MARCA.tinta} strokeWidth="3" />
      </g>
    ))}
  </svg>
);

// ── Persona de bloque (cabeza + torso) ───────────────────────────────────────
export const Persona: React.FC<{ c: string; s?: number }> = ({ c, s = 1 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 * s }}>
    <div style={{ width: 70 * s, height: 70 * s, borderRadius: "50%", background: c }} />
    <div style={{ width: 120 * s, height: 170 * s, borderRadius: `${60 * s}px ${60 * s}px 20px 20px`, background: c }} />
  </div>
);

// ── Palomita en círculo (`k` dibuja el trazo 0→1) ────────────────────────────
export const Check: React.FC<{ k: number; size?: number; color?: string }> = ({ k, size = 200, color = MARCA.pet }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="46" fill={color} />
    <path d="M28 52 L44 67 L73 36" fill="none" stroke={MARCA.hoja} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - k} />
  </svg>
);

// ── Celular genérico con isla; lo de adentro va en `children` ────────────────
export const Celular: React.FC<{ w?: number; h?: number; pantalla?: string; children?: React.ReactNode; style?: React.CSSProperties }> = ({ w = 470, h = 920, pantalla = MARCA.hoja, children, style }) => (
  <div style={{ position: "relative", width: w, height: h, borderRadius: w * 0.14, background: MARCA.tinta, padding: 16, boxSizing: "border-box", boxShadow: "0 50px 100px rgba(22,25,28,.25)", ...style }}>
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: w * 0.11, background: pantalla, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: "50%", top: 18, width: 110, height: 30, marginLeft: -55, borderRadius: 15, background: MARCA.tinta, zIndex: 5 }} />
      {children}
    </div>
  </div>
);

// ── Batería: cada carga cae (y gira) en su segundo de `cargas` ───────────────
export const Bateria: React.FC<{ t: number; cargas: number[]; roja: number }> = ({ t, cargas, roja }) => {
  const borde = roja > 0.5 ? MARCA.error : MARCA.tinta;
  return (
    <div style={{ position: "relative", width: 560, height: 270 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 48, border: `${TRAZO + 4}px solid ${borde}`, boxSizing: "border-box" }} />
      <div style={{ position: "absolute", right: -46, top: 85, width: 34, height: 100, borderRadius: "0 18px 18px 0", background: borde }} />
      {cargas.map((y, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 34 + i * 126,
            top: 34,
            width: 110,
            height: 202,
            borderRadius: 22,
            background: i === 0 && roja > 0.5 ? MARCA.error : MARCA.pet,
            transform: `translateY(${caida(t, y)}px) rotate(${t > y ? (t - y) * (i % 2 ? 300 : -260) : 0}deg)`,
          }}
        />
      ))}
    </div>
  );
};

// ── Cronómetro: cuerpo obsidiana, bisel y botón arena, manecilla cian que da una vuelta por segundo ──
/**
 * Cronómetro de cronometraje. Se dibuja con el CENTRO DE LA CARÁTULA en (x, y) y radio de carátula 175·k px.
 * - `valor`: segundos que marca (el número va directo, sin temblar; la manecilla da una vuelta por segundo
 *   y si el valor baja, gira hacia atrás: sirve para «rebobinar»).
 * - `presion` 0→1: el botón de arriba se hunde. `listo` 0→1: halo cian cuando se detiene.
 * - `piezas` 0→1: todo lo que no es la carátula (bisel, marcas, botón, número). Con 0 queda solo el círculo
 *   obsidiana: sirve para que un bloque o un logo redondo se transforme en el cronómetro.
 */
export const Cronometro: React.FC<{ x: number; y: number; k?: number; valor: number; presion?: number; listo?: number; piezas?: number; acento?: string; cara?: string; bisel?: string; tinta?: string; formato?: "seg" | "min" }> = ({
  x,
  y,
  k = 1,
  valor,
  presion = 0,
  listo = 0,
  piezas = 1,
  acento = "#23B5E8",
  cara = MARCA.obs,
  bisel = "#C4A882",
  tinta = MARCA.crema,
  formato = "seg",
}) => {
  // «seg»: 4.0 s, la punta da una vuelta por segundo. «min»: 0:42, la punta es el segundero (una vuelta por minuto).
  const vuelta = formato === "min" ? valor / 60 : valor;
  const frac = vuelta - Math.floor(vuelta + 1e-6);
  const ang = vuelta * 360;
  const R = 128;
  const arco = 2 * Math.PI * R;
  const [ent, dec] = Math.max(0, valor).toFixed(1).split(".");
  return (
    <svg width={400 * k} height={470 * k} viewBox="0 0 400 470" style={{ position: "absolute", left: x - 200 * k, top: y - 270 * k, overflow: "visible" }}>
      <g opacity={piezas}>
        {/* Botón de arriba y botón lateral */}
        <g transform={`translate(0 ${presion * 16})`}>
          <rect x={183} y={58} width={34} height={44} rx={6} fill={bisel} />
          <rect x={150} y={30} width={100} height={38} rx={14} fill={bisel} />
          <rect x={150} y={30} width={100} height={12} rx={6} fill="#FFFFFF" opacity={0.18} />
        </g>
        <g transform="rotate(44 200 270)">
          <rect x={186} y={70} width={28} height={34} rx={7} fill="#A88E68" />
        </g>
        {listo > 0 ? <circle cx={200} cy={270} r={190 + 26 * listo} fill="none" stroke={acento} strokeWidth={10 * (1 - listo) + 2} opacity={1 - listo} /> : null}
      </g>
      <circle cx={200} cy={270} r={175} fill={cara} />
      <g opacity={piezas}>
        <circle cx={200} cy={270} r={170} fill="none" stroke={bisel} strokeWidth={10} />
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * Math.PI * 2;
          const largo = i % 5 === 0;
          const r1 = largo ? 138 : 148;
          return <line key={i} x1={200 + Math.sin(a) * r1} y1={270 - Math.cos(a) * r1} x2={200 + Math.sin(a) * 158} y2={270 - Math.cos(a) * 158} stroke={tinta} strokeOpacity={largo ? 0.7 : 0.3} strokeWidth={largo ? 5 : 3} strokeLinecap="round" />;
        })}
        {/* Estela de la vuelta en curso */}
        {frac > 0.005 ? <circle cx={200} cy={270} r={R} fill="none" stroke={acento} strokeOpacity={0.35} strokeWidth={14} strokeDasharray={`${arco * frac} ${arco}`} transform="rotate(-90 200 270)" /> : null}
        {/* Manecilla */}
        {/* Manecilla: solo la punta, por fuera del número para que no lo cruce */}
        <g transform={`rotate(${ang} 200 270)`}>
          <line x1={200} y1={170} x2={200} y2={124} stroke={acento} strokeWidth={10} strokeLinecap="round" />
          <circle cx={200} cy={124} r={9} fill={acento} />
        </g>
        {/* Número: segundos y décimas */}
        <text x={200} y={312} textAnchor="middle" fontFamily={SERIF} fontSize={124} fill={tinta} style={{ paintOrder: "stroke", stroke: cara, strokeWidth: 10 }}>
          {formato === "min" ? (
            `${Math.floor(Math.max(0, valor) / 60)}:${String(Math.floor(Math.max(0, valor) % 60)).padStart(2, "0")}`
          ) : (
            <>
              {ent}.{dec}
              <tspan fontSize={56} fill={bisel} dx={6}>s</tspan>
            </>
          )}
        </text>
      </g>
    </svg>
  );
};

// ── Mano que toca la pantalla: índice extendido, puño cerrado y manga obsidiana ──
/**
 * La punta del índice queda en (0, 0) del contenedor: colócala con `left/top` en el punto que toca.
 * `escala` 1 = dedo de ~60 px de ancho. `presion` 0→1: el dedo se hunde (sube la mano un poco y se aplana).
 * `giro`: inclinación en grados (por defecto entra desde abajo a la derecha).
 */
export const Mano: React.FC<{ escala?: number; presion?: number; giro?: number; piel?: string; sombra?: string; manga?: string }> = ({ escala = 1, presion = 0, giro = -16, piel = "#E8BE98", sombra = "#D3A47C", manga = MARCA.obs }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0 }}>
    <svg width={400} height={680} viewBox="-130 -10 400 680" style={{ position: "absolute", left: -130, top: -10, overflow: "visible", transformOrigin: "130px 10px", transform: `rotate(${giro}deg) scale(${escala * (1 - presion * 0.05)}) translateY(${presion * 6}px)`, filter: "drop-shadow(0 18px 22px rgba(26,46,53,.25))" }}>
      {/* Manga */}
      <rect x={-58} y={440} width={262} height={240} rx={26} fill={manga} />
      <rect x={-58} y={440} width={262} height={22} rx={10} fill="#FFFFFF" opacity={0.1} />
      {/* Palma y puño */}
      <rect x={-46} y={196} width={232} height={262} rx={78} fill={piel} />
      <rect x={26} y={184} width={58} height={118} rx={29} fill={sombra} />
      <rect x={80} y={190} width={56} height={112} rx={28} fill={sombra} />
      <rect x={130} y={202} width={52} height={100} rx={26} fill={sombra} />
      <rect x={30} y={190} width={50} height={18} rx={9} fill="#FFFFFF" opacity={0.15} />
      {/* Pulgar */}
      <rect x={-92} y={232} width={64} height={168} rx={32} fill={piel} transform="rotate(-24 -60 316)" />
      {/* Índice */}
      <rect x={-31} y={0} width={62} height={268} rx={31} fill={piel} />
      <rect x={-21} y={10} width={42} height={50} rx={19} fill="#F6DCC6" />
      <path d="M-14 104 q14 7 28 0 M-14 182 q14 7 28 0" fill="none" stroke={sombra} strokeWidth={4} strokeLinecap="round" />
    </svg>
  </div>
);
