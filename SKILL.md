---
name: creator-lab
description: "Creator Lab: sistema completo de contenido de marca personal y de producto para cualquier creador. Arranca con un onboarding guiado que define tu marca («Tú eres el nicho»), tus colores y tu parrilla, y después planea piezas, reescribe guiones con estructura viral y voz humana, produce reels con y sin cara en Remotion (corte, voz, música, motion graphics, subtítulos), portadas estilo serie, carruseles animados, rondas de Style Lab, auditorías, análisis de virales, insights de métricas y una librería de motion que crece con cada pieza. Todo se personaliza con lenguaje natural y explica cada decisión. Invocar cuando la persona pida hacer, editar, revisar o planear un reel, carrusel, portada, guion o pieza de su parrilla, cuando pregunte qué está funcionando o pida insights, cuando quiera cambiar su marca, colores, ganchos o reglas, o cuando diga /creator-lab."
user-invocable: true
argument-hint: "[marca|personalizar|panel|planear|reel|portada|carrusel|ronda|libreria|auditoria|analizar|insights|lanzamiento] [ID o fecha]"
---

# Creator Lab

Sistema de producción de contenido para **una persona y sus marcas**. Todo lo de esta carpeta (rutas relativas a la
raíz de `creator-lab/`) es la única fuente de verdad: si algo cambia, se cambia aquí.

## Dos capas: el motor y lo tuyo

| Capa | Dónde | Qué tiene | Quién la cambia |
|---|---|---|---|
| **Motor** (público, se actualiza con `git pull`) | `modos/`, `referencias/`, `plantillas/`, `scripts/`, `kit/` | cómo se hace cada cosa, reglas de oficio, catálogo del kit, herramientas | el repo |
| **Lo de la persona** (git lo ignora) | `personal/` | su config, marca, paletas, parrilla, ganchos, librería, rechazados, aprendizajes, preferencias, reglas propias, marcas, virales | la persona (y tú, con su confirmación) |

Reglas de lectura:
1. **Lo de la persona sale de `personal/`; lo genérico, del repo.** Nunca escribas datos de la persona en el motor
   (nombres, marcas, productos, cuentas, montos, rutas, ligas): al motor solo sube la versión genérica de un
   aprendizaje (ver «El sistema aprende en dos capas»).
2. **Si un archivo existe en los dos lados, léelos los dos** (`referencias/ganchos.md` + `personal/ganchos.md`,
   `referencias/libreria-motion.md` + `personal/libreria-motion.md`, `referencias/rechazados.md` + `personal/rechazados.md`,
   `referencias/estilo-*.md` + `personal/estilo-*.md` si existe). Si se contradicen, **manda `personal/`**.
3. Antes de trabajar en cualquier modo, lee `personal/reglas.md` si existe: ahí están las reglas propias de la persona.

## El sistema aprende en dos capas

**Quién puede tocar el motor:** solo quien mantiene Creator Lab (`mantenedor: si` en `personal/config.md`). Para
cualquier otra persona, **las dos capas viven en su propio `personal/`**: la versión genérica va a
`personal/motor-local/` (mismo nombre de archivo que en el motor, p. ej. `personal/motor-local/rechazados.md`) y se
lee junto con el motor como cualquier archivo de `personal/`. Así nunca se edita, commitea ni sube nada al repo, `git
pull` no choca con sus cambios y lo de cada quien se queda en su Creator Lab. Sin `mantenedor: si`, **nunca** edites
`modos/`, `referencias/`, `plantillas/`, `scripts/` ni `kit/`, ni hagas `git commit` o `git push` en la carpeta de la skill.

Todo lo que se aprende al hacer contenido (guiones, reels, edición, carruseles, portadas, lanzamientos, series,
parrilla) se guarda **el mismo día, en dos capas**:

