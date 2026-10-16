# Estilo con cara (talking head)

Sistema visual y de edición para reels a cámara. Todo lo que está aquí salió de revisar video por video una serie
real de reels y quedarse con lo que funcionó. Sirve para que cualquier persona (o Claude) edite un reel nuevo y se
vea de la misma familia. **El brief y los colores de la persona van en `personal/estilo-con-cara.md` y
`personal/paletas.md`, y mandan sobre este archivo** cuando no coinciden.

Herramientas: Claude Code + Remotion 4 (React/TypeScript), ffmpeg y faster-whisper. El kit es `kit` de
`personal/config.md` (o una copia de `kit/`). Los prompts de cada pieza (motion, edición y portada) pueden vivir en
la parrilla; hay ejemplos en `ejemplos/prompts-con-cara/`.

---

## 1. El brief (llénalo en `personal/estilo-con-cara.md`)

| | |
|---|---|
| **Para qué** | [qué cuentas y de qué negocio o proyecto; si algunas piezas salen también en otra cuenta] |
| **Dónde y formato** | Instagram Reels / TikTok, vertical 9:16, 1080×1920 a 30 fps. Portadas pensadas para la cuadrícula 3:4. Carruseles en 1080×1350. |
| **Quién lo ve** | [tu avatar, de `personal/marca.md`] |
| **Qué debe sentir en el primer segundo** | Intriga. Un gancho visual que se entiende sin audio, con una pregunta o una cifra que no te deja pasar de largo. |
| **Cómo se mueve** | Dinámico, 3D suave, con resortes. Algo cambia cada 2 a 3 segundos. |
| **Cómo suena** | Voz clara y pareja al frente. Efectos de sonido sutiles y solo cuando suman. |
| **Idioma** | El español de la persona, con acentos correctos. Nada de traducciones literales. |
| **Referencias** | [cuentas o videos que te gustan y qué tomas de cada una; p. ej. portadas de serie con cuadrícula, persona grande y UI recortada] |

---

## 2. Lo fijado (punto de partida probado)

### 2.1 Estructura del reel
- **Arranca exactamente en el gancho**, sin nada antes. Del cuadro 0 al segundo 1.5 va el texto del gancho en
  pantalla, en el tercio superior y sin tapar la cara. El primer cuadro ya tiene movimiento: nada de fade desde negro.
- **Overlays casi todo el video.** La cara sola con subtítulos no dura más de ~1 s, salvo el remate.
- **Tramos sin cara a pantalla completa** para los momentos de producto o de datos (fondo oscuro de la paleta con
  retícula que se mueve lento).
- **Momento wow entre el 50 y el 65 %** del video. Si la frase cae después, se reordena el corte antes que mover el
  gráfico (nunca mostrar una cifra antes de decirla).
- **Cierre que empata con el inicio**, para que el video se repita en bucle. CTA tipo «Mándaselo a…» con la hoja de
  compartir de Instagram en pantalla flotante.
- **Producto real:** la UI se calca del repo o de la app y se muestra un flujo simulado (p. ej. una reserva por
  WhatsApp que aparece en la agenda), mejor que pantallas quietas. El WhatsApp es una réplica con burbujas,
  palomitas, barra que teclea y formato real (*negritas*, _itálicas_, saltos).

### 2.2 Corte
- Se transcribe con timestamps (faster-whisper medium) y se corrige con el guion.
- Se quitan silencios de más de 0.3 s, muletillas y tomas repetidas. **Las pausas de ~0.2 s a media frase («se
  traba») también se cortan**, con salto de corte y cambio de punch para que no se note.
- Si la toma termina en seco, se **sostiene el último cuadro 0.4 s** con un fade de audio de 40 ms.
- El corte se arma en **un solo mp4 continuo** (ffmpeg trim/atrim + afade 8 ms + concat, `-g 30 -bf 0 -fps_mode cfr`).
  Nunca saltar por tramos dentro de Remotion: repite cuadros.
- Antes de entregar se verifica con `mpdecimate` que no haya cuadros repetidos.

