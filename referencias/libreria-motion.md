# Librería de motion (catálogo del kit plantilla)

Catálogo de elementos de motion probados en reels reales. Cada entrada dice **qué es**, **cuándo usarlo** (qué frase
de la voz lo pide) y **dónde está el código**. Este archivo describe lo que trae el **kit plantilla** (`kit/`) y las
reglas de edición que valen para cualquiera. **Los elementos que salen de las piezas de la persona van en
`personal/libreria-motion.md`** (se leen los dos; si se contradicen, manda el de `personal/`).

## Dónde está el código

La librería pública vive en `kit/src/libreria/` (el kit plantilla; ver `kit/README.md`). El kit de trabajo de cada
persona es el `kit` de `personal/config.md` (normalmente una copia de `kit/` que crece con sus piezas) →
`import { Escena, Bloque, Subtitulos, Medidor, ChatWA, MARCA } from "../../libreria";`

Los colores, fuentes, logo y nombres salen de la marca activa: `kit/src/marcas/<id>.ts`, elegida en
`kit/src/marca.ts` (`MARCA_POR_DEFECTO`) o con `REMOTION_MARCA=<id>`.

Cada pieza tiene un demo en Remotion Studio, carpeta **Libreria** (`lib-<id>`); abre el Studio con `npx remotion
studio` dentro del kit para verlas todas. Para agregar una nueva, modo `libreria`.

| Archivo | Qué trae |
|---|---|
| `base.ts` | utilidades de movimiento: `pe` (curva expo), `sp` (resorte), `suave`, `expo`, `morph` (transformar una caja en otra), `FPS`, `INTER`, `SERIF`, `MONO`, `CX`, `CY`, `acelera`, `caida`, `tiembla` |
| `paletas.ts` / `tema.ts` | la paleta `MARCA` y `MARCA_APP` de la marca activa (`src/marcas/<id>.ts`) y la UI de WhatsApp (`WA`, `WA_OSCURO`) |
| `escena.tsx` | `Escena` (mundo vertical continuo: `entrada`/`salida` = pan · nada · fade), `Centro`, `Mono`, `Onda` |
| `bloques.tsx` | `Bloque`, `Bloques`, `enBloque`: bloques de color a pantalla completa para capítulos y CTA |
| `subtitulos.tsx` | `Subtitulos` (karaoke, ≤4 palabras, pastilla en la palabra activa; props `compacto` y `pastilla`), `frasesDe` |
| `objetos.tsx` | ilustraciones planas: `Medidor`, `Lapiz`, `Ticket`, `Carrito`, `Persona`, `Check`, `Celular`, `Bateria`, `Cronometro`, `Mano` |
| `whatsapp.tsx` | `ChatWA`, `ChatWAOscuro`, `Burbuja`, `AppWA`, `Palomitas`: WhatsApp iOS clonado, claro y oscuro |
| `logos.tsx` | `LogoMarca`: logo de ejemplo que se arma pieza por pieza, o el archivo de `logo.archivo` de tu marca |
| `comun.tsx`, `pro.tsx` | piezas «pro» (abajo) |
| `hoja.tsx`, `apps.tsx`, `registro.tsx`, `antojos.tsx`, `deudas.tsx`, `cobros.tsx` | objetos y escenas extra (hoja de cálculo, app genérica, ticket gigante, etiquetas de precio, calendario, campo que se teclea…); sus demos `lib-*` en el Studio |
| piezas «pro» | `TextoMascara`, `HojaEnviar` (hoja «Mándaselo a…» de Instagram), `NotificacionIOS`, `Moneda3D`, `pila()` |

Si un componente de este catálogo no aparece en tu `kit/`, puede que todavía viva en el kit de origen: pídele a
Claude que lo construya con esta descripción y guárdalo con el modo `libreria`.

## Cómo se usa esta librería

