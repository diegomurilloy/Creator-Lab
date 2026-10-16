// UI genérica: wireframe gris de una app de gastos «de las de siempre» y contador de toques.
import React from "react";
import { INTER, SERIF, pe, sp, suave } from "./base";
import { WA_OSC_GEO } from "./whatsapp";
import { WA_OSCURO } from "./paletas";

/** Grises del wireframe. */
export const WIRE = { fondo: "#F2F1EE", barra: "#E4E2DE", bloque: "#DEDBD5", fuerte: "#BDB9B2", texto: "#8A8680", tinta: "#5E5A55", blanco: "#FFFFFF" };

/** Mezcla dos colores hex (#RRGGBB) con k 0→1. Úsala solo entre colores cercanos o neutros (nada de rojo→petróleo). */
export const mezclaColor = (a: string, b: string, k: number) => {
  const p = (c: string, i: number) => parseInt(c.slice(1 + i * 2, 3 + i * 2), 16);
  const kk = Math.max(0, Math.min(1, k));
  return `rgb(${[0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * kk)).join(",")})`;
};

/** Los 6 toques del flujo «de siempre», en el orden en que pasan. */
export type ToquesApp = { abre: number; mas: number; monto: number; categoria: number; cuenta: number; guardar: number };

/** Dónde toca el dedo en cada paso (coordenadas internas de la pantalla 508×1068). */
export const PUNTOS_APP: Record<keyof ToquesApp, { x: number; y: number }> = {
  abre: { x: 197, y: 304 },
  mas: { x: 430, y: 960 },
  monto: { x: 254, y: 262 },
  categoria: { x: 254, y: 404 },
  cuenta: { x: 254, y: 528 },
  guardar: { x: 254, y: 980 },
};

const XS = [38, 152.7, 267.3, 382];

/**
 * Pantalla de una app de gastos genérica en gris (508×1068): inicio → abre la app → lista con botón + →
 * formulario (monto, categoría, cuenta) → Guardar. `toques`: el segundo de cada toque.
 * `haciaWA` 0→1: se transforma en el chat oscuro de WhatsApp (`ChatWAOscuro`): fondo y encabezado se oscurecen,
 * los campos se disuelven y el botón Guardar se vuelve la barra para escribir. Encima puedes poner el chat real
 * con opacidad cuando `haciaWA` llega a 1: las piezas coinciden.
 */
