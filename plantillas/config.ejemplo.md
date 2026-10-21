# Configuración de Creator Lab · [Tu nombre]

Copia este archivo a `personal/config.md` (el onboarding lo hace por ti) y llena los valores. La carpeta `personal/`
es tuya y git la ignora: `git pull` nunca la toca. La skill lee este archivo antes que cualquier otro y los scripts
(`scripts/config.py`) sacan de aquí las rutas cuando no les pasas una por argumento.

Formato: una `clave: valor` por renglón dentro del bloque de abajo; lo que va después de `#` es comentario. Si un
valor no aplica, déjalo vacío.

```
# Cómo te llamas y tu usuario principal (sale en el encabezado del panel y en los footers de carruseles)
nombre:
usuario:
# Tus marcas: clave=Nombre, separadas por coma. La primera es la personal.
# Ejemplo: yo=Yo (personal), cafe=Café La Esquina
marcas:
marca_principal:
# Déjalo en no: tus aprendizajes se guardan en personal/ (también los genéricos, en personal/motor-local/).
mantenedor: no
# Se llenan solas: fecha de tu última actualización, tu página de novedades y (opcional) tu índice de artifacts
ultima_actualizacion:
novedades_url:
indice_artifacts_url:

# Rutas (con / aunque estés en Windows)
# Carpeta donde vive una carpeta por pieza («AAAA-MM-DD HHMM ID - Pieza»)
carpeta_contenido:
# Tu proyecto de Remotion (puede ser una copia de kit/ de este repo)
kit:
# Carpeta de efectos de sonido (por defecto <kit>/public/sfx)
sfx:
# De dónde sueles pasar tus tomas y videos de referencia
descargas:
# Navegador para renderizar (opcional: si lo dejas vacío, Remotion usa el suyo)
chrome:

# Parrilla en Google Sheets (opcional; si no tienes, el onboarding te arma una)
sheets_id:
sheets_nombre:
# Quién hace las piezas que nueva_pieza.py --todas toma como tuyas (columna «Quién lo hace»), separadas por coma
quien_hace:
# Año en que empieza tu parrilla y mes de corte: los meses menores al corte cuentan como del año siguiente
# (para una parrilla de enero a diciembre, deja parrilla_mes_corte: 1)
parrilla_anio:
parrilla_mes_corte: 1

# Páginas (artifacts de claude.ai). Las crea la skill y aquí guarda la liga.
panel_url:
stylelab_url:
```

## Qué más va en `personal/`

El onboarding copia aquí las plantillas de `plantillas/` y las llena contigo:

| Archivo | Qué es |
|---|---|
| `marca.md` | Tu perfil «Tú eres el nicho» (mensaje, pilares, avatar, historias, ancla, voz, cuentas). |
| `paletas.md` | Tus colores y tipografías, y qué paleta va en qué pieza. |
| `parrilla.md` | Las pestañas y columnas de tu Sheets (si difieren del mapa base). |
| `ganchos.md` | Tus ejemplos para cada fórmula y tus fórmulas nuevas. |
| `libreria-motion.md` | Los elementos que salieron de tus piezas. |
| `rechazados.md` | Lo que ya descartaste y por qué. |
| `aprendizajes.md` | Bitácora de lo que vas aprendiendo con tus métricas reales. |
| `reglas.md` | Tus reglas propias (colores que solo usa una cuenta, lo que nunca quieres ver…). |
| `marcas/<marca>/` | Marca visual extraída de tu página (`scripts/extraer_marca.py`). |
| `virales/` | Videos de referencia que bajas tú, con su análisis y su ficha. |