Es un catálogo de **componentes**, no un inventario de cada video: **una entrada por idea**, con el mejor ejemplo
como preview y «también en…» para los demás lugares donde se usó. Cuando algo surge en un reel nuevo, se toma de aquí
tal cual o se edita (si su código todavía vive dentro de un reel, se sube a `src/libreria/` con sus tiempos como props
y luego se usa). No se agregan repetidos.

## Reglas de edición (siempre, con cara y sin cara)

0. **Personajes y objetos bien hechos:** los personajes se mueven con articulaciones y poses interpoladas (nada de
   brincos ni brazos rígidos); lo que se sostiene se agarra bien (la lupa del mango); si algo se ve de cerca (un
   celular), se hace cambio de toma al punto de vista. Antes de crear un componente, busca si ya existe.
1. **Causa y efecto (encadenado):** nada aparece solo. Cada elemento entra porque otro lo empujó o lo disparó (una
   palomita saca el siguiente renglón, una pieza que cae empuja la pila, un toque abre el chat, la respuesta se vuelve
   el renglón).
2. **Transformación:** en vez de cortar, un objeto se expande o se convierte en la siguiente escena (ícono → chat,
   hoja → tarjetas, barra → bloque, polvo → casilla).
3. **Máscara:** el texto sale de detrás de un borde, por palabra y con desenfoque de movimiento; nunca aparece solo con fade.
4. **Sincronía:** cada cifra, objeto o acción entra en la palabra exacta en que se dice; nunca una cifra antes de decirla.
5. **Fluidez:** curvas expo/suave, sin cortes secos ni escenas encimadas; la cámara nunca se queda quieta y la acción
   continúa de una escena a la siguiente.

## Lo que se aprendió haciendo reels sin cara

1. **Un reel no es un carrusel.** Nada de página fija con el guion escrito. Lo que se ve son objetos que entran,
   hacen algo y salen al ritmo de la voz.
2. **Lo visual complementa al audio, no lo duplica.** Si la voz dice «tarda más anotar que pagar», no se escribe eso:
   se ve una carrera (tarjeta instantánea vs. lápiz que se arrastra).
3. **Subtítulos sí, siempre**, normales, abajo (y≈1420), frases de ≤4 palabras con la palabra que suena en pastilla.
   Lo que NO va es el guion completo como texto aparte.
4. **Música siempre.** Se apaga en seco en cada loop abierto («Pero…», «Y lo que casi nadie hace…») y regresa con
   golpe: eso crea la intriga. Baja sola cuando hay voz (sidechain).
5. **Énfasis con bloques de color** a pantalla completa en los momentos clave (capítulos 01/02/03, la cifra del
   gancho, el CTA). Número gigante en serif + etiqueta mono.
6. **Golpes de cámara suaves** en cada palabra clave: suben y bajan en ~0.2 s (curva x·e^(1−x)), +2.8 %. Si saltan,
   se ve «choppy». Sacudida solo en impactos reales.
7. **Efectos de sonido sincronizados** a cada entrada (pop, tic, whoosh, golpe, ding, enviar/recibir).
8. **Los primeros 3 s deciden todo.** Movimiento desde el cuadro 0 (cámara que entra + algo que ya se mueve, p. ej.
   un número que sube), un giro fuerte en la palabra clave y un impacto. Un objeto quieto que aparece = «meh».
9. **Transiciones fluidas:** la escena que sale se va con desenfoque mientras la nueva entra (traslape corto, ~0.15 s).
10. **UI real clonada, no aproximada:** WhatsApp con barra de estado, encabezado, fondo, burbujas con cola, hora y
    palomitas, barra para escribir (el texto se teclea ahí y al enviar sube como burbuja). Logos vectoriales oficiales.
11. **Todo conectado:** un solo mundo vertical. Entre escenas la cámara baja (la que sale y la que entra se mueven
    juntas 1920 px en 0.46 s, con desenfoque de movimiento y un whoosh). Donde se pueda, un objeto se TRANSFORMA en el
    siguiente en vez de salir y entrar otro.
