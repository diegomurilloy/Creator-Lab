// Reel de ejemplo · «Así se ve anotar un gasto en 2026» · sin cara y SIN VOZ (animación + texto; agrégale música).
// Una sola toma: el cronómetro es el hilo. Arranca en 0.0, viaja a la esquina y mide el flujo de siempre (app
// genérica, 7 pasos en cámara rápida); la app se transforma en el chat oscuro de WhatsApp mientras el cronómetro se
// rebobina; vuelve a correr y se detiene cuando contesta la marca. La cámara entra a la respuesta, la burbuja crece
// hasta volverse el bloque final y el bloque se encoge en el cronómetro del primer cuadro (bucle).
// Úsalo como plantilla: cambia los textos, los tiempos de arriba y los colores en src/marcas/.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  AppGenericaLarga,
  BUSQUEDA_APP,
  Celular,
  ChatWAOscuro,
  CirculoMano,
  ContadorToques,
  Cronometro,
  EmojiCarrito,
  FPS,
  INTER,
  MARCA,
  MARCA_APP,
  LogoMarca,
  MONO,
  Mano,
  Mundo,
  PUNTOS_APP_LARGA,
  SERIF,
  WA_OSCURO,
  camaraEn,
  expo,
  mezclaColor,
  pe,
  sp,
  suave,
  type Cam,
  type Toma,
  type ToquesAppLarga,
  type TramosAppLarga,
} from "../libreria";
import { TextoMascara } from "../libreria/pro";


const A = MARCA_APP;
const CIAN = MARCA.vivo; // rellenos y ondas
const CIAN_T = MARCA.vivoTexto; // palabras clave sobre claro
const FONDO = A.superficie;

// ── Tiempos ──────────────────────────────────────────────────────────────────
// Se cuentan PASOS (acciones completas), no toques: 7 en la app de siempre contra 1 mensaje. La app va en
// cámara rápida (×6): 7 s de video = 42 s en el cronómetro. WhatsApp va a velocidad normal: teclear + que conteste
// ≈ 5 s. Las cifras son ilustrativas.
const VEL = 6;
const INI_APP = 2.0;
const TQ: ToquesAppLarga = { desbloquea: 2.6, app: 3.3, mas: 4.35, monto: 4.75, d1: 5.0, d2: 5.2, d3: 5.4, categoria: 5.75, elige: 7.1, cuenta: 7.45, tarjeta: 7.7, fecha: 8.0, dia: 8.3, guardar: 8.65 };
const TRAMOS: TramosAppLarga = { carga: [3.55, 4.15], baja: [6.05, 6.6], sube: [6.7, 6.95] };
const LISTA_TOQUES = Object.values(TQ);
const VUELO = 0.24; // lo que tarda el «+1» en llegar al contador
// Cuándo se completa cada paso y desde qué toque sale su «+1».
const PASOS: { en: number; desde: keyof ToquesAppLarga }[] = [
  { en: TQ.app, desde: "app" }, // 1 abrir la app (buscarla incluida)
  { en: TQ.mas, desde: "mas" }, // 2 tocar +
  { en: TQ.d3, desde: "d3" }, // 3 escribir el monto
  { en: TQ.elige, desde: "elige" }, // 4 elegir categoría (con el scroll)
  { en: TQ.tarjeta, desde: "tarjeta" }, // 5 elegir cuenta
  { en: TQ.dia, desde: "dia" }, // 6 elegir fecha
  { en: TQ.guardar, desde: "guardar" }, // 7 guardar
];
const LLEGA = PASOS.map((p) => p.en + VUELO);
const MORFO = 9.0;
const CORRE2 = MORFO + 0.5;
const TECLEO = 9.75;
const MSG = "gasté 180 en el súper";
// Tecleo a mano, con ritmo irregular (más lento en los espacios).
const TECLAS_EN = MSG.split("").reduce<number[]>((acc, ch, i) => [...acc, i === 0 ? TECLEO : acc[i - 1] + (ch === " " ? 0.17 : 0.1 + 0.03 * ((i * 7) % 3))], []);
const ENVIA = 12.7;
const LEIDO = 13.0;
const ESCRIBE = 13.2;
const RESP = 14.7; // ~1.5 s de «escribiendo…»
const ZOOM = 15.6;
const CIRCULO = 16.0;
const TARJETA_EN = 16.2;
const L1 = 16.3;
const L2 = 17.05;
const BLOQUE = 18.2;
const CTA_EN = 19.1;
const PILL = 19.5;
const CIERRE = 20.35;
export const DURACION = 21.1;

