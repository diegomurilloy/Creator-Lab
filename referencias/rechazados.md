# Lo rechazado (y por qué) · para cualquiera

Cosas que se probaron en reels reales y no funcionaron, por razones que aplican a cualquier cuenta. No las vuelvas a
proponer sin que la persona lo pida. **Lo que rechaza la persona va en `personal/rechazados.md`** (se leen los dos).

## Reels con cara y portadas

| Se probó | Por qué no |
|---|---|
| Etalonaje «cosy» ámbar | Se ve como filtro naranja, no como iluminación |
| Íconos de línea delgada | Se ven feos y genéricos; van rellenos con degradado |
| Emojis dentro de los gráficos | Se ven baratos y cambian según el teléfono |
| Un acento claro apagado en subtítulos | Se pierde; los subtítulos piden el acento más vivo de la paleta |
| El chat de WhatsApp chiquito flotando dentro del celular | Tiene que llenar la pantalla del celular |
| «Cámara pegada que se aleja» para comparar tamaños | No se entiende; mejor escala real desde el inicio |
| Gráficos grises sobre una pared clara | Ilegibles; van sobre panel oscuro |
| Efectos de sonido fuertes | Distraen; volumen 0.05–0.2 |
| dynaudnorm o speechnorm para estabilizar la voz | Suben el ruido de las pausas |
| `afftdn nf=-32` | Opaca la voz ~3 dB |
| Portadas con la persona chica y un solo objeto | Se sienten vacías |
| Caras neutras, serias o a media palabra en portada | Se ven extrañas aunque el tema sea serio |
| Recortes de UI como recuadro blanco con fondo | Feo; van recortados a su forma y uno detrás de la persona |
| Texto letra por letra | Efectista; la palabra es la unidad |
| Renglón que sube inclinado | Efectista |
| «Dominó» con golpe y física | Se siente hecho; mejor empujes suaves |
| Sacudidas decorativas en tarjetas y pastillas | Lo efectista resta calidad |
| Grabaciones con clientes reales | Privacidad: solo cuentas de prueba |

## Reels sin cara

| Se probó | Por qué no |
|---|---|
| Página tipo Notion con el guion escrito en pantalla | Un reel no es un carrusel |
| Reel cinético sin subtítulos ni música | Faltan: subtítulos normales siempre, música siempre |
| Un objeto quieto que aparece como gancho (p. ej. una batería que se vacía) | No detiene el scroll |
| Cortes secos entre escenas / escenas encimadas | Se siente brusco; mejor cámara continua |
| Ícono genérico de 24 px y flechas curvas a mano | Feos; ilustraciones con oficio |
| WhatsApp aproximado y logo en PNG borroso | Hay que clonar la UI y usar el logo vectorial |
| Contador que oscila (99↔100, rebote en el número) | Se ve tembloroso; el rebote va solo en la pieza física |
| Loops que solo oscurecen la pantalla | Sin impacto; necesitan curiosity gap visual |
| Cierre con un ícono chico + logo | Flojo; cierre con callback y tarjeta final |
| Interpolar entre colores lejanos (rojo→petróleo) | Da café lodoso |

## Carruseles

| Se probó | Por qué no |
|---|---|
| Escáner, barrido de fondo o glitch | Se ve barato |
| Números con contorno en Outfit | Las líneas se cruzan por dentro; mejor números sólidos o barra de pasos |
| Animar el texto | Una animación por lámina, sobre el visual |

## Videos de lanzamiento y producto

| Se probó | Por qué no |
|---|---|
| Comercial con títulos de función («01 · REGISTRA», «02 · AVISA») | Se siente anuncio; mejor la historia de una persona con las funciones como escenas de su vida |
| Arrancar con calma o con el logo quieto | Se pierde el scroll; el cuadro 0 ya se mueve y la voz o una pregunta entra en el primer segundo |
| Texto desenfocado en reposo (foco selectivo sobre lo que se lee) | No se lee; el foco se hace con escala, luz y viñeta. El blur solo en fondos o como motion blur en movimiento |
| Trama halftone o de puntos sobre la escena | Se ve sucia y barata en un video que quiere verse premium |
| Líneas, flechas o círculos que guían la vista hacia la UI | Estorban; la UI grande y nítida se explica sola con una frase al lado |
| Zoom a un mensaje o a una parte de la pantalla | Corta la UI y marea; el celular se ve completo y grande |
| Zoom de ida y vuelta (entra, sale, vuelve a entrar) en la misma escena | Se ve raro; un solo movimiento de cámara por escena |
| Ráfagas de elementos que duran menos de lo que tarda leerlos | No se entienden; cada elemento se queda al menos 0.85–1.2 s |
| Burbujas de chat encimadas | El hilo necesita layout real: alturas, separación y scroll |
| Texto o celular pegado o cortado por el borde | Se siente descuidado; margen de al menos 60 px en todo el cuadro |
| Logo que se desvanece o se deforma para volverse otra cosa | Se ve horrible; el logo es un elemento continuo que viaja y aterriza en su lugar, siempre por delante (z-order) |
| UI aproximada o navegación inventada | Delata que no es el producto; se clona exacta del código real, barra de navegación incluida |
| Respuestas del producto escritas «como sonarían» | Si no son literales del código, prometen algo que no pasa |
| Texto en pantalla que repite lo que dice la voz | Redundante; el texto explica lo que hace la UI |
| Música que cambia de sección a media escena | Rompe la escena; música continua que crece y cambia solo entre escenas |
| Rebobinado con corte o fundido | No se lee como «regresar el tiempo»; va en reversa acelerada con rampa |
| Galaxia o remolino de tarjetas que gira sin parar | No se alcanza a ver ninguna; avanza por pasos: gira → se detiene al frente → gira |
| Notificaciones apiladas en stack comprimido cuando se busca acumulación | No se siente el peso; en cascada, cada una visible completa |
| Renderizar en 4K en cada ronda | Lento y caro; se itera en baja y el 4K va al final, cuando se aprueba |
