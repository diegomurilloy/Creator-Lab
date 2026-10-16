"""Arma los documentos del panel de Creator Lab desde `personal/` (y lo genérico del repo).

Uso:
    python scripts/panel_seed.py <carpeta_tmp> [personal/panel/panel_blobs.json] [--solo perfil,ganchos,...]

- Escribe un JSON por documento en `<carpeta_tmp>/<coleccion>/<doc_id>.json` (para `ArtifactData batch` con
  `file_path`, máx. 50 por lote) y el total en `personal/panel/panel_seed.json` ({coleccion: {doc_id: doc}}).
- `panel_blobs.json` (opcional): urls de assets ya subidos al artifact:
  {"logo/<marca>": "/_blob/…", "mini/<lote>-<carpeta>": "/_blob/…", "lib/<id>": "/_blob/…"}.

De dónde sale cada colección:
  perfil        ← personal/config.md (documento `firma`) + secciones de personal/marca.md
  marca_visual  ← una por marca de la config: personal/marcas/<clave>/colores.json, o propuesta desde marca-visual.json
  ganchos       ← tablas de referencias/ganchos.md + personal/ganchos.md (lo personal reemplaza el mismo código)
  inspiracion   ← personal/virales/*/*/ficha.md
  ideas         ← «Ideas por pulir» de personal/libreria-motion.md
  aprendizajes  ← tabla «Bitácora» de personal/aprendizajes.md
  cultura       ← referencias/conexion-cultural.md + sección «Conexión cultural» de personal/reglas.md
  libreria      ← tablas de referencias/libreria-motion.md («Catálogo», marca `todas`) + personal/libreria-motion.md
  reglas        ← viñetas de personal/reglas.md + tablas de referencias/rechazados.md y personal/rechazados.md
Todos los documentos salen con `sincronizado: true`. Lo que la persona escribió es dato: se copia tal cual.
"""
from __future__ import annotations

import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import leer, marcas, raiz  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

CL = raiz()
PER = os.path.join(CL, "personal")
args = sys.argv[1:]
solo = None
if "--solo" in args:
    i = args.index("--solo")
    solo = set(args[i + 1].split(","))
    del args[i:i + 2]
if not args or args[0] in ("-h", "--help"):
    sys.exit(__doc__)
TMP = args[0]
BLOBS = json.load(open(args[1], encoding="utf-8")) if len(args) > 1 and os.path.exists(args[1]) else {}
COLS = ("perfil", "marca_visual", "ganchos", "inspiracion", "ideas", "aprendizajes", "cultura", "libreria", "reglas")
docs = {c: {} for c in COLS}


def leer_md(*partes):
    ruta = os.path.join(CL, *partes)
    return open(ruta, encoding="utf-8").read() if os.path.exists(ruta) else ""


def limpio(t):
    t = re.sub(r"\*\*(.+?)\*\*", r"\1", t or "")
    t = t.replace("`", "")
    return re.sub(r"[ \t]+", " ", t).strip()


def slug(t):
    return re.sub(r"[^a-z0-9-]+", "-", t.lower()).strip("-")[:60] or "x"


def add(col, i, d):
    docs[col][i] = {**d, "sincronizado": True}


def celdas(fila):
    return [c.strip() for c in fila.strip().strip("|").split(" | ")]


def secciones(md, nivel="## "):
    """[(titulo, cuerpo)] de cada encabezado de ese nivel."""
    partes = re.split(rf"^{re.escape(nivel)}", md, flags=re.M)
    salida = []
    for p in partes[1:]:
        titulo, _, cuerpo = p.partition("\n")
        salida.append((titulo.strip(), cuerpo.strip()))
    return salida


def seccion(md, titulo):
    m = re.search(rf"^## {re.escape(titulo)}[^\n]*\n(.*?)(?=^## |\Z)", md, flags=re.S | re.M)
    return m.group(1).strip() if m else ""


