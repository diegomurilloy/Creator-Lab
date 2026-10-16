"""Revisa el contraste de los tokens del panel (plantillas/panel.html) en claro y oscuro.

Uso:
    python scripts/contraste_panel.py [panel.html] [panel_anterior.html]

Lee los bloques `:root {…}` (claro) y `:root[data-theme="dark"] {…}` (oscuro), calcula el contraste WCAG de cada par
texto/fondo y de los bordes de los campos, y marca lo que no pasa: texto ≥ 4.5:1 (AA), bordes y foco ≥ 3:1.
Con un segundo archivo imprime la tabla antes → después.

    python scripts/contraste_panel.py --marcas ejemplos/panel_seed_v2.json

Revisa los tokens de cada marca (colección marca_visual) después del mismo ajuste automático que hace la plantilla
(completa los que faltan y oscurece o aclara texto, acento y error hasta pasar AA).
"""
import re
import sys

PANEL = sys.argv[1] if len(sys.argv) > 1 else "plantillas/panel.html"
ANTES = sys.argv[2] if len(sys.argv) > 2 else None
# Tokens que una versión vieja puede no tener: qué se veía en su lugar.
DEFECTOS = {
    "field": "card",          # el campo era transparente sobre la tarjeta
    "field-line": None,       # borde transparente: invisible
    "on-fill": "#0B1F28",
    "focus": "fill",
}
PLACEHOLDER_VIEJO = "#A9A9A9"  # la versión vieja no fijaba color: gris por defecto del navegador (aprox.)


def lum(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def cr(a, b):
    if a is None or b is None:
        return 1.0
    x, y = sorted((lum(a), lum(b)), reverse=True)
    return (x + 0.05) / (y + 0.05)


def mezcla(a, b, t):
    pa = [int(a[i:i + 2], 16) for i in (1, 3, 5)]
    pb = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(x + (y - x) * t):02X}" for x, y in zip(pa, pb))


def tokens(html):
    css = html[: html.index("</style>")]
    claro = re.search(r":root\s*{([^}]*)}", css).group(1)
    oscuro = re.search(r':root\[data-theme="dark"\]\s*{([^}]*)}', css).group(1)
    leer = lambda b: dict(re.findall(r"--([\w-]+)\s*:\s*(#[0-9A-Fa-f]{6})", b))
    return {"claro": leer(claro), "oscuro": leer(oscuro)}


def resolver(t):
    t = dict(t)
    for k, v in DEFECTOS.items():
        if k not in t:
            t[k] = t.get(v, v) if v else None
    return t


PARES = [
    # (texto, fondo, mínimo, qué es)
    ("ink", "bg", 4.5, "Texto principal sobre el fondo"),
    ("ink", "card", 4.5, "Texto sobre tarjeta"),
    ("ink", "field", 4.5, "Texto que escribes en un campo"),
    ("placeholder", "field", 4.5, "Placeholder (texto guía) en un campo"),
    ("sec", "bg", 4.5, "Texto secundario sobre el fondo (intro, etiquetas)"),
    ("sec", "card", 4.5, "Texto secundario sobre tarjeta (ayuda, «Tu nota»)"),
    ("sec", "soft", 4.5, "«Sin preview» sobre el área de media"),
    ("accent", "bg", 4.5, "Acento como texto («Lab», contador)"),
    ("accent", "card", 4.5, "Acento como texto sobre tarjeta (código G#)"),
    ("bad", "card", 4.5, "Contador con cambios pendientes"),
    ("bad", "badsoft", 4.5, "Insignia «editado»"),
    ("on-fill", "fill", 4.5, "Chip de filtro activo"),
    ("bg", "ink", 4.5, "Botón y pestaña activa"),
    ("field-line", "field", 3.0, "Borde del campo contra su fondo"),
    ("field-line", "card", 3.0, "Borde del campo contra la tarjeta"),
    ("focus", "card", 3.0, "Anillo de foco"),
]


def evaluar(t, viejo):
    t = resolver(t)
    # La plantilla nueva pinta ::placeholder con var(--sec)
    t["placeholder"] = PLACEHOLDER_VIEJO if viejo else t["sec"]
    pct = 0.14 if viejo else 0.12
    t["badsoft"] = mezcla(t["card"], t["bad"], pct)
    return {q: cr(t.get(a), t.get(b)) for a, b, _, q in PARES}


# ── Réplica en Python del ajuste de la plantilla (completa + tokensDe) ──
BASE = {
    False: {"bg": "#F1EDE4", "card": "#FCFAF6", "ink": "#16191C", "sec": "#69645C", "line": "#E2DCD0", "soft": "#E9E3D7", "accent": "#136C97", "fill": "#23B5E8", "bad": "#A64A2B", "ok": "#2F7D5B", "field": "#FFFFFF", "field-line": "#8F877A", "focus": "#136C97"},
    True: {"bg": "#101316", "card": "#191D21", "ink": "#F1EDE4", "sec": "#9AA2A9", "line": "#2C333A", "soft": "#22272C", "accent": "#33CCFF", "fill": "#33CCFF", "bad": "#EE8A6A", "ok": "#6CC4A0", "field": "#0C0F12", "field-line": "#66707B", "focus": "#33CCFF"},
}