export const AppGenerica: React.FC<{ t: number; toques: ToquesApp; haciaWA?: number; valorMonto?: string; categoria?: string; cuenta?: string }> = ({ t, toques: T, haciaWA = 0, valorMonto = "$250", categoria = "Supermercado", cuenta = "Tarjeta" }) => {
  const W = WIRE;
  const G = WA_OSC_GEO;
  const C = WA_OSCURO;
  const k = haciaWA;
  const disuelve = Math.min(1, k * 1.8);
  const abre = pe(t, T.abre + 0.03, 0.32, suave);
  const forma = pe(t, T.mas + 0.05, 0.34);
  const enApp = t >= T.abre + 0.03;
  const tinta = mezclaColor(W.tinta, "#E9EDEF", k);

  // Caja del ícono que se abre hasta llenar la pantalla.
  const ic = { x: XS[1] + (0 - XS[1]) * abre, y: 260 + (0 - 260) * abre, w: 88 + (508 - 88) * abre, h: 88 + (1068 - 88) * abre, r: 22 * (1 - abre) };
  // Botón Guardar → campo de texto de WhatsApp.
  const bot = { x: 34 + (G.campo.x - 34) * k, y: 940 + (G.campo.y - 940) * k, w: 440 + (G.campo.w - 440) * k, h: 80 + (G.campo.h - 80) * k, r: 18 + (G.campo.r - 18) * k };
  const hunde = t >= T.guardar && t < T.guardar + 0.16 ? 0.97 : 1;
  const nMonto = Math.max(0, Math.min(valorMonto.length - 1, Math.floor((t - T.monto - 0.12) / 0.09)));
  const montoTxt = t < T.monto + 0.12 ? "" : valorMonto.slice(0, 1 + nMonto);
  const catLista = t >= T.categoria + 0.05 && t < T.categoria + 0.36;
  const catLista_k = pe(t, T.categoria + 0.05, 0.16) * (1 - pe(t, T.categoria + 0.3, 0.08));
  const catPuesta = t >= T.categoria + 0.34;
  const cuentaPuesta = t >= T.cuenta + 0.14;
  const activo = (a: number, b: number) => t >= a && t < b;

  const Campo: React.FC<{ y: number; h: number; etiqueta: string; foco: boolean; children: React.ReactNode }> = ({ y, h, etiqueta, foco, children }) => (
    <div style={{ position: "absolute", left: 30, top: y, width: 448, height: h, borderRadius: 18, background: W.blanco, border: `3px solid ${foco ? W.tinta : W.bloque}`, boxSizing: "border-box", padding: "14px 22px" }}>
      <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 21, color: W.texto }}>{etiqueta}</div>
      {children}
    </div>
  );
  const Elegir: React.FC = () => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: W.fuerte }}>
      Elegir
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path d="M6 9l6 6 6-6" fill="none" stroke={W.fuerte} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 508, height: 1068, overflow: "hidden", background: mezclaColor(W.fondo, C.fondo, k) }}>
      {/* Inicio: cuadrícula de apps */}
      {abre < 1 ? (
        <div style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 20 }, (_, i) => {
            const c = i % 4;
            const r = Math.floor(i / 4);
            const y = 110 + r * 150;
            return (
              <React.Fragment key={i}>
                <div style={{ position: "absolute", left: XS[c], top: y, width: 88, height: 88, borderRadius: 22, background: r === 1 && c === 1 ? W.fuerte : W.bloque }} />
                <div style={{ position: "absolute", left: XS[c] + 14, top: y + 100, width: 60, height: 10, borderRadius: 5, background: W.bloque }} />
              </React.Fragment>
            );
          })}
          <div style={{ position: "absolute", left: 20, top: 910, width: 468, height: 128, borderRadius: 40, background: "rgba(94,90,85,.08)" }} />
          {XS.map((x, i) => (
            <div key={i} style={{ position: "absolute", left: x, top: 930, width: 88, height: 88, borderRadius: 22, background: W.bloque }} />
          ))}
        </div>
      ) : null}
      {/* La app que se abre desde su ícono */}
      {enApp ? (
        <div style={{ position: "absolute", left: ic.x, top: ic.y, width: ic.w, height: ic.h, borderRadius: ic.r, overflow: "hidden", background: mezclaColor(W.fondo, C.fondo, k) }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 508, height: 1068, opacity: pe(t, T.abre + 0.18, 0.2) }}>
            {/* Lista de gastos */}
            {forma < 1 ? (
              <>
                <div style={{ position: "absolute", left: 0, top: 0, width: 508, height: 150, background: W.barra }} />
                <div style={{ position: "absolute", left: 32, top: 82, fontFamily: INTER, fontWeight: 600, fontSize: 34, color: W.tinta }}>Gastos</div>
                {Array.from({ length: 7 }, (_, i) => (
                  <React.Fragment key={i}>
                    <div style={{ position: "absolute", left: 32, top: 182 + i * 100, width: 60, height: 60, borderRadius: 30, background: W.bloque }} />
                    <div style={{ position: "absolute", left: 112, top: 192 + i * 100, width: 190 - (i % 3) * 30, height: 16, borderRadius: 8, background: W.bloque }} />
                    <div style={{ position: "absolute", left: 112, top: 220 + i * 100, width: 110, height: 12, borderRadius: 6, background: W.barra }} />
                    <div style={{ position: "absolute", left: 396, top: 198 + i * 100, width: 80, height: 16, borderRadius: 8, background: W.fuerte }} />
                  </React.Fragment>
                ))}
                <div style={{ position: "absolute", left: 430 - 46, top: 960 - 46, width: 92, height: 92, borderRadius: 46, background: W.tinta, boxShadow: "0 10px 20px rgba(0,0,0,.18)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${t >= T.mas && t < T.mas + 0.14 ? 0.9 : 1})` }}>
                  <svg width="40" height="40" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
                  </svg>
                </div>
              </>
            ) : null}
            {/* Formulario «Nuevo gasto» que sube */}
            {t >= T.mas + 0.05 ? (
              <div style={{ position: "absolute", left: 0, top: (1 - forma) * 1068, width: 508, height: 1068, background: mezclaColor(W.fondo, C.fondo, k) }}>
                <div style={{ position: "absolute", left: 0, top: 0, width: 508, height: 150, background: mezclaColor(W.barra, C.barra, k) }} />
                <div style={{ position: "absolute", left: 32, top: 82, fontFamily: INTER, fontWeight: 600, fontSize: 34, color: W.tinta, opacity: 1 - disuelve }}>Nuevo gasto</div>
                <div style={{ position: "absolute", left: 30, right: 30, top: 0, bottom: 0, opacity: 1 - disuelve, transform: `scale(${1 - 0.08 * disuelve})`, transformOrigin: "50% 40%" }}>
                  <div style={{ position: "absolute", left: -30, top: 0, width: 508, height: 1068 }}>
                    <Campo y={190} h={136} etiqueta="Monto" foco={activo(T.monto, T.categoria)}>
                      <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 60, lineHeight: "76px", color: montoTxt ? W.tinta : W.fuerte }}>
                        {montoTxt || "$0"}
                        {activo(T.monto, T.categoria) ? <span style={{ display: "inline-block", width: 3, height: 54, marginLeft: 4, verticalAlign: "-6px", background: W.tinta, opacity: Math.floor(t * 4) % 2 ? 1 : 0 }} /> : null}
                      </div>
                    </Campo>
                    <Campo y={352} h={104} etiqueta="Categoría" foco={activo(T.categoria, T.cuenta)}>
                      <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 30, marginTop: 4, color: W.tinta }}>{catPuesta ? categoria : <Elegir />}</div>
                    </Campo>
                    <Campo y={476} h={104} etiqueta="Cuenta" foco={activo(T.cuenta, T.guardar)}>
                      <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 30, marginTop: 4, color: W.tinta }}>{cuentaPuesta ? cuenta : <Elegir />}</div>
                    </Campo>
                    {/* Lista de categorías que se abre y se cierra */}
                    {catLista ? (
                      <div style={{ position: "absolute", left: 30, top: 464, width: 448, height: 260, borderRadius: 18, background: W.blanco, boxShadow: "0 18px 40px rgba(0,0,0,.16)", transformOrigin: "50% 0", transform: `scaleY(${0.6 + 0.4 * catLista_k})`, opacity: catLista_k, padding: "16px 22px", boxSizing: "border-box" }}>
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} style={{ height: 56, borderRadius: 12, marginBottom: 4, background: i === 1 ? W.barra : "transparent", display: "flex", alignItems: "center", gap: 14, padding: "0 12px" }}>
                            <div style={{ width: 28, height: 28, borderRadius: 14, background: W.bloque }} />
                            <div style={{ width: 150 + (i % 2) * 60, height: 14, borderRadius: 7, background: i === 1 ? W.fuerte : W.bloque }} />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                {/* Barra de abajo de WhatsApp que aparece al transformarse */}
                <div style={{ position: "absolute", left: 0, top: G.barra, width: 508, height: 1068 - G.barra, background: C.barra, opacity: k }} />
                {/* Guardar → campo para escribir */}
                <div style={{ position: "absolute", left: bot.x, top: bot.y, width: bot.w, height: bot.h, borderRadius: bot.r, background: mezclaColor(t >= T.guardar && t < T.guardar + 0.16 ? "#45423E" : W.tinta, C.campo, k), display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${hunde})` }}>
                  <span style={{ fontFamily: INTER, fontWeight: 600, fontSize: 30, color: "#FFFFFF", opacity: 1 - disuelve }}>{t >= T.guardar + 0.18 ? "Guardado" : "Guardar"}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {/* Barra de estado (siempre arriba) */}
      <div style={{ position: "absolute", left: 40, top: 16, fontFamily: INTER, fontWeight: 600, fontSize: 22, color: tinta }}>9:41</div>
      <div style={{ position: "absolute", right: 34, top: 22, width: 72, height: 16, borderRadius: 8, background: tinta, opacity: 0.55 }} />
    </div>
  );
};

/**
 * Contador «N toques» en serif: el número rueda hacia arriba por su máscara en cada segundo de `toques`.
 * `colorFin`: color del número cuando llega al último toque (p. ej. rojo error).
 */
export const ContadorToques: React.FC<{ t: number; toques: number[]; size?: number; color?: string; colorFin?: string; singular?: string; plural?: string; desde?: number }> = ({
  t,
  toques,
  size = 120,
  color = "#1A1A1E",
  colorFin,
  singular = "toque",
  plural = "toques",
  desde = 0,
}) => {
  const n = toques.filter((x) => t >= x).length;
  const ult = n > 0 ? toques[n - 1] : -1e9;
  const k = pe(t, ult, 0.32);
  const valor = desde + n;
  const fin = n === toques.length && colorFin;
  const golpe = n > 0 ? 1 + 0.12 * Math.max(0, 1 - (t - ult) / 0.25) * sp(t, ult, { damping: 10 }) : 1;
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: size * 0.22, fontFamily: SERIF, fontSize: size, lineHeight: 1, color, whiteSpace: "nowrap" }}>
      <span style={{ position: "relative", display: "inline-block", overflow: "hidden", height: size * 1.05, paddingBottom: size * 0.05, verticalAlign: "bottom", color: fin ? colorFin : color, transform: `scale(${golpe})`, transformOrigin: "50% 80%" }}>
        <span style={{ display: "block", transform: `translateY(${(1 - k) * 100}%)` }}>{valor}</span>
        {n > 0 && k < 1 ? <span style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${-k * 100}%)`, color }}>{valor - 1}</span> : null}
      </span>
      <span>{valor === 1 ? singular : plural}</span>
    </span>
  );
};