### 2.3 Cámara y color
- **Punch-in alternado** fuerte, como un cambio de cámara: escalas 1 · 1.16 · 1 · 1.28.
- **Empuje lento** (+3.5 %) dentro de cada tramo con cara, para que nunca se sienta quieto.
- **Acercamiento lento y sacudida** en la palabra emocional.
- **Etalonaje «suave»:** una curva de tonos que baja las altas luces y calienta muy poco, más una viñeta tenue. Se ve
  como mejor luz, no como filtro.

### 2.4 Tipografía y color en video
- Una sola familia sans para todo (la de `personal/paletas.md`; si no hay, Outfit).
- Paneles e informativos sobre **fondo oscuro** de la paleta. El texto gris o delgado sobre una pared clara no se lee.
- **Un acento vivo** para palabra clave y subtítulos, y un rojo solo para errores.
- **Subtítulos** palabra por palabra, debajo de la barbilla (y ≈ 0.68 de la altura), con la palabra clave en el acento.
- **Zona segura de Reels:** x 140–950, y 260–1640. Nada importante arriba de y ≈ 260.

### 2.5 Motion «pro» (utilidades del kit)
- **Vidrio oscuro:** degradado translúcido del color oscuro de la paleta, borde de luz arriba, sombra profunda y
  brillo del color de acento.
- **Entrada 3D con resorte:** el panel se inclina hacia atrás, sube, rebota un poco y se enfoca.
- **Texto palabra por palabra** con resorte; las palabras clave van en el acento.
- **Íconos rellenos SVG** (robot, chip, escudo, candado, moneda, tienda, cartera, calendario…). Nunca emojis ni íconos de línea.
- **Transición a pantalla completa:** zoom-blur desde 118 % con un barrido de luz.
- **Monedas 3D, contadores que ruedan tipo tragamonedas, flechas con paquetes que viajan y dejan estela.**
- **Pantalla flotante:** el video se encoge a una tarjeta redondeada sobre fondo de color para que la UI viva encima.
- **Celular con chat:** la pantalla es 9:16 exacta y adentro va el mismo chat de pantalla completa, para que el zoom aterrice continuo.

### 2.5b Movimiento premium (lo que ganó en una ronda de Style Lab)
- **Curvas:** salida expo larga (`cubic-bezier(.16,1,.3,1)`, 0.5–0.8 s) y entrada/salida suave (`.65,0,.35,1`) para
  traslados. Rebote solo donde hay un impacto real.
- **Texto con máscara, por palabra:** cada palabra sube desde abajo de su propio borde, 70 ms entre palabras y 0.62 s
  por palabra, con desenfoque de movimiento vertical mientras sube (`TextoMascara`). Las palabras se van hacia arriba
  por la misma máscara. Excepción: el gancho del cuadro 0 se ve completo desde el primer cuadro.
- **Encadenado:**
  - **Pila que empuja:** cada pieza nueva entra por abajo y sube a las anteriores un escalón, que se atenúan un poco (`pila()`).
  - **Cadena de palomitas:** cada palomita, al cerrarse, saca el siguiente renglón desde su máscara.
- **Transformaciones** (helper `morph()`):
  - una pastilla que se abre en panel;
  - un ícono que crece y se vuelve la ventana (el ícono queda de avatar);
  - un número que se encoge y viaja a ser título;
  - una hoja que se separa en tarjetas.
- **Sin sacudidas decorativas** en tarjetas ni pastillas: las pastillas se abren de izquierda a derecha con su texto en máscara.

### 2.6 Audio
- Remotion renderiza **sin audio**. La voz sale del corte y se procesa aparte con ffmpeg (`referencias/audio.md`).
- **Primero se mide.** Las bandas de la voz se comparan contra la toma de referencia aprobada y el nivel se mide por tramo.
- **Nivel parejo (estabilizar):** un «vocal rider» (`scripts/rider.py`) ajusta la ganancia frase por frase (±6 dB)
  solo donde hay voz, así las pausas no suben. Nada de dynaudnorm ni speechnorm: suben el ruido de fondo 6–9 dB.
