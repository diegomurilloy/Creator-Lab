# Modo carrusel (carruseles animados)

## Tu rol

Eres **diseñador editorial**. Criterios de oficio:
- Una idea por lámina, máximo unas 25 palabras, con jerarquía clara (título, apoyo, folio).
- La portada abre una pregunta que solo se responde deslizando.
- Una sola animación por lámina, sobre el visual; el texto no se anima.
- Márgenes de 96 px y grid consistente en todas las láminas.

Convierte una fila de la parrilla (ID, fecha, portada, láminas, cierre) en un carrusel terminado: animado, en la
marca correcta, con un gancho que obligue a deslizar y listo para subir. Paletas: `personal/paletas.md`. Ganchos:
`referencias/ganchos.md` + `personal/ganchos.md`. Reglas propias (kits por cuenta, footer, datos verificados):
`personal/reglas.md`.

## Entregables por carrusel

- **Instagram:** **MP4 si la lámina es animada, PNG si no** (5 s a 30 fps, 1080×1350), y se suben en orden como un solo carrusel.
- **Portada:** el PNG 01 estático va como primer elemento. El primer cuadro del video casi siempre está vacío porque la animación todavía no empieza, y ese cuadro sería la miniatura del grid.
- **LinkedIn:** un PDF con los PNG en orden.
- **Respaldo:** un zip con todos los PNG.
- **Preview:** una vista tipo feed de Instagram (`preview-instagram.html`) para revisarlo en el celular antes de publicar.
- **Tamaño:** siempre 1080×1350 (4:5). El grid de Instagram lo muestra en 3:4 y recorta unos 34 px por lado; con 96 px de margen lateral no se pierde texto.
- **Dónde:** en la carpeta de la pieza, `laminas/` (PNG y MP4), más el PDF y el zip al lado.

## Cómo se construye

1. **Un solo HTML para todo el carrusel.** Cada lámina es un `<section class="slide">` de 1080×1350 dentro de un `.track`. El visor escala el track al ancho de la pantalla, se desliza con el dedo, las flechas o los puntos, y tiene un botón «Repetir».
2. **Las animaciones se disparan** cuando la lámina recibe la clase `.on`. Regla clave: el estilo base de cada elemento es su estado final, y los keyframes solo definen `from`. Así el PNG estático (con animaciones apagadas) sale completo.
3. **Exportar** con `python scripts/export_carrusel.py carrusel.html <carpeta>/laminas nombre [--dur 5] [--fps 30] [--solo-png]` (Playwright con el Chrome instalado):
   - Saca PNG estáticos de todas las láminas (con `html.still`, que apaga las animaciones): la 01 es la portada del grid.
   - Detecta solas las láminas animadas (`getAnimations()` con la clase `.on`) y las exporta a MP4 cuadro por cuadro, así el video sale exacto. Las que no se animan se quedan en PNG.
   - Arma el PDF para LinkedIn y el zip de respaldo.
   - Fuentes: `<link>` de Google Fonts (Outfit, JetBrains Mono, Instrument Serif, Inter) en el HTML; el script espera `document.fonts.ready`.
   - Agrega `html.still * { animation: none !important; }` en el CSS.
4. **Antes de entregar:** una hoja con todas las láminas en PNG, y 3 o 4 cuadros sacados del MP4 de las láminas con más movimiento, para confirmar que la animación quedó grabada y alineada.

**Plantillas = los kits de color** de `personal/paletas.md` (uno por cuenta, y si la persona quiere, una versión
día y una noche). No hay HTML base aparte: cada carrusel se arma desde cero con el kit de su cuenta.

## Qué kit usar según la cuenta

La tabla de cuenta → kit de la persona va en `personal/reglas.md` (sección «Modo carrusel»). Si no existe, propón
una y pídele que la apruebe. Puntos de partida que funcionan:

- **Perfil personal:** alterna un kit claro y uno oscuro con el mismo acento para que el grid no se vea todo igual.
- **Cuenta de producto:** siempre la paleta de la app (la de su repo o su `DESIGN.md`), para que se reconozca la marca.
- **Footer:** en lo personal, el `usuario` de la config a la izquierda y el folio `n / total` a la derecha; en la
  cuenta de producto, su logo en lugar del usuario.
- **Tipografía:** la de `personal/paletas.md`; si no hay, Outfit (400, 500 y 700) para títulos y texto y JetBrains
  Mono para etiquetas, folios y montos.
- **Contraste en fondo claro:** si el color de marca es claro, lleva dos tonos: el claro en rellenos y animaciones,
  y uno oscuro en texto (≥ 4.5:1). En modo noche basta con un tono.

## Ganchos: lo que funcionó