def filas_tabla(texto):
    filas = [celdas(x) for x in texto.splitlines() if x.startswith("|") and not re.match(r"^\|\s*-", x)]
    return filas[0] if filas else [], filas[1:]


cfg = leer()
lista_marcas = marcas(cfg)

# ── perfil ──
n = 0
firma = " · ".join(x for x in (cfg.get("nombre", ""), cfg.get("usuario", "")) if x)
if firma:
    add("perfil", "firma", {"orden": n, "seccion": "Identidad", "titulo": "Nombre y usuario", "ayuda": "Sale en el encabezado del panel.", "texto": firma, "ancho": False})
    n += 1
for titulo, cuerpo in secciones(leer_md("personal", "marca.md")):
    if not cuerpo:
        continue
    add("perfil", slug(titulo), {"orden": n, "seccion": titulo, "titulo": titulo, "ayuda": "", "texto": cuerpo, "ancho": titulo.lower().startswith(("mensaje", "objetivo"))})
    n += 1

# ── marca_visual ──
ROL_TOKEN = {"fondo": "bg", "texto": "ink", "primario": "accent", "acento": "fill"}
for k, (clave, nombre) in enumerate(lista_marcas):
    carpeta = os.path.join(PER, "marcas", clave)
    doc = {"orden": k, "clave": clave, "nombre": nombre, "logo": BLOBS.get(f"logo/{clave}", ""), "colores": [], "fuentes": "", "textos": "", "nota": "", "fuente": ""}
    cj, mv = os.path.join(carpeta, "colores.json"), os.path.join(carpeta, "marca-visual.json")
    if os.path.exists(cj):
        c = json.load(open(cj, encoding="utf-8"))
        doc.update({x: c[x] for x in ("colores", "fuentes", "textos") if x in c})
        doc["fuente"] = c.get("fuente", f"personal/marcas/{clave}/colores.json")
    elif os.path.exists(mv):
        v = json.load(open(mv, encoding="utf-8"))
        for rol, d in (v.get("colores", {}).get("roles_propuestos") or {}).items():
            doc["colores"].append({"tema": "claro", "token": ROL_TOKEN.get(rol, ""), "rol": rol, "hex": d.get("hex", ""), "uso": "propuesta de extraer_marca.py: revísala"})
        doc["fuentes"] = "\n".join(v.get("fuentes", {}).get("principales", []))
        doc["textos"] = "\n".join(v.get("textos", {}).get("esloganes", []))
        doc["fuente"] = f"{v.get('url', '')} con scripts/extraer_marca.py"
    add("marca_visual", clave, doc)

# ── ganchos ──
g = {}
for origen, md in (("referencias", leer_md("referencias", "ganchos.md")), ("personal", leer_md("personal", "ganchos.md"))):
    for titulo, cuerpo in [("", md.split("\n## ")[0])] + secciones(md):
        cab, filas = filas_tabla(cuerpo)
        for c in filas:
            if not c or not re.match(r"^G\d+$", c[0]):
                continue
            cab_l = [x.lower() for x in cab]
            d = {"codigo": c[0], "categoria": titulo or "Fórmulas base", "nombre": "", "molde": "", "ejemplo": "", "referencia": ""}
            for nombre_col, valor in zip(cab_l, c):
                if "categor" in nombre_col or nombre_col == "tipo":
                    d["categoria"] = limpio(valor)
                elif nombre_col in ("fórmula",) and len(c) == 4:
                    d["nombre"] = limpio(valor)
                elif "molde" in nombre_col or "cómo funciona" in nombre_col or nombre_col == "fórmula":
                    d["molde"] = limpio(valor)
                elif "ejemplo" in nombre_col or nombre_col.startswith("para "):
                    d["ejemplo"] = limpio(valor)
                elif "referencia" in nombre_col or "de dónde" in nombre_col:
                    d["referencia"] = limpio(valor)
            previo = g.get(c[0], {})
            g[c[0]] = {**previo, **{k: v for k, v in d.items() if v}}
