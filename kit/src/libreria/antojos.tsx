// Objetos de gastos hormiga: etiqueta de precio colgante, vaso de café, bolsa de delivery, auto, pin de
// mapa, frasco de vidrio (atrás/frente), contador de rodillos y burbuja de excusa.
// Todo plano, con la paleta de la marca y en segundos de `t`.
import React from "react";
import { MONO, SERIF, pe, sp } from "./base";
import { MARCA_APP } from "./paletas";

const A = MARCA_APP;
const TINTA = "#16191C";

// ── Movimiento ───────────────────────────────────────────────────────────────
/** Columpio amortiguado (grados) desde `en`: para algo que cuelga de un hilo y recibe un empujón. */
export const columpio = (t: number, en: number, amp = 16, frec = 1.6, amort = 2.2) => (t < en ? 0 : amp * Math.sin(2 * Math.PI * frec * (t - en)) * Math.exp(-amort * (t - en)));

/** Caída con rebote: 1 arriba (en `desde` px) → 0 en su lugar. Devuelve el desplazamiento en px. */
export const caeRebota = (t: number, en: number, desde = -900, o: { damping?: number; stiffness?: number } = {}) => desde * (1 - sp(t, en, { damping: o.damping ?? 11, stiffness: o.stiffness ?? 170 }));

// ── Etiqueta de precio colgante ──────────────────────────────────────────────
/**
 * Etiqueta de tienda con esquinas cortadas, ojillo y cordón. El pivote es la punta del cordón (arriba al centro):
 * `giro` la columpia desde ahí. Lo de adentro (`children`) se centra en el cuerpo.
 */
