# Prompt 2 · Edición de un reel

Se manda después del motion. Cambia lo que está entre [corchetes].

---

Edita [ID] «[título]» para Reels en Remotion (1080x1920, 30 fps). Material en [carpeta]: toma.mp4, clips/, pantallas/ y motion/ con los tiempos del motion.

1. Corte: quita silencios de más de 0.3 s, muletillas y tomas repetidas, y deja la mejor toma de cada frase. Corta también las pausas de ~0.2 s a media frase (salto + cambio de punch para que no se note). Arma el corte en un mp4 continuo con scripts/corte.py.
2. El video arranca exactamente en el gancho: «[frase del gancho]». Si se grabó distinto, reordena o pon el gancho como texto en pantalla.
3. Del cuadro 0 al segundo 1.5, el texto «[texto corto del gancho]» en Outfit bold, blanco, con la palabra clave en cian #33CCFF, en el tercio superior. El primer cuadro ya se mueve: nada de fade desde negro.
4. Ritmo: algo cambia cada 2 a 3 s (punch 1 · 1.16 · 1 · 1.28 alternado, empuje lento de cámara, tramo sin cara, pantalla flotante o motion).
5. Subtítulos M1 palabra por palabra, debajo de la barbilla, con la palabra clave en cian.
6. Inserta el motion según motion/timestamps.json. El wow cae entre el 50 y el 65 %; si no, reordena el corte (nunca muestres una cifra antes de decirla).
7. Duración de 35 a 60 s; si se pasa, recorta repeticiones antes que contenido.
8. Cierre: «[frase de cierre]», que empate con el inicio para que el video se repita en bucle. Si la toma termina en seco, sostén el último cuadro 0.4 s.
9. Audio: voz a -14 LUFS con scripts/procesar_voz.py ([sin efectos | efectos sutiles 0.08–0.2]).
10. Etalonaje «suave». Exporta H.264 1080x1920: final vN.mp4 y final vN MASTER alta calidad.mp4. Verifica con mpdecimate que no haya cuadros repetidos.
11. Antes del render final muéstrame 4 capturas: gancho, una escena media, el wow y el cierre.