- **Cadena ligera** (`scripts/cadena-voz.txt`): pasa-altos 80 Hz, reducción de ruido neutra (`afftdn nr=14 nf=-48`),
  menos lodo en ~700 Hz, de-esser suave, compresor 2.5:1 y limitador.
- **Loudness: −14 LUFS** en dos pasadas, lineal, con pico verdadero ≤ −1.5 dB. Siempre se verifica el resultado.
- **Metas:** variación entre tramos menor a 2.5 dB y relación señal/ruido en las pausas mayor a 30 dB.
- **Efectos de sonido:** sintetizados en `public/sfx` del kit, con volumen final entre 0.08 y 0.2. Por defecto el reel
  va sin efectos, salvo que se pidan.

### 2.7 Portadas (estilo serie)
- **Fondo claro** con cuadrícula de cuaderno visible de 54 px. Es la misma línea que los carruseles.
- **Arriba, el nombre de la serie** en minúsculas, black, enorme y en dos renglones, con el color de la serie. Debajo «EPISODIO 01».
- **El gancho en tinta:** primero la parte chica en semibold y luego la grande en black. Debajo, la línea de tensión en gris.
- **La persona grande**, desde la mitad hacia abajo (se sale por abajo), recortada con borde blanco tipo sticker y sombra suave.
- **La cara siempre SONRIENDO:** sonrisa natural con dientes y ojos abiertos. Las caras neutras o serias se ven
  extrañas aunque el tema sea serio; el tono lo pone el texto. El cuadro se busca en una hoja densa (cada 0.1 s) del
  inicio o el final de la toma.
- **1 o 2 piezas de UI real** del mismo reel, **recortadas a su forma** (nunca un recuadro blanco con fondo). Una va
  **detrás de la persona**, asomándose por un lado sin chocar con el texto; la otra al frente, abajo, sin tapar la cara
  ni la boca. Opcionalmente, un objeto 3D suave al lado de la cabeza.
- **Recorte de la persona:** BiRefNet retrato en local (`scripts/recorta.py birefnet-portrait` + `scripts/sticker.py`). El modelo general agarra la silla.
- **Todo lo importante dentro de la banda 3:4** (y 240–1680).
- **Color por serie:** una tabla Serie | Color en `personal/paletas.md`. Un acento claro que no se lee sobre el fondo no va como texto.

### 2.8 Carruseles
- 1080×1350, mismo fondo y tinta que las portadas, color de la serie o de la marca para lo clave.
- Abren con una línea chica de contexto («Lo que nadie te cuenta de…») sobre un titular grande con la parte clave en
  color, y llevan tarjetas blancas de UI. Detalle en `modos/carrusel.md`.

### 2.9 Flujo de trabajo
- Cada pieza tiene su carpeta «AAAA-MM-DD HHMM ID - Pieza» con `toma.mp4`, `clips/`, `pantallas/`, `motion/timestamps.json` y la portada.
- Dos prompts por reel: primero el motion y luego la edición (`ejemplos/prompts-con-cara/`). La portada tiene su propio prompt.
- **Datos:** solo números verificados. Si falta uno, se deja un marcador [DATO] visible o no se muestra, nunca se
  inventa. Los montos de muestra valen cuando la UI calca el producto real.
- **Entregables:** `final vN.mp4` (CRF 20, faststart) y `final vN MASTER.mp4`. Nunca se sobreescribe: cada cambio es
  una versión nueva, y las viejas se borran cuando la persona aprueba.
- **Revisión:** antes del render final se muestran capturas del gancho, una escena media, el wow y el cierre.

---

## 3. Lo rechazado

Está en `referencias/rechazados.md` (lo que aplica a cualquiera) y en `personal/rechazados.md` (lo de la persona).

---

## 4. Preguntas abiertas (para tu primera ronda)

- ¿Los efectos de sonido van por defecto o solo cuando se piden?
- ¿Máscara por renglón en titulares largos? (quedó en «Maybe» la primera vez que se probó).
- Si grabas una foto con sonrisa en cada sesión, las portadas quedan más nítidas que con un cuadro del video.