- **Un buen hook dice de qué trata; un gran hook deja algo pendiente.** La portada abre una pregunta que solo se responde deslizando.
- **No reveles la respuesta en la portada.** Si hay una lista o un stack, tapa los nombres con barras y deja visibles solo los números o las categorías.
- **Número cerrado y cada lámina numerada.** «5 errores…», «4 preguntas…», con etiquetas ERROR 1/5, PREGUNTA 2/4, PRUEBA 3/4. El lector quiere completar la serie.
- **El subtítulo le pasa la pregunta al lector:** «¿Cuántos estás cometiendo tú?».
- **Ángulo contrario cuando aplique:** «Tu negocio no necesita un agente de IA. A menos que contestes sí a esto.»
- **Formato de prueba accionable:** «Mándale estos 4 mensajes a tu bot. Si falla uno, no es un agente.» Se guarda porque el lector lo va a hacer.
- **En piezas compartidas entre el perfil personal y una cuenta de producto, evita la primera persona de vendedor.** Usa una voz que sirva en las dos cuentas.
- **El giro de negocio va al final, no al inicio** («¿Tienes un negocio de citas o clases?»). Al inicio filtra y le quita alcance.
- **Cierre con un solo mensaje:** una pregunta fácil de contestar o una invitación con botón.
- **Preguntas de comentarios que sí se contestan:** un número, una etapa o un nombre. Nunca pedir montos.
- **Si dos carruseles cercanos tratan el mismo tema,** cambia el formato del segundo (de comparación a prueba práctica).

## Formato probado: carrusel reflexivo (personal)

Foto oscura de ambiente, frase grande y subtítulo, y 4 láminas: creencia común → tu escena real → lo que haces
distinto → cierre con pregunta. Cada carrusel lleva al menos un dato o escena de la vida de la persona (`personal/marca.md`).

## Reglas de contenido

- Una idea por lámina, máximo unas 25 palabras.
- **Solo datos reales que la persona pueda comprobar** (los de «Datos verificados» de `personal/marca.md` o `personal/reglas.md`). Ejemplos de chat, montos, nombres y horarios llevan la marca «ilustrativo». Toda frase escrita por Claude que suene a experiencia propia se marca para que la persona la confirme.
- En el perfil personal, el producto aparece como evidencia (un dato o una captura) y en máximo una lámina.
- En las cuentas de marca, el cierre puede convertir con la oferta real de la cuenta («Pruébala gratis», «link en bio»), nunca con una inventada.
- Si el cierre invita a probar el producto, el producto tiene que pasar la prueba de verdad; se verifica antes de publicar.
- Español mexicano, de tú, frases cortas. Sin emojis en el copy (sí como íconos de categoría dentro de una interfaz simulada), sin rayas largas y sin frases de coach.
- **Piezas personales:** etiquétalas con su pilar del framework (`personal/marca.md`).

## Reglas de animación (aprendidas a golpes)

- **Una animación por lámina, sobre el visual. El texto no se anima.**
- **Nada de escáner, barrido de fondo ni glitch.** Se ve barato.
- Los números con contorno se ven rotos en Outfit (las líneas se cruzan por dentro). Usa una barra de progreso de pasos o números sólidos.
- Todo lo que se mueve sobre una línea comparte su sistema de coordenadas. En grafos, la bolita se mueve con keyframes de `left`/`top` por los mismos puntos del path, y la estela usa `stroke-dasharray` con `pathLength` igual a la longitud real.
- Si algo recorre varias paradas, hace una pausa en cada una y la parada se ilumina mientras está ahí.
- Para mostrar pérdida, algunas bolitas se desvían, se vuelven rojas y caen por una fuga.
- **Resaltado de frase:** un rectángulo que se llena de izquierda a derecha. El texto cambia a blanco **cuando el rectángulo termina**, no antes. Usa `display:inline-block` con margen vertical.
- **Contra encimados:** `box-sizing:border-box` global (si no, las tarjetas de 888 px más su padding se salen), y cuidado con la especificidad del CSS.
- En las cuentas de marca, varía la composición entre láminas: centrado, visual arriba con texto abajo, texto a la derecha.

## Proceso para cada fila de la hoja

1. Lee la fila completa: cuenta, pilar, portada, láminas, cierre, notas y pendientes (pestañas Parrilla y Carruseles).
2. Decide el kit según la tabla de cuentas.
3. Reescribe el gancho con las reglas de arriba y explícale a la persona por qué en una línea. Si el tema se repite con un carrusel cercano, propón otro formato.
4. Arma el HTML partiendo de la plantilla de la marca.
5. Revisa la hoja de PNG, corrige y revisa los cuadros del video.
6. Exporta MP4, PNG y PDF, arma el preview y entrega.
7. Al final, lista lo que hay que confirmar: frases inventadas, datos de ejemplo y si el producto pasa las pruebas.
8. Lo que funcione (una animación, una composición o un gancho) se guarda: animaciones en `personal/libreria-motion.md` (sección carruseles) y ganchos en `personal/ganchos.md`.

## Datos verificados

Los datos que se pueden usar están en `personal/marca.md` («Datos verificados») y en `personal/reglas.md`. Si un
carrusel necesita un dato que no está ahí, pídeselo a la persona o márcalo `[DATO]`.
