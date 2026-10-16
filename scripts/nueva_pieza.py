# Crea y reprograma las carpetas de las piezas según la parrilla. Solo renombra y crea; nunca borra.
# Uso: python nueva_pieza.py filas.json [--id P04 | --todas] [--aplicar] [--base RUTA]
#   filas.json: las filas de la pestaña Parrilla que Claude exporta del Sheets (el script no usa el conector):
#     [{"id": "P04", "fecha": "mar 13 oct", "hora": "12:30", "pieza": "…", "formato": "Marca · Reel",
#       "quien": "Ana"}, ...]
#   --id: solo esa pieza (se crea aunque no sea tuya). --todas: todas las piezas que haces tú: «Quién lo hace»
#     empieza con o contiene alguno de los valores de `quien_hace` de personal/config.md.
#   --base: carpeta de piezas; si no se pasa, `carpeta_contenido` de personal/config.md.
#   Año: `parrilla_anio` y `parrilla_mes_corte` de la config (los meses menores al corte son del año siguiente).
#   Sin --aplicar solo imprime lo que haría.
# Carpeta: «AAAA-MM-DD HHMM ID - Pieza». Reels: clips/ pantallas/ motion/. Carruseles: laminas/.
import json
import os
import re
import sys

from config import leer, valor

sys.stdout.reconfigure(encoding="utf-8")

args = sys.argv[1:]
filas = json.load(open(args[0], encoding="utf8"))
aplicar = "--aplicar" in args
solo = args[args.index("--id") + 1] if "--id" in args else None
CFG = leer()
base = valor("carpeta_contenido", args[args.index("--base") + 1] if "--base" in args else None)
MESES = {"ene": 1, "feb": 2, "mar": 3, "abr": 4, "may": 5, "jun": 6, "jul": 7, "ago": 8, "sep": 9, "oct": 10, "nov": 11, "dic": 12}
AÑO = int(CFG.get("parrilla_anio") or 2026)
CORTE = int(CFG.get("parrilla_mes_corte") or 1)
QUIEN = [q.strip().lower() for q in (CFG.get("quien_hace") or "").split(",") if q.strip()]


def prefijo(fecha, hora):
    _, dia, mes = fecha.split()
    m = MESES[mes[:3].lower()]
    año = AÑO + 1 if m < CORTE else AÑO  # p. ej. una parrilla de oct a ene con corte 7: ene–jun ya es el año siguiente
    return f"{año}-{m:02d}-{int(dia):02d} {hora.replace(':', '')}"


def limpio(titulo):
    t = re.sub(r'[\\/:*?"<>|«»¿]', "", titulo)
    t = re.sub(r"\s+", " ", t).strip().rstrip(".")
    return t[:60].rstrip()


def es_mia(f):
    q = f.get("quien", "").lower()
    if not QUIEN:
        return True  # sin `quien_hace` en la config, todas las piezas cuentan
    return any(q.startswith(x) or x in q for x in QUIEN)


existentes = {}
for d in os.listdir(base):
    m = re.match(r"\d{4}-\d{2}-\d{2} \d{4} ([A-Z]+\d+) - ", d)
    if m:
        existentes[m.group(1)] = d

for f in filas:
    if solo and f["id"] != solo:
        continue
    if not solo and not es_mia(f):
        continue
    if not f.get("fecha") or not f.get("hora"):
        print("SIN FECHA", f["id"])
        continue
    pre = prefijo(f["fecha"], f["hora"])
    if f["id"] in existentes:
        viejo = existentes[f["id"]]
        nuevo = pre + viejo[15:]
        if viejo != nuevo:
            print("RENOMBRA", viejo, "→", nuevo)
            if aplicar:
                assert not os.path.exists(os.path.join(base, nuevo)), nuevo
                os.rename(os.path.join(base, viejo), os.path.join(base, nuevo))
        continue
    nombre = f"{pre} {f['id']} - {limpio(f['pieza'])}"
    subs = ["laminas"] if "carrusel" in f.get("formato", "").lower() else ["clips", "pantallas", "motion"]
    print("CREA    ", nombre, subs)
    if aplicar:
        for s in subs:
            os.makedirs(os.path.join(base, nombre, s), exist_ok=True)
if not aplicar:
    print("(en seco: agrega --aplicar para hacerlo)")