// ── Flujo largo y realista: 14 toques, carga, teclado, lista larga con scroll, cuenta y fecha ──

/** Los 14 toques del flujo largo, en orden. */
export type ToquesAppLarga = {
  desbloquea: number;
  app: number;
  mas: number;
  monto: number;
  d1: number;
  d2: number;
  d3: number;
  categoria: number;
  elige: number;
  cuenta: number;
  tarjeta: number;
  fecha: number;
  dia: number;
  guardar: number;
};
/** Tiempos de lo que no es toque: la carga de la app y los dos deslizamientos de la lista. */
export type TramosAppLarga = { carga: [number, number]; baja: [number, number]; sube: [number, number] };

/** Dónde toca el dedo en cada paso (coordenadas internas 508×1068). */
export const PUNTOS_APP_LARGA: Record<keyof ToquesAppLarga, { x: number; y: number }> = {
  desbloquea: { x: 254, y: 760 },
  app: { x: 311, y: 604 },
  mas: { x: 430, y: 960 },
  monto: { x: 254, y: 258 },
  d1: { x: 252, y: 725 },
  d2: { x: 252, y: 821 },
  d3: { x: 252, y: 1013 },
  categoria: { x: 254, y: 404 },
  elige: { x: 254, y: 600 },
  cuenta: { x: 254, y: 528 },
  tarjeta: { x: 254, y: 910 },
  fecha: { x: 254, y: 652 },
  dia: { x: 131, y: 880 },
  guardar: { x: 254, y: 980 },
};
/** Puntos donde el dedo duda buscando la app antes de tocarla. */
export const BUSQUEDA_APP = [
  { x: 426, y: 154 },
  { x: 82, y: 454 },
];