12. **Números que no tiemblan:** un contador nunca oscila; el rebote va solo en la pieza física (la aguja).
13. **Open loops = curiosity gap visual.** No basta con oscurecer: muestra algo que falta (el primer lugar de un
    ranking CENSURADO con «?»; cien personas y solo una se enciende) y haz que ESO se transforme en el capítulo
    siguiente. Música cortada + golpe/ding + whoosh al entrar.
14. **Cierre con callback y tarjeta final.** Regresa el objeto del gancho, resuélvelo (se tacha y cae) y termina en
    tarjeta: logo que se arma, nombre, botón de acción real y dominio.
15. **Al cambiar de color, no interpoles entre colores lejanos** (rojo→petróleo da café lodoso): elige el color del
    siguiente bloque igual al de la pieza que crece.
16. **Ilustraciones con oficio:** nada de íconos genéricos de 24 px. Objetos planos con facetas y los colores de la
    marca (un lápiz con goma, virola, cuerpo de color y punta de madera).

## Estructura visual de un reel sin cara

| Bloque viral | Qué se ve | Recurso |
|---|---|---|
| Gancho (0–3 s) | Un objeto-metáfora que se mueve desde el cuadro 0 y se rompe en la palabra clave + bloque de color con la cifra | `Medidor`, `Bloque` |
| Lead | Gráfica punteada que cae + la «excusa» tachada | gráfica punteada, pastilla tachada |
| Capítulo 01/02/03 | Bloque de color con número gigante (0.7 s) | `Bloque` |
| Cuerpo | Una metáfora por frase (carrera, botón, pila de pantallas, fila del súper, lluvia de tickets…) | catálogo |
| Loop abierto | Apagón + música cortada + algo que falta (ranking censurado, uno entre cien) | fondo oscuro |
| Wow | El producto real: ícono → chat → respuesta → se vuelve renglón | `morph`, `ChatWA` |
| CTA | Pieza que encaja + bloque con «1» gigante + cierre en bucle con el objeto del gancho | |

## Catálogo

