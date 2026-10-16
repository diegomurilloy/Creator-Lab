# Creator Lab · kit de video

Kit plantilla de [Remotion](https://www.remotion.dev/) para reels verticales (1080×1920, 30 fps): una librería de
motion probada en reels reales, demos de cada pieza, un reel de ejemplo sin voz y 12 efectos de sonido propios.
Todo toma los colores, fuentes, logo y nombres de **tu marca**, y puedes tener varias (p. ej. tu marca personal y
la de tu producto) sin mezclarlas.

## Requisitos

- Node.js 18 o más reciente.
- Chrome no es obligatorio: Remotion descarga su propio Chrome headless la primera vez. Si prefieres usar el
  tuyo, pon su ruta en la variable de entorno `REMOTION_CHROME`.

## Instalar y abrir

```bash
cd kit
npm install
npm run studio
```

Se abre el Studio en el navegador. Ahí ves tres carpetas:

- **Libreria**: una demo corta por pieza (`lib-*`).
- **Ejemplo**: `ejemplo-reel`, un reel completo de 21 s sin voz (cronómetro, app genérica y chat).
- **Mis-reels**: vacía, para los tuyos.

## Personaliza tu marca, paso a paso

Las marcas viven en `src/marcas/`. Cada una es un archivo con comentarios que dicen qué es cada campo.
`src/marca.ts` decide cuál se usa.

1. **Cambia los colores.** Abre `src/marcas/ejemplo.ts` y cambia los hexadecimales de `colores`:
   `claro` (escenas sobre fondo claro), `oscuro` (escenas nocturnas y tarjetas oscuras) y `marca` (principal,
   acento, destacado vivo y error). Guarda: el Studio se actualiza solo.
2. **Cambia las fuentes.** En el mismo archivo, cambia los `import { loadFont ... } from "@remotion/google-fonts/<Fuente>"`
   por las fuentes de Google Fonts que quieras (p. ej. `Poppins`, `Fraunces`, `DMSans`) y ajusta los pesos en
   `fuentes`. Si un peso no existe, `npx tsc --noEmit` te lo dice.
3. **Pon tu logo.** Copia tu logo cuadrado (SVG o PNG) a `public/marcas/<id>/logo.svg` y escribe la ruta en
   `logo: { archivo: "marcas/<id>/logo.svg" }`. Si lo dejas vacío se usa el logo vectorial de ejemplo
   (`src/libreria/logos.tsx`). Cambia también `nombres`: el nombre de la marca, el contacto que contesta en los
   chats, la persona de ejemplo y la firma de los comentarios.
4. **Agrega otra marca.** Copia `src/marcas/ejemplo.ts` como `src/marcas/<id>.ts` (cambia `id` y el nombre de la
   constante), regístrala en `src/marcas/index.ts` y elígela:
   - para siempre: `MARCA_POR_DEFECTO` en `src/marca.ts`;
   - solo para un comando: `REMOTION_MARCA=<id> npm run studio`
     (PowerShell: `$env:REMOTION_MARCA="<id>"; npm run studio`).
   `src/marcas/producto.ts` es una segunda marca de ejemplo que ya usa logo en archivo y otras fuentes.
5. **Borra las de ejemplo.** Cuando tengas la tuya, borra `src/marcas/ejemplo.ts`, `src/marcas/producto.ts`,
   `public/marcas/producto/` y sus líneas en `src/marcas/index.ts`, y pon tu `id` en `MARCA_POR_DEFECTO`.

Comprueba con `npx tsc --noEmit` que todo sigue en orden.

## Agregar un reel

1. Crea `src/reels/MiReel.tsx`. Lo más rápido es copiar `src/ejemplo/Ejemplo.tsx` y cambiar textos y tiempos.
   Los tiempos se escriben en segundos (`const t = useCurrentFrame() / FPS`) y las piezas se importan de
   `./libreria` (o `../libreria` según la carpeta):

   ```tsx
   import { AbsoluteFill, useCurrentFrame } from "remotion";
   import { FPS, MARCA, SERIF, pe } from "../libreria";
   import { TextoMascara } from "../libreria/pro";

   export const DURACION = 6;
   export const MiReel: React.FC = () => {
     const t = useCurrentFrame() / FPS;
     return (
       <AbsoluteFill style={{ background: MARCA.fondo, justifyContent: "center", alignItems: "center" }}>
         <div style={{ fontFamily: SERIF, fontSize: 120, color: MARCA.tinta, opacity: pe(t, 0, 0.4) }}>
           <TextoMascara t={t} en={0.1} texto="Tu idea en *un reel.*" colorClave={MARCA.vivoTexto} />
         </div>
       </AbsoluteFill>
     );
   };
   ```

2. Regístralo en `src/Root.tsx`, dentro de la carpeta `Mis-reels`:

   ```tsx
   <Composition id="mi-reel" component={MiReel} durationInFrames={Math.round(DURACION * FPS)} fps={FPS} width={W} height={H} />
   ```

Para reels con cara, `src/libreria/comun.tsx` trae `crearEdicion` (cortes sobre un video continuo, punch-in,
zooms, etalonaje, efectos de sonido y subtítulos) y overlays listos: `NotificacionIOS`, `HojaEnviar`,
`BurbujaSuelta`, `FondoPleno` y `ComentarioCTA`. Pon tus videos en `public/` (no se suben al repo si los dejas en
una carpeta ignorada).

Los subtítulos usan palabras con tiempos `[{ "text", "startMs", "endMs" }]`, como
`src/libreria/palabras-ejemplo.json`.

## Efectos de sonido

`public/sfx/` trae 12 WAV sintetizados propios (ver `public/sfx/LICENSE.md`). Úsalos con `<Audio>` de
`@remotion/media`:

```tsx
import { Audio } from "@remotion/media";
import { Sequence, staticFile } from "remotion";

<Sequence from={45} layout="none"><Audio src={staticFile("sfx/pop.wav")} volume={0.35} /></Sequence>
```

## Renderizar

```bash
# Un cuadro (para revisar)
npx remotion still ejemplo-reel out/ejemplo.png --frame=200

# El video completo
npx remotion render ejemplo-reel out/ejemplo.mp4

# Con otra marca
REMOTION_MARCA=producto npx remotion render ejemplo-reel out/ejemplo-producto.mp4
```

La carpeta `out/` está ignorada por git.

## Estructura

```
src/
  marca.ts          selector de la marca activa
  marcas/           tus marcas (ejemplo.ts, producto.ts, tipos.ts, index.ts)
  libreria/         piezas de motion (index.ts exporta casi todo; pro.tsx y comun.tsx se importan directo)
  ejemplo/          reel de ejemplo
  Root.tsx          composiciones del Studio
public/
  sfx/              efectos de sonido
  marcas/<id>/      logos y archivos de cada marca
```