const CATEGORIAS = [
  "Agua", "Alimentos", "Antojos", "Bebidas", "Belleza", "Café", "Comida rápida", "Despensa", "Educación", "Electrónica",
  "Entretenimiento", "Farmacia", "Gasolina", "Gimnasio", "Hogar", "Impuestos", "Lavandería", "Mascotas", "Regalos", "Restaurantes",
  "Ropa", "Salud", "Seguros", "Servicios", "Supermercado", "Suscripciones", "Taxis", "Teléfono", "Tintorería", "Transporte",
  "Transporte público", "Vacaciones", "Varios", "Viajes", "Videojuegos", "Vivienda", "Zapatos",
];
const I_SUPER = CATEGORIAS.indexOf("Supermercado");
const FILA = 80;
/** Desplazamiento de la lista: se pasa de «Supermercado» y regresa hasta dejarlo en y≈560. */
const OFF_PASA = 150 + I_SUPER * FILA - 70;
const OFF_FIN = 150 + I_SUPER * FILA - 560;
const CUENTAS = ["Efectivo", "Tarjeta de crédito", "Tarjeta de débito"];
const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫"];

/**
 * App de gastos genérica con el flujo completo y tedioso (508×1068): pantalla bloqueada → buscar la app → carga →
 * botón + → teclado numérico (2-5-0) → lista larga de categorías con scroll (se pasa y regresa) → cuenta → fecha →
 * Guardar. `haciaWA` 0→1 la transforma en `ChatWAOscuro` igual que `AppGenerica`.
 */