| Elemento | Úsalo cuando la voz dice… | Dónde |
|---|---|---|
| **Escena** (mundo vertical continuo: `entrada`/`salida` = pan · nada · fade) | contenedor de cada metáfora | `escena.tsx` · `Escena` |
| **Bloque de color** (wipe desde abajo, número gigante serif, etiqueta mono, sale hacia arriba) | capítulos, cifras, CTA | `bloques.tsx` · `Bloque` |
| **Subtítulos karaoke** (≤4 palabras, pastilla en la palabra activa, cambia a claro sobre fondos oscuros; modo compacto) | siempre | `subtitulos.tsx` · `Subtitulos` |
| **Medidor** (arco que sube 0→100 % desde el cuadro 0, aguja que se desploma con resorte, número que se pone rojo, grietas, cae) | ganchos de energía, motivación, «ya perdiste» | `objetos.tsx` · `Medidor` |
| **Lápiz plano** que escribe un trazo a mano (gira sobre su punta) | «anotar», «registrar a mano» | `objetos.tsx` · `Lapiz` |
| **Lluvia de tickets** (caen con aceleración, se apilan, golpe + sacudida) | «de golpe», acumulación | `objetos.tsx` · `Ticket` |
| **Fila + carrito** (personas planas, carrito rueda con giro de llantas) | «en la fila del súper», vida real | `objetos.tsx` · `Carrito`, `Persona` |
| **Check que se dibuja + onda** | «listo», confirmar | `objetos.tsx` · `Check`, `escena.tsx` · `Onda` |
| **Celular** (marco, pantalla 9:16, acercamiento con origen abajo para no tapar subtítulos) | leer mensajes en un celular | `objetos.tsx` · `Celular` |
| **Batería** (barras que caen con gravedad, se pone roja) | cierre en bucle; para ganchos mejor el Medidor | `objetos.tsx` · `Bateria` |
| **Cronómetro hilo conductor** (carátula, bisel, punta que da una vuelta por segundo y gira hacia atrás al rebobinar; formato `min`) | «tarda», «en segundos», comparar cuánto toma algo | `objetos.tsx` · `Cronometro` |
| **Mano que toca la pantalla** (índice con uña y nudillos; `presion` hunde el dedo; con una onda en el punto) | «un toque», «abres la app» | `objetos.tsx` · `Mano` |
| **WhatsApp iOS clonado** (pantalla de inicio → toque → se abre desde el ícono; mensaje que se teclea; «escribiendo…»; respuesta) | cualquier demo por WhatsApp | `whatsapp.tsx` · `ChatWA`, `Burbuja`, `AppWA`, `Palomitas` |
| **WhatsApp iOS oscuro** (patrón oscuro, burbuja verde, palomitas, tres puntos, respuesta de tamaño fijo para transformarla) | demos en modo oscuro | `whatsapp.tsx` · `ChatWAOscuro` |
| **Logo que se arma pieza por pieza** | avatar, cierre, tarjeta final | `logos.tsx` (ejemplo; cambia la geometría por la de tu logo) |
| **TextoMascara** (palabra por palabra desde su máscara + blur vertical) | títulos cortos | piezas «pro» · `TextoMascara` |
| **Hoja «Mándaselo a…» de Instagram** (contactos, se elige uno y se envía; colores configurables) | CTA para DM | piezas «pro» · `HojaEnviar` |
| **Notificación de iOS** que baja y se apila | «me llegó…», avisos, testimonios | piezas «pro» · `NotificacionIOS` |
| **Moneda 3D** (gira, cae en lluvia) | adivinanzas de precio, dinero | piezas «pro» · `Moneda3D` |
| **morph / pila / pe / sp** | transformar una caja en otra, pila que empuja, curvas | `base.ts` |
| **Ranking con el 1.º censurado** (barras, la censurada roja con bloques que brillan y «?», crece a pantalla completa) | loop abierto «pero eso no es lo que más falla» | se arma con `Bloque` + barras (escena compuesta) |
| **Cien personas, una se enciende** (cuadrícula 10×10 que entra en ola, una con brillo, zoom hacia ella) | «casi nadie…», «solo unos pocos…» | escena compuesta con `Persona` |
| **Carrera de carriles** (una pieza cruza al instante con estela, otra se arrastra) | «tarda más X que Y» | escena compuesta |
| **Gráfica punteada que cae** (polyline `strokeDasharray="0 26"`, revelado con clipPath, último punto rojo) | abandono, caída, «cada vez menos» | escena compuesta |
| **Pastilla tachada** (serif itálica en pastilla, raya roja `scaleX`, tiembla y cae) | una excusa o creencia falsa | escena compuesta |
| **Burbuja → renglón** (`morph` de caja) | «y ya quedó», se registra | `base.ts` · `morph` |
| **Pieza que encaja en el hueco** (cae girando, golpe al encajar) | «un hábito que quepa en tu vida» | escena compuesta |

## Reels con cara (overlays que funcionan)

| Elemento | Úsalo cuando la voz dice… |
|---|---|
| **Cifra del gancho que rueda** tipo contador en el tercio superior desde el cuadro 0 | una cifra que duele en el gancho |
| **Pastilla que se abre de izquierda a derecha** con su texto en máscara + notificación | fechas, avisos, «me llegó…» |
| **Hoja que se separa en tarjetas** (`morph()`) | desglosar, «lo que llevaba pagando» |
| **Video flotante → chat** (el video se encoge a tarjeta y el ícono crece y se vuelve el chat) | mostrar el producto encima |
| **Pastillas de vidrio que se apilan** (`pila()`) | listas cortas |
| **Checklist que se tacha + alerta** | «lo que nadie ve», el trabajo invisible |
| **Titular que se tacha** y aparece la frase nueva | remate que cambia una creencia |
| **Preguntas flotando** alrededor de la cara | volumen de mensajes, dudas del público |
| **Encuesta con íconos** que se marcan | CTA de comentario con opciones |
| **Quiz con monedas 3D** | adivinanza (G12) |
| **«Comenta PALABRA» + DM** (comentario que se teclea y respuesta en DM) | CTA de palabra clave |

