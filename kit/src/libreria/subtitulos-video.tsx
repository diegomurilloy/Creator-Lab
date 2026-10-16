// Subtítulos sobre video (cara a cámara): páginas de hasta 4 palabras, blancas con sombra y palabras clave con pop.
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palabra } from "./subtitulos";
import { C, FONT, SUBTITULO_Y, clamp, easeOut, sombraTexto } from "./tema";

export type SubtitulosVideoProps = {
  words: Palabra[];
  /** Palabras clave (color vivo de la marca, con pop). Se comparan sin acentos, mayúsculas ni puntuación. */
  keywords?: string[];
  /** Posición vertical como fracción de la altura (0.68 = debajo de la barbilla). */
  y?: number;
  maxWords?: number;
  fontSize?: number;
  /** Silencio (ms) a partir del cual se corta la página aunque no esté llena. */
  pauseMs?: number;
  /** Cuánto se queda la última página después de la última palabra. */
  tailMs?: number;
  /** Color de las palabras clave (por defecto, el vivo de la marca). */
  colorClave?: string;
};

const normaliza = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");

type Pagina = { words: Palabra[]; startMs: number; endMs: number };

export const paginar = (words: Palabra[], maxWords: number, pauseMs: number, tailMs: number) => {
  const paginas: Pagina[] = [];
  let actual: Palabra[] = [];
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const corte = actual.length >= maxWords || (prev && w.startMs - prev.endMs > pauseMs);
    if (corte && actual.length) {
      paginas.push({ words: actual, startMs: actual[0].startMs, endMs: 0 });
      actual = [];
    }
    actual.push(w);
  });
  if (actual.length) paginas.push({ words: actual, startMs: actual[0].startMs, endMs: 0 });
  // Cada página dura hasta que empieza la siguiente, salvo que haya un silencio largo.
  paginas.forEach((p, i) => {
    const ultima = p.words[p.words.length - 1].endMs;
    const siguiente = paginas[i + 1]?.startMs ?? Infinity;
    p.endMs = Math.min(siguiente, ultima + tailMs);
  });
  return paginas;
};

export const SubtitulosVideo: React.FC<SubtitulosVideoProps> = ({
  words,
  keywords = [],
  y = SUBTITULO_Y,
  maxWords = 4,
  fontSize = 64,
  pauseMs = 700,
  tailMs = 600,
  colorClave = C.cian,
}) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const ms = (frame / fps) * 1000;

  const paginas = useMemo(
    () => paginar(words, maxWords, pauseMs, tailMs),
    [words, maxWords, pauseMs, tailMs],
  );
  const claves = useMemo(() => new Set(keywords.map(normaliza)), [keywords]);

  const pagina = paginas.find((p) => ms >= p.startMs && ms < p.endMs);
  if (!pagina) return null;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: height * y,
          left: 60,
          right: 60,
          transform: "translateY(-50%)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: fontSize * 0.28,
          rowGap: fontSize * 0.08,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize,
          lineHeight: 1.1,
          textAlign: "center",
        }}
      >
        {pagina.words.map((w, i) => {
          // Todas las palabras reservan su lugar desde el inicio de la página: la línea no se recentra.
          const f0 = (w.startMs / 1000) * fps;
          const visible = frame >= f0;
          const aparece = interpolate(frame, [f0, f0 + 3], [0, 1], { ...clamp, easing: easeOut });
          const esClave = claves.has(normaliza(w.text));
          const pop = esClave ? interpolate(frame, [f0, f0 + 3, f0 + 6], [1, 1.15, 1], clamp) : 1;
          return (
            <span
              key={`${w.startMs}-${i}`}
              style={{
                display: "inline-block",
                color: esClave ? colorClave : C.blanco,
                textShadow: sombraTexto,
                opacity: visible ? aparece : 0,
                transform: `translateY(${(1 - aparece) * 8}px) scale(${pop})`,
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
