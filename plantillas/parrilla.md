# La parrilla (Google Sheets) · mapa base

Mapa de columnas que usa Creator Lab por defecto. Si tu hoja usa otras, copia este archivo a `personal/parrilla.md` y
cámbialo (el onboarding lo hace por ti). El id de la hoja va en `sheets_id` de `personal/config.md`. Se lee y escribe
con el conector de Google Sheets (`get_values`, `update_values`, `batch_update`…).

## Pestañas

| Pestaña | Qué tiene |
|---|---|
| **Parrilla** | la tabla maestra, una fila por pieza |
| **Guiones** | guion completo por pieza |
| Ganchos virales | fórmulas de gancho (`referencias/ganchos.md`) |
| Carruseles | contenido de láminas |
| Estrategia | objetivo, cadencia, series, voz, datos verificados, palabras clave |
| **Resultados** | métricas por pieza a 7 días (modo `insights`) |
| Análisis | tablas que se arman solas desde Resultados (fórmulas: no se escribe) |

## Columnas de Parrilla (fila 1 = encabezados)

- **A–I:** A ID · B Fecha («lun 12 oct») · C Hora («19:00») · D Semana · E Pieza · F Status · G Quién lo hace · H Formato · I Cara.
- **J–S:** J Dónde se publica · K Pilar · L Serie · M Tema de la semana · N Gancho viral (lo que dices) · O Fórmula de gancho · P Texto en pantalla (0 a 1.5 s) · Q Primer cuadro · R Narrativa · S Cierre / CTA.
- **T–AF:** T Producción · U Lo que necesito de ti · V Rodaje · W Entrega · X Relación con el ancla · Y También en · Z Notas · AA Nivel de motion · AB Momento wow · AC–AE Links (Instagram, TikTok, LinkedIn) · AF Fecha (fecha).
- **AG–AP:** AG Prompt de edición · AH Prompt de motion graphics · AI Guion completo (de Guiones) · AJ Caption · AK Serie de portada · AL Portada: línea chica · AM línea grande · AN línea de tensión · AO Portada: objeto · AP Portada: cara (cuadro a elegir).

**Celdas con fórmulas:** anota aquí las que no se tocan (p. ej. «AO2 lleva un ARRAYFORMULA: no escribas debajo»).

## Columnas de Resultados

- **A–F:** ID · Pieza · Fecha · Formato · Pilar · Nivel de motion.
- **G–O:** Alcance · Reproducciones · Retención a 3 s (%) · Tiempo medio visto (s) · Compartidos · Guardados · Comentarios · Visitas al perfil · Seguidores ganados.
- **P–S:** DMs por palabra clave · Compartidos por 1,000 · Guardados por 1,000 · Seguidores por 1,000.
- **T–Z:** Cuenta · Fórmula de gancho · Serie · Hora · Gancho dicho · Diagnóstico · Qué aprendí (tú).

## IDs

Un prefijo por tipo de pieza o por cuenta. Ejemplo:

| Prefijo | Qué |
|---|---|
| P## | reels del perfil personal |
| C## | carruseles (láminas en `laminas/`) |
| M## | piezas de la cuenta de la marca o producto |

## Carpetas de pieza

`<carpeta_contenido>/AAAA-MM-DD HHMM ID - Pieza` (el título sin `\ / : * ? " < > | « » ¿`, cortado si es muy largo).

- **Reels:** `clips/ pantallas/ motion/`.
- **Carruseles:** `laminas/`.

Se crean y reprograman con `scripts/nueva_pieza.py`: lee las filas de la parrilla y renombra cuando cambia la fecha. Nunca borra.

## Reglas al escribir

- Primero muestra a la persona las celdas y valores; escribe cuando confirme.
- Respeta el formato de fecha («mié 14 oct») y de hora («12:30»).
- El guion reescrito va a la pestaña **Guiones** y su resumen a «Gancho viral», «Narrativa» y «Cierre / CTA» de la Parrilla.