for n, (cod, d) in enumerate(sorted(g.items(), key=lambda x: int(x[0][1:]))):
    add("ganchos", cod.lower(), {"orden": n, **{k: d.get(k, "") for k in ("codigo", "categoria", "nombre", "molde", "ejemplo", "referencia")}, "nota": ""})

# ── inspiracion ──
for n, f in enumerate(sorted(glob.glob(os.path.join(PER, "virales", "*", "*", "ficha.md")) + glob.glob(os.path.join(PER, "virales", "*", "ficha.md")))):
    md = open(f, encoding="utf-8").read()
    carpeta = os.path.relpath(os.path.dirname(f), CL).replace("\\", "/")
    nombre = os.path.basename(os.path.dirname(f))
    lote_dir = os.path.basename(os.path.dirname(os.path.dirname(f)))
    lote = re.sub(r"^\d{4}-\d{2}-\d{2}\s*", "", lote_dir if lote_dir != "virales" else nombre)
    m = re.search(r"\*\*Cuenta:\*\*\s*(.+)", md)
    cuenta_txt = limpio(m.group(1)) if m else "sin identificar"
    gan = seccion(md, "Gancho")
    dice = re.search(r"\*\*Lo que dice:\*\*\s*(.+)", gan)
    formula = re.search(r"\*\*Fórmula\*\*[^:]*:\s*(.+)", gan)
    add("inspiracion", slug(f"{lote}-{nombre}"), {
        "orden": n, "marca": cfg.get("marca_principal", "todas") or "todas", "lote": lote, "carpeta": carpeta, "titulo": nombre,
        "cuenta": re.split(r"\s\(", cuenta_txt, maxsplit=1)[0], "cuenta_detalle": cuenta_txt,
        "gancho": limpio(dice.group(1)) if dice else "", "formula": limpio(formula.group(1)) if formula else "",
        "por_que": limpio(seccion(md, "Por qué funciona")), "replicar": limpio(seccion(md, "Cómo lo replico")),
        "miniatura": BLOBS.get(f"mini/{lote}-{nombre}", ""), "nota": "",
    })

# ── ideas (Ideas por pulir de la persona) ──
lm = leer_md("personal", "libreria-motion.md")
_, filas = filas_tabla(seccion(lm, "Ideas por pulir"))
for n, c in enumerate(f for f in filas if f and f[0]):
    add("ideas", f"lib-{n:02d}", {"orden": 1000 + n, "marca": "todas", "destino": "libreria", "titulo": limpio(c[0]),
                                  "detalle": limpio(f"Úsala cuando: {c[2]}. Para construirla: {c[3]}") if len(c) > 3 else "",
                                  "origen": limpio(c[1]) if len(c) > 1 else "", "estado": "por pulir", "nota": ""})

# ── aprendizajes ──
_, filas = filas_tabla(seccion(leer_md("personal", "aprendizajes.md"), "Bitácora"))
for n, c in enumerate(f for f in filas if len(f) >= 5 and f[0]):
    add("aprendizajes", f"a{n:03d}", {"orden": n, "fecha": limpio(c[0]), "pieza": limpio(c[1]), "probado": limpio(c[2]), "resultado": limpio(c[3]), "leccion": limpio(c[4])})

# ── cultura ──
cc = leer_md("referencias", "conexion-cultural.md")
if cc:
    intro = cc.split("\n## ")[0].split("\n", 1)[1].strip()
    add("cultura", "c00", {"orden": 0, "tipo": "central", "numero": "", "titulo": "", "texto": limpio(re.sub(r"\s*\n\s*", " ", intro))})
    for k, (num, tit, txt) in enumerate(re.findall(r"^(\d+)\.\s+\*\*(.+?)\*\*\s*(.+)$", seccion(cc, "Cómo se aplica"), flags=re.M), 1):
        add("cultura", f"c{k:02d}", {"orden": k, "tipo": "principio", "numero": num, "titulo": limpio(tit).rstrip("."), "texto": limpio(txt)})
    for k, q in enumerate(re.findall(r"^- (.+)$", seccion(cc, "Revisión rápida antes de entregar"), flags=re.M)):
        add("cultura", f"q{k:02d}", {"orden": 900 + k, "tipo": "revision", "numero": "", "titulo": "", "texto": limpio(q)})
