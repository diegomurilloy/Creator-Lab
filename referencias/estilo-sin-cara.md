# Estilo sin cara (reel cinético, solo voz)

Para piezas donde la persona graba solo audio (típico en cuentas de producto). Salió de seis versiones de un mismo
reel hasta que quedó; el reel de ejemplo del kit (`kit/`) sigue esta estructura. Las piezas reutilizables están en
`src/libreria/` del kit y en el catálogo `referencias/libreria-motion.md` (+ `personal/libreria-motion.md`).
El estilo propio de la persona, si lo tiene, va en `personal/estilo-sin-cara.md` y manda sobre este.

## La idea

Una narrativa tipo SaaS editorial: fondo crema con retícula de puntos tenue, objetos planos con oficio y la
paleta de la cuenta (`personal/paletas.md`). **Cada frase de la voz tiene un objeto-metáfora que entra,
hace algo y sale**, y todo vive en **un solo mundo vertical** por el que baja la cámara.

## Reglas

1. **Los primeros 3 s deciden todo.** Movimiento desde el cuadro 0 (la cámara entra y un número ya está subiendo), un giro fuerte en la palabra clave y un impacto.
2. **Complementa, no dupliques.** «Tarda más anotar que pagar» se ve como una carrera: la tarjeta cruza al instante y el lápiz se arrastra.
3. **Subtítulos siempre:** abajo (y≈1420), frases de ≤4 palabras, con la palabra que suena en pastilla. Sobre fondos oscuros cambian a crema. Nada de guion aparte.
4. **Mundo continuo:** entre escenas la cámara baja. La que sale y la que entra se mueven juntas 1920 px en 0.46 s, con desenfoque de movimiento y un whoosh (`Escena` con `entrada`/`salida` = `pan`).
5. **Transformar antes que cortar:** donde se pueda, un objeto se vuelve el siguiente. Ejemplos: polvo → casilla «Hoy»; renglón → pieza que encaja; barra censurada → bloque de capítulo.
6. **Bloques de color** a pantalla completa para capítulos (01/02/03) y el CTA: número gigante en serif y etiqueta mono. Si la pieza que crece ya llenó la pantalla, el bloque entra sin barrido y en SU color (nunca interpolar colores lejanos).
7. **Loops abiertos = curiosity gap visual:**
   - apagón a `noche`;
   - la música se corta;
   - algo falta: el 1.º lugar de un ranking censurado con «?», o cien personas de las que solo una se enciende;
   - eso mismo se transforma en el capítulo siguiente;
   - golpe o ding, y whoosh al entrar.
8. **Golpes de cámara suaves** en cada palabra clave: +2.8 % con curva x·e^(1−x) en ~0.2 s. Sacudida solo en impactos reales.
9. **Números que no tiemblan:** el contador va directo; el rebote solo en la pieza física (la aguja).
10. **UI clonada:** WhatsApp iOS completo (barra de estado, encabezado con avatar, fondo, píldora «Hoy», burbujas con cola, hora y palomitas, barra para escribir). El mensaje se teclea en la barra y sube como burbuja; aparece «escribiendo…». Acércate con la cámara para que se lea (origen abajo, para no tapar los subtítulos).
11. **Cierre con callback y tarjeta final:** regresa el objeto del gancho, se resuelve (se tacha y cae) y entra la tarjeta. La tarjeta lleva el logo que se arma pieza por pieza, el nombre, un botón de acción real (p. ej. «Escríbenos» con WhatsApp) y el dominio.
12. **Música siempre** (`scripts/musica.py`): se apaga en cada loop y regresa con golpe. Baja sola cuando hay voz.
13. **Efectos sincronizados** a cada entrada (pop, tic, whoosh, golpe, ding, enviar/recibir), volumen 0.05–0.2.
14. **Ilustraciones con oficio,** nunca íconos genéricos de 24 px. Ejemplo: lápiz con goma, virola, cuerpo del color de la marca y punta de madera.

## Esqueleto de un reel sin cara

| Bloque viral | Qué se ve (ejemplo: «si entrenar depende de tus ganas, ya perdiste») |
|---|---|
| Gancho | Medidor de «ganas» que sube 0→100 % desde el cuadro 0, se desploma en la palabra clave, se agrieta y cae |
| Lead | Gráfica punteada que cae + la excusa en pastilla, tachada |
| Capítulo 01 | Bloque de color oscuro «01 · Primero» |
| Cuerpo 1 | Metáforas por frase (botón + dedo, globo que revienta, pila de celulares, fila del súper) |
| Loop 1 | Ranking con el 1.º censurado → la barra llena la pantalla → bloque 02 (rojo) |
| Cuerpo 2 | Lluvia de tickets, días vacíos que se derrumban, tragamonedas que se hace polvo → «Hoy» |
| Loop 2 | Cien personas, una se enciende, zoom hacia ella → bloque 03 (acento) |
| Cuerpo 3 (wow) | Celular: inicio → WhatsApp → chat del producto → respuesta → sello ✓ → la burbuja se vuelve renglón |
| CTA | El renglón se vuelve la pieza que encaja en la semana → bloque «1 · hoy» → callback del medidor → tarjeta final |

## Nunca quieto

Si un cuadro se queda quieto se pierde la atención. En todo el reel:
- La cámara siempre se mueve: deriva, zoom o paneo lento aunque no pase nada más.
- Cada 1 a 1.5 s cambia algo en pantalla (entra, sale, se transforma o reacciona un elemento); ninguna toma fija de más de ~1 s.
- Las esperas (tecleo, «escribiendo…», respuesta) llevan movimiento propio: elementos que flotan, zoom que avanza, partículas.
- Subtítulos compactos: palabras juntas (espacio normal), no repartidas a lo ancho.

## Reels sin voz: manda la lectura

En reels de solo texto el ritmo lo pone la velocidad de lectura, no los cortes: unos 2.5–3 s por frase de ~10 palabras en el gancho y el lead. Se alarga estirando la animación (la cámara sigue con deriva), nunca con cuadros quietos. Un arranque de menos de 5 s para dos frases suele sentirse apresurado.