export const Etiqueta: React.FC<{ w?: number; h?: number; hilo?: number; fondo?: string; borde?: string; cordon?: string; giro?: number; children?: React.ReactNode; style?: React.CSSProperties }> = ({
  w = 220,
  h = 300,
  hilo = 90,
  fondo = A.fondo,
  borde = "rgba(22,25,28,.14)",
  cordon = A.arena,
  giro = 0,
  children,
  style,
}) => {
  const c = w * 0.26;
  const r = w * 0.07;
  const y0 = hilo;
  const y1 = hilo + h;
  const ojo = { x: w / 2, y: y0 + c * 0.62, r: w * 0.055 };
  const cuerpo = `M ${c} ${y0} H ${w - c} L ${w} ${y0 + c} V ${y1 - r} Q ${w} ${y1} ${w - r} ${y1} H ${r} Q 0 ${y1} 0 ${y1 - r} V ${y0 + c} Z`;
  return (
    <div style={{ position: "relative", width: w, height: y1, transformOrigin: `${w / 2}px 0px`, transform: `rotate(${giro}deg)`, ...style }}>
      <svg width={w} height={y1 + 20} viewBox={`0 0 ${w} ${y1 + 20}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <path d={cuerpo} transform="translate(0 10)" fill="rgba(22,25,28,.10)" />
        <path d={cuerpo} fill={fondo} stroke={borde} strokeWidth={3} />
        {/* Cordón: sale de arriba y entra por el ojillo */}
        <path d={`M ${w / 2} 0 C ${w / 2 - 18} ${hilo * 0.45}, ${w / 2 - 14} ${ojo.y - 30}, ${ojo.x - ojo.r * 0.4} ${ojo.y}`} fill="none" stroke={cordon} strokeWidth={5} strokeLinecap="round" />
        <path d={`M ${w / 2} 0 C ${w / 2 + 16} ${hilo * 0.5}, ${w / 2 + 12} ${ojo.y - 26}, ${ojo.x + ojo.r * 0.4} ${ojo.y}`} fill="none" stroke={cordon} strokeWidth={5} strokeLinecap="round" opacity={0.75} />
        <circle cx={ojo.x} cy={ojo.y} r={ojo.r + 6} fill="none" stroke="#BDB6A8" strokeWidth={5} />
        <circle cx={ojo.x} cy={ojo.y} r={ojo.r} fill={A.superficie} stroke="rgba(22,25,28,.25)" strokeWidth={2} />
      </svg>
      <div style={{ position: "absolute", left: 0, top: y0 + c + 4, width: w, height: h - c - 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
};

// ── Vaso de café para llevar ─────────────────────────────────────────────────
/** Vaso de cafetería (tapa obsidiana, funda arena) con vapor que sube. `size` = ancho del vaso. */
export const VasoCafe: React.FC<{ t: number; size?: number; vapor?: number; funda?: string; tapa?: string }> = ({ t, size = 220, vapor = 1, funda = A.arena, tapa = A.primario }) => {
  const h = size * 1.55;
  return (
    <svg width={size} height={h} viewBox="0 0 200 310" style={{ overflow: "visible" }}>
      {/* Vapor */}
      {[0, 1, 2].map((i) => {
        const fase = (t * 0.8 + i * 0.33) % 1;
        const x = 78 + i * 22;
        return (
          <path
            key={i}
            d={`M ${x} 40 C ${x - 14} 22, ${x + 14} 6, ${x} -14 C ${x - 12} -30, ${x + 10} -44, ${x} -58`}
            fill="none"
            stroke="#C9C2B6"
            strokeWidth={7}
            strokeLinecap="round"
            opacity={vapor * Math.sin(Math.PI * fase) * 0.85}
            transform={`translate(${Math.sin(t * 2 + i) * 3} ${-fase * 26})`}
          />
        );
      })}
      {/* Sombra en el piso */}
      <ellipse cx={100} cy={300} rx={70} ry={10} fill="rgba(22,25,28,.12)" />
      {/* Cuerpo (se angosta hacia abajo) con cara en sombra */}
      <path d="M 30 70 H 170 L 152 292 Q 151 298 145 298 H 55 Q 49 298 48 292 Z" fill="#FCFAF6" stroke="rgba(22,25,28,.16)" strokeWidth={3} />
      <path d="M 140 70 H 170 L 152 292 Q 151 298 145 298 H 128 Z" fill="#ECE6DA" />
      {/* Funda */}
      <path d="M 38 140 H 162 L 155 228 H 45 Z" fill={funda} />
      <path d="M 136 140 H 162 L 155 228 H 132 Z" fill="rgba(22,25,28,.10)" />
      <path d="M 52 162 H 148 M 50 206 H 150" stroke="rgba(252,250,246,.35)" strokeWidth={4} />
      {/* Tapa: base, domo y boquilla */}
      <rect x={22} y={56} width={156} height={22} rx={10} fill={tapa} />
      <path d="M 36 56 Q 40 30 64 28 H 136 Q 160 30 164 56 Z" fill={tapa} />
      <path d="M 120 28 H 136 Q 160 30 164 56 H 146 Z" fill="rgba(255,255,255,.08)" />
      <rect x={84} y={34} width={32} height={8} rx={4} fill="rgba(0,0,0,.35)" />
    </svg>
  );
};

// ── Bolsa de delivery ────────────────────────────────────────────────────────
/** Bolsa de papel kraft doblada arriba, con el ticket engrapado y vapor. `size` = ancho. */
export const BolsaDelivery: React.FC<{ t: number; size?: number; vapor?: number }> = ({ t, size = 360, vapor = 1 }) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 240 300" style={{ overflow: "visible" }}>
    {[0, 1].map((i) => {
      const fase = (t * 0.7 + i * 0.5) % 1;
      const x = 98 + i * 40;
      return <path key={i} d={`M ${x} 30 C ${x - 12} 14, ${x + 12} 0, ${x} -18 C ${x - 10} -32, ${x + 10} -44, ${x} -56`} fill="none" stroke="#C9C2B6" strokeWidth={7} strokeLinecap="round" opacity={vapor * Math.sin(Math.PI * fase) * 0.8} transform={`translate(0 ${-fase * 22})`} />;
    })}
    <ellipse cx={120} cy={292} rx={110} ry={10} fill="rgba(22,25,28,.12)" />
    {/* Cuerpo y costado */}
    <path d="M 22 70 H 218 L 210 286 H 30 Z" fill="#C9A77A" />
    <path d="M 176 70 H 218 L 210 286 H 172 Z" fill="#B48F60" />
    {/* Doblez de arriba */}
    <path d="M 22 44 H 218 V 78 H 22 Z" fill="#D6B98F" />
    <path d="M 22 78 L 36 92 H 204 L 218 78 Z" fill="#A9845A" opacity={0.6} />
    {/* Ticket engrapado */}
    <g transform="rotate(-4 120 150)">
      <path d="M 78 96 H 162 V 196 L 155 190 L 148 196 L 141 190 L 134 196 L 127 190 L 120 196 L 113 190 L 106 196 L 99 190 L 92 196 L 85 190 L 78 196 Z" fill="#FCFAF6" />
      <rect x={90} y={112} width={60} height={7} rx={3} fill={TINTA} opacity={0.7} />
      {[130, 144, 158].map((y, i) => (
        <rect key={y} x={90} y={y} width={i === 1 ? 44 : 58} height={5} rx={2.5} fill="#D9D2C6" />
      ))}
      <rect x={92} y={86} width={22} height={6} rx={1} fill="#9AA0A6" />
    </g>
  </svg>
);

// ── Auto (de lado) ───────────────────────────────────────────────────────────
/** Auto compacto de lado; las llantas giran con `giro` (grados). `size` = ancho. */
export const Auto: React.FC<{ size?: number; giro?: number; color?: string }> = ({ size = 440, giro = 0, color = A.arena }) => (
  <svg width={size} height={size * 0.5} viewBox="0 0 260 130" style={{ overflow: "visible" }}>
    <ellipse cx={130} cy={122} rx={118} ry={7} fill="rgba(22,25,28,.14)" />
    <path d="M 14 92 Q 12 70 34 66 L 70 60 Q 92 26 128 24 H 168 Q 196 26 214 58 L 236 64 Q 250 68 250 84 V 94 Q 250 102 242 102 H 22 Q 14 102 14 92 Z" fill={color} />
    <path d="M 14 86 H 250 V 94 Q 250 102 242 102 H 22 Q 14 102 14 94 Z" fill="rgba(22,25,28,.16)" />
    {/* Ventanas */}
    <path d="M 82 60 Q 98 34 126 32 H 134 V 60 Z" fill="#E8EEF0" />
    <path d="M 142 32 H 166 Q 186 34 200 60 H 142 Z" fill="#E8EEF0" />
    <path d="M 100 50 L 112 36" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.8} />
    <rect x={150} y={68} width={18} height={5} rx={2.5} fill="rgba(22,25,28,.35)" />
    <circle cx={244} cy={78} r={5} fill="#F4E29A" />
    <rect x={14} y={76} width={8} height={8} rx={2} fill="#C8613F" />
    {[66, 196].map((x) => (
      <g key={x} transform={`rotate(${giro} ${x} 102)`}>
        <circle cx={x} cy={102} r={22} fill={TINTA} />
        <circle cx={x} cy={102} r={11} fill="#BDB9B2" />
        <path d={`M ${x - 9} 102 H ${x + 9}`} stroke={TINTA} strokeWidth={4} />
      </g>
    ))}
  </svg>
);

/** Pin de mapa (gota con punto), con su sombra. */
export const PinMapa: React.FC<{ size?: number; color?: string }> = ({ size = 90, color = A.primario }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 60 78" style={{ overflow: "visible" }}>
    <ellipse cx={30} cy={74} rx={12} ry={4} fill="rgba(22,25,28,.18)" />
    <path d="M 30 72 C 18 54 6 42 6 28 A 24 24 0 0 1 54 28 C 54 42 42 54 30 72 Z" fill={color} />
    <circle cx={30} cy={28} r={9} fill={A.fondo} />
  </svg>
);

// ── Frasco de vidrio (en dos partes, para que algo caiga dentro) ─────────────
/** Parte de atrás del frasco: vidrio y fondo. Va DETRÁS de lo que cae dentro. */
export const FrascoAtras: React.FC<{ w?: number; h?: number }> = ({ w = 520, h = 640 }) => (
  <svg width={w} height={h} viewBox="0 0 260 320" style={{ overflow: "visible" }}>
    <ellipse cx={130} cy={314} rx={120} ry={10} fill="rgba(22,25,28,.14)" />
    <path d="M 62 40 H 198 V 62 Q 244 80 244 130 V 284 Q 244 310 218 310 H 42 Q 16 310 16 284 V 130 Q 16 80 62 62 Z" fill="rgba(232,238,240,.6)" />
    <path d="M 26 270 H 234 V 284 Q 234 302 216 302 H 44 Q 26 302 26 284 Z" fill="rgba(26,46,53,.06)" />
  </svg>
);

/**
 * Parte de enfrente: contorno, brillos, tapa y etiqueta. Va ENCIMA de lo que cae dentro.
 * `tapa`: 0 = tapa arriba (fuera de cuadro), 1 = cerrada. `children` va en la etiqueta.
 */
export const FrascoFrente: React.FC<{ w?: number; h?: number; tapa?: number; children?: React.ReactNode }> = ({ w = 520, h = 640, tapa = 1, children }) => {
  const sc = w / 260;
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      <svg width={w} height={h} viewBox="0 0 260 320" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path d="M 62 40 H 198 V 62 Q 244 80 244 130 V 284 Q 244 310 218 310 H 42 Q 16 310 16 284 V 130 Q 16 80 62 62 Z" fill="none" stroke="rgba(26,46,53,.45)" strokeWidth={4} />
        <path d="M 34 140 Q 34 100 62 86" fill="none" stroke="rgba(255,255,255,.95)" strokeWidth={9} strokeLinecap="round" />
        <path d="M 34 168 V 250" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth={9} strokeLinecap="round" />
        <path d="M 226 150 V 270" fill="none" stroke="rgba(26,46,53,.12)" strokeWidth={8} strokeLinecap="round" />
        {/* Rosca */}
        <rect x={58} y={40} width={144} height={10} rx={4} fill="rgba(26,46,53,.18)" />
        {/* Tapa */}
        <g transform={`translate(0 ${(1 - tapa) * -160})`} opacity={tapa > 0 ? 1 : 0}>
          <rect x={50} y={8} width={160} height={40} rx={10} fill={A.primario} />
          {[70, 90, 110, 130, 150, 170, 190].map((x) => (
            <rect key={x} x={x - 2} y={14} width={4} height={28} rx={2} fill="rgba(255,255,255,.12)" />
          ))}
        </g>
      </svg>
      {children ? <div style={{ position: "absolute", left: 40 * sc, right: 40 * sc, top: 150 * sc, height: 110 * sc, borderRadius: 14 * sc, background: A.fondo, boxShadow: "0 6px 16px rgba(22,25,28,.12)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>{children}</div> : null}
    </div>
  );
};

// ── Contador de rodillos ─────────────────────────────────────────────────────
/**
 * Contador de rodillos tipo odómetro. Cada cifra gira según `valor` (flotante) y se desenfoca con su velocidad
 * (`previo` = valor un cuadro antes): cuando corre rápido, las cifras de abajo se vuelven ilegibles.
 * Las cifras nuevas entran por la izquierda cuando el número crece. Comas cada tres cifras.
 */
export const Rodillos: React.FC<{ valor: number; previo?: number; size?: number; color?: string; prefijo?: string; minCifras?: number }> = ({ valor, previo = valor, size = 200, color = TINTA, prefijo = "$", minCifras = 4 }) => {
  const n = Math.max(minCifras, Math.floor(Math.log10(Math.max(1, valor))) + 1);
  const alto = size * 1.12;
  const ancho = size * 0.6;
  const cols: React.ReactNode[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const pos = (valor / 10 ** i) % 10; // 0..10 flotante
    const vel = Math.abs(valor - previo) / 10 ** i; // cifras por cuadro
    const entra = Math.min(1, Math.max(0, valor / 10 ** i - 0.6) / 0.4); // la cifra nueva se asoma
    const blur = Math.min(size * 0.14, vel * size * 0.3);
    cols.push(
      <div key={`c${i}`} style={{ position: "relative", width: ancho * (i >= minCifras ? entra : 1), height: alto, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${-pos * alto}px)`, filter: blur > 0.4 ? `blur(${(blur * 0.6).toFixed(2)}px)` : undefined }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, j) => (
            <div key={j} style={{ width: ancho, height: alto, lineHeight: `${alto}px`, textAlign: "center", fontFamily: SERIF, fontSize: size, color }}>
              {d}
            </div>
          ))}
        </div>
      </div>,
    );
    if (i > 0 && i % 3 === 0) cols.push(<div key={`s${i}`} style={{ width: size * 0.22, height: alto, lineHeight: `${alto}px`, fontFamily: SERIF, fontSize: size, color, textAlign: "center" }}>,</div>);
  }
  return (
    <div style={{ display: "flex", alignItems: "center", WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 22%, #000 78%, transparent 100%)", maskImage: "linear-gradient(180deg, transparent 0%, #000 22%, #000 78%, transparent 100%)" }}>
      <div style={{ height: alto, lineHeight: `${alto}px`, fontFamily: SERIF, fontSize: size, color, marginRight: size * 0.04 }}>{prefijo}</div>
      {cols}
    </div>
  );
};

// ── Burbuja de excusa ────────────────────────────────────────────────────────
/**
 * Globo de diálogo con la excusa entre comillas, en serif itálica. Entra con resorte desde su cola y el texto
 * sube palabra por palabra por su máscara. `cola`: de qué lado sale el pico.
 */
export const BurbujaExcusa: React.FC<{ t: number; en: number; texto: string; sale?: number; cola?: "izq" | "der"; size?: number; ancho?: number; fondo?: string; tinta?: string }> = ({
  t,
  en,
  texto,
  sale,
  cola = "izq",
  size = 64,
  ancho,
  fondo = A.fondo,
  tinta = TINTA,
}) => {
  if (t < en) return null;
  const k = sp(t, en, { damping: 13, stiffness: 190 });
  const s = sale === undefined ? 0 : pe(t, sale, 0.3);
  if (s >= 1) return null;
  const palabras = `«${texto}»`.split(" ");
  return (
    <div style={{ position: "relative", display: "inline-block", maxWidth: ancho, transformOrigin: cola === "izq" ? "12% 120%" : "88% 120%", transform: `scale(${(0.3 + 0.7 * k) * (1 - 0.3 * s)})`, opacity: Math.min(1, k * 2) * (1 - s) }}>
      <div style={{ position: "relative", padding: `${size * 0.42}px ${size * 0.6}px ${size * 0.5}px`, borderRadius: size * 0.7, background: fondo, boxShadow: "0 24px 50px rgba(22,25,28,.16), 0 0 0 2px rgba(22,25,28,.05)" }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: size, lineHeight: 1.08, color: tinta, textAlign: "center" }}>
          {palabras.map((w, i) => {
            const y = (1 - pe(t, en + 0.06 + i * 0.07, 0.5)) * 110;
            return (
              <React.Fragment key={i}>
                <span style={{ display: "inline-block", overflow: "hidden", paddingBottom: "0.12em", marginBottom: "-0.12em", verticalAlign: "top" }}>
                  <span style={{ display: "inline-block", transform: `translateY(${y}%)` }}>{w}</span>
                </span>
                {i < palabras.length - 1 ? " " : ""}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      <svg width={size * 0.9} height={size * 0.8} viewBox="0 0 60 50" style={{ position: "absolute", bottom: -size * 0.62, [cola === "izq" ? "left" : "right"]: size * 0.7, transform: cola === "der" ? "scaleX(-1)" : undefined }}>
        <path d="M 4 0 H 44 Q 30 26 6 48 Q 14 24 4 0 Z" fill={fondo} />
      </svg>
    </div>
  );
};

/** Precio «tapado»: el signo de pesos y dos barritas, para cuando el monto no se dice. */
export const PrecioTapado: React.FC<{ size?: number; color?: string }> = ({ size = 40, color = "#BDB6A8" }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.18, fontFamily: MONO, fontWeight: 500, fontSize: size, color }}>
    $<span style={{ display: "inline-block", width: size * 1.3, height: size * 0.5, borderRadius: size * 0.25, background: color, opacity: 0.6 }} />
  </span>
);

/** Etiqueta mono chiquita (para rótulos dentro de objetos). */
export const Rotulo: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 26, color = A.sec }) => (
  <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: size, letterSpacing: "0.14em", textTransform: "uppercase", color }}>{children}</span>
);

