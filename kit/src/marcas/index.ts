// Registro de marcas. Cada marca nueva: crea `src/marcas/<id>.ts` (copia ejemplo.ts) y agrégala aquí.
import { ejemplo } from "./ejemplo";
import { producto } from "./producto";

export const marcas = {
  ejemplo,
  producto,
  // personal,   ← así se agregan las tuyas (y su import arriba)
};

export type IdMarca = keyof typeof marcas;
