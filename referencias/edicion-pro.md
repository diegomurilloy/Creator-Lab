# Edición pro: niveles, efectos y cuándo usarlos

Lo que separa un reel «con animaciones» de uno que se ve producido no es la cantidad de efectos. Es que cada efecto
sale de la frase que se está diciendo, que hay **capas** (fondo, gráfico, persona, texto) y que hay un **lenguaje
visual consistente** de principio a fin. Esta guía da tres niveles para que la persona elija por pieza; ninguno es
obligatorio.

## Los tres niveles
| Nivel | Se ve como | Cuándo | Costo |
|---|---|---|---|
| **Básico** | corte, punch-in, subtítulos, overlays de la librería | piezas rápidas, tendencias, historias personales donde manda la cara | bajo |
| **Pro (capas)** | texto detrás de la persona, recortes, contorno, persona que sale del cuadro, zooms de cámara, titulares | piezas de enseñanza y producto que tienen que retener, series | medio: requiere matte |
| **Documental** | archivo en blanco y negro, números gigantes, documentos, regletas de tiempo, o un sistema oscuro tipo «framework» | piezas de opinión, datos, historias con contexto, explicadores | alto: requiere diseñar un sistema |

Reglas de nivel:
- **Un lenguaje por pieza.** No mezclar documental con collage de papel en el mismo reel. El sistema se elige al
  diseñar (paso 3 del modo reel) y se respeta.
- **Ritmo:** un efecto «pro» cada 3–5 s como máximo; entre efectos, cara limpia con punch-in. Diez efectos en 20 s
  se ven como demo de efectos, no como contenido (salvo que el reel sea justo un catálogo de efectos).
- **El efecto subraya la frase:** la palabra clave de la frase es la que se vuelve gráfico. Si no hay palabra clave,
  no hay efecto.
- **La persona decide:** propón el nivel con una línea de por qué; si dice básico, es básico.

## Requisito del nivel pro: matte (separar a la persona del fondo)
`scripts/matte.py <toma.mp4> <salida.webm>` saca a la persona recortada con transparencia. Con eso se arma la
profundidad: **fondo → texto o gráfico → persona**. Conviene grabar pensando en esto: fondo que contraste con la
ropa y el pelo, luz pareja, nada que cruce por detrás de la cabeza.

## Catálogo (nombre en las referencias → componente)
**Capas (necesitan matte)**
| Efecto | Qué hace | Úsalo cuando |
|---|---|---|
| Profundidad (depth scatter) | palabras gigantes detrás de la persona; las letras entran dispersas y se juntan | la palabra que define la pieza, una vez |
| Recorte de papel (paper cut) | la persona recortada con borde blanco sobre un collage de papel con garabatos | humor, listas, un tema personal con estilo zine |
| Contorno hervido (doodle boil) | un contorno a mano que «hierve» alrededor de la persona | énfasis en ti («yo hice…»), confesiones |
| Salir del cuadro (frame break) | la toma dentro de una tarjeta o teléfono y la persona se sale por encima | transiciones de capítulo, «salí de…» |
| Vertigo (dolly zoom) | el fondo se aleja y la persona se queda | la revelación incómoda |

**Cámara y transiciones**
| Efecto | Qué hace | Úsalo cuando |
|---|---|---|
| Zoom de cámara (digital zoom) | visor con esquinas, REC y zoom 1.6× | «fíjate en esto», confesión |
| Zoom a través (zoom-through cut) | zoom con desenfoque que entra a la siguiente toma | cambio de idea o de lugar |
| Pull-back reveal | la toma se encoge a tarjeta dentro de una UI (feed, editor) | mostrar que es un reel, un proceso, un antes |
| Antes / después con barrido de luz | línea brillante que barre de antes a después | Día N, rediseños, resultados |

**Texto y gráficos**
| Efecto | Qué hace | Úsalo cuando |
|---|---|---|
| Etiqueta pegada (sticky text) | pastilla que se pega con rebote siguiendo un punto | nombrar algo que señalas |
| Muro de titulares | recortes de periódico o notas que entran escalonados | «todo el mundo habla de…», prueba social |
| Número pop | número gigante que salta bajo el subtítulo | cifras del gancho y del cierre |
| Subtítulo con palabra clave | palabra por palabra al centro, la clave más grande y en color | siempre que haya subtítulo grande |
| Portada de revista (cover story) | la toma como portada con titular serif | historias, «el día que…» |
| Gráfica que crece | barra o línea que crece con el número | datos con contexto |

