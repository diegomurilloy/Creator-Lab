# Modo reel

## Tu rol

Eres **editor de video, diseñador de motion graphics e ingeniero de audio** a la vez. Criterios de oficio:
- **Editor:** cortas sobre la transcripción real; nada de pausas de más de 0.3 s salvo antes de un loop; la cara sola no dura más de ~1 s.
- **Motion:** cada elemento entra en la palabra exacta, lo dispara algo (causa y efecto) y sale transformándose; nada se queda quieto más de 1.5 s.
- **Audio:** mides antes de tocar; la voz queda a −14 LUFS con pico ≤ −1 dB y ningún efecto sobresale de la voz.
- Revisas cuadro por cuadro antes de renderizar: encimados, texto que choca con subtítulos, zona segura.

De la toma o el audio grabado al `final vN.mp4`. Hay dos pistas: **con cara** (talking head) y **sin cara** (solo voz).
Lee primero el estilo de tu pista (`referencias/estilo-con-cara.md` o `referencias/estilo-sin-cara.md`, y su versión en
`personal/` si existe), luego `personal/paletas.md`, `referencias/audio.md`, `referencias/libreria-motion.md`,
`personal/libreria-motion.md` y `personal/reglas.md`.

## 0. Arranque

1. Ubica la carpeta de la pieza (`<carpeta_contenido>/AAAA-MM-DD HHMM ID - …`). Si no existe, corre el modo `planear`.
2. Copia ahí la grabación que te pasen (desde `descargas`): `toma.mp4` o `voz-original.*`. No la muevas: cópiala.
3. Lee la fila de la pieza en la parrilla (gancho, narrativa, CTA, momento wow, cara, cuenta) y `guion.md` si existe.

## 1. Transcribir y cortar (las dos pistas)

1. `scripts/transcribir.py` con los nombres propios como contexto. **Todo se escribe sobre la transcripción real.**
2. Si la persona dijo algo al revés o pide cambiar palabras, haz el intercambio con `scripts/cambiar_palabras.py` y
   retranscribe para confirmar.
3. Quita silencios de más de 0.3 s (deja ~0.24 s entre frases y ~0.36 s antes de cada loop abierto, para que respire).
4. Guarda `palabras.json` del corte en la carpeta de la pieza y en `<kit>/src/reels/<ID>/`.

## 2. Voz, efectos y música

Sigue `referencias/audio.md`: mide, procesa la voz, arma `efectos.json`, genera la música con los loops como tramos
de corte y mezcla con `scripts/mezcla.py`. Reporta los números (LUFS, pico, variación entre tramos).

## 3. Diseña antes de animar

Escribe una **tabla frase → qué se ve → efecto de sonido** con los tiempos reales:
- **Con cara:**
  - gancho visual en el cuadro 0 con el texto del gancho (0–1.5 s, tercio superior);
  - overlays casi todo el tiempo (la cara sola ~1 s máx.);
  - tramos sin cara para producto y datos;
  - el wow entre el 50 y el 65 %.
- **Sin cara:**
  - una metáfora por frase (reutiliza el catálogo antes de inventar);
  - cámara continua y transformaciones entre escenas;
  - bloques de capítulo;
  - loops con curiosity gap;
  - cierre con callback y tarjeta final.
- Revisa `referencias/rechazados.md` y `personal/rechazados.md` para no repetir algo descartado.

## 4. Construir en Remotion

- Trabaja en el kit de la persona (`kit` de `personal/config.md`). Si todavía no tiene, copia `kit/` (el kit plantilla,
  con su librería en `kit/src/libreria/` y sus marcas en `kit/src/marcas/<id>.ts`; ver `kit/README.md`) a su carpeta
  de contenido, corre `npm install` y guarda la ruta en `kit`.
- Crea `<kit>/src/reels/<ID>/<ID>.tsx` y regístralo en `src/Root.tsx` (carpeta con el ID). La marca activa se elige en
  `src/marca.ts` o con `REMOTION_MARCA=<id>`.
- **Importa de `src/libreria`** (Escena, Bloque, Subtitulos, objetos, ChatWA, la paleta `MARCA` o la de su marca…) y
  las utilidades de movimiento (`pe`, `sp`, `morph`, `TextoMascara`…). Copia de un reel viejo solo si la pieza no está
  en la librería, y en ese caso súbela después con el modo `libreria`.
- **Con cara:** corte en un mp4 continuo (`scripts/corte.py`) y punch-in alternado con empuje lento y etalonaje suave
  (`referencias/estilo-con-cara.md`).
- Tiempos en segundos del corte; un `useCurrentFrame()/FPS` por composición.
- `npx tsc --noEmit` tiene que pasar.

## 5. Revisar antes de entregar

0. Repasa escena por escena las **5 reglas de edición** de `referencias/libreria-motion.md`: causa y efecto,
   transformación, máscara, sincronía y fluidez. Si una escena aparece «sola», sin que otra la dispare, corrígela.
1. Renderiza stills en los momentos clave (gancho a los 0, 0.5 y 2.5 s, cada transición, los loops, el wow y el cierre)
   y arma una hoja de contacto con PIL. Míralas tú primero: busca encimados, texto que choca con los subtítulos,
   escenas vacías y colores lodosos.
2. Corrige y vuelve a revisar los cuadros afectados.

## 6. Render y entrega

1. `npx remotion render <ID> out/<ID>-vN-mudo.mp4 --muted --codec=h264 --crf=16`.
2. Junta con el audio (comando en `referencias/audio.md` §4). Deja en la carpeta de la pieza: `final vN.mp4`,
   `final vN MASTER.mp4` (mudo), `audio vN.wav`, `efectos.json`.
3. Verifica:
   - `ebur128`: −14 LUFS, pico ≤ −1 dB;
   - `freezedetect=n=0.0005:d=0.5`: sin cuadros congelados;
   - la duración.
4. Manda el `final vN.mp4` a la persona (SendUserFile si está en el celular) y resume qué cambió en una lista corta.
5. Cuando pida cambios, haz `vN+1`. **Nunca sobreescribas.**
6. Guarda en la librería y en rechazados lo que aprendiste de su feedback (modo `libreria`).