// ── Geometría (mundo = lienzo cuando la cámara está en reposo) ────────────────
const PH = { x: 270, y: 420, w: 540, h: 1100 };
const SC = { x: PH.x + 16, y: PH.y + 16 }; // origen de la pantalla del celular
const RESP_CAJA = { x: SC.x + 18, y: SC.y + 330, w: 404, h: 100 };
const GRANDE = { x: 540, y: 980, k: 1.3 };
const HUD = { x: 168, y: 250, k: 0.56 };

// ── Cámara ───────────────────────────────────────────────────────────────────
const lineal = (x: number) => x;
const INICIO: Cam = { x: 540, y: 800, s: 1, r: 0 };
const TOMAS: Toma[] = [
  { en: 2.6, dur: MORFO - 2.7, x: 540, y: 806, s: 1.025, curva: lineal },
  { en: MORFO, dur: 0.6, x: 540, y: 809, s: 1.15 }, // se ve el chat completo con el contacto
  { en: MORFO + 0.62, dur: 0.5, x: 540, y: 1296, s: 1.9, curva: expo }, // a la barra donde se teclea
  { en: MORFO + 1.12, dur: ENVIA - MORFO - 1.12, x: 540, y: 1286, s: 1.95, curva: lineal },
  { en: ENVIA, dur: 0.55, x: 530, y: 636, s: 1.9 }, // sube: encabezado del contacto + burbujas
  { en: ENVIA + 0.55, dur: ZOOM - ENVIA - 0.55, x: 530, y: 662, s: 2.04, curva: lineal }, // la espera: se acerca despacio
  { en: ZOOM, dur: 0.6, x: 506, y: 833, s: 2.3, curva: expo }, // a la respuesta
  { en: ZOOM + 0.6, dur: BLOQUE - ZOOM - 0.6, x: 506, y: 836, s: 2.38, curva: lineal },
];
const aPantalla = (c: Cam, x: number, y: number) => ({ x: 540 + (x - c.x) * c.s, y: 800 + (y - c.y) * c.s });

// Golpes de cámara (+2.8 %, curva x·e^(1−x)); chicos en cada paso completado.
const GOLPES: [number, number][] = [[0.62, 0.028], ...LLEGA.map((x, i): [number, number] => [x, i === LLEGA.length - 1 ? 0.03 : 0.012]), [ENVIA, 0.02], [RESP, 0.028], [CIRCULO, 0.02], [BLOQUE + 0.3, 0.028]];