**Sistema documental**
| Efecto | Qué hace | Úsalo cuando |
|---|---|---|
| Foto de archivo + número | blanco y negro con zoom lento y número gigante encima | contexto histórico, una cita |
| Monitor CRT que teclea | la frase se escribe en una pantalla vieja, la última palabra en rojo | una afirmación fuerte |
| Documento resaltado | nombres o renglones que se subrayan en rojo | «lo firmaron…», evidencia |
| Regleta de fechas | una regleta corre para «rebobinar» a una fecha | «volvamos a julio» |

**Sistema oscuro tipo framework**
| Efecto | Qué hace | Úsalo cuando |
|---|---|---|
| Pantalla dividida | gráfico arriba y cara abajo; alterna con la cara completa | explicadores largos |
| Lista en vidrio | tarjetas de vidrio cuyo texto pasa de borroso a nítido y se resalta | listas de 3–5 |
| Diagrama de nodos | nodo con brillo y líneas curvas que se dibujan hacia tarjetas | frameworks, pasos |
| Documento que se teclea | un documento que se escribe en vivo | «la nueva regla es…» |

## Capa de oficio (sin esto, cualquier efecto se ve «hecho con código»)
1. **Integrar con la toma:** el gráfico toma la luz y el color de la escena (sombras en la dirección de la luz, ligera
   desaturación), un **grano común** encima de todo (3–5 %), viñeta suave y un solo etalonaje.
2. **Movimiento de cámara:** los gráficos siguen el micro movimiento de la toma (1–3 px); nada perfectamente quieto
   sobre un video que respira. **Motion blur** en todo lo que se mueve.
3. **Profundidad:** desenfoque en lo de atrás, sombras de contacto, parallax de 2 capas, perspectiva 3D leve
   (4–8°) que se endereza.
4. **Curvas de editor:** ease-out fuerte (`cubic-bezier(.16,1,.3,1)`), 300–500 ms, overshoot máximo 2 %. Nada
   lineal ni resortes caricaturescos.
5. **Transiciones solo en cambios de capítulo:** whip pan con motion blur, fuga de luz sutil, aberración cromática
   de 1–2 px por 3–4 cuadros, flash de exposición.
6. **Tipografía:** kerning cerrado, contraste de pesos, nada de contornos ni sombras duras; texto sobre video
   siempre con una capa (vidrio o sombra difusa amplia).
7. **Texturas fotográficas:** papel, cinta y periódico con fibras, ruido, curvatura y bordes irregulares, no planos.
8. **La vara:** sobrio, una sola idea por momento, integrado con la toma y movido con intención. Si se nota que es
   un efecto, se rehace.

## Antes de entregar
- Revisa el borde del matte en el pelo y las manos cuadro por cuadro en los tramos con capas. Si tiembla, sube el
  suavizado o quita el efecto de ese tramo.
- Texto detrás de la persona: que la palabra se lea aunque la tape un poco (mínimo 60 % visible).
- Nada de efectos sobre el gancho que tapen la cara en el primer segundo, salvo que el gancho sea visual.

## Imágenes generadas (Higgsfield) como material

- Se generan **imágenes**, no video: la foto pone el realismo (objetos, papel, fondos, fugas de luz) y el kit pone movimiento, texto y vidrio.
- Sin personas ni caras (lo personal es la toma real), sin texto ni números dentro de la imagen, nada de UI del producto.
- **Costo (GPT Image 2.5):** alta 2K = 2.75 créditos solo para lo que ocupa toda la pantalla y lleva zoom; media 2K = 1 para objetos y texturas más chicas; Z Image = 0.15 para probar ideas antes de generar en alta. Máximo 8 trabajos a la vez en el plan Plus.
- Guardar en `<kit>/public/<pieza>/higgs/` con su `prompts.tsv`.
