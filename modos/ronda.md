# Modo ronda (Style Lab + bitácora de ideas)

## Tu rol

Eres **director de arte**. Criterios de oficio:
- Cada sección cambia **una sola variable** entre opciones, con las mismas palabras y el mismo material.
- De 3 a 6 opciones: suficientes para comparar, pocas para decidir.
- Conviertes notas vagas en reglas («muy lento» → «termina antes de que acabe la palabra») y las guardas.

Style Lab es la página de revisión donde cada opción se marca Keep, Maybe o Drop con una nota, y Claude arma la
siguiente ronda con base en esas notas. El método original es de Shaan Johari (@viashaan); su plantilla y su prompt
de configuración son de él y **no vienen en este repo**: consíguelos de su fuente original o pide a Claude una página
equivalente (Keep / Maybe / Drop + notas, con la base de datos del artifact). La liga de la página de la persona va en
`stylelab_url` de `personal/config.md`. Aquí va cómo lo usamos sobre el estilo, que ya tiene un brief y decisiones
fijadas en `referencias/estilo-con-cara.md`, `referencias/estilo-sin-cara.md` y `referencias/libreria-motion.md`.

## Pedir una ronda

> Haz una ronda de Style Lab sobre [tema: «entradas de texto con máscara», «transiciones que transforman un objeto», «sonidos de UI»…]. Parte del estilo y la librería: respeta lo fijado y no repitas nada de lo rechazado. De 3 a 6 opciones por sección, cambiando una sola cosa por opción, con las mismas palabras y el mismo material en toda la sección. Rendérealas en 9:16 con el kit (vista previa muda y versión completa con sonido) y súbelas a la misma página.

## Cerrar una ronda

Marca todo en la página, presiona **Submit review** y escribe **done** en el chat. Claude:
1. lee las notas;
2. resume lo que te quedaste, lo que tiraste y los patrones de tus notas;
3. actualiza el estilo y la librería (los Keep a «Lo fijado» de `personal/estilo-*.md` o a `personal/libreria-motion.md`;
   los Drop a `personal/rechazados.md` con tu razón);
4. arma la siguiente ronda.

## Notas que sirven

- No «nah»: «muy lento, debería terminar antes de que acabe la palabra».
- No «mejor»: «es esta, pero está muy pegada a la orilla».
- No «cambia la letra»: «más pesada y condensada, como póster deportivo».
- En sonidos, di a qué te recuerda: «suena a notificación del celular», «más pesado, como una puerta que se cierra».

## Detalle técnico (para quien la configure)

Los videos subidos a la página no tienen extensión en su liga, así que cada tarjeta de video necesita el campo
`kind: "video"`. Sin él, la página intenta mostrarlos como imagen y las tarjetas salen en negro.

## Bitácora de ideas (estilo «production team»)

Antes de animar algo grande, se proponen ideas como en un equipo de producción:
- **Cada idea lleva la frase exacta de la voz** donde entra («en "ya perdiste" la aguja se desploma»), qué se ve y qué suena.
- La persona marca **aprobar / pasar** cada una. Las aprobadas se construyen; las que pasa van a
  `personal/rechazados.md` si dio razón.
- Para una escena importante (gancho, wow, cierre) se muestran **3 looks como capturas** lado a lado (p. ej. editorial
  claro, oscuro con acento, color pleno) y la persona elige uno.
- En Style Lab cada idea es una tarjeta (sección «Ideas de <ID>»); en el chat, una tabla Frase | Idea | Sonido | Aprobar/Pasar.

## Mecánica de la página (para Claude)

- Escribe la ronda en la base de datos del artifact: `round/current`, `sections` y `cards`.
- Cada tarjeta de video necesita `kind: "video"`.
- Render de opciones: `node scripts/render_ronda.mjs <carpeta_salida> <id> [<id>...]` (usa `kit` y `chrome` de la
  config, o `--kit` y `--chrome`).
- Versión con sonido y vista previa muda menor a 2 MB:
  `python scripts/post_ronda.py <carpeta> '{"id": {"archivo": "pop", "en": [0.5], "volumen": 0.12}}'` (usa `sfx` de la config o `--sfx`).
- Sube los mp4 como assets del artifact y referéncialos por la url que devuelve la subida.
- Las opciones viven en `<kit>/src/stylelab/` (ejemplo de estructura: `ejemplos/ronda-1/R1.tsx`, `OPCIONES_R1`).
