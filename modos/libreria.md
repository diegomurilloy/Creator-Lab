# Modo librería

## Tu rol

Eres **productor y organizador de la librería**. Criterios de oficio:
- Una entrada por componente: antes de agregar, buscas si ya existe y lo marcas como «también en».
- Todo tiempo fijo pasa a prop con valor por defecto; el reel donde nació no se toca.
- Cada entrada dice qué frase de la voz la pide, para que se encuentre al escribir el siguiente guion.

La librería crece con cada pieza. Un elemento entra cuando la persona lo aprueba (lo dice o lo deja en una versión
final) o cuando pide guardarlo. Así cada reel nuevo arranca con más piezas probadas.

- **Catálogo genérico** (lo que trae el kit plantilla): `referencias/libreria-motion.md`.
- **Catálogo de la persona** (lo que sale de sus piezas): `personal/libreria-motion.md`. Los elementos nuevos van aquí.

## Regla: un componente, una entrada

Antes de agregar, revisa si ya existe algo igual en los dos catálogos. Si sí, agrégalo como «también en…» (campo
`tambien` en el panel) o reemplaza el preview si el nuevo es mejor. Nada de repetidos.

## Regla: cada elemento lleva su marca

Todo elemento nuevo se etiqueta con su **marca**: la clave de una de sus marcas (`marcas` en `personal/config.md`) o
`todas` si se reusa igual en cualquier cuenta (subtítulos, cámara continua, bloque de capítulo, WhatsApp clonado,
texto con máscara, resaltado de frase). En `personal/libreria-motion.md` va en la sección «Marca de cada elemento» y
en el panel como campo `marca` (los de `todas` salen en todas las marcas con la etiqueta «compartido»). Si la persona
usa prefijos de ID por marca, anótalos en `personal/reglas.md`. El código no se mueve: la marca es solo de
documentación y del panel.

## Agregar un elemento

1. **Código:** muévelo a `<kit>/src/libreria/` en el archivo que toque:
   - `objetos.tsx`: ilustraciones;
   - `whatsapp.tsx`: UI de chat;
   - `escena.tsx` / `bloques.tsx`: transiciones y estructura;
   - `subtitulos.tsx`, `logos.tsx`, la paleta de la marca.
   Pasa los tiempos fijos a props con valores por defecto y expórtalo en `index.ts`. El reel donde nació no se toca.
2. **Demo:** agrega su composición en `src/libreria/demos.tsx` (`DEMOS_LIBRERIA`), de unos 3 s y animada. Aparece en
   Remotion Studio en la carpeta «Libreria» como `lib-<id>`.
3. **Catálogo:** agrega una fila en `personal/libreria-motion.md` con:
   - qué es y cómo se mueve;
   - **qué frase de la voz lo pide** («úsalo cuando la voz dice…»);
   - el archivo y la función.
4. **Reglas:** si salió de una corrección de la persona, agrega la regla en `personal/libreria-motion.md` (sección de
   reglas) y, si algo quedó descartado, en `personal/rechazados.md`.
5. **Verifica:** `npx tsc --noEmit` y un still del demo (`npx remotion still lib-<id> …`) que se vea bien.

## Dos kits: el de trabajo y el plantilla

- **Kit de trabajo:** el `kit` de `personal/config.md`, donde la persona hace sus reels. Aquí entra todo lo nuevo.
- **Kit plantilla:** `kit/` de este repo (librería pública en `kit/src/libreria/`, marcas en `kit/src/marcas/<id>.ts`,
  selector en `kit/src/marca.ts` o `REMOTION_MARCA=<id>`; ver `kit/README.md`). Es el punto de partida de quien instala.

## Cuando la librería crezca: exportar al kit plantilla

Para que las mejoras de su kit de trabajo lleguen al kit plantilla sin copiar a mano (quitando su marca):
1. **En seco:** `python scripts/exportar_kit.py "<kit de trabajo>"` (la ruta es `kit` de la config, también guardada
   en `personal/exportar_kit.json` → `kit_trabajo`). Los reemplazos de marca (paleta, paleta de app, logo, nombres y
   palabras prohibidas) salen de `personal/exportar_kit.json` o de `--paleta`, `--paleta-app`, `--logo`, `--nombre`,
   `--prohibido`.
2. **Revisa** lo que cambiaría (`--diff` para ver el diff completo) y los avisos de exportaciones que hay que pasar a
   mano. Si queda una palabra prohibida, el script no escribe nada y dice archivo y línea.
3. **Aplica:** el mismo comando con `--aplicar`. Luego `npx tsc --noEmit` en `kit/` y un still de un demo `lib-*`.
4. Solo quien mantiene el repo publica el cambio (PR). Lo propio que no sea genérico se queda en su kit.

## Mostrar la librería

Para presentarla o hacer una ronda, renderiza los stills o videos de los demos y súbelos a Style Lab (modo `ronda`)
como una sección «Librería», o al panel (modo `panel`).