## Audio

- Voz: `scripts/procesar_voz.py` (rider + cadena + efectos + loudnorm −14).
- Música: `scripts/musica.py voz.wav salida.wav duración "ini:fin,ini:fin" [bpm] [estilo]`: sintetizada, sin derechos;
  los tramos son los loops donde se apaga. Mezcla: música −6.5 dB bajo la voz y ajuste fijo a −14 LUFS.
- **Ojo:** `alimiter` de ffmpeg trae `level=true` (reajuste automático de nivel). En la mezcla final usar
  `alimiter=limit=0.84:level=false` o te sube el volumen después de normalizar.
- Efectos: `efectos.json` del reel (lista `{archivo, en, volumen}`), volúmenes 0.05–0.2. Catálogo: `referencias/sound-library.json`.

## Cambiar palabras de lugar en la voz («nadie casi» → «casi nadie»)

Whisper da límites aproximados. Para cortar dentro de una frase: energía en ventanas de 10 ms (los cierres de
oclusivas como la «k» son el corte limpio) y bandas espectrales (F2 alto 1.8–3 kHz = «i», fricción 4–9 kHz = «s»)
para separar vocales pegadas. Cortar a precisión de muestra con fundidos de 6 ms y volver a transcribir para
confirmar que no quedó una sílaba suelta.

## Ideas por pulir (vistas en referencias, todavía sin código)

La columna «De dónde» da el crédito a la cuenta donde se vio el recurso. Se replica el tipo de recurso, nunca el video.