| Capa | Dónde | Cómo se escribe |
|---|---|---|
| **La versión de la persona** | el archivo de `personal/` que toque: `preferencias-guion.md`, `rechazados.md`, `aprendizajes.md`, `libreria-motion.md`, `reglas.md`, `virales/<lote>/patron.md` | con sus nombres, sus marcas, sus piezas y sus ejemplos |
| **La versión genérica** | el archivo del motor que toque: `referencias/rechazados.md`, `referencias/estilo-*.md`, `referencias/libreria-motion.md`, `referencias/voz-humana.md`, `referencias/series.md`, `modos/lanzamiento.md`, `modos/planear.md`, el modo del oficio | sin datos de nadie: ni nombres, ni marcas, ni cuentas, ni montos, ni rutas; los ejemplos van genéricos («tu producto», «una app de finanzas») |

- La versión genérica se escribe **solo si le sirve a cualquier creador**. Si es un gusto de la persona («no me gusta
  el ámbar»), se queda en `personal/`; si es oficio («el texto desenfocado en reposo no se lee»), sube al motor.
- Avísale a la persona en una línea: «Lo guardé en tus rechazados y, en versión genérica, en `referencias/rechazados.md`».
- Antes de dejar un cambio en el motor, búscale nombres propios, cuentas, montos, rutas y ligas (`git diff`): si
  aparece uno, se generaliza o se queda en `personal/`.
- **Revisión de motor al cerrar cada entrega:** pregúntate «¿qué de lo aprendido hoy le sirve a cualquiera?». Lo que
  sí, se escribe en el motor en versión genérica antes de cerrar (y se avisa en una línea); si no hubo nada, no se dice.

## Rutas: `personal/config.md`

Lee `personal/config.md` **al abrir la skill**. Ahí están (bloque `clave: valor`):

| Clave | Qué es | Lo usa |
|---|---|---|
| `nombre`, `usuario` | nombre y usuario principal | panel, footers, portadas |
| `marcas`, `marca_principal` | marcas de la persona (`clave=Nombre`) | separación por marca, panel |
| `carpeta_contenido` | una carpeta por pieza: `AAAA-MM-DD HHMM ID - Pieza` | planear, reel, carrusel, `nueva_pieza.py` |
| `kit` | su proyecto de Remotion (puede ser una copia de `kit/`) | reel, portada, ronda, librería |
| `sfx` | efectos de sonido (por defecto `<kit>/public/sfx`) | audio, `post_ronda.py` |
| `descargas` | de dónde pasa sus tomas y referencias | reel, analizar |
| `sheets_id`, `sheets_nombre` | su parrilla en Google Sheets | planear, insights, portada |
| `quien_hace`, `parrilla_anio`, `parrilla_mes_corte` | qué filas son suyas y cómo leer fechas | `nueva_pieza.py` |
| `panel_url`, `stylelab_url` | sus páginas (artifacts) | panel, ronda |

Los scripts leen la misma config con `scripts/config.py` o reciben la ruta por argumento. Marca visual por marca
(logo, colores, fuentes extraídos de su página): `personal/marcas/<marca>/` (`scripts/extraer_marca.py`).

## Onboarding guiado (siempre, al abrir la skill)

1. **¿Existe `personal/config.md` y `personal/marca.md` con Mensaje, Pilares, Avatar y Ancla llenos (sin [POR CONFIRMAR])?**
   Si no, corre el modo `marca` **antes de generar cualquier contenido**, aunque la persona haya pedido otra cosa.
   Dile en una línea por qué: «primero definimos tu marca, así todo lo que creemos suena a ti».
2. El onboarding crea `personal/` copiando `plantillas/` (`config.ejemplo.md` → `config.md`, `marca.md`,
   `paletas.md`, `parrilla.md`, `ganchos.md`, `libreria-motion.md`, `rechazados.md`, `aprendizajes.md`,
   `preferencias-guion.md`, `reglas.md`) y los llena con la persona **paso a paso**: explica qué va a hacer, pregunta
   de una en una (o en tandas cortas), muestra lo que entendió y pide confirmación antes de guardar. Al final resume
   qué quedó configurado y sugiere la primera pieza. El guion completo está en `modos/marca.md`.
3. Con el perfil validado, léelo siempre primero. Cada idea, guion, reel o carrusel se revisa contra él: pilar,
   avatar, historia, ancla, lado humano y voz.
4. Al escribir ganchos, usa `referencias/ganchos.md` + `personal/ganchos.md`. Antes de planear o proponer, revisa
   `personal/aprendizajes.md`. Antes de escribir cualquier guion o texto, lee `personal/preferencias-guion.md`.
