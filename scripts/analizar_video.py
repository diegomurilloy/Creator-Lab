# Analiza un video de referencia (viral o del nicho) que la persona ya descargó y lo deja listo para llenar su ficha.
# Uso: python analizar_video.py video.mp4 carpeta_salida [--modelo small] [--contexto "MiMarca, WhatsApp"]
#                               [--umbral 0.3] [--k 4] [--toma-min 0.12] [--sin-transcripcion] [--sin-hoja-ritmo]
# Salida en carpeta_salida:
#   analisis.json     → duración, ritmo de voz, eventos visuales (cortes, transiciones, movimiento), ritmo por tramo,
#                       silencios, estimación de música y transcripción con tiempos por palabra;
#   hoja.jpg          → hoja de cortes: un cuadro por segundo en el gancho (0–3 s) y uno por corte o transición (máx. 24);
#   hoja-ritmo-N.jpg  → hojas densas: un cuadro cada 0.5 s (24 por hoja) para ver TODO el video, con el texto en pantalla;
#   ficha.md          → borrador con los datos medidos y las secciones vacías que Claude llena (ver modos/analizar.md).
# Detección visual (una sola decodificación a 160 px de ancho), con dos señales independientes por cuadro:
#   1) puntaje de escena de ffmpeg (diferencia de píxeles) con umbral adaptativo: mediana móvil + k·MAD, además del
#      umbral absoluto (--umbral);
#   2) diferencia de histograma de color HSV entre cuadros consecutivos, que confirma cortes y ve cambios de color/flash.
#   Cada tramo de cuadros «agitados» se clasifica: corte duro (1–2 cuadros), transición (zoom/barrido/flash: cambio
#   sostenido de 2–8 cuadros) o movimiento continuo (más de 8 cuadros). Dos cortes a menos de --toma-min s son uno solo.
# Solo archivos locales: nunca descarga nada. Si le pasas una URL, te pide que descargues el video a mano.
# La transcripción reusa la lógica de transcribir.py (faster-whisper local, PCM por ffmpeg); revisa nombres y cifras.
import argparse
import io
import json
import math
import os
import re
import subprocess
import sys
import tempfile
from datetime import date
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

SILENCIO_MIN = 0.4  # s: hueco entre palabras que cuenta como silencio
MAX_CORTES_HOJA = 24
GANCHO_S = 3
LEAD_S = 10

# Detección visual
ANCHO_ANALISIS = 160      # px: resolución a la que se miden las dos señales
VENTANA_S = 1.0           # s: ventana de la mediana móvil (centrada)
PISO_ESCENA = 0.02        # el umbral adaptativo nunca baja de aquí (ruido de compresión)
PISO_HIST = 0.06
PISO_MOV = 3.0            # niveles de gris: el umbral adaptativo de movimiento nunca baja de aquí
CONFIRMA_HIST = 0.10      # diferencia de histograma que confirma un corte visto por la escena
HIST_FUERTE = 0.30        # un salto de color así es corte aunque la escena no lo vea (mismo brillo, otro color)
CORTE_MIN = 0.03          # un pico aislado por debajo de esto no es corte (parpadeo, ruido)
PICO_RELATIVO = 3.0       # un corte en el mismo encuadre (jump cut) vale al menos 3× sus vecinos en escena y movimiento
TRANS_MAX_CUADROS = 8     # 2–8 cuadros agitados con cambio sostenido = transición
FLASH_LUMA = 25           # niveles de gris (0–255) que sube o baja el brillo dentro de una transición tipo flash
CAMBIO_SOSTENIDO_HIST = 0.08
CAMBIO_SOSTENIDO_PIX = 10  # niveles de gris de diferencia media entre el cuadro antes y el cuadro después
QUIETO = 0.6              # niveles de gris: diferencia media entre cuadros por debajo de esto = imagen quieta
QUIETO_MIN_S = 0.5

# Hojas de ritmo
RITMO_PASO_S = 0.5
RITMO_POR_HOJA = 24
RITMO_ANCHO = 240


def sh(cmd, texto=True):
    return subprocess.run(cmd, capture_output=True, text=texto, encoding="utf-8" if texto else None, errors="replace" if texto else None)


def probe(f):
    r = sh(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height,r_frame_rate", "-of", "json", f])
    info = json.loads(r.stdout or "{}")
    streams = info.get("streams", [])
    v = next((s for s in streams if s.get("codec_type") == "video"), None)
    a = any(s.get("codec_type") == "audio" for s in streams)
    fps = None
    if v and v.get("r_frame_rate") and v["r_frame_rate"] != "0/0":
        n, d = v["r_frame_rate"].split("/")
        fps = round(float(n) / float(d), 2) if float(d) else None
    out = {
        "duracion": float(info.get("format", {}).get("duration", 0) or 0),
        "video": bool(v),
        "audio": a,
        "ancho": v.get("width") if v else None,
        "alto": v.get("height") if v else None,
        "fps": fps,
    }
    if v:  # tamaño real ya rotado (los videos de celular traen la rotación como metadato)
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
        if raw:
            out["ancho"], out["alto"] = Image.open(io.BytesIO(raw)).size
    return out


def audio_pcm(f):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-vn", "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.int16).astype(np.float32) / 32768


def transcribir(audio, modelo, contexto, idioma):
    from faster_whisper import WhisperModel

    m = WhisperModel(modelo, device="cpu", compute_type="int8")
    segs, _ = m.transcribe(audio, language=idioma, word_timestamps=True, vad_filter=False, beam_size=5, initial_prompt=contexto)
    return [{"text": w.word.strip(), "startMs": round(w.start * 1000), "endMs": round(w.end * 1000)} for s in segs for w in (s.words or [])]


# ---------------------------------------------------------------- señales por cuadro


