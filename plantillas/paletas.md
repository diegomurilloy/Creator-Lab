# Paletas · [Tu nombre]

Tus colores y tipografías por cuenta. La skill los lee **siempre** antes de elegir un color. Si tu kit de Remotion
tiene la marca en `src/marcas/<id>.ts`, cuando cambies un color aquí cámbialo también ahí (la skill te lo recuerda).
Revisa que el texto pase contraste AA (≥ 4.5:1) con `python scripts/contraste_panel.py`.

## [Marca personal] · claro

| Token | Hex | Uso |
|---|---|---|
| fondo | `#______` | fondo de carruseles, portadas y escenas claras |
| tarjeta | `#______` | tarjetas y paneles |
| texto | `#______` | titulares y texto |
| secundario | `#______` | texto de apoyo, etiquetas |
| líneas | `#______` | bordes, divisores, retícula |
| acento (texto) | `#______` | palabra clave en texto sobre claro (versión oscura del acento si el de relleno no se lee) |
| acento (rellenos) | `#______` | barras, pastillas, rellenos |
| error | `#______` | errores, «lo que falla», tachados |

## [Marca personal] · oscuro

| Token | Hex | Uso |
|---|---|---|
| fondo | `#______` | fondos oscuros, apagones de loops |
| tarjetas | `#______` | paneles sobre video |
| texto | `#______` | texto sobre oscuro |
| secundario | `#______` | apoyo |
| líneas | `#______` | bordes |
| acento | `#______` | palabra clave, subtítulo activo |
| error | `#______` | errores sobre oscuro |

## [Otra marca o producto]

(Copia una tabla por cada marca de `marcas` en tu config.)

## Tipografía

| Para qué | Fuente | Pesos |
|---|---|---|
| Títulos | [p. ej. Outfit] | [700, 900] |
| Texto y subtítulos | [p. ej. Inter] | [400, 500] |
| Etiquetas, folios, montos | [p. ej. JetBrains Mono] | [500] |

## Logo

[Dónde está tu logo vectorial (SVG) y sus variantes.]

## Portadas

Fondo, tinta y gris de portadas, y un color por serie:

| Serie | Color |
|---|---|
| [serie 1] | `#______` |

## Qué paleta va dónde

| Pieza | Paleta |
|---|---|
| Carruseles del perfil personal | [claro / alternar claro y oscuro] |
| Reels claros del perfil | [claro] |
| Reels oscuros del perfil | [oscuro] |
| Piezas de [producto] | [paleta del producto] |
