// Demos de la librería: una composición corta por pieza, sobre el fondo de la marca.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import palabras from "./palabras-ejemplo.json";
import { CY, FPS, INTER, acelera, pe, sp, suave, tiembla } from "./base";
import { Bloque } from "./bloques";
import { Centro, Escena, Mono, Onda } from "./escena";
import { LogoMarca } from "./logos";
import { Bateria, Carrito, Celular, Check, Lapiz, Medidor, Persona, Ticket } from "./objetos";
import { MARCA } from "./paletas";
import { Subtitulos, type Palabra } from "./subtitulos";
import { AppWA, ChatWA, ChatWAOscuro, EmojiCarrito } from "./whatsapp";
import { Cronometro, Mano } from "./objetos";
import { AppGenerica, ContadorToques, PUNTOS_APP } from "./apps";

const useT = () => useCurrentFrame() / FPS;

const Lienzo: React.FC<{ children: React.ReactNode; fondo?: string }> = ({ children, fondo = MARCA.fondo }) => (
  <AbsoluteFill style={{ background: fondo, overflow: "hidden" }}>
    <AbsoluteFill style={{ backgroundImage: `radial-gradient(${MARCA.linea} 2px, transparent 2px)`, backgroundSize: "44px 44px", opacity: 0.8 }} />
    {children}
  </AbsoluteFill>
);

// Dos escenas que se pasan la cámara con el paneo vertical.
const DemoEscena: React.FC = () => {
  const t = useT();
  return (
    <Lienzo>
      <Escena t={t} a={0} b={1.5} sin>
        <Centro y={CY - 60}>
          <div style={{ width: 360, height: 360, borderRadius: 60, background: MARCA.pet }} />
        </Centro>
        <Centro y={CY + 220}>
          <Mono color={MARCA.tinta}>Escena uno</Mono>
        </Centro>
      </Escena>
      <Escena t={t} a={1.5} b={3} salida="nada">
        <Centro y={CY - 60}>
          <div style={{ width: 360, height: 360, borderRadius: "50%", background: MARCA.error }} />
        </Centro>
        <Centro y={CY + 220}>
          <Mono color={MARCA.tinta}>Escena dos</Mono>
        </Centro>
      </Escena>
    </Lienzo>
  );
};

const DemoBloque: React.FC = () => {
  const t = useT();
  return (
    <Lienzo>
      <Bloque t={t} a={0.2} b={2.8} color={MARCA.pet} grande="01" etiqueta="Primero" />
    </Lienzo>
  );
};

const DemoSubtitulos: React.FC = () => {
  const t = useT();
  return (
    <Lienzo>
      <Subtitulos t={t} palabras={palabras as Palabra[]} oscuro={false} top={CY - 60} />
    </Lienzo>
  );
};

const DemoMedidor: React.FC = () => {
  const t = useT();
  return (
    <Lienzo>
      <Centro y={CY - 20} style={{ transform: `scale(${1.15 - 0.15 * pe(t, 0, 1.3)}) rotate(${tiembla(t, 2.36, 0.6, 3)}deg)` }}>
        <Medidor t={t} />
      </Centro>
    </Lienzo>
  );
};

// El lápiz va dejando su trazo a mano.
const DemoLapiz: React.FC = () => {
  const t = useT();
  const k = pe(t, 0.2, 2.4, (x) => x);
  const punta = 140 + 760 * k;
  const yDe = (x: number) => CY + 13 * Math.sin(x * 0.016 * 10) + 6 * Math.sin(x * 0.047 * 10);
  const pts = Array.from({ length: Math.max(2, Math.round((punta - 140) / 5)) }, (_, i) => `${140 + i * 5},${yDe(140 + i * 5)}`).join(" ");
  return (
    <Lienzo>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <polyline points={pts} fill="none" stroke={MARCA.tinta} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={k > 0.005 ? 0.85 : 0} />
      </svg>
      <div style={{ position: "absolute", left: punta - 294, top: yDe(punta) - 33, width: 300, height: 66, transform: `rotate(${32 + Math.sin(t * 14) * 3}deg)`, transformOrigin: "294px 33px" }}>
        <Lapiz w={300} />
      </div>
    </Lienzo>
  );
};

