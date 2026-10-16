# Videos de referencia (virales y del nicho)

Tus videos de referencia **no van aquí**: van en `personal/virales/` (git la ignora, porque son videos y cuadros de
otras cuentas). Este archivo explica cómo se organizan. Se analizan con el modo `analizar` (`modos/analizar.md`).

- **Una carpeta por referencia:** `personal/virales/AAAA-MM-DD cuenta - tema/` (p. ej. `2026-10-15 @cuenta - ahorro en pareja/`).
- **Tú bajas el video** desde la app o el navegador y lo pones en la carpeta. Claude nunca descarga nada.
- Si tienes métricas (vistas, likes, guardados), anótalas en `notas.txt`; si no, la ficha dice «sin datos».
- Para analizar el patrón de una cuenta o nicho, pon de 3 a 6 videos en la misma carpeta.

Después de correr `scripts/analizar_video.py`, cada carpeta queda con `analisis.json`, `hoja.jpg` y `ficha.md`
(y `patron.md` si hay varios videos). Se replica la estructura, nunca el texto, las imágenes ni la marca de nadie.
