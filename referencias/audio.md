# Audio: voz, efectos, música y mezcla

Remotion renderiza **mudo**. El audio se arma aparte y se junta al final. Mide antes de tocar.

## 1. Voz

1. **Transcribe:** `python scripts/transcribir.py toma.mp4 palabras.json medium "MiMarca, WhatsApp"`. Revisa números y nombres contra el guion.
2. **Corte:**
   - **Con video:** `python scripts/corte.py toma.mp4 tramos.json corte.mp4 [sostener=0.4]` (redondea a cuadros de 33 ms). Quita silencios de más de 0.3 s, muletillas, repeticiones y pausas de ~0.2 s a media frase.
   - **Cambiar palabras de lugar** (p. ej. «nadie casi» → «casi nadie»): `python scripts/cambiar_palabras.py audio.wav tramos.json salida.wav`, a precisión de muestra. Para encontrar los límites:
     - energía en ventanas de 10 ms: los cierres de oclusivas, como la «k», son el corte limpio;
     - bandas: F2 alto de 1.8–3 kHz = «i»; fricción de 4–9 kHz = «s»;
     - **retranscribe siempre** para confirmar que no quedó una sílaba suelta.
3. **Mide:**
   - `python scripts/medir_voz.py espectro corte.wav` contra la referencia aprobada de la persona (la toma que más le gustó; guárdala en `personal/reglas.md`). Punto de partida que funcionó: 150–400 Hz vs 3–6 kHz ≈ 28; vs 6–12 kHz ≈ 34–35.
   - `medir_voz.py tramos`: si un tramo está más de 3 dB abajo, ahí está el «se escucha raro».
4. **Procesa:** `python scripts/procesar_voz.py corte.wav voz.wav [cadena.txt] [efectos.json]`. Hace rider por frase (umbral relativo al piso de ruido), cadena, efectos opcionales y −14 LUFS en dos pasadas.
   - Cadena: `scripts/cadena-voz.txt` (general). Ajusta el EQ solo si las bandas se alejan de la referencia. Ejemplos:
     - toma brillante: `equalizer=f=4200:t=q:w=1:g=-1.5`;
     - toma apagada: +7 dB en 3.2 kHz y highshelf +3.5.
   - Nunca uses dynaudnorm, speechnorm ni `afftdn nf=-32`.
5. **Verifica:**
   - `medir_voz.py ruido original procesado`: SNR en pausas > 30 dB y variación entre tramos < 2.5 dB.
   - Si el corte es muy apretado, compara el piso (percentil 10) contra la toma original.

## 2. Efectos de sonido

Propios, sintetizados con numpy, en `public/sfx` del kit (`kit/public/sfx` o el `sfx` de `personal/config.md`; catálogo con rutas relativas y duraciones: `referencias/sound-library.json`). Se publican con el repo: no son muestras de terceros.

| Grupo | Archivos |
|---|---|
| clicks y UI | ding, enviar, pop, recibir, tic, tecla |
| foley | borrador, moneda, papel, reloj |
| impactos | golpe |
| whooshes | whoosh |

- Se listan en `efectos.json` como `[{ "archivo": "…/sfx/pop.wav", "en": 2.85, "volumen": 0.12 }]`, en segundos del corte, y se mezclan con `procesar_voz.py`.
- Volumen de 0.05 a 0.2.
- Con cara: solo cuando suman. Sin cara: en cada entrada, paneo (whoosh) e impacto.

## 3. Música

`python scripts/musica.py voz.wav musica.wav duracion "ini:fin,ini:fin" [bpm=104]`

- Sintetizada, sin derechos: groove editorial con kick, clap, hats, acordes tipo Rhodes y arpegio.
- Los tramos son los loops abiertos: ahí se apaga (queda un drone y un riser) y regresa con golpe y crash.
- Sidechain con la voz (−5 dB cuando hablas). Sale a −20 LUFS aprox.
- Si a la persona no le late, se entrega el MASTER mudo + `voz` para que ponga un audio de tendencia en Instagram.

## 4. Mezcla final

`python scripts/mezcla.py voz_con_efectos.wav musica.wav audio.wav [musica_db=-6.5]`

- Pone la música 6.5 dB bajo su nivel, junta y lleva el total a −14 LUFS con ganancia fija.
- Limita con `alimiter=limit=0.84:level=false` y verifica. **Ojo:** `alimiter` trae `level=true` (reajuste automático), que sube el volumen después de normalizar.
- Junta con el video mudo: `ffmpeg -i mudo.mp4 -i audio.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "final vN.mp4"`.

## Efectos que no tapan la voz

Los efectos largos o de roce (lápiz, goma, raspado) van bajitos: unos 10–12 dB abajo de un pop. Un borrado de goma a volumen de pop tapa la frase. Ningún efecto debe sobresalir de la voz.