// ── Dedo: a dónde va y cuándo toca ───────────────────────────────────────────
const enMundo = (p: { x: number; y: number }) => ({ x: SC.x + p.x, y: SC.y + p.y });
const P = PUNTOS_APP_LARGA;
const PUNTOS_LISTA = (Object.keys(TQ) as (keyof ToquesAppLarga)[]).map((k) => enMundo(P[k]));
const FUERA = { x: 1000, y: 2120 };
const ENVIAR = enMundo({ x: 458, y: 1018 });
const RUTA: { a: number; b: number; p: { x: number; y: number } }[] = [
  { a: 2.2, b: 2.5, p: enMundo(P.desbloquea) },
  { a: 2.7, b: 2.88, p: enMundo(BUSQUEDA_APP[0]) }, // busca la app…
  { a: 2.93, b: 3.1, p: enMundo(BUSQUEDA_APP[1]) },
  { a: 3.12, b: 3.27, p: enMundo(P.app) },
  { a: 3.4, b: 3.7, p: enMundo({ x: 330, y: 820 }) }, // espera a que cargue
  { a: 4.12, b: 4.32, p: enMundo(P.mas) },
  { a: 4.45, b: 4.72, p: enMundo(P.monto) },
  { a: 4.82, b: 4.97, p: enMundo(P.d1) },
  { a: 5.05, b: 5.17, p: enMundo(P.d2) },
  { a: 5.25, b: 5.37, p: enMundo(P.d3) },
  { a: 5.5, b: 5.72, p: enMundo(P.categoria) },
  { a: 5.82, b: 6.03, p: enMundo({ x: 254, y: 900 }) },
  { a: 6.05, b: 6.35, p: enMundo({ x: 254, y: 330 }) }, // desliza hacia arriba (se pasa)
  { a: 6.4, b: 6.66, p: enMundo({ x: 254, y: 420 }) },
  { a: 6.7, b: 6.95, p: enMundo({ x: 254, y: 880 }) }, // regresa
  { a: 6.97, b: 7.07, p: enMundo(P.elige) },
  { a: 7.2, b: 7.42, p: enMundo(P.cuenta) },
  { a: 7.53, b: 7.67, p: enMundo(P.tarjeta) },
  { a: 7.8, b: 7.97, p: enMundo(P.fecha) },
  { a: 8.08, b: 8.27, p: enMundo(P.dia) },
  { a: 8.4, b: 8.62, p: enMundo(P.guardar) },
  { a: 8.85, b: 9.2, p: FUERA },
  { a: ENVIA - 0.6, b: ENVIA - 0.1, p: ENVIAR },
  { a: ENVIA + 0.15, b: ENVIA + 0.6, p: FUERA },
];
const TAPS = [...LISTA_TOQUES, ENVIA - 0.05];
const ONDAS = [...PUNTOS_LISTA, ENVIAR];
const posDedo = (t: number) => {
  let p = FUERA;
  for (const r of RUTA) {
    if (t <= r.a) break;
    const k = pe(t, r.a, r.b - r.a, suave);
    p = { x: p.x + (r.p.x - p.x) * k, y: p.y + (r.p.y - p.y) * k };
  }
  return p;
};
const arrastra = (t: number) => (t >= TRAMOS.baja[0] && t < 6.35) || (t >= TRAMOS.sube[0] && t < TRAMOS.sube[1]);
const presionEn = (t: number) => (arrastra(t) ? 1 : TAPS.reduce((m, x) => Math.max(m, t > x - 0.05 && t < x + 0.08 ? Math.sin((Math.PI * (t - x + 0.05)) / 0.13) : 0), 0));

// ── Cronómetro: lo que marca ─────────────────────────────────────────────────
const valorCrono = (t: number) => {
  if (t < INI_APP) return 0;
  if (t < MORFO) return (t - INI_APP) * VEL;
  if (t < MORFO + 0.5) return (MORFO - INI_APP) * VEL * (1 - pe(t, MORFO, 0.5, suave));
  if (t < RESP) return t - CORRE2;
  return RESP - CORRE2;
};