def alto_par(ancho, info):
    h = round(ancho * (info["alto"] or 16) / (info["ancho"] or 9))
    return max(2, h - h % 2)


def histograma_hsv(rgb):
    """Histograma normalizado H (pesado por saturación, 24 bins) + S (8) + V (8). El tono de un gris es ruido,
    por eso pesa la saturación."""
    hsv = np.asarray(Image.fromarray(rgb).convert("HSV"))
    hh, ss, vv = hsv[..., 0].ravel(), hsv[..., 1].ravel(), hsv[..., 2].ravel()
    w = ss.astype(np.float64)
    h_hist = np.bincount(hh // 11, weights=w, minlength=24)[:24]
    tot = h_hist.sum()
    h_hist = h_hist / tot if tot > len(hh) * 8 else np.zeros(24)  # casi sin color: el tono no cuenta
    s_hist = np.bincount(ss // 32, minlength=8)[:8] / len(ss)
    v_hist = np.bincount(vv // 32, minlength=8)[:8] / len(vv)
    return np.concatenate([h_hist, s_hist, v_hist]).astype(np.float32)


def dist_hist(a, b):
    """Distancia 0–1: promedio de la variación total en H, S y V. Si un cuadro no tiene color, H no cuenta."""
    dh = 0.5 * np.abs(a[:24] - b[:24]).sum()
    ds = 0.5 * np.abs(a[24:32] - b[24:32]).sum()
    dv = 0.5 * np.abs(a[32:] - b[32:]).sum()
    if a[:24].sum() == 0 and b[:24].sum() == 0:
        return float((ds + dv) / 2)
    return float((dh + ds + dv) / 3)


def senales(f, info):
    """Una pasada: decodifica a 160 px, lee el puntaje de escena de ffmpeg (stderr) y calcula histograma HSV,
    movimiento (diferencia media de gris) y brillo de cada cuadro (stdout)."""
    W = ANCHO_ANALISIS
    H = alto_par(W, info)
    vf = f"scale={W}:{H},select='gte(scene,0)',metadata=print:key=lavfi.scene_score,format=rgb24"
    tam = W * H * 3
    with tempfile.TemporaryFile() as err:
        p = subprocess.Popen(["ffmpeg", "-hide_banner", "-nostats", "-i", f, "-an", "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                             stdout=subprocess.PIPE, stderr=err)
        hists, mov, luma, chicos = [], [], [], []
        prev = None
        while True:
            buf = p.stdout.read(tam)
            if len(buf) < tam:
                break
            rgb = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
            gris = rgb @ np.array([0.299, 0.587, 0.114], np.float32)
            mov.append(float(np.mean(np.abs(gris - prev))) if prev is not None else 0.0)
            prev = gris
            luma.append(float(gris.mean()))
            hists.append(histograma_hsv(rgb))
            chicos.append(gris[::4, ::4].copy())  # 40 px de ancho: para comparar el cuadro antes y después de un tramo
        p.wait()
        err.seek(0)
        log = err.read().decode("utf-8", "replace")
    tiempos = [float(x) for x in re.findall(r"pts_time:([0-9.]+)", log)]
    escena = [float(x) for x in re.findall(r"lavfi\.scene_score=([0-9.]+)", log)]
    n = len(hists)
    if len(tiempos) < n or len(escena) < n:  # por si algún cuadro no imprimió metadato
        fps = info["fps"] or 30
        tiempos = (tiempos + [i / fps for i in range(len(tiempos), n)])[:n]
        escena = (escena + [0.0] * n)[:n]
    hist = np.stack(hists) if n else np.zeros((0, 40), np.float32)
    dh = np.zeros(n)
    for i in range(1, n):
        dh[i] = dist_hist(hist[i - 1], hist[i])
    esc = np.array(escena[:n], float)
    if n:
        esc[0] = 0.0
    return {"t": np.array(tiempos[:n]), "escena": esc, "hist": dh, "mov": np.array(mov), "luma": np.array(luma), "hists": hist, "chicos": chicos}


def mediana_movil(x, mitad):
    if len(x) == 0:
        return x, x
    pad = np.pad(x, mitad, mode="edge")
    ventanas = np.lib.stride_tricks.sliding_window_view(pad, 2 * mitad + 1)
    med = np.median(ventanas, axis=1)
    mad = np.median(np.abs(ventanas - med[:, None]), axis=1)
    return med, mad


def detectar_eventos(s, fps, umbral, k, toma_min):
    """Devuelve (eventos, umbrales). Eventos: dict con t, tipo (corte | transicion | movimiento), subtipo, hasta, etc."""
    t, esc, dh, luma, hists, chicos = s["t"], s["escena"], s["hist"], s["luma"], s["hists"], s["chicos"]
    n = len(t)
    if n < 3:
        return [], {}
    fps = fps or 30
    mitad = max(3, round(fps * VENTANA_S / 2))
    med_e, mad_e = mediana_movil(esc, mitad)
    med_h, mad_h = mediana_movil(dh, mitad)
    thr_e = np.maximum(PISO_ESCENA, med_e + k * 1.4826 * mad_e)
    thr_h = np.maximum(PISO_HIST, med_h + k * 1.4826 * mad_h)
    mov = s["mov"]
    med_m, mad_m = mediana_movil(mov, mitad)
    thr_m = np.maximum(PISO_MOV, med_m + k * 1.4826 * mad_m)
    agitado = (esc > thr_e) | (dh > thr_h) | (esc >= umbral) | (dh >= HIST_FUERTE) | ((mov > thr_m) & (esc >= CORTE_MIN))
    agitado[0] = False
    q = np.maximum(esc, dh)  # señal combinada para ubicar el pico

    def confianza(i):
        # alta: lo confirman las dos señales o la escena pasa el umbral absoluto; media: solo el pico adaptativo
        return "alta" if esc[i] >= umbral or dh[i] >= CONFIRMA_HIST else "media"

    def es_corte(i, vecinos):
        """Un pico aislado: fuerte en absoluto, o muy por encima de su entorno en escena Y en movimiento (cortes en
        el mismo encuadre, p. ej. jump cuts de talking head, que el histograma casi no ve)."""
        if esc[i] >= umbral or dh[i] >= HIST_FUERTE:
            return True
        if esc[i] > thr_e[i] and esc[i] >= CORTE_MIN:
            base_e = max([esc[j] for j in vecinos] or [0.0])
            base_m = max([mov[j] for j in vecinos] or [0.0])
            if dh[i] >= CONFIRMA_HIST and esc[i] >= 2 * base_e:
                return True
            return esc[i] >= PICO_RELATIVO * base_e and mov[i] >= max(thr_m[i], PICO_RELATIVO * base_m)
        return False

    def evento_corte(i):
        return {"t": round(float(t[i]), 3), "tipo": "corte", "subtipo": "duro", "escena": round(float(esc[i]), 3),
                "hist": round(float(dh[i]), 3), "confianza": confianza(i)}

    eventos = []
    i = 1
    while i < n:
        if not agitado[i]:
            i += 1
            continue
        a = i
        while i < n and agitado[i]:
            i += 1
        b = i - 1  # tramo agitado [a, b]
        L = b - a + 1
        tramo = list(range(a, b + 1))
        p = max(tramo, key=lambda j: q[j])
        fuera_i = [j for j in (a - 1, b + 1) if 0 <= j < n]
        otros_i = [j for j in tramo if j != p]
        otros = [q[j] for j in otros_i]
        if L <= 2 and (not otros or q[p] >= 2 * max(otros)):
            if es_corte(p, fuera_i + otros_i):
                eventos.append(evento_corte(p))
            continue
        if L <= TRANS_MAX_CUADROS:
            # ¿hay un corte dominante dentro? (un corte con un cuadro de compresión a cada lado)
            if otros and q[p] >= 2.5 * max(otros) and es_corte(p, fuera_i + otros_i):
                eventos.append(evento_corte(p))
                continue
            antes, despues = max(a - 1, 0), min(b + 1, n - 1)
            cambio_hist = dist_hist(hists[antes], hists[despues])
            cambio_pix = float(np.mean(np.abs(chicos[despues] - chicos[antes])))
            pico_luma = float(np.max(luma[a:b + 1]) - max(luma[antes], luma[despues]))
            valle_luma = float(min(luma[antes], luma[despues]) - np.min(luma[a:b + 1]))
            if pico_luma >= FLASH_LUMA or valle_luma >= FLASH_LUMA:
                sub = "flash" if pico_luma >= valle_luma else "flash negro"
            elif cambio_hist >= CAMBIO_SOSTENIDO_HIST or cambio_pix >= CAMBIO_SOSTENIDO_PIX:
                sub = "zoom/barrido/fundido"
            else:
                continue  # sacudida que regresa a la misma imagen: no cuenta como cambio visual
            eventos.append({"t": round(float(t[a]), 3), "tipo": "transicion", "subtipo": sub, "hasta": round(float(t[b]), 3),
                            "cuadros": L, "cambio_hist": round(cambio_hist, 3), "cambio_pix": round(cambio_pix, 1)})
            continue
        # Más de 8 cuadros agitados seguidos: movimiento continuo; adentro puede haber cortes fuertes.
        med_tramo = float(np.median(esc[a:b + 1]))
        for j in tramo:
            vec = [esc[x] for x in (j - 1, j + 1) if a <= x <= b]
            if (esc[j] >= umbral or dh[j] >= HIST_FUERTE) and esc[j] >= 2.5 * max(med_tramo, 1e-6) and esc[j] >= 1.5 * max(vec or [0]):
                eventos.append(evento_corte(j))
        eventos.append({"t": round(float(t[a]), 3), "tipo": "movimiento", "subtipo": "continuo", "hasta": round(float(t[b]), 3),
                        "cuadros": L})

    # Toma mínima: dos cortes a menos de toma_min s son el mismo (parpadeos dobles); se queda el más fuerte.
    cortes = sorted((e for e in eventos if e["tipo"] == "corte"), key=lambda e: e["t"])
    limpios = []
    for e in cortes:
        if limpios and e["t"] - limpios[-1]["t"] < toma_min:
            if e["escena"] + e["hist"] > limpios[-1]["escena"] + limpios[-1]["hist"]:
                limpios[-1] = e
            continue
        limpios.append(e)
    resto = [e for e in eventos if e["tipo"] != "corte"]
    # una transición que arranca encima de un corte es la cola de ese corte
    resto = [e for e in resto if e["tipo"] == "movimiento" or all(abs(e["t"] - c["t"]) >= toma_min for c in limpios)]
    eventos = sorted(limpios + resto, key=lambda e: (e["t"], e["tipo"]))
    umbrales = {
        "umbral_absoluto": umbral,
        "k_mad": k,
        "toma_min_s": toma_min,
        "ventana_s": VENTANA_S,
        "umbral_adaptativo_escena_mediano": round(float(np.median(thr_e)), 3),
        "umbral_adaptativo_hist_mediano": round(float(np.median(thr_h)), 3),
    }
    return eventos, umbrales


def etiqueta_movimiento(m):
    if m < QUIETO:
        return "estático"
    if m < 2:
        return "bajo"
    if m < 6:
        return "medio"
    return "alto"


def metricas_ritmo(s, eventos, dur):
    t, mov = s["t"], s["mov"]
    cortes = [e["t"] for e in eventos if e["tipo"] == "corte"]
    trans = [e for e in eventos if e["tipo"] == "transicion"]
    cambios = sorted(cortes + [e["t"] for e in trans])
    tramos = []
    for nombre, a, b in (("gancho 0–3 s", 0, GANCHO_S), ("3–10 s", GANCHO_S, LEAD_S), ("resto 10 s–final", LEAD_S, dur)):
        b = min(b, dur)
        if b - a <= 0.05:
            continue
        nc = sum(1 for c in cortes if a <= c < b)
        ncam = sum(1 for c in cambios if a <= c < b)
        sel = (t >= a) & (t < b)
        m = float(np.mean(mov[sel])) if sel.any() else 0.0
        tramos.append({"tramo": nombre, "desde": a, "hasta": round(b, 2), "cortes": nc, "cortes_por_s": round(nc / (b - a), 2),
                       "cambios": ncam, "cambios_por_s": round(ncam / (b - a), 2), "movimiento_medio": round(m, 2),
                       "movimiento": etiqueta_movimiento(m)})
    # Toma más larga sin cambio visual (entre cortes y transiciones).
    bordes = sorted(set([0.0] + cambios + [e["hasta"] for e in trans] + [dur]))
    toma = {"desde": 0.0, "hasta": round(dur, 2), "dur": round(dur, 2)}
    if len(bordes) > 1:
        gaps = np.diff(bordes)
        i = int(np.argmax(gaps))
        toma = {"desde": round(bordes[i], 2), "hasta": round(bordes[i + 1], 2), "dur": round(float(gaps[i]), 2)}
    # Momentos quietos: cuadros seguidos con imagen casi idéntica (ni corte, ni movimiento, ni animación).
    quietos = []
    quieto = mov < QUIETO
    if len(quieto):
        quieto[0] = quieto[1] if len(quieto) > 1 else True
    i, n = 0, len(t)
    while i < n:
        if not quieto[i]:
            i += 1
            continue
        a = i
        while i < n and quieto[i]:
            i += 1
        desde, hasta = float(t[a]), float(t[i]) if i < n else dur
        if hasta - desde >= QUIETO_MIN_S:
            quietos.append({"desde": round(desde, 2), "hasta": round(hasta, 2), "dur": round(hasta - desde, 2)})
    quietos.sort(key=lambda x: -x["dur"])
    # Línea de tiempo por segundo.
    linea = []
    for seg in range(int(math.ceil(dur))):
        sel = (t >= seg) & (t < seg + 1)
        linea.append({"s": seg, "cortes": sum(1 for c in cortes if seg <= c < seg + 1),
                      "cambios": sum(1 for c in cambios if seg <= c < seg + 1),
                      "movimiento": round(float(np.mean(mov[sel])), 2) if sel.any() else 0.0})
    tomas = np.diff([0.0] + cortes + [dur]) if dur else np.array([])
    return {
        "cortes_total": len(cortes),
        "cortes_por_s": round(len(cortes) / dur, 2) if dur else 0,
        "transiciones_total": len(trans),
        "cambios_visuales_total": len(cambios),
        "cambios_visuales_por_s": round(len(cambios) / dur, 2) if dur else 0,
        "toma_media_s": round(float(np.mean(tomas)), 2) if len(tomas) else None,
        "toma_mas_larga_entre_cortes_s": round(float(np.max(tomas)), 2) if len(tomas) else None,
        "toma_mas_larga_sin_cambio": toma,
        "momento_quieto_mas_largo": quietos[0] if quietos else None,
        "momentos_quietos": quietos[:8],
        "movimiento_medio": round(float(np.mean(mov)), 2) if len(mov) else 0,
        "movimiento_nota": f"diferencia media de gris entre cuadros (0–255) a {ANCHO_ANALISIS} px; < {QUIETO} estático, < 2 bajo, < 6 medio, ≥ 6 alto",
        "tramos": tramos,
        "por_segundo": linea,
    }


# ---------------------------------------------------------------- audio y voz


def silencios(palabras, dur):
    huecos = []
    marcas = [(0.0, 0.0)] + [(w["startMs"] / 1000, w["endMs"] / 1000) for w in palabras] + [(dur, dur)]
    for (_, fin), (ini, _) in zip(marcas, marcas[1:]):
        if ini - fin > SILENCIO_MIN:
            huecos.append({"desde": round(fin, 2), "hasta": round(ini, 2), "dur": round(ini - fin, 2)})
    return huecos


def db(x):
    return round(20 * math.log10(max(x, 1e-9)), 1)


def estimar_musica(audio, palabras, huecos):
    """Aproximado: compara la energía de las pausas (sin voz) con la de los tramos con voz.
    Si en las pausas sigue habiendo energía alta y pareja, probablemente hay música o ambiente debajo."""
    sr, win = 16000, 800  # ventanas de 50 ms
    n = len(audio) // win
    if n == 0:
        return {"estimacion": "sin audio", "nota": "estimación"}
    rms = np.sqrt(np.mean(audio[: n * win].reshape(n, win) ** 2, axis=1))
    t = np.arange(n) * win / sr
    voz = np.zeros(n, bool)
    for w in palabras:
        voz |= (t >= w["startMs"] / 1000) & (t < w["endMs"] / 1000)
    pausa = np.zeros(n, bool)
    for h in huecos:  # se recortan 80 ms por lado para no medir colas de palabra
        pausa |= (t >= h["desde"] + 0.08) & (t < h["hasta"] - 0.08)
    if not palabras:
        global_db = db(float(np.median(rms)))
        return {
            "estimacion": "probable música sin voz" if global_db > -40 else "casi silencio",
            "energia_media_db": global_db,
            "nota": "estimación: no se detectó voz",
        }
    voz_db = db(float(np.median(rms[voz]))) if voz.any() else None
    if pausa.sum() < 4:
        return {"estimacion": "indeterminado", "voz_db": voz_db, "nota": "estimación: casi no hay pausas para medir el fondo"}
    p = rms[pausa]
    pausa_db = db(float(np.median(p)))
    piso_db = db(float(np.percentile(p, 10)))
    diferencia = round(voz_db - pausa_db, 1)
    if pausa_db > -42 and diferencia < 20:
        est = "probable música o ambiente bajo la voz"
    elif pausa_db > -50 and diferencia < 28:
        est = "posible música baja"
    else:
        est = "voz sola (fondo casi en silencio)"
    return {"estimacion": est, "voz_db": voz_db, "pausas_db": pausa_db, "piso_pausas_db": piso_db, "diferencia_db": diferencia, "nota": "estimación por energía en pausas; confírmalo escuchando"}


def frases(palabras, max_hueco=SILENCIO_MIN):
    out, cur = [], []
    for w in palabras:
        if cur and (w["startMs"] - cur[-1]["endMs"] > max_hueco * 1000 or re.search(r"[.?!¿¡]$", cur[-1]["text"])):
            out.append(cur)
            cur = []
        cur.append(w)
    if cur:
        out.append(cur)
    return [{"desde": c[0]["startMs"] / 1000, "hasta": c[-1]["endMs"] / 1000, "texto": " ".join(x["text"] for x in c)} for c in out]


# ---------------------------------------------------------------- hojas de contacto


def fuente(px):
    for nombre in ("arialbd.ttf", "arial.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(nombre, px)
        except OSError:
            pass
    try:
        return ImageFont.load_default(size=px)
    except TypeError:
        return ImageFont.load_default()


def cuadro(f, t, w, h):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", f, "-frames:v", "1", "-vf", f"scale={w}:{h}", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
    return Image.open(io.BytesIO(raw)).convert("RGB") if raw else None


COLORES = {"gancho": (220, 40, 40), "corte": (255, 255, 255), "transición": (30, 90, 200), "relleno": (120, 120, 120)}


def hoja_contacto(f, info, eventos, out):
    """Hoja de cortes: gancho (0, 1, 2 s) + un cuadro por corte o transición (repartidos si son más de 24)."""
    dur = info["duracion"]
    marcas = [(float(s), "gancho") for s in range(GANCHO_S) if s < dur]
    cambios = [(e["t"], "corte" if e["tipo"] == "corte" else "transición") for e in eventos if e["tipo"] in ("corte", "transicion")]
    elegidos = cambios
    if len(cambios) > MAX_CORTES_HOJA:  # se reparten parejo a lo largo del video
        idx = np.linspace(0, len(cambios) - 1, MAX_CORTES_HOJA).round().astype(int)
        elegidos = [cambios[i] for i in sorted(set(idx))]
    marcas += [(min(t + 0.12, dur - 0.05), tipo) for t, tipo in elegidos]
    if len(elegidos) < 6 and dur > GANCHO_S:  # pocos cambios (p. ej. motion continuo): relleno cada tramo
        paso = max(2.0, (dur - GANCHO_S) / 9)
        t = GANCHO_S + paso / 2
        while t < dur - 0.2:
            if all(abs(t - m) > 0.8 for m, _ in marcas):
                marcas.append((t, "relleno"))
            t += paso
    marcas.sort()
    W = 216
    H = alto_par(W, info)
    COLS, CAB = 6, 26
    filas = (len(marcas) + COLS - 1) // COLS
    hoja = Image.new("RGB", (COLS * W, filas * (H + CAB)), "white")
    d = ImageDraw.Draw(hoja)
    fnt = fuente(16)
    for k, (t, tipo) in enumerate(marcas):
        x, y = (k % COLS) * W, (k // COLS) * (H + CAB)
        img = cuadro(f, t, W, H)
        if img:
            hoja.paste(img, (x, y + CAB))
        d.rectangle([x, y, x + W - 1, y + CAB - 1], fill=COLORES[tipo])
        d.text((x + 6, y + 4), f"{t:.1f}s · {tipo}", fill="black" if tipo == "corte" else "white", font=fnt)
    hoja.save(out, quality=88)
    return [{"t": round(t, 2), "tipo": tipo} for t, tipo in marcas]


def hojas_ritmo(f, info, eventos, out_dir):
    """Un cuadro cada 0.5 s (24 por hoja, 6×4), para ver todo el video aunque no corte. Encabezado rojo = gancho,
    azul oscuro = hay corte o transición en ese medio segundo, gris = nada cambió de golpe."""
    W = RITMO_ANCHO
    H = alto_par(W, info)
    COLS, CAB = 6, 26
    filas_hoja = RITMO_POR_HOJA // COLS
    tam = W * H * 3
    fnt = fuente(16)
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", f, "-an", "-vf", f"fps={1 / RITMO_PASO_S:g},scale={W}:{H},format=rgb24",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    archivos, pagina, k = [], [], 0

    def nota(t):
        tipos = [e for e in eventos if e["tipo"] in ("corte", "transicion") and t - RITMO_PASO_S / 2 <= e["t"] < t + RITMO_PASO_S / 2]
        if any(e["tipo"] == "corte" for e in tipos):
            return "corte"
        return "trans." if tipos else ""

    def guardar():
        n = len(archivos) + 1
        filas = (len(pagina) + COLS - 1) // COLS
        hoja = Image.new("RGB", (COLS * W, filas * (H + CAB)), "white")
        d = ImageDraw.Draw(hoja)
        for j, (t, img) in enumerate(pagina):
            x, y = (j % COLS) * W, (j // COLS) * (H + CAB)
            hoja.paste(img, (x, y + CAB))
            marca = nota(t)
            color = (220, 40, 40) if t < GANCHO_S else ((20, 40, 110) if marca else (110, 110, 110))
            d.rectangle([x, y, x + W - 1, y + CAB - 1], fill=color)
            d.text((x + 6, y + 4), f"{t:.1f}s" + (f" · {marca}" if marca else ""), fill="white", font=fnt)
        ruta = out_dir / f"hoja-ritmo-{n}.jpg"
        hoja.save(ruta, quality=85)
        archivos.append({"archivo": ruta.name, "desde": pagina[0][0], "hasta": pagina[-1][0]})

    while True:
        buf = p.stdout.read(tam)
        if len(buf) < tam:
            break
        pagina.append((round(k * RITMO_PASO_S, 2), Image.frombuffer("RGB", (W, H), buf, "raw", "RGB", 0, 1).copy()))
        k += 1
        if len(pagina) == filas_hoja * COLS:
            guardar()
            pagina = []
    p.wait()
    if pagina:
        guardar()
    for viejo in sorted(out_dir.glob("hoja-ritmo-*.jpg")):  # quita hojas sobrantes de una corrida anterior más larga
        if all(viejo.name != a["archivo"] for a in archivos):
            viejo.unlink()
    return archivos


def ruta_relativa(f, base):
    """Ruta de f relativa a la carpeta de salida (así el análisis no guarda rutas de tu disco)."""
    try:
        return os.path.relpath(Path(f).resolve(), Path(base).resolve()).replace("\\", "/")
    except ValueError:  # otra unidad en Windows: basta con el nombre
        return Path(f).name


# ---------------------------------------------------------------- ficha


def barras(valores, tope=None):
    bloques = " ▁▂▃▄▅▆▇█"
    if not valores:
        return ""
    tope = tope or max(valores) or 1
    return "".join(bloques[max(1, min(8, round(8 * v / tope)))] if v > 0 else "·" for v in valores)


def escribir_ficha(out, nombre, a):
    r, c, m = a["ritmo"], a["cortes"], a["musica"]
    rv = a.get("ritmo_visual") or {}
    fr = a["frases"]
    formato = f"{a['ancho']}×{a['alto']} · {a['fps']} fps" if a["tiene_video"] else "solo audio (sin video)"
    dur = a["duracion_s"] or 1
    trans = "\n".join(f"| {f['desde']:.2f}–{f['hasta']:.2f} | {round(100 * f['desde'] / dur)} % | {f['texto']} |" for f in fr) or "| — | — | (sin voz detectada) |"
    sil = ", ".join(f"{h['desde']:.1f}–{h['hasta']:.1f} s" for h in a["silencios"][:20]) or "ninguno"
    lista_cortes = ", ".join(f"{t:.2f}" for t in c["tiempos"][:60]) or "sin cortes duros detectados"
    tr = [e for e in a.get("eventos", []) if e["tipo"] == "transicion"]
    lista_trans = ", ".join(f"{e['t']:.2f} ({e['subtipo']})" for e in tr[:40]) or "ninguna"
    mov_cont = [e for e in a.get("eventos", []) if e["tipo"] == "movimiento"]
    lista_mov = ", ".join(f"{e['t']:.1f}–{e['hasta']:.1f}" for e in mov_cont[:20]) or "ninguno"
    tabla_tramos = "\n".join(
        f"| {x['tramo']} | {x['cortes']} ({x['cortes_por_s']}/s) | {x['cambios']} ({x['cambios_por_s']}/s) | {x['movimiento_medio']} · {x['movimiento']} |"
        for x in rv.get("tramos", [])) or "| — | — | — | — |"
    toma = rv.get("toma_mas_larga_sin_cambio") or {}
    quieto = rv.get("momento_quieto_mas_largo")
    quieto_txt = f"{quieto['dur']} s (de {quieto['desde']} a {quieto['hasta']} s)" if quieto else f"ninguno de más de {QUIETO_MIN_S} s"
    otros_quietos = ", ".join(f"{q['desde']}–{q['hasta']} s" for q in rv.get("momentos_quietos", [])[1:6]) or "—"
    ps = rv.get("por_segundo", [])
    linea_cambios = barras([x["cambios"] for x in ps])
    linea_mov = barras([x["movimiento"] for x in ps])
    hojas = ", ".join(f"`{Path(h['archivo']).name}` ({h['desde']:.1f}–{h['hasta']:.1f} s)" for h in a.get("hojas_ritmo", [])) or "no se generaron"
    txt = f"""# Ficha · {nombre}

> Borrador generado por `scripts/analizar_video.py` el {date.today().isoformat()}. Los datos medidos son automáticos;
> las secciones con «…» las llena Claude viendo `hoja.jpg`, las `hoja-ritmo-N.jpg` y la transcripción. Nada de
> métricas inventadas.

## Referencia

- **Cuenta:** @… (cítala siempre)
- **Archivo:** `{a['archivo']}`
- **Métricas que dio la persona:** … (vistas, likes, guardados, compartidos; si no las dio, «sin datos»)
- **Formato:** {formato} · {'con' if a['tiene_audio'] else 'sin'} audio

## Lo medido

| Dato | Valor |
|---|---|
| Duración | {dur:.1f} s |
| Palabras | {r['palabras']} ({r['palabras_por_segundo']} por segundo sobre el total; {r['palabras_por_segundo_hablando']} mientras habla) |
| Primera palabra | {r['primera_palabra_s'] if r['primera_palabra_s'] is not None else '—'} s |
| Silencios > {SILENCIO_MIN} s | {len(a['silencios'])} ({r['silencio_total_s']} s en total) |
| Cortes duros | {c['total']} ({c['por_segundo']} por segundo · toma media {c['toma_media_s']} s · en el gancho: {c['en_gancho']}) |
| Transiciones (zoom, barrido, flash) | {len(tr)} |
| Cambios visuales (cortes + transiciones) | {rv.get('cambios_visuales_total', '—')} ({rv.get('cambios_visuales_por_s', '—')} por segundo) |
| Música (estimación) | {m['estimacion']} |

- **Tiempos de corte (s):** {lista_cortes}
- **Transiciones (s):** {lista_trans}
- **Silencios:** {sil}

## Ritmo visual

| Tramo | Cortes | Cambios visuales | Movimiento medio |
|---|---|---|---|
{tabla_tramos}

- **Toma más larga sin cambio visual:** {toma.get('dur', '—')} s (de {toma.get('desde', '—')} a {toma.get('hasta', '—')} s)
- **Momento quieto más largo** (imagen casi idéntica, sin animación): {quieto_txt} · otros: {otros_quietos}
- **Movimiento continuo** (cámara, animación o zoom sostenido): {lista_mov}
- **Cambios por segundo:** `{linea_cambios}`
- **Movimiento por segundo:** `{linea_mov}`
- **Hojas de ritmo** (un cuadro cada {RITMO_PASO_S} s): {hojas}

> Movimiento = diferencia media de gris entre cuadros (0–255): < {QUIETO} estático, < 2 bajo, < 6 medio, ≥ 6 alto.
> Un tramo «estático» o un momento quieto de más de 1 s es lo primero que se corrige en una pieza propia.

- **Lectura del ritmo:** … (¿dónde acelera y dónde respira?, ¿el gancho cambia más que el resto?, ¿qué tapa los momentos quietos: texto, zoom, b-roll?)

## Transcripción con tiempos

| Tiempo (s) | % | Lo que dice |
|---|---|---|
{trans}

## Gancho (0–3 s)

- **Lo que dice:** …
- **Lo que se ve en el cuadro 0:** …
- **Texto en pantalla:** …
- **Fórmula** (`referencias/ganchos.md` + `personal/ganchos.md`): G… · …
- **¿Las 3 capas prometen lo mismo?** …

## Lead (hasta ~10 s)

…

## Cuerpos

| Bloque | Desde (s) | Qué hace |
|---|---|---|
| C1 | … | … |
| C2 | … | … |
| C3 | … | … |

## Loops abiertos

| Loop | Segundo | Frase o recurso |
|---|---|---|
| 1 | … | … |
| 2 | … | … |

## Momento wow

- **Segundo:** … · **% del video:** … (meta de `estructura-viral.md`: 50–65 %)
- **Qué pasa:** …

## CTA

- **Segundo:** … · **Qué pide:** … · **¿Cierra en bucle con el gancho?** …

## Recursos visuales

- **Cara / sin cara:** …
- **Texto en pantalla** (tamaño, posición, cuántas palabras): …
- **Motion graphics:** …
- **B-roll / capturas / UI:** …
- **Subtítulos:** …
- **Cortes y cámara** (zooms, golpes, transiciones): …

## Audio

- **Voz:** … (ritmo, tono, pausas)
- **Música:** {m['estimacion']} (estimación) → …
- **Efectos de sonido:** …

## Por qué funciona

…

## Lo que este viral te enseña para tu marca

> 2 o 3 aprendizajes accionables, ligados a un pilar y al avatar de `personal/marca.md`. Cada uno: qué hace el viral →
> por qué le pega al avatar → cómo lo usas tú esta semana.

- …

## Lo que NO copiar

> Lo que no va con la marca, la voz o las reglas (`personal/marca.md`, `referencias/rechazados.md` + `personal/rechazados.md`): datos que no son
> tuyos, tono de coach, clickbait que no paga, recursos ya descartados, nada de su texto, imágenes, música ni marca.

- …

## Cómo lo replico

> Estructura sí, contenido no: nada de su texto, imágenes, música ni marca. Todo con mi pilar, mi voz y mis datos reales.

- **Lo que me llevo (estructura):** …
- **Pilar / rama** (`personal/marca.md`): …
- **Idea propia 1:** … (ID nuevo o pieza existente a reescribir)
- **Idea propia 2:** …
- **Idea propia 3:** …
- **Elementos de la librería que sirven / faltan:** …
"""
    Path(out).write_text(txt, encoding="utf-8")


# ---------------------------------------------------------------- main


def main():
    ap = argparse.ArgumentParser(description="Analiza un video local de referencia y arma su ficha.")
    ap.add_argument("video")
    ap.add_argument("salida")
    ap.add_argument("--modelo", default="small", help="modelo de faster-whisper (tiny, base, small, medium…)")
    ap.add_argument("--contexto", default=None, help="nombres propios o jerga para la transcripción")
    ap.add_argument("--idioma", default="es")
    ap.add_argument("--umbral", type=float, default=0.3, help="umbral absoluto de corte de escena (0–1); arriba de esto siempre es corte")
    ap.add_argument("--k", type=float, default=4.0, help="sensibilidad adaptativa: mediana móvil + k·MAD (menor = más cortes)")
    ap.add_argument("--toma-min", type=float, default=0.12, help="s: dos cortes más juntos que esto cuentan como uno")
    ap.add_argument("--sin-transcripcion", action="store_true")
    ap.add_argument("--sin-hoja-ritmo", action="store_true", help="no generar las hojas densas de un cuadro cada 0.5 s")
    args = ap.parse_args()

    if re.match(r"^[a-z]+://", args.video, re.I) or args.video.lower().startswith("www."):
        print("Esto es una URL. Este script no descarga nada: baja el video tú (desde la app o tu navegador),"
              " ponlo en la carpeta de la referencia y vuelve a correrlo con la ruta local.")
        sys.exit(2)
    f = Path(args.video)
    if not f.is_file():
        print(f"No encuentro el archivo: {f}")
        sys.exit(1)
    out = Path(args.salida)
    out.mkdir(parents=True, exist_ok=True)

    info = probe(str(f))
    dur = info["duracion"]
    tam = f"{info['ancho']}x{info['alto']}" if info["video"] else "sin video"
    print(f"[1/6] {f.name}: {dur:.1f} s, {tam}, audio={'sí' if info['audio'] else 'no'}")

    palabras, audio = [], np.zeros(0, np.float32)
    if info["audio"]:
        audio = audio_pcm(str(f))
        if not args.sin_transcripcion:
            print(f"[2/6] Transcribiendo con faster-whisper «{args.modelo}»…")
            palabras = transcribir(audio, args.modelo, args.contexto, args.idioma)
    else:
        print("[2/6] Sin pista de audio: no hay transcripción.")

    eventos, umbrales, ritmo_visual = [], {}, {}
    if info["video"]:
        print("[3/6] Detectando cortes, transiciones y movimiento (escena adaptativa + histograma HSV)…")
        s = senales(str(f), info)
        eventos, umbrales = detectar_eventos(s, info["fps"], args.umbral, args.k, args.toma_min)
        ritmo_visual = metricas_ritmo(s, eventos, dur)
    else:
        print("[3/6] El archivo no tiene video (solo audio): sin cortes ni hojas de contacto.")
    cortes = [e["t"] for e in eventos if e["tipo"] == "corte"]

    huecos = silencios(palabras, dur) if palabras else []
    hablando = sum((w["endMs"] - w["startMs"]) for w in palabras) / 1000
    print("[4/6] Midiendo ritmo de voz y música…")
    if not info["audio"]:
        musica = {"estimacion": "sin audio", "nota": "estimación"}
    elif args.sin_transcripcion:  # sin palabras no se distinguen voz y pausas
        musica = {"estimacion": "no medida (corrida sin transcripción)", "nota": "estimación"}
    else:
        musica = estimar_musica(audio, palabras, huecos)

    marcas, ritmo_hojas = [], []
    if info["video"]:
        print("[5/6] Armando la hoja de cortes…")
        marcas = hoja_contacto(str(f), info, eventos, out / "hoja.jpg")
        if not args.sin_hoja_ritmo:
            print("[6/6] Armando las hojas de ritmo (un cuadro cada 0.5 s)…")
            ritmo_hojas = hojas_ritmo(str(f), info, eventos, out)

    analisis = {
        "archivo": ruta_relativa(f, out),
        "generado": date.today().isoformat(),
        "duracion_s": round(dur, 2),
        "ancho": info["ancho"],
        "alto": info["alto"],
        "fps": info["fps"],
        "tiene_audio": info["audio"],
        "tiene_video": info["video"],
        "modelo_transcripcion": args.modelo if palabras else None,
        "ritmo": {
            "palabras": len(palabras),
            "palabras_por_segundo": round(len(palabras) / dur, 2) if dur else 0,
            "palabras_por_segundo_hablando": round(len(palabras) / hablando, 2) if hablando else 0,
            "primera_palabra_s": round(palabras[0]["startMs"] / 1000, 2) if palabras else None,
            "silencio_total_s": round(sum(h["dur"] for h in huecos), 2),
        },
        "silencios": huecos,
        "cortes": {
            "umbral": args.umbral,
            "deteccion": umbrales,
            "total": len(cortes),
            "por_segundo": ritmo_visual.get("cortes_por_s", 0),
            "toma_media_s": ritmo_visual.get("toma_media_s"),
            "toma_mas_larga_s": ritmo_visual.get("toma_mas_larga_entre_cortes_s"),
            "en_gancho": sum(1 for c in cortes if c < GANCHO_S),
            "tiempos": cortes,
        },
        "ritmo_visual": ritmo_visual,
        "eventos": eventos,
        "musica": musica,
        "hoja_contacto": {"archivo": "hoja.jpg" if marcas else None, "cuadros": marcas},
        "hojas_ritmo": ritmo_hojas,
        "frases": frases(palabras),
        "palabras": palabras,
    }
    (out / "analisis.json").write_text(json.dumps(analisis, ensure_ascii=False, indent=1), encoding="utf-8")
    ficha = out / "ficha.md"
    if ficha.exists():  # nunca se pisa una ficha ya llenada
        ficha = out / "ficha (borrador nuevo).md"
    escribir_ficha(ficha, f.stem, analisis)

    r, c = analisis["ritmo"], analisis["cortes"]
    print(f"\nDuración {dur:.1f} s · {r['palabras']} palabras ({r['palabras_por_segundo']}/s) · {c['total']} cortes ({c['por_segundo']}/s, toma media {c['toma_media_s']} s)")
    if ritmo_visual:
        rv = ritmo_visual
        q = rv["momento_quieto_mas_largo"]
        print(f"Cambios visuales {rv['cambios_visuales_total']} ({rv['cambios_visuales_por_s']}/s; {rv['transiciones_total']} transiciones) · "
              f"toma más larga sin cambio {rv['toma_mas_larga_sin_cambio']['dur']} s en {rv['toma_mas_larga_sin_cambio']['desde']} s · "
              f"momento quieto más largo: {str(q['dur']) + ' s en ' + str(q['desde']) + ' s' if q else 'ninguno'}")
        for x in rv["tramos"]:
            print(f"  {x['tramo']}: {x['cortes_por_s']} cortes/s · {x['cambios_por_s']} cambios/s · movimiento {x['movimiento_medio']} ({x['movimiento']})")
    print(f"Silencios > {SILENCIO_MIN} s: {len(huecos)} · Música: {musica['estimacion']} (estimación)")
    hojas = (f" · {out / 'hoja.jpg'}" if marcas else "") + (f" · {len(ritmo_hojas)} hojas de ritmo" if ritmo_hojas else "")
    print(f"Listo: {out / 'analisis.json'} · {ficha}{hojas}")


if __name__ == "__main__":
    main()
