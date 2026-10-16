// Molde de una marca. No necesitas tocar este archivo: copia `ejemplo.ts`, cambia los valores y regístrala en index.ts.

/** Lo que escribe cada persona en `src/marcas/<id>.ts`. */
export type DefinicionMarca = {
  /** Identificador corto, igual al nombre del archivo y de la carpeta `public/marcas/<id>/`. */
  id: string;

  /** Nombres que aparecen en pantalla. */
  nombres: {
    /** Nombre de la marca (debajo del logo, firma de los comentarios). */
    marca: string;
    /** Nombre del contacto en los chats de WhatsApp (quien contesta). */
    contacto: string;
    /** Persona de ejemplo (contadores de deuda, historias). */
    persona: string;
    /** Firma de la respuesta en el CTA de comentarios. */
    firma: string;
  };

  colores: {
    /** Modo claro: escenas sobre fondo claro. */
    claro: {
      /** Lienzo de las escenas. */
      fondo: string;
      /** Tarjetas, hojas y pantallas (un poco más claro que el fondo). */
      papel: string;
      /** Superficie de las apps dentro del celular (entre fondo y papel). */
      superficie: string;
      /** Texto principal. */
      texto: string;
      /** Texto secundario y etiquetas. */
      textoSuave: string;
      /** Líneas, bordes y rejillas. */
      linea: string;
    };
    /** Modo oscuro: escenas nocturnas, tarjetas oscuras, cronómetro. */
    oscuro: {
      /** Fondo de las escenas oscuras. */
      fondo: string;
      /** Superficies oscuras (cronómetro, manga de la mano, tarjetas). */
      superficie: string;
      /** Texto sobre oscuro. */
      texto: string;
    };
    /** Colores de identidad. */
    marca: {
      /** Color principal (bloques, botones, pastillas). */
      principal: string;
      /** Variante más clara del principal. */
      principalClaro: string;
      /** Acento (rellenos, monedas, resaltados). */
      acento: string;
      /** Acento legible como texto sobre claro. */
      acentoTexto: string;
      /** Destacado vivo para escenas oscuras y palabras clave (*así* en los textos). */
      vivo: string;
      /** Destacado vivo legible sobre claro. */
      vivoTexto: string;
      /** Solo para errores, tachones y alertas. */
      error: string;
    };
  };

  /**
   * Logo. `archivo` vacío = logo vectorial de ejemplo (LogoMarca). Para el tuyo, pon un SVG o PNG cuadrado en
   * `public/marcas/<id>/` y escribe su ruta relativa a `public/`, p. ej. "marcas/mimarca/logo.svg".
   */
  logo: { archivo: string };

  /**
   * Fuentes de Google Fonts. Va dentro de una función para que solo se descarguen las de la marca activa.
   * Cada valor es el `fontFamily` que devuelve `loadFont(...)` de `@remotion/google-fonts/<Fuente>`.
   */
  fuentes: () => { texto: string; serif: string; mono: string; titular: string };
};

/** Una marca lista para usar: lo que escribiste + las claves internas que usan los componentes. */
export const definirMarca = (d: DefinicionMarca) => d;

export const resolverMarca = (d: DefinicionMarca) => {
  const { claro, oscuro, marca } = d.colores;
  const fuentes = d.fuentes();
  // Vista plana de los colores (la usan tema.ts y las piezas oscuras).
  const COLORES = {
    fondo: claro.fondo,
    papel: claro.papel,
    superficie: claro.superficie,
    texto: claro.texto,
    textoSuave: claro.textoSuave,
    linea: claro.linea,
    noche: oscuro.fondo,
    oscuro: oscuro.superficie,
    claro: oscuro.texto,
    ...marca,
  };
  // Claves internas de la librería (nombres históricos; el comentario dice qué es cada una).
  const MARCA = {
    id: d.id,
    nombre: d.nombres.marca,
    contacto: d.nombres.contacto,
    persona: d.nombres.persona,
    firma: d.nombres.firma,
    logo: d.logo.archivo,
    fondo: claro.fondo,
    hoja: claro.papel,
    tinta: claro.texto,
    sec: claro.textoSuave,
    linea: claro.linea,
    /** Principal. */
    pet: marca.principal,
    petClaro: marca.principalClaro,
    /** Superficie oscura. */
    obs: oscuro.superficie,
    /** Acento. */
    dorado: marca.acento,
    /** Texto sobre oscuro. */
    crema: oscuro.texto,
    error: marca.error,
    /** Acento como texto. */
    arena: marca.acentoTexto,
    noche: oscuro.fondo,
    vivo: marca.vivo,
    vivoTexto: marca.vivoTexto,
  };
  /** Paleta de «app»: pantallas, tarjetas y botones dentro de los celulares. */
  const MARCA_APP = {
    primario: oscuro.superficie,
    arena: marca.acento,
    fondo: claro.papel,
    superficie: claro.superficie,
    texto: claro.texto,
    sec: claro.textoSuave,
    borde: claro.linea,
    crema: oscuro.texto,
  };
  return { MARCA, MARCA_APP, COLORES, FUENTES: fuentes, NOMBRES: d.nombres };
};
