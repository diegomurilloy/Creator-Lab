# Transcribe una toma con tiempos por palabra (faster-whisper, corre local en CPU).
# Uso: python transcribir.py toma.mp4 palabras.json [modelo=medium] [contexto]
#   contexto (opcional): nombres propios o jerga que el modelo debe escribir bien, p. ej. "MiMarca, WhatsApp".
# Salida: lista JSON de {"text", "startMs", "endMs"}; imprime cada palabra con su segundo para revisarla.
# Revisa SIEMPRE el resultado contra el guion: los números y los nombres son lo que más falla.
import json
import subprocess
import sys

import numpy as np
from faster_whisper import WhisperModel

src, out = sys.argv[1], sys.argv[2]
modelo = sys.argv[3] if len(sys.argv) > 3 else "medium"
contexto = sys.argv[4] if len(sys.argv) > 4 else None

# Se decodifica con ffmpeg a PCM: pasarle el archivo directo a faster-whisper falla con algunos .mov/.mp4.
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768

m = WhisperModel(modelo, device="cpu", compute_type="int8")
segs, _ = m.transcribe(audio, language="es", word_timestamps=True, vad_filter=False, beam_size=5, initial_prompt=contexto)
palabras = [{"text": w.word.strip(), "startMs": round(w.start * 1000), "endMs": round(w.end * 1000)} for s in segs for w in s.words]
json.dump(palabras, open(out, "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(" ".join(f"{w['text']}@{w['startMs'] / 1000:.2f}" for w in palabras))