for k, t in enumerate(re.findall(r"^- (.+)$", seccion(leer_md("personal", "reglas.md"), "Conexión cultural") or seccion(leer_md("personal", "reglas.md"), "Modo lanzamiento y conexión cultural"), flags=re.M)):
    add("cultura", f"p{k:02d}", {"orden": 500 + k, "tipo": "principio", "numero": "", "titulo": "Propio", "texto": limpio(t)})

# ── libreria ──
n = 0
for origen, md, marca_def in (("referencias", leer_md("referencias", "libreria-motion.md"), "todas"), ("personal", lm, cfg.get("marca_principal") or "todas")):
    for titulo, cuerpo in secciones(md):
        if titulo.startswith(("Ideas por pulir", "Marca de cada", "Dónde está", "Reglas", "Lo que se aprendió", "Estructura visual", "Audio", "Cambiar palabras")):
            continue
        cab, filas = filas_tabla(cuerpo)
        if not cab or not cab[0].lower().startswith(("elemento",)):
            continue
        tipo = "carrusel" if "carrusel" in titulo.lower() else "personal" if "con cara" in titulo.lower() else "reel"
        for c in filas:
            if not c or not c[0].startswith("**"):
                continue
            nombre = limpio(re.match(r"\*\*(.+?)\*\*", c[0]).group(1)) if re.match(r"\*\*(.+?)\*\*", c[0]) else limpio(c[0])
            i = slug(f"{origen[:3]}-{nombre}")
            add("libreria", i, {"orden": n, "marca": limpio(c[3]) if len(c) > 3 and origen == "personal" and c[3] else marca_def, "tipo": tipo,
                                "nombre": nombre, "que": limpio(c[0]), "frase": limpio(c[1]) if len(c) > 1 else "",
                                "codigo": limpio(c[2]) if len(c) > 2 else "", "estado": "probado", "nota": "",
                                "video": BLOBS.get(f"lib/{i}", ""), "tambien": ""})
            n += 1

# ── reglas ──
n = 0
for t in re.findall(r"^- (.+)$", seccion(leer_md("personal", "reglas.md"), "Generales"), flags=re.M):
    add("reglas", f"r{n:03d}", {"orden": n, "tipo": "regla", "texto": limpio(t), "porque": "", "origen": "personal/reglas.md"})
    n += 1
for origen in (("referencias", "rechazados.md"), ("personal", "rechazados.md")):
    for titulo, cuerpo in secciones(leer_md(*origen)):
        _, filas = filas_tabla(cuerpo)
        for c in filas:
            if len(c) >= 2 and c[0]:
                add("reglas", f"x{n:03d}", {"orden": n, "tipo": "rechazado", "texto": limpio(c[0]), "porque": limpio(c[1]), "origen": "/".join(origen) + f" · {titulo}"})
                n += 1

# ── salida ──
if solo:
    docs = {c: d for c, d in docs.items() if c in solo}
os.makedirs(os.path.join(PER, "panel"), exist_ok=True)
json.dump(docs, open(os.path.join(PER, "panel", "panel_seed.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for col, ds in docs.items():
    os.makedirs(os.path.join(TMP, col), exist_ok=True)
    for i, d in ds.items():
        json.dump(d, open(os.path.join(TMP, col, i + ".json"), "w", encoding="utf-8"), ensure_ascii=False)
print(json.dumps({c: len(d) for c, d in docs.items()}, ensure_ascii=False))