// Lluvia de tickets que se apilan sobre una bandeja.
const DemoTicket: React.FC = () => {
  const t = useT();
  const tickets = Array.from({ length: 10 }, (_, i) => ({ en: 0.2 + i * 0.12, x: 140 + ((i * 197) % 620), rot: ((i * 37) % 50) - 25, y: 1000 - Math.floor(i / 4) * 90 - (i % 3) * 25 }));
  return (
    <Lienzo>
      {tickets.map((tk, i) => {
        if (t < tk.en) return null;
        const k = pe(t, tk.en, 0.42, acelera);
        return (
          <div key={i} style={{ position: "absolute", left: tk.x, top: -400 + (tk.y + 400) * k, transform: `rotate(${tk.rot + (1 - k) * 90}deg)` }}>
            <Ticket w={200} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 90, right: 90, top: 1300, height: 24, borderRadius: 12, background: MARCA.tinta }} />
    </Lienzo>
  );
};

// La fila del súper: el carrito entra rodando.
const DemoCarrito: React.FC = () => {
  const t = useT();
  const k = pe(t, 0.2, 1.2);
  return (
    <Lienzo>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", left: 80 + i * 170, top: 760 + Math.abs(Math.sin(t * 5 + i)) * -10, opacity: pe(t, 0.1 + i * 0.08, 0.3) }}>
          <Persona c={i === 1 ? MARCA.sec : MARCA.linea} s={1.1} />
        </div>
      ))}
      <div style={{ position: "absolute", left: 1100 - 520 * k, top: 820 }}>
        <Carrito giro={(1 - k) * 720} />
      </div>
    </Lienzo>
  );
};

const DemoPersona: React.FC = () => {
  const t = useT();
  return (
    <Lienzo>
      <Centro y={CY}>
        <div style={{ display: "flex", gap: 40, alignItems: "flex-end" }}>
          {[MARCA.linea, MARCA.sec, MARCA.pet, MARCA.linea].map((c, i) => (
            <div key={i} style={{ transform: `translateY(${(1 - sp(t, 0.2 + i * 0.12)) * 400}px)`, opacity: Math.min(1, sp(t, 0.2 + i * 0.12) * 2) }}>
              <Persona c={c} s={1.2} />
            </div>
          ))}
        </div>
      </Centro>
    </Lienzo>
  );
};

const DemoCheckOnda: React.FC = () => {
  const t = useT();
  return (
    <Lienzo>
      <Centro y={CY} style={{ transform: `scale(${sp(t, 0.3)})` }}>
        <Check k={pe(t, 0.45, 0.4)} size={300} />
      </Centro>
      <Onda t={t} en={0.5} r={240} />
      <Onda t={t} en={0.7} r={240} />
    </Lienzo>
  );
};

// Celular que sube con resorte y se llena de renglones.
const DemoCelular: React.FC = () => {
  const t = useT();
  const k = sp(t, 0.2, { damping: 14 });
  return (
    <Lienzo>
      <Centro y={CY} style={{ transform: `translateY(${(1 - k) * 900}px)` }}>
        <Celular w={470} h={920}>
          <div style={{ position: "absolute", left: 40, right: 40, top: 110, display: "flex", flexDirection: "column", gap: 22 }}>
            {[0.9, 0.6, 0.75, 0.5, 0.8].map((w, j) => (
              <div key={j} style={{ width: `${w * 100 * pe(t, 0.8 + j * 0.12, 0.5)}%`, height: 22, borderRadius: 11, background: MARCA.linea }} />
            ))}
          </div>
        </Celular>
      </Centro>
    </Lienzo>
  );
};

