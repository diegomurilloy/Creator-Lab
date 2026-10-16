// Composiciones del Studio. Agrega tus reels en la carpeta «Mis reels» (ver README: «Agregar un reel»).
import React from "react";
import { Composition, Folder } from "remotion";
import * as Ejemplo from "./ejemplo/Ejemplo";
import { DEMOS_LIBRERIA } from "./libreria/demos";
import { FPS } from "./libreria/base";
import { H, W } from "./libreria/tema";

export const Root: React.FC = () => (
  <>
    <Folder name="Libreria">
      {DEMOS_LIBRERIA.map((d) => (
        <Composition key={d.id} id={`lib-${d.id}`} component={d.comp} durationInFrames={Math.round(d.segundos * FPS)} fps={FPS} width={W} height={H} />
      ))}
    </Folder>
    <Folder name="Ejemplo">
      <Composition id="ejemplo-reel" component={Ejemplo.Ejemplo} durationInFrames={Math.round(Ejemplo.DURACION * FPS)} fps={FPS} width={W} height={H} />
    </Folder>
    <Folder name="Mis-reels">{/* <Composition id="mi-reel" component={MiReel} durationInFrames={...} fps={FPS} width={W} height={H} /> */}</Folder>
  </>
);