export const Ejemplo: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const cam = camaraEn(t, INICIO, TOMAS);
  const camPrev = camaraEn(t - 1 / FPS, INICIO, TOMAS);
  const golpe = GOLPES.reduce((s, [g, a]) => {
    const x = (t - g) / 0.09;
    return s + (x > 0 ? a * x * Math.exp(1 - x) : 0);
  }, 0);

  // Celular
  const sube = (1 - pe(t, 1.95, 0.7, expo)) * 1500;
  const verCel = t >= 1.95 && t < BLOQUE + 0.5;
  const haciaWA = pe(t, MORFO, 0.5, suave);
  const chatOp = pe(t, MORFO + 0.45, 0.12);
  const nTecla = TECLAS_EN.filter((x) => t >= x).length;
  const tecleo = t >= TECLEO ? MSG.slice(0, nTecla) : "";

  // Cronómetro: grande al centro → esquina (HUD) → se vuelve a armar al final.
  const vuela = pe(t, 1.95, 0.62, expo);
  const empuje = 1 + 0.045 * pe(t, 0, 1.9, suave) * (1 - vuela);
  const golpeCrono = 1 + 0.06 * Math.max(0, 1 - Math.abs(t - 0.66) / 0.18);
  const cro = { x: GRANDE.x + (HUD.x - GRANDE.x) * vuela, y: GRANDE.y + (HUD.y - GRANDE.y) * vuela, k: (GRANDE.k + (HUD.k - GRANDE.k) * vuela) * empuje * golpeCrono };
  const presion = t > 1.5 && t < 1.78 ? Math.sin((Math.PI * (t - 1.5)) / 0.28) : 0;
  const listo = t >= RESP ? pe(t, RESP, 0.7) : 0;
  const latido = t >= RESP && t < RESP + 0.3 ? 1 + 0.12 * Math.sin((Math.PI * (t - RESP)) / 0.3) : 1;

  // Bloque final: la respuesta crece hasta llenar la pantalla.
  const camB = camaraEn(BLOQUE, INICIO, TOMAS);
  const b0 = aPantalla(camB, RESP_CAJA.x, RESP_CAJA.y);
  const kb = pe(t, BLOQUE, 0.45, expo);
  const caja = { x: b0.x * (1 - kb), y: b0.y * (1 - kb), w: RESP_CAJA.w * camB.s + (1080 - RESP_CAJA.w * camB.s) * kb, h: RESP_CAJA.h * camB.s + (1920 - RESP_CAJA.h * camB.s) * kb, r: 18 * camB.s * (1 - kb) };
  const radioCierre = 1250 + (175 * GRANDE.k - 1250) * pe(t, CIERRE, 0.55, suave);
  const verBloque = t >= BLOQUE && t < CIERRE + 0.56;
  const contenidoSale = pe(t, CIERRE - 0.15, 0.2, suave);

  // Texto de arriba: contador de toques → «1 mensaje».
  const encoge = pe(t, MORFO + 0.1, 0.5, expo);
  const tacha = pe(t, MORFO + 0.35, 0.3);
  const veloArriba = pe(t, MORFO + 0.5, 0.4);

  return (
    <AbsoluteFill style={{ background: FONDO, overflow: "hidden" }}>
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${MARCA.linea} 2px, transparent 2px)`, backgroundSize: "44px 44px", backgroundPosition: `${(-cam.x * cam.s * 0.4) % 44}px ${(-cam.y * cam.s * 0.4) % 44}px` }} />
      <AbsoluteFill style={{ transform: `scale(${1 + golpe})` }}>
        {/* ── El mundo: el celular ── */}
        {verCel ? (
          <Mundo cam={cam} previa={camPrev} centro={{ x: 540, y: 800 }} blurMax={6}>
            <div style={{ position: "absolute", left: PH.x, top: PH.y + sube }}>
              <Celular w={PH.w} h={PH.h} pantalla={WA_OSCURO.fondo}>
                {t < MORFO + 0.6 ? <AppGenericaLarga t={t} toques={TQ} tramos={TRAMOS} haciaWA={haciaWA} /> : null}
                {chatOp > 0 ? (
                  <div style={{ position: "absolute", inset: 0, opacity: chatOp }}>
                    <ChatWAOscuro
                      t={t}
                      contacto={MARCA.contacto}
                      tecleo={tecleo}
                      enviado={t >= ENVIA}
                      enviadoEn={ENVIA}
                      leidoEn={LEIDO}
                      escribiendo={t >= ESCRIBE && t < RESP}
                      puntos={pe(t, ESCRIBE + 0.05, 0.2) * (1 - pe(t, RESP - 0.06, 0.06))}
                      resp={sp(t, RESP, { damping: 14, stiffness: 170 })}
                      mensaje={MSG}
                      respAlto={RESP_CAJA.h}
                      respAncho={RESP_CAJA.w}
                      respuesta={
                        <>
                          Listo, anoté <b style={{ fontWeight: 700 }}>$180</b> en{" "}
                          <span style={{ position: "relative", display: "inline-block" }}>
                            <i>Supermercado</i>
                            <span style={{ position: "absolute", left: -14, top: -7 }}>
                              <CirculoMano t={t} en={CIRCULO} w={192} h={50} color={CIAN} grosor={4.5} semilla={2} dur={0.4} />
                            </span>
                          </span>
                          <EmojiCarrito />
                        </>
                      }
                    />
                  </div>
                ) : null}
              </Celular>
            </div>
            {/* Ondas en cada toque */}
            {TAPS.map((x, i) => {
              const k = pe(t, x, 0.45);
              if (t < x || k >= 1) return null;
              const p = ONDAS[i];
              return <div key={i} style={{ position: "absolute", left: p.x - 50, top: p.y - 50, width: 100, height: 100, borderRadius: 50, border: `${7 * (1 - k)}px solid ${CIAN}`, transform: `scale(${0.3 + k * 1.1})`, opacity: 1 - k }} />;
            })}
            {/* El dedo */}
            {(t > 2.2 && t < 9.2) || (t > ENVIA - 0.65 && t < ENVIA + 0.65) ? (
              <div style={{ position: "absolute", left: posDedo(t).x, top: posDedo(t).y }}>
                <Mano escala={t > MORFO ? 0.5 : 0.92} presion={presionEn(t)} />
              </div>
            ) : null}
          </Mundo>
        ) : null}

        {/* Velo de papel arriba para que el texto se lea cuando la cámara se acerca */}
        {veloArriba > 0 ? <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 480, background: `linear-gradient(180deg, ${FONDO} 0%, ${FONDO} 76%, ${FONDO}00 100%)`, opacity: veloArriba }} /> : null}

        {/* «+1» que vuela de cada toque al contador */}
        {PASOS.map(({ en: x, desde }, i) => {
          if (t < x || t > x + VUELO + 0.02) return null;
          const k = pe(t, x, VUELO, suave);
          const origen = aPantalla(cam, enMundo(P[desde]).x, enMundo(P[desde]).y);
          const dest = { x: 340, y: 250 };
          const arco = Math.sin(Math.PI * k) * 120;
          return (
            <div key={i} style={{ position: "absolute", left: origen.x + (dest.x - origen.x) * k - 34, top: origen.y + (dest.y - origen.y) * k - 34 - arco, width: 68, height: 68, borderRadius: 34, background: CIAN, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 700, fontSize: 28, color: "#FFFFFF", transform: `scale(${(0.6 + 0.4 * sp(t, x, { damping: 12 })) * (1 - 0.5 * k)})`, boxShadow: `0 8px 18px ${CIAN}59` }}>
              +1
            </div>
          );
        })}

        {/* Gancho */}
        {t < 2.6 ? (
          <>
            <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", fontFamily: SERIF, fontSize: 108, lineHeight: 1.08, color: A.texto }}>
              <TextoMascara t={t} en={0.02} texto="Así se ve anotar" sale={1.92} colorClave={CIAN_T} />
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 452, textAlign: "center", fontFamily: SERIF, fontSize: 108, lineHeight: 1.08, color: A.texto }}>
              <TextoMascara t={t} en={0.2} texto="un gasto en *2026.*" sale={1.96} colorClave={CIAN_T} />
            </div>
          </>
        ) : null}

        {/* Contador de toques (se encoge y se tacha cuando llega WhatsApp) */}
        {t >= 2.2 && t < BLOQUE + 0.5 ? (
          <div style={{ position: "absolute", left: 290, top: 250, transformOrigin: "0 50%", transform: `translateY(${-62 - 80 * encoge}px) scale(${1 - 0.52 * encoge})`, opacity: 1 - 0.35 * encoge }}>
            <div style={{ overflow: "hidden", paddingBottom: 8 }}>
              <div style={{ transform: `translateY(${(1 - pe(t, 2.2, 0.5)) * 110}%)` }}>
                <ContadorToques t={t} toques={LLEGA} size={112} color={A.texto} colorFin={MARCA.error} singular="paso" plural="pasos" />
              </div>
            </div>
            {tacha > 0 ? <div style={{ position: "absolute", left: -6, top: 62, height: 9, width: 400 * tacha, borderRadius: 5, background: MARCA.error }} /> : null}
          </div>
        ) : null}
        {t >= ENVIA && t < BLOQUE + 0.5 ? (
          <div style={{ position: "absolute", left: 290, top: 218, fontFamily: SERIF, fontSize: 118, lineHeight: 1.05, color: A.texto, whiteSpace: "nowrap" }}>
            <TextoMascara t={t} en={ENVIA + 0.02} texto="*1* mensaje" colorClave={CIAN_T} />
          </div>
        ) : null}

        {/* Indicador de cámara rápida */}
        {t >= 2.3 && t < MORFO + 0.2 ? (
          <div style={{ position: "absolute", left: 292, top: 326, display: "flex", alignItems: "center", gap: 14, padding: "12px 28px", borderRadius: 44, background: A.primario, opacity: pe(t, 2.3, 0.2) * (1 - pe(t, MORFO, 0.2)), transform: `scale(${0.7 + 0.3 * sp(t, 2.3, { damping: 12 })})`, transformOrigin: "0 50%" }}>
            <svg width="58" height="34" viewBox="0 0 44 26">
              <path d="M2 2l18 11L2 24z" fill={A.crema} opacity={Math.floor(t * 6) % 2 ? 1 : 0.45} />
              <path d="M22 2l18 11-18 11z" fill={A.crema} opacity={Math.floor(t * 6) % 2 ? 0.45 : 1} />
            </svg>
            <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 44, letterSpacing: "0.06em", color: A.crema }}>×{VEL}</span>
          </div>
        ) : null}
        {/* Cronómetro (hilo conductor) */}
        {t < BLOQUE + 0.5 ? <Cronometro x={cro.x} y={cro.y} k={cro.k * latido} formato="min" valor={valorCrono(t)} presion={presion} listo={listo} acento={CIAN} /> : null}

        {/* Tarjeta de la escena del acercamiento */}
        {t >= TARJETA_EN && t < BLOQUE + 0.5 ? (
          <div style={{ position: "absolute", left: 60, top: 1150, width: 960, padding: "40px 0 46px", borderRadius: 40, background: A.fondo, boxShadow: "0 30px 70px rgba(26,46,53,.22)", textAlign: "center", fontFamily: SERIF, fontSize: 84, lineHeight: 1.12, color: A.texto, transformOrigin: "50% 0", transform: `translateY(${(1 - sp(t, TARJETA_EN, { damping: 15 })) * 260}px)`, opacity: Math.min(1, pe(t, TARJETA_EN, 0.12)) }}>
            <div>
              <TextoMascara t={t} en={L1} texto="No escogiste *categoría.*" colorClave={CIAN_T} />
            </div>
            <div>
              <TextoMascara t={t} en={L2} texto="No abriste *nada.*" colorClave={CIAN_T} />
            </div>
          </div>
        ) : null}
      </AbsoluteFill>

      {/* Bloque final: la burbuja de la respuesta crece, dice «Listo.» y se encoge en el cronómetro del inicio */}
      {verBloque ? (
        <div
          style={{
            position: "absolute",
            left: caja.x,
            top: caja.y,
            width: caja.w,
            height: caja.h,
            borderRadius: caja.r,
            background: mezclaColor(WA_OSCURO.entra, A.primario, kb),
            opacity: Math.min(1, pe(t, BLOQUE, 0.08)),
            clipPath: t >= CIERRE ? `circle(${radioCierre}px at ${GRANDE.x}px ${GRANDE.y}px)` : undefined,
            overflow: "hidden",
          }}
        >
          <AbsoluteFill style={{ backgroundImage: `radial-gradient(${A.crema}1A 2px, transparent 2px)`, backgroundSize: "44px 44px", opacity: kb }} />
          {kb > 0.5 ? (
            <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: 1 - contenidoSale, transform: `scale(${1 - 0.05 * contenidoSale})` }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", justifyContent: "center", transform: `scale(${sp(t, BLOQUE + 0.32, { damping: 13 })})` }}>
                <LogoMarca size={168} fondo={A.crema} color={A.primario} entrada={[0, 1, 2].map((i) => pe(t, BLOQUE + 0.4 + i * 0.07, 0.45))} />
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center", fontFamily: SERIF, fontSize: 236, lineHeight: 1, color: A.crema, letterSpacing: "-0.01em" }}>
                <TextoMascara t={t} en={BLOQUE + 0.22} texto="*Listo.*" colorClave={A.arena} paso={0.1} />
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 1010, textAlign: "center", fontFamily: INTER, fontWeight: 600, fontSize: 52, lineHeight: 1.2, color: A.crema }}>
                <TextoMascara t={t} en={CTA_EN} texto="Pruébalo hoy, es gratis." paso={0.06} colorClave={A.arena} />
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 1120, display: "flex", justifyContent: "center", opacity: Math.min(1, pe(t, PILL, 0.2)), transform: `translateY(${(1 - sp(t, PILL, { damping: 13 })) * 40}px) scale(${0.8 + 0.2 * sp(t, PILL, { damping: 13 })})` }}>
                <div style={{ padding: "20px 46px", borderRadius: 60, background: A.arena, fontFamily: INTER, fontWeight: 700, fontSize: 46, color: A.primario }}>Link en bio</div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* El cronómetro vuelve a armarse sobre el círculo del bloque (empata con el primer cuadro) */}
      {t >= CIERRE + 0.25 ? <Cronometro x={GRANDE.x} y={GRANDE.y} k={GRANDE.k} formato="min" valor={0} piezas={pe(t, CIERRE + 0.3, 0.25)} acento={CIAN} /> : null}
    </AbsoluteFill>
  );
};
