// ─────────────────────────────────────────────────────────────────────────────
// MARCA DE EJEMPLO («Tu marca»). Úsala de punto de partida:
//   1. Copia este archivo como `src/marcas/<tu-id>.ts` (p. ej. `personal.ts`).
//   2. Cambia `id`, nombres, colores, fuentes y logo (cada campo dice qué es).
//   3. Regístrala en `src/marcas/index.ts` y elígela en `src/marca.ts`.
// ─────────────────────────────────────────────────────────────────────────────
import { loadFont as cargarTexto } from "@remotion/google-fonts/Inter";
import { loadFont as cargarSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as cargarMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as cargarTitular } from "@remotion/google-fonts/Outfit";
import { definirMarca } from "./tipos";

export const ejemplo = definirMarca({
  id: "ejemplo",

  nombres: {
    marca: "Tu marca",
    contacto: "Tu marca",
    persona: "Ana",
    firma: "Tu marca · Autor",
  },

  // Cambia los hexadecimales. Deja los claros muy claros y los oscuros muy oscuros para que todo se lea.
  colores: {
    claro: {
      fondo: "#F2F0EB",
      papel: "#FCFBF8",
      superficie: "#F5F3EE",
      texto: "#17181C",
      textoSuave: "#6F6C66",
      linea: "#E0DCD3",
    },
    oscuro: {
      fondo: "#0F1218",
      superficie: "#1C2433",
      texto: "#EEF1F6",
    },
    marca: {
      principal: "#2B3A55",
      principalClaro: "#4A6290",
      acento: "#E2A33B",
      acentoTexto: "#8C6421",
      vivo: "#3FB6E8",
      vivoTexto: "#1B7FAF",
      error: "#D2553B",
    },
  },

  // Vacío = logo vectorial de ejemplo. Para el tuyo: "marcas/ejemplo/logo.svg" (archivo en public/marcas/ejemplo/).
  logo: { archivo: "" },

  // Para cambiar una fuente, cambia el import de arriba (p. ej. "@remotion/google-fonts/Poppins") y sus pesos.
  fuentes: () => ({
    texto: cargarTexto("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] }).fontFamily,
    serif: cargarSerif("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily,
    mono: cargarMono("normal", { weights: ["500"], subsets: ["latin"] }).fontFamily,
    titular: cargarTitular("normal", { weights: ["600", "700", "800", "900"], subsets: ["latin", "latin-ext"] }).fontFamily,
  }),
});
