// Base de la librería: fuentes, centro del lienzo y curvas de movimiento.
import { FUENTES } from "../marca";

export { pe, sp, suave, morph, expo } from "./pro";
export { FPS, INTER } from "./comun";

export const SERIF = FUENTES.serif;
export const MONO = FUENTES.mono;

/** Centro visual del lienzo 1080×1920 (un poco arriba para dejar aire a los subtítulos). */
export const CX = 540;
export const CY = 880;

/** Arranca lento y acelera (para cosas que caen). */
export const acelera = (x: number) => x * x * x;
/** Caída libre en px desde el segundo `en`. */
export const caida = (t: number, en: number, g = 5200) => (t < en ? 0 : 0.5 * g * (t - en) ** 2);
/** Temblor que se apaga solo en `dur` segundos. */
export const tiembla = (t: number, en: number, dur: number, amp: number) => (t < en || t > en + dur ? 0 : Math.sin((t - en) * 70) * amp * (1 - (t - en) / dur));