5. Si la persona dice «sincroniza» o menciona cambios en su panel, corre la sincronización de `modos/panel.md` antes de crear.

**Separación por marca:** librería, marca visual, inspiración e ideas son de cada marca (campo `marca`: la clave de
`marcas` en la config, o «todas»); ganchos, perfil, reglas, aprendizajes y cultura se comparten (`modos/panel.md`).

## Actualizar Creator Lab (sola, al abrir, o con «actualiza Creator Lab»)

**Al abrir la skill** (una vez por sesión), revisa en silencio si hay versión nueva: `git fetch` en la carpeta de la
skill y compara con `origin/main`. Si hay commits nuevos:
1. Si el motor no tiene cambios locales (`git status` limpio fuera de `personal/`), actualiza sola con `git pull --ff-only`
   y dilo en una línea. Si hay cambios locales en el motor o el pull no es directo, pregunta antes y no pises nada.
2. **Página de novedades:** corre `python scripts/novedades.py <scratchpad>/novedades.html --desde <ultima_actualizacion>`
   (la fecha sale de `personal/config.md`; si no existe, sin `--desde`) y publícala como artifact. Si la config ya
   trae `novedades_url`, actualiza ese mismo artifact (pasa su `url`); si no, crea uno y guarda su liga en
   `novedades_url`. Dale a la persona la liga y un resumen de 2–3 líneas de lo más útil para ella.
3. Guarda en `personal/config.md` `ultima_actualizacion: <fecha de la entrada más nueva de NOVEDADES.md>`.
4. Si cambiaron `plantillas/`, compara con su `personal/` y ofrece agregar los campos nuevos (sin pisar nada). Si cambió
   `requirements.txt` o `kit/package.json`, ofrece reinstalar dependencias.
5. `personal/` nunca se toca. Si no es un repo de git (se instaló por ZIP), explícalo y ofrece reinstalar con `git clone`.

**Quien mantiene la skill** (`mantenedor: si`): cada cambio que se sube al repo lleva su entrada en `NOVEDADES.md`
(fecha · título y viñetas en lenguaje simple: qué es nuevo y para qué le sirve a la persona), en el mismo commit.

## Tus artifacts de Creator Lab

Cada artifact que crea la skill (panel, Style Lab, guías, docs de guiones, novedades, vistas previas) se anota en
`personal/artifacts.md` (título · liga · para qué es · fecha). Si la persona tiene un índice propio de artifacts
(`indice_artifacts_url` en la config), regístralo también ahí, en su sección «Creator Lab». Así nunca se pierden.

## Inspiración antes de crear

Antes de escribir un guion o armar un video nuevo (reel, serie, lanzamiento), pregunta **una vez** si hay inspiración:
«¿Tienes algún video de referencia? Pásame la ruta de la carpeta (tus descargas u otra), o descríbemelo: qué te
gustó, el ritmo, el estilo». Si hay videos, córrelos por `modos/analizar.md` y usa su ficha como base, sin copiar
texto, imágenes ni marcas. Si no hay, sigue con la librería y el estilo de la cuenta. No lo vuelvas a preguntar en
cada pieza de una serie que ya tiene referencia.

## Modos

Lee el archivo del modo ANTES de trabajar. Si la persona no dice el modo, dedúcelo de lo que pide.
**En cada modo actúas como el experto de ese oficio** (bloque «Tu rol» al inicio de cada modo) y aplicas sus criterios.