// Batería: las cargas se caen una por una.
const DemoBateria: React.FC = () => {
  const t = useT();
  const cargas = [2.4, 1.9, 1.5, 1.1];
  return (
    <Lienzo>
      <Centro y={CY} style={{ transform: `scale(${sp(t, 0.1)}) translateX(${tiembla(t, 2.4, 0.4, 12)}px)` }}>
        <Bateria t={t} cargas={cargas} roja={t > 2.4 ? 1 : 0} />
      </Centro>
    </Lienzo>
  );
};

// WhatsApp completo: se toca la app, se abre el chat, se teclea, sale el mensaje y la marca responde.
const DemoWhatsApp: React.FC = () => {
  const t = useT();
  const msg = "gasté 250 en el súper";
  const abre = pe(t, 0.9, 0.6, suave);
  const tecleoEn = 1.7;
  const enviadoEn = 2.9;
  const n = Math.round(Math.min(1, Math.max(0, (t - tecleoEn) / 0.95)) * msg.length);
  const enviado = t > enviadoEn;
  return (
    <Lienzo>
      <Centro y={CY - 60} style={{ transform: `scale(${0.9 + 0.1 * pe(t, 0, 0.8)})` }}>
        <Celular w={600} h={1180} pantalla="#24343B">
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 30% 20%, #3B5A66, ${MARCA.obs} 70%)` }}>
            <div style={{ position: "absolute", left: 44, top: 22, fontFamily: INTER, fontWeight: 600, fontSize: 24, color: "#fff" }}>9:41</div>
            <div style={{ position: "absolute", left: 44, right: 44, top: 140, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", rowGap: 46, justifyItems: "center" }}>
              {Array.from({ length: 16 }, (_, i) =>
                i === 9 ? (
                  <div key={i} style={{ transform: `scale(${sp(t, 0.15) * (t > 0.75 && t < 0.9 ? 0.88 : 1)})` }}>
                    <AppWA size={104} />
                  </div>
                ) : (
                  <div key={i} style={{ width: 104, height: 104, borderRadius: 24, background: "rgba(255,255,255,.14)" }} />
                ),
              )}
            </div>
          </div>
          <ChatWA
            t={t}
            abre={abre}
            tecleo={enviado ? "" : msg.slice(0, n)}
            tecleoEn={tecleoEn}
            enviado={enviado}
            enviadoEn={enviadoEn}
            escribiendo={t > enviadoEn + 0.05 && t < enviadoEn + 0.3}
            resp={sp(t, enviadoEn + 0.3)}
            respSale={0}
            mensaje={msg}
            respuesta={
              <>
                Listo, registré <b>$250</b> en Supermercado.
              </>
            }
          />
        </Celular>
      </Centro>
    </Lienzo>
  );
};

const DemoLogo: React.FC = () => {
  const t = useT();
  return (
    <Lienzo>
      <Centro y={CY - 80} style={{ transform: `scale(${sp(t, 0.2, { damping: 13 })})` }}>
        <LogoMarca size={320} entrada={[0, 1, 2].map((i) => pe(t, 0.3 + i * 0.07, 0.45))} />
      </Centro>
      <Centro y={CY + 190} style={{ opacity: pe(t, 0.5, 0.3), transform: `translateY(${(1 - pe(t, 0.5, 0.5)) * 30}px)` }}>
        <span style={{ fontFamily: INTER, fontWeight: 800, fontSize: 116, color: MARCA.tinta, letterSpacing: "-0.03em" }}>{MARCA.nombre}</span>
      </Centro>
    </Lienzo>
  );
};


const DemoCronometro: React.FC = () => {
  const t = useT();
  const v = t < 0.4 ? 0 : t < 2.2 ? t - 0.4 : t < 2.7 ? 1.8 * (1 - pe(t, 2.2, 0.5, suave)) : 0;
  return (
    <Lienzo>
      <Cronometro x={540} y={CY} k={1.3} valor={v} presion={t > 0.2 && t < 0.45 ? Math.sin((Math.PI * (t - 0.2)) / 0.25) : 0} listo={t >= 2.2 && t < 2.3 ? 0.1 : 0} />
    </Lienzo>
  );
};

const DemoAppGenerica: React.FC = () => {
  const t = useT();
  const T = { abre: 0.4, mas: 0.9, monto: 1.3, categoria: 1.8, cuenta: 2.2, guardar: 2.6 };
  const toques = Object.values(T);
  const i = toques.filter((x) => t >= x - 0.3).length;
  const p = i > 0 && i <= 6 ? Object.values(PUNTOS_APP)[i - 1] : { x: 600, y: 1300 };
  return (
    <Lienzo>
      <Centro y={180}>
        <ContadorToques t={t} toques={toques.map((x) => x + 0.2)} size={110} colorFin={MARCA.error} />
      </Centro>
      <div style={{ position: "absolute", left: 270, top: 420 }}>
        <Celular w={540} h={1100}>
          <AppGenerica t={t} toques={T} haciaWA={pe(t, 3.0, 0.5, suave)} />
        </Celular>
        <div style={{ position: "absolute", left: 16 + p.x, top: 16 + p.y }}>
          <Mano escala={0.9} presion={toques.some((x) => Math.abs(t - x) < 0.06) ? 1 : 0} />
        </div>
      </div>
    </Lienzo>
  );
};

const DemoWhatsAppOscuro: React.FC = () => {
  const t = useT();
  const msg = "gasté 250 en el súper";
  return (
    <Lienzo>
      <div style={{ position: "absolute", left: 270, top: 380 }}>
        <Celular w={540} h={1100}>
          <ChatWAOscuro
            t={t}
            tecleo={msg.slice(0, Math.max(0, Math.floor((t - 0.3) / 0.05)))}
            enviado={t >= 1.6}
            enviadoEn={1.6}
            leidoEn={1.9}
            escribiendo={t >= 2.0 && t < 3.0}
            puntos={pe(t, 2.0, 0.2) * (1 - pe(t, 2.95, 0.06))}
            resp={sp(t, 3.0)}
            mensaje={msg}
            respAlto={100}
            respuesta={
              <>
                Listo, registré <b>$250</b> en <i>Supermercado</i>
                <EmojiCarrito />
              </>
            }
          />
        </Celular>
      </div>
    </Lienzo>
  );
};

export const DEMOS_LIBRERIA: { id: string; comp: React.FC; segundos: number }[] = [
  { id: "escena-paneo", comp: DemoEscena, segundos: 3 },
  { id: "bloque-capitulo", comp: DemoBloque, segundos: 3 },
  { id: "subtitulos", comp: DemoSubtitulos, segundos: 4 },
  { id: "medidor", comp: DemoMedidor, segundos: 4 },
  { id: "lapiz", comp: DemoLapiz, segundos: 3 },
  { id: "ticket", comp: DemoTicket, segundos: 3 },
  { id: "carrito", comp: DemoCarrito, segundos: 3 },
  { id: "persona", comp: DemoPersona, segundos: 3 },
  { id: "check-onda", comp: DemoCheckOnda, segundos: 3 },
  { id: "celular", comp: DemoCelular, segundos: 3 },
  { id: "bateria", comp: DemoBateria, segundos: 3 },
  { id: "whatsapp-chat", comp: DemoWhatsApp, segundos: 5 },
  { id: "logo-marca", comp: DemoLogo, segundos: 3 },
  { id: "cronometro", comp: DemoCronometro, segundos: 3 },
  { id: "app-generica", comp: DemoAppGenerica, segundos: 4 },
  { id: "whatsapp-oscuro", comp: DemoWhatsAppOscuro, segundos: 4 },
];