def asegura(fg, fondos, hacia, m):
    c = fg
    for i in range(21):
        if all(cr(c, f) >= m for f in fondos):
            break
        c = mezcla(fg, hacia, i / 20)
    return c


def ajusta(t, oscuro):
    if not (t.get("bg") and t.get("ink")):
        o = {**BASE[oscuro], **t}
    else:
        o = dict(t)
        o.setdefault("card", mezcla(o["bg"], "#FFFFFF", 0.05 if oscuro else 0.6))
        o.setdefault("line", mezcla(o["bg"], o["ink"], 0.12))
        o.setdefault("soft", mezcla(o["bg"], o["ink"], 0.06))
        o.setdefault("field", mezcla(o["bg"], "#000000", 0.3) if oscuro else "#FFFFFF")
        o.setdefault("field-line", mezcla(o["bg"], o["ink"], 0.45))
        o.setdefault("sec", mezcla(o["ink"], o["bg"], 0.4))
        o.setdefault("accent", o["ink"])
        o.setdefault("fill", o["accent"])
        o.setdefault("focus", o["accent"])
        o.setdefault("bad", "#E8805F" if oscuro else "#C8613F")
    fondos = [o["bg"], o["card"], o["field"]]
    o["ink"] = asegura(o["ink"], fondos, "#FFFFFF" if oscuro else "#000000", 7)
    for k in ("sec", "accent", "focus"):
        o[k] = asegura(o[k], fondos + [o["soft"]], o["ink"], 4.5)
    o["bad"] = asegura(o["bad"], fondos, o["ink"], 5.4)
    o["field-line"] = asegura(o["field-line"], [o["field"], o["card"]], o["ink"], 3)
    negro = mezcla(o["fill"], "#000000", 0.85)
    o["on-fill"] = negro if cr(negro, o["fill"]) >= cr("#FFFFFF", o["fill"]) else "#FFFFFF"
    if cr(o["on-fill"], o["fill"]) < 4.5:
        o["fill"] = asegura(o["fill"], ["#FFFFFF"], "#000000", 4.5)
        o["on-fill"] = "#FFFFFF"
    return o


def revisa_marcas(ruta):
    import json
    docs = json.load(open(ruta, encoding="utf8"))["marca_visual"]
    fallan = 0
    for d in sorted(docs.values(), key=lambda x: x.get("orden", 0)):
        for oscuro in (False, True):
            t = {c["token"]: c["hex"] for c in d["colores"] if c.get("token") and (c.get("tema") == "oscuro") == oscuro}
            o = ajusta(t, oscuro)
            r = evaluar(o, False)
            peor = min(r.items(), key=lambda kv: kv[1] / dict((q, m) for _, _, m, q in PARES)[kv[0]])
            mal = [q for a, b, m, q in PARES if r[q] < m]
            fallan += len(mal)
            cambios = ", ".join(f"{k} {t[k]}→{o[k]}" for k in ("ink", "sec", "accent", "fill", "bad", "focus") if k in t and t[k].upper() != o[k].upper())
            print(f"| {d.get('nombre', d.get('clave'))} | {'oscuro' if oscuro else 'claro'} | {'todo pasa' if not mal else 'NO: ' + '; '.join(mal)} | {peor[0]}: {peor[1]:.2f} | {cambios or 'sin ajustes'} |")
    return fallan


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass
    if PANEL == "--marcas":
        print("| Marca | Tema | Resultado | Par más justo | Ajustes automáticos para AA |\n|---|---|---|---|---|")
        f = revisa_marcas(ANTES or "ejemplos/panel_seed_v2.json")
        sys.exit(1 if f else 0)
    nuevo = tokens(open(PANEL, encoding="utf8").read())
    viejo = tokens(open(ANTES, encoding="utf8").read()) if ANTES else None
    fallan = 0
    for tema in ("claro", "oscuro"):
        print(f"\n## Tema {tema}\n")
        n = evaluar(dict(nuevo[tema]), False)
        v = evaluar(dict(viejo[tema]), True) if viejo else None
        print("| Par | Mínimo | " + ("Antes | " if v else "") + "Después | ¿Pasa? |")
        print("|---|---|" + ("---|" if v else "") + "---|---|")
        for a, b, m, q in PARES:
            ok = n[q] >= m
            fallan += not ok
            antes = f"{v[q]:.2f}{'' if v[q] >= m else ' ✗'} | " if v else ""
            print(f"| {q} (`{a}` / `{b}`) | {m}:1 | {antes}{n[q]:.2f} | {'sí' if ok else 'NO'} |")
    print(f"\n{'Todo pasa.' if not fallan else f'{fallan} pares no pasan.'}")
    sys.exit(1 if fallan else 0)


if __name__ == "__main__":
    main()
