// Segunda marca de ejemplo («Tu producto»): muestra cómo convivir con dos marcas (p. ej. tu marca personal y la de
// tu producto) sin mezclar colores ni logos. Usa un logo en archivo: public/marcas/producto/logo.svg.
// Si solo tienes una marca, borra este archivo y su línea en index.ts.
import { loadFont as cargarTexto } from "@remotion/google-fonts/DMSans";
import { loadFont as cargarSerif } from "@remotion/google-fonts/Fraunces";
import { loadFont as cargarMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as cargarTitular } from "@remotion/google-fonts/DMSans";
import { definirMarca } from "./tipos";

export const producto = definirMarca({
  id: "producto",

  nombres: {
    marca: "Tu producto",
    contacto: "Tu producto",
    persona: "Luis",
    firma: "Tu producto · Equipo",
  },

  colores: {
    claro: {
      fondo: "#EEF3EF",
      papel: "#FBFDFB",
      superficie: "#F3F7F4",
      texto: "#122019",
      textoSuave: "#5F6F66",
      linea: "#D7E2DA",
    },
    oscuro: {
      fondo: "#0C1410",
      superficie: "#16251D",
      texto: "#EAF4EE",
    },
    marca: {
      principal: "#1F5C45",
      principalClaro: "#2F8063",
      acento: "#F06A4A",
      acentoTexto: "#B5432A",
      vivo: "#4ADE9B",
      vivoTexto: "#1A8A5A",
      error: "#D9433B",
    },
  },

  logo: { archivo: "marcas/producto/logo.svg" },

  fuentes: () => ({
    texto: cargarTexto("normal", { weights: ["400", "500", "700", "800"], subsets: ["latin"] }).fontFamily,
    serif: cargarSerif("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily,
    mono: cargarMono("normal", { weights: ["500"], subsets: ["latin"] }).fontFamily,
    titular: cargarTitular("normal", { weights: ["700", "800", "900"], subsets: ["latin", "latin-ext"] }).fontFamily,
  }),
});