| Modo | Cuándo | Archivo |
|---|---|---|
| `marca` | **onboarding**: primera vez, perfil incompleto, o afinar la marca con «Tú eres el nicho» | `modos/marca.md` |
| `personalizar` | «cambia mi color de acento», «agrega mi marca X», «quita esta regla», «cambia mis pilares», «sube mi logo»… | `modos/personalizar.md` |
| `panel` | crear la página editable de la persona, o «sincroniza Creator Lab» (pasar sus ediciones a `personal/`) | `modos/panel.md` |
| `planear` | «planea P04», «reescribe los guiones», «crea las carpetas», cambios de fechas en la parrilla, series, armar o reacomodar la semana | `modos/planear.md` |
| `reel` | hay audio o toma grabada y hay que editar (con cara o sin cara) | `modos/reel.md` |
| `portada` | portada de un reel | `modos/portada.md` |
| `carrusel` | carruseles animados 1080×1350 (MP4 por lámina + PNG + PDF + preview) | `modos/carrusel.md` |
| `ronda` | probar opciones de estilo, bitácora de ideas, «haz una ronda» / «done» | `modos/ronda.md` |
| `libreria` | un elemento nuevo funcionó, o la persona pide guardarlo | `modos/libreria.md` |
| `auditoria` | revisar reels o portadas terminados | `modos/auditoria.md` |
| `analizar` | analizar videos virales o del nicho y replicar su estructura | `modos/analizar.md` |
| `insights` | «¿qué está funcionando?», «dame insights», revisión semanal o mensual con las métricas reales | `modos/insights.md` |
| `lanzamiento` | video de lanzamiento de un producto o función: launch, demo de capacidades, anuncio | `modos/lanzamiento.md` |

## Referencias (se leen según el modo)

- `personal/paletas.md`: colores y tipografías de cada cuenta. **Siempre** antes de elegir un color.
- `referencias/framework-nicho.md`: el fondo del contenido personal (qué / a quién / por qué + ancla).
- `referencias/voz-humana.md`: cómo suena una persona y no una IA. **Siempre** antes de entregar un guion o un texto.
- `referencias/conexion-cultural.md`: comerciales que no se sienten comerciales. **Siempre** en piezas de producto y lanzamientos.
- `referencias/storytelling.md`: guionista y copywriter: pulir el borrador de la persona, que siempre enseñe algo, cierres y recursos descargables. **Siempre** antes de escribir o mejorar un guion.
- `referencias/estructura-viral.md`: gancho, lead, cuerpos, loops y CTA, con tiempos.
- `referencias/series.md`: series de episodios («Día N de M»): estructura, ritmo y reglas de la meta fija.
- `referencias/ganchos.md` (+ `personal/ganchos.md`): fórmulas G# con el crédito de cada cuenta de referencia.
- `referencias/estilo-con-cara.md`: reels talking head (corte, cámara, subtítulos, motion «pro», audio, portadas).
- `referencias/estilo-sin-cara.md`: reels cinéticos solo voz (mundo continuo, bloques, loops, cierre).
- `referencias/libreria-motion.md` (+ `personal/libreria-motion.md`): reglas de edición y catálogo del kit.
- `referencias/audio.md`: voz, efectos, música y mezcla.
- `personal/parrilla.md` (si no existe, `plantillas/parrilla.md`): pestañas, columnas y reglas de escritura del Sheets.
- `referencias/rechazados.md` + `personal/rechazados.md`: lo que ya se descartó y por qué. No volver a proponerlo.
- `personal/aprendizajes.md`: bitácora de lo que ya se aprendió (pruebas, resultados reales y lecciones).

## Reglas que aplican a todo

1. **Español del país de la persona** (por defecto, mexicano) en todo lo que ve la gente: tuteo si así habla,
   acentos correctos, nada de traducciones literales.
2. **Nunca inventes datos.** Cifras, testimonios y montos solo si la persona los dice o son de la UI real. Si falta
   uno, pon `[DATO]` o no lo muestres.
3. **Se trabaja sobre la transcripción real**, no sobre el guion: lo que se dijo manda.
4. **Nunca sobreescribas un entregable.** Cada cambio es una versión nueva (`final vN.mp4`). Las viejas se borran
   solo cuando la persona lo dice, y con rutas literales.
5. **Muestra antes de entregar:** hoja de capturas de cada escena antes del render final, y verifica el audio
   (−14 LUFS, pico ≤ −1 dB) y que no haya cuadros congelados (`freezedetect`).
6. **Un reel no es un carrusel.** Lo visual complementa al audio (metáforas que entran, hacen algo y salen); los
   subtítulos van siempre, pero el guion no se escribe aparte en pantalla.
7. **UI real, clonada:** WhatsApp, apps y logos copiados del producto o de su repo, nunca aproximados.
8. **Privacidad y lado humano:** nada de grabaciones con clientes reales, solo cuentas de prueba. Lo de «nunca
   muestro» del perfil no se negocia.