| Idea | De dónde | Úsala cuando… | Notas para construirla |
|---|---|---|---|
| **Diagrama tipo pizarra que se arma rama por rama** sobre un talking head | video «You are the niche» (@jun_yuh) | explicas un framework o «A se divide en B y C» | fondo blanco, nodos pastel por rama, cajas amarillas; cada rama entra en su palabra; la cámara del diagrama va a la rama activa |
| **Círculo rojo a mano** sobre la parte de la que se habla | mismo | señalar «este» | trazo irregular con `strokeDashoffset` en ~0.3 s |
| **Tachas rojas (X)** sobre lo que «no» es | mismo | descartar opciones | dos trazos rápidos escalonados 80 ms, con golpe suave |
| **Subtítulo de una palabra al centro** | mismo | talking heads de ritmo rápido | alternativa a las frases de ≤4 palabras; probar en Style Lab |
| **Mapa completo que se aleja** al final | mismo | recapitular un framework | zoom out del diagrama con las ideas abajo |
| **Pastillas con palomita que descartan variables** | @mnnercy | lead de eliminación: «no es esto, ni esto…» | pastillas en fila arriba, cada una con su palomita en la palabra |
| **Tabla de colores que se llena por renglones detrás de la cara** | @iamchrischung | listas de N puntos con cara | 3–4 columnas planas, un renglón por punto; la tabla final se sostiene 1.5 s |
| **Cuenta regresiva «3-2-1-ya»** a pantalla completa | @kallawaymarketing | arranque de un paso a paso | números gigantes que se reemplazan en el golpe; 1.5 s en total |
| **Número de capítulo gigante sobre una línea curva** | mismo | «1 · Primero…» con pantalla dividida | número enorme a la izquierda, arco que se dibuja, título palabra por palabra |
| **Doble tarjeta Antes / Después apilada** | @finish.edits | toma cruda contra reel terminado | dos tarjetas con etiqueta en pastilla, CTA fijo debajo |
| **Titular condensado gigante junto a la cara** | mismo | la palabra clave de cada frase | altas condensadas a un lado de la cara |
| **Línea de tiempo de edición con pistas que se apagan** | @christianarciga_ve | crudo vs editado | 4 pistas con nombre y playhead; en cada vuelta se apaga una |
| **Recuadro de prueba que entra sin transición en el gancho** | @jun_yuh | pagar la promesa a los 2–3 s | recuadro recortado con sombra; solo datos verificados |
| **Tarjeta de prueba arriba de la cabeza** | @ayoships | credencial o dato real | captura recortada a su forma, entra con resorte y sale en 1.5 s |
| **Par de celulares Antes / Ahora con flecha** | @ceciliakimdesign | cualquier mejora de UI | dos mockups con la UI real y flecha que señala el cambio |
| **Flecha blanca a mano con etiqueta** | mismo | señalar un detalle sobre b-roll | trazo curvo + etiqueta de 2 palabras |
| **Objeto con física (squash & stretch)** | @cevox_ | cuadro 0 de teasers | caída con gravedad, aplastado al tocar el piso, estela punteada |
| **Titular gigante letra por letra con desenfoque** | mismo | tesis del video | grotesca negra a lo ancho, blur horizontal por letra |
| **Botón que el cursor presiona en ráfaga de cortes** | @mosycreate × @higgsfield.creators | ráfaga del problema | un botón distinto por corte, el cursor fijo; corte en cada golpe |
| **Texto que se escribe con cursor** | varias cuentas de producto | teaser y cierre | cursor parpadeante, tecleo humano, pausa antes de la palabra clave |
| **Contador regresivo que se pone rojo cerca del cero** | @motiontheory.media | avisos, suspenso | número mono grande con etiqueta chica; cambia de color en los últimos 3 |
| **Palabra-capítulo con su color y una letra que es objeto** | @grafigator | capítulos de un lanzamiento | bloque de color por palabra; una letra es un objeto del producto |
| **Resplandor que respira y desenfoque que se enfoca** | @madebyext | revelación del logo | brillo radial que pulsa lento; texto de blur a nítido en 0.6 s |
| **Lista de instrucciones en lenguaje natural** | @momteiro.mp4 | «sin timeline, solo conversación» | renglones que se escriben con subrayado y su resultado a la derecha |
| **Barra segmentada por destino con objeto y hueco «?»** | @lx.growth × @tappeame.mx | desglose de un total | total que rueda, cada segmento con su objeto; el último gris con «?» |
| **Pantalla de bloqueo con hora que avanza y notificaciones que se acumulan** | @fran.sarni | problemas de madrugada | iPhone clonado, hora que salta, contador que sube |
| **Tres tarjetas dispersas que se juntan en una** | @rayyan_akm | «¿en el correo? ¿en el PDF?» → todo en un lugar | inverso de «Hoja que se separa en tarjetas» (`morph()`) |
| **Ráfaga de verbos con subrayado y etiqueta mono numerada** | spec ad sin identificar | resumen de capacidades | verbo serif que cambia en cada compás; etiqueta «01 · VERBO» arriba |

## Carruseles (HTML/CSS)

| Elemento | Úsalo cuando… | Notas |
|---|---|---|
| Barras que tapan nombres en la portada | lista o stack que no quieres revelar | se destapan lámina por lámina |
| Etiqueta numerada ERROR 1/5 · PREGUNTA 2/4 | listas con número cerrado | el lector quiere completar la serie |
| Bolita que recorre un grafo con paradas que se iluminan | procesos, flujos | keyframes `left/top` sobre los puntos del path; estela con `stroke-dasharray` + `pathLength` real |
| Bolitas que se desvían, se ponen rojas y caen por una fuga | pérdida, dinero que se va | |
| Resaltado de frase que se llena izquierda→derecha | la frase clave | el texto cambia a blanco al terminar el relleno, `inline-block` con margen vertical |
| Barra de progreso de pasos | números o etapas | en vez de números con contorno (se rompen en Outfit) |
| Reloj que se llena (anillo de progreso alrededor de un número) | rutinas, tiempo corto | |
| Semana que se ilumina día por día | revisión semanal, pagos que vienen | |
| Checklist que se palomea completa | lo que revisas antes de decidir | |
| Opción A vs opción B con selección | comparar dos opciones | |