export const AppGenericaLarga: React.FC<{ t: number; toques: ToquesAppLarga; tramos: TramosAppLarga; haciaWA?: number }> = ({ t, toques: T, tramos: R, haciaWA = 0 }) => {
  const W = WIRE;
  const G = WA_OSC_GEO;
  const C = WA_OSCURO;
  const k = haciaWA;
  const disuelve = Math.min(1, k * 1.8);
  const fondo = mezclaColor(W.fondo, C.fondo, k);
  const tinta = mezclaColor(W.tinta, "#E9EDEF", k);
  const desbloq = pe(t, T.desbloquea + 0.02, 0.22, suave);
  const abre = pe(t, T.app + 0.03, 0.22, suave);
  const enApp = t >= T.app + 0.03;
  const cargado = pe(t, R.carga[1], 0.12);
  const forma = pe(t, T.mas + 0.05, 0.2);
  const teclado = pe(t, T.monto + 0.04, 0.12) * (1 - pe(t, T.d3 + 0.12, 0.12));
  const digitos = [T.d1, T.d2, T.d3].filter((x) => t >= x).length;
  const monto = digitos === 0 ? "" : "$" + "250".slice(0, digitos);
  const lista = pe(t, T.categoria + 0.04, 0.14) * (1 - pe(t, T.elige + 0.08, 0.14));
  const off = OFF_PASA * pe(t, R.baja[0], R.baja[1] - R.baja[0], (x) => 1 - (1 - x) ** 3) + (OFF_FIN - OFF_PASA) * pe(t, R.sube[0], R.sube[1] - R.sube[0], suave);
  const hoja = pe(t, T.cuenta + 0.04, 0.12) * (1 - pe(t, T.tarjeta + 0.08, 0.12));
  const cal = pe(t, T.fecha + 0.04, 0.12) * (1 - pe(t, T.dia + 0.1, 0.12));
  const bot = { x: 34 + (G.campo.x - 34) * k, y: 940 + (G.campo.y - 940) * k, w: 440 + (G.campo.w - 440) * k, h: 80 + (G.campo.h - 80) * k, r: 18 + (G.campo.r - 18) * k };
  const toca = (x: number) => t >= x && t < x + 0.12;
  const activo = (a: number, b: number) => t >= a && t < b;

  const campo = (y: number, h: number, etiqueta: string, foco: boolean, valor: React.ReactNode) => (
    <div style={{ position: "absolute", left: 30, top: y, width: 448, height: h, borderRadius: 18, background: W.blanco, border: `3px solid ${foco ? W.tinta : W.bloque}`, boxSizing: "border-box", padding: "14px 22px" }}>
      <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 21, color: W.texto }}>{etiqueta}</div>
      {valor}
    </div>
  );
  const elegir = <span style={{ color: W.fuerte }}>Elegir ›</span>;
  const val = (v: React.ReactNode) => <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 30, marginTop: 4, color: W.tinta }}>{v}</div>;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 508, height: 1068, overflow: "hidden", background: fondo }}>
      {/* Inicio: cuadrícula de apps (todas parecidas: hay que buscar) */}
      {abre < 1 ? (
        <div style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 20 }, (_, i) => {
            const c = i % 4;
            const r = Math.floor(i / 4);
            const y = 110 + r * 150;
            const meta = r === 3 && c === 2;
            return (
              <React.Fragment key={i}>
                <div style={{ position: "absolute", left: XS[c], top: y, width: 88, height: 88, borderRadius: 22, background: meta ? W.fuerte : i % 3 === 0 ? "#D3CFC8" : W.bloque }} />
                <div style={{ position: "absolute", left: XS[c] + 14, top: y + 100, width: 60, height: 10, borderRadius: 5, background: W.bloque }} />
              </React.Fragment>
            );
          })}
          <div style={{ position: "absolute", left: 20, top: 910, width: 468, height: 128, borderRadius: 40, background: "rgba(94,90,85,.08)" }} />
          {XS.map((x, i) => (
            <div key={i} style={{ position: "absolute", left: x, top: 930, width: 88, height: 88, borderRadius: 22, background: W.bloque }} />
          ))}
        </div>
      ) : null}
      {/* Pantalla bloqueada que sube al desbloquear */}
      {desbloq < 1 ? (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#CFCBC4,#E7E4DF)", transform: `translateY(${-desbloq * 1068}px)` }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: INTER, fontWeight: 600, fontSize: 116, color: W.tinta }}>9:41</div>
          <div style={{ position: "absolute", left: 154, top: 300, width: 200, height: 14, borderRadius: 7, background: W.fuerte }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 940, textAlign: "center", fontFamily: INTER, fontSize: 22, color: W.texto }}>Toca para abrir</div>
        </div>
      ) : null}
      {/* La app: se abre desde su ícono, carga y luego muestra la lista */}
      {enApp ? (
        <div style={{ position: "absolute", left: XS[2] * (1 - abre), top: 560 * (1 - abre), width: 88 + 420 * abre, height: 88 + 980 * abre, borderRadius: 22 * (1 - abre), overflow: "hidden", background: fondo }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 508, height: 1068 }}>
            {/* Pantalla de carga */}
            {cargado < 1 ? (
              <div style={{ position: "absolute", inset: 0, opacity: 1 - cargado }}>
                <div style={{ position: "absolute", left: 194, top: 380, width: 120, height: 120, borderRadius: 30, background: W.fuerte }} />
                <svg width="70" height="70" viewBox="0 0 50 50" style={{ position: "absolute", left: 219, top: 580, transform: `rotate(${t * 720}deg)` }}>
                  <circle cx="25" cy="25" r="19" fill="none" stroke={W.bloque} strokeWidth="5" />
                  <path d="M25 6 a19 19 0 0 1 19 19" fill="none" stroke={W.tinta} strokeWidth="5" strokeLinecap="round" />
                </svg>
                <div style={{ position: "absolute", left: 0, right: 0, top: 680, textAlign: "center", fontFamily: INTER, fontSize: 22, color: W.texto }}>Cargando…</div>
              </div>
            ) : null}
            {/* Lista de gastos con botón + */}
            {cargado > 0 && forma < 1 ? (
              <div style={{ position: "absolute", inset: 0, opacity: cargado }}>
                <div style={{ position: "absolute", left: 0, top: 0, width: 508, height: 150, background: W.barra }} />
                <div style={{ position: "absolute", left: 32, top: 82, fontFamily: INTER, fontWeight: 600, fontSize: 34, color: W.tinta }}>Gastos</div>
                {Array.from({ length: 7 }, (_, i) => (
                  <React.Fragment key={i}>
                    <div style={{ position: "absolute", left: 32, top: 182 + i * 100, width: 60, height: 60, borderRadius: 30, background: W.bloque }} />
                    <div style={{ position: "absolute", left: 112, top: 192 + i * 100, width: 190 - (i % 3) * 30, height: 16, borderRadius: 8, background: W.bloque }} />
                    <div style={{ position: "absolute", left: 112, top: 220 + i * 100, width: 110, height: 12, borderRadius: 6, background: W.barra }} />
                    <div style={{ position: "absolute", left: 396, top: 198 + i * 100, width: 80, height: 16, borderRadius: 8, background: W.fuerte }} />
                  </React.Fragment>
                ))}
                <div style={{ position: "absolute", left: 384, top: 914, width: 92, height: 92, borderRadius: 46, background: W.tinta, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${toca(T.mas) ? 0.9 : 1})` }}>
                  <svg width="40" height="40" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            ) : null}
            {/* Formulario */}
            {t >= T.mas + 0.05 ? (
              <div style={{ position: "absolute", left: 0, top: (1 - forma) * 1068, width: 508, height: 1068, background: fondo }}>
                <div style={{ position: "absolute", left: 0, top: 0, width: 508, height: 150, background: mezclaColor(W.barra, C.barra, k) }} />
                <div style={{ position: "absolute", left: 32, top: 82, fontFamily: INTER, fontWeight: 600, fontSize: 34, color: W.tinta, opacity: 1 - disuelve }}>Nuevo gasto</div>
                <div style={{ position: "absolute", inset: 0, opacity: 1 - disuelve, transform: `scale(${1 - 0.08 * disuelve})`, transformOrigin: "50% 40%" }}>
                  {campo(
                    190,
                    136,
                    "Monto",
                    activo(T.monto, T.categoria),
                    <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 60, lineHeight: "76px", color: monto ? W.tinta : W.fuerte }}>
                      {monto || "$0"}
                      {activo(T.monto, T.categoria) ? <span style={{ display: "inline-block", width: 3, height: 54, marginLeft: 4, verticalAlign: "-6px", background: W.tinta, opacity: Math.floor(t * 6) % 2 ? 1 : 0 }} /> : null}
                    </div>,
                  )}
                  {campo(352, 104, "Categoría", activo(T.categoria, T.cuenta), val(t >= T.elige + 0.08 ? "Supermercado" : elegir))}
                  {campo(476, 104, "Cuenta", activo(T.cuenta, T.fecha), val(t >= T.tarjeta + 0.08 ? "Tarjeta de crédito" : elegir))}
                  {campo(600, 104, "Fecha", activo(T.fecha, T.guardar), val(t >= T.dia + 0.1 ? "Hoy" : elegir))}
                </div>
                {/* Barra de abajo de WhatsApp que aparece al transformarse */}
                <div style={{ position: "absolute", left: 0, top: G.barra, width: 508, height: 1068 - G.barra, background: C.barra, opacity: k }} />
                {/* Guardar → campo para escribir */}
                <div style={{ position: "absolute", left: bot.x, top: bot.y, width: bot.w, height: bot.h, borderRadius: bot.r, background: mezclaColor(toca(T.guardar) ? "#45423E" : W.tinta, C.campo, k), display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${toca(T.guardar) ? 0.97 : 1})` }}>
                  <span style={{ fontFamily: INTER, fontWeight: 600, fontSize: 30, color: "#FFFFFF", opacity: 1 - disuelve }}>{t >= T.guardar + 0.15 ? "Guardado" : "Guardar"}</span>
                </div>
                {/* Teclado numérico */}
                {teclado > 0 ? (
                  <div style={{ position: "absolute", left: 0, top: 668 + (1 - teclado) * 400, width: 508, height: 400, background: "#D5D2CC" }}>
                    {TECLAS.map((d, i) => {
                      const c = i % 3;
                      const r = Math.floor(i / 3);
                      const pulsada = (d === "2" && toca(T.d1)) || (d === "5" && toca(T.d2)) || (d === "0" && toca(T.d3));
                      return (
                        <div key={i} style={{ position: "absolute", left: 17 + c * 160, top: 16 + r * 96, width: 150, height: 82, borderRadius: 12, background: pulsada ? "#A9A49C" : W.blanco, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 500, fontSize: 38, color: W.tinta, boxShadow: "0 2px 0 rgba(0,0,0,.12)" }}>
                          {d}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                {/* Lista larga de categorías (con scroll) */}
                {lista > 0 ? (
                  <div style={{ position: "absolute", left: (1 - lista) * 508, top: 0, width: 508, height: 1068, background: W.blanco, overflow: "hidden" }}>
                    {CATEGORIAS.map((c, i) => {
                      const y = 150 + i * FILA - off;
                      if (y < 70 || y > 1068) return null;
                      const elegida = i === I_SUPER && t >= T.elige;
                      return (
                        <div key={c} style={{ position: "absolute", left: 0, top: y, width: 508, height: FILA, borderBottom: `2px solid ${W.barra}`, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 18, padding: "0 30px", background: elegida ? W.bloque : "transparent" }}>
                          <div style={{ width: 36, height: 36, borderRadius: 18, background: W.bloque }} />
                          <span style={{ fontFamily: INTER, fontWeight: 500, fontSize: 28, color: W.tinta }}>{c}</span>
                        </div>
                      );
                    })}
                    <div style={{ position: "absolute", left: 0, top: 0, width: 508, height: 150, background: W.barra }} />
                    <div style={{ position: "absolute", left: 32, top: 82, fontFamily: INTER, fontWeight: 600, fontSize: 34, color: W.tinta }}>‹ Categoría</div>
                    <div style={{ position: "absolute", right: 8, top: 160 + (off / 2400) * 780, width: 6, height: 120, borderRadius: 3, background: W.fuerte }} />
                  </div>
                ) : null}
                {/* Hoja de cuentas */}
                {hoja > 0 ? (
                  <>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.18)", opacity: hoja }} />
                    <div style={{ position: "absolute", left: 0, top: 700 + (1 - hoja) * 380, width: 508, height: 380, borderRadius: "28px 28px 0 0", background: W.blanco, padding: "22px 30px", boxSizing: "border-box" }}>
                      <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 28, color: W.tinta }}>Cuenta</div>
                      {CUENTAS.map((c, i) => (
                        <div key={c} style={{ position: "absolute", left: 20, top: 80 + i * 90, width: 468, height: 80, borderRadius: 14, display: "flex", alignItems: "center", padding: "0 18px", boxSizing: "border-box", background: i === 1 && t >= T.tarjeta ? W.bloque : "transparent", fontFamily: INTER, fontWeight: 500, fontSize: 28, color: W.tinta }}>
                          {c}
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
                {/* Calendario */}
                {cal > 0 ? (
                  <>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.18)", opacity: cal }} />
                    <div style={{ position: "absolute", left: 0, top: 620 + (1 - cal) * 448, width: 508, height: 448, borderRadius: "28px 28px 0 0", background: W.blanco }}>
                      <div style={{ position: "absolute", left: 30, top: 24, fontFamily: INTER, fontWeight: 600, fontSize: 28, color: W.tinta }}>Fecha</div>
                      {Array.from({ length: 31 }, (_, d) => {
                        const idx = d + 3;
                        const c = idx % 7;
                        const r = Math.floor(idx / 7);
                        const hoy = d + 1 === 13 && t >= T.dia;
                        return (
                          <div key={d} style={{ position: "absolute", left: 40 + c * 61, top: 100 + r * 64, width: 61, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ width: 52, height: 52, borderRadius: 26, background: hoy ? W.tinta : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontSize: 24, color: hoy ? "#fff" : W.tinta }}>{d + 1}</div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {/* Barra de estado */}
      {desbloq >= 1 ? (
        <>
          <div style={{ position: "absolute", left: 40, top: 16, fontFamily: INTER, fontWeight: 600, fontSize: 22, color: tinta }}>9:41</div>
          <div style={{ position: "absolute", right: 34, top: 22, width: 72, height: 16, borderRadius: 8, background: tinta, opacity: 0.55 }} />
        </>
      ) : null}
    </div>
  );
};