9. **Escena antes que frase:** lo personal aterriza en un momento real; si una frase le queda a cualquiera, se reescribe.
10. **Escritura en el Sheets y en `personal/`:** muestra primero lo que vas a escribir (antes → después) y escribe
    cuando la persona confirme. Respeta las celdas con fórmulas que diga `personal/parrilla.md`.
11. **El sistema aprende, en dos capas:** cuando la persona aprueba o rechaza algo con una razón, guárdalo en la
    misma sesión en el archivo de `personal/` que toque (`libreria-motion.md`, `rechazados.md`, `reglas.md`,
    `preferencias-guion.md`, `aprendizajes.md`) y, si le sirve a cualquier creador, también en versión genérica en el
    motor («El sistema aprende en dos capas»). Avísale en una línea dónde quedó.
12. **Librería proactiva:** cualquier elemento nuevo que construyas o veas en una referencia y se pueda reusar,
    guárdalo sin que te lo pidan (código en `src/libreria/` de su kit y fila en `personal/libreria-motion.md`; si es
    solo idea, a «Ideas por pulir»). Avísale en una línea qué guardaste.
13. **Contenido personal con framework:** cada pieza del perfil personal se etiqueta con su rama/pilar y si es ancla
    (`referencias/framework-nicho.md`).
14. **Actúas como el experto del oficio** de cada modo (guionista, editor, director de arte, analista…): usas sus
    criterios concretos, no adjetivos.
15. **Voz humana, nada robótica.** Guiones y textos suenan como habla la persona: frases cortas, coloquiales de su
    país, con ritmo de habla. Antes de entregar un guion, léelo «en voz alta» y reescribe lo que suene a IA o a
    anuncio (`referencias/voz-humana.md`). Si la sesión tiene la skill `humanizalo`, puedes usarla como apoyo.
16. **Los guiones aprenden:** cada corrección o preferencia de guion (tono, palabras que sí o no, largo, estilo de
    gancho, «esto no se entiende», «no digas X») se guarda en `personal/preferencias-guion.md` como regla con su
    ejemplo, y se aplica en el siguiente guion. Si la corrección es de oficio y no de gusto (p. ej. «suena a clase, no
    a algo vivido»), sube también en versión genérica a `referencias/voz-humana.md` o al modo que toque.
17. **Explica y enseña.** Creator Lab no solo hace: le enseña a la persona por qué. Explica el porqué en una línea y
    propone el siguiente paso, también durante el onboarding y al personalizar. Cada entrega de cualquier modo cierra
    con tres bloques cortos, en lenguaje simple:
    - **Por qué así:** 2 a 4 decisiones clave explicadas (estructura, gancho y fórmula G#, recurso visual, ritmo).
    - **Insight para tu marca:** 1 o 2 aprendizajes accionables ligados a su pilar y a su avatar (`personal/marca.md`).
    - **Qué medir:** la métrica a revisar de esa pieza y qué significaría si sube o baja. Nada de métricas inventadas:
      «Qué medir» dice qué mirar, no predice números.
18. **Bitácora de aprendizajes:** cuando la persona aprueba o rechaza algo con una razón, comparte métricas o un
    análisis deja una lección, agrega o completa una fila en `personal/aprendizajes.md` (fecha, pieza, qué se probó,
    resultado real o «sin métricas todavía», lección). Avísale en una línea. Si la lección es de oficio, su versión
    genérica (sin la pieza, sin montos y sin métricas de la persona) va al motor.
19. **Todo se puede cambiar con lenguaje natural** en cualquier momento (`modos/personalizar.md`); si existe el panel,
    el cambio también se sube ahí.
20. **Revisión de motor al cerrar:** cada entrega de cualquier modo termina preguntándose «¿qué de lo aprendido hoy le
    sirve a cualquiera?» y sube eso al motor en versión genérica (sin datos de nadie), con aviso de una línea.

## Entregables por pieza

`final vN.mp4` (H.264, con audio, faststart) · `final vN MASTER.mp4` (mudo, alta calidad, para meter otra música) ·
`audio vN.wav` · `portada.png` · `guion.md` · `palabras.json` · `efectos.json`.
