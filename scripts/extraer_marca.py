"""Extrae la marca visual (logo, colores, fuentes y textos clave) de la página web de TU marca.

Uso:
    python scripts/extraer_marca.py <url> <carpeta_salida>

Ejemplo:
    python scripts/extraer_marca.py https://tumarca.com personal/marcas/tumarca

Es para la página de la propia marca de la persona, no para copiar marcas ajenas.

Qué hace:
- Descarga el HTML, sus CSS (máx. 15, solo del mismo dominio o de CDNs de fuentes), el manifest.json y los logos.
- Logo: <link rel=icon / apple-touch-icon>, og:image, <img>/<svg> con «logo» en src/alt/class/id o dentro de <header>.
- Colores: variables CSS (--*), hex/rgb/hsl/oklch más frecuentes y theme-color; agrupa similares y propone
  roles (fondo, texto, primario, acento) con su frecuencia.
- Fuentes: font-family usadas, links de Google Fonts y @font-face.
- Textos: title, description, h1, h2 y og:title como posibles eslóganes.

Salida en <carpeta_salida>: marca-visual.json, marca-visual.md, muestra.png y logos/ con los archivos.
Si la página es una SPA y el HTML trae poco, lo dice y saca lo que haya (CSS enlazados, manifest, favicon).
"""
from __future__ import annotations

import colorsys
import json
import math
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import date
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/126.0 Safari/537.36")
TIMEOUT = 15
MAX_CSS = 15
MAX_BYTES = 6_000_000
FONT_CDNS = ("fonts.googleapis.com", "fonts.gstatic.com", "use.typekit.net", "fonts.bunny.net", "rsms.me",
             "api.fontshare.com", "cdn.fontshare.com")


# ───────────────────────── descarga ─────────────────────────
def bajar(url: str, binario: bool = False):
    req = Request(url, headers={"User-Agent": UA, "Accept": "*/*", "Accept-Language": "es-MX,es;q=0.9,en;q=0.8"})
    with urlopen(req, timeout=TIMEOUT) as r:
        datos = r.read(MAX_BYTES + 1)[:MAX_BYTES]
        tipo = r.headers.get("Content-Type", "")
        final = r.geturl()
    if binario:
        return datos, tipo, final
    cs = "utf-8"
    m = re.search(r"charset=([\w-]+)", tipo)
    if m:
        cs = m.group(1)
    return datos.decode(cs, errors="replace"), tipo, final


def mismo_sitio(url: str, base: str) -> bool:
    a, b = urlparse(url).hostname or "", urlparse(base).hostname or ""
    raiz = lambda h: ".".join(h.split(".")[-2:])
    return raiz(a) == raiz(b)


def es_cdn_fuentes(url: str) -> bool:
    return (urlparse(url).hostname or "") in FONT_CDNS


# ───────────────────────── HTML ─────────────────────────
class Lector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links, self.metas, self.imgs, self.styles, self.inline = [], [], [], [], []
        self.title, self.h1, self.h2 = "", [], []
        self._en = []  # pila de etiquetas abiertas relevantes
        self._buf = None
        self._style = None
        self.texto_visible = 0
        self._skip = 0
        self.dentro_header = 0

    def handle_starttag(self, tag, attrs):
        a = {k: (v or "") for k, v in attrs}
        if a.get("style"):
            self.inline.append(a["style"])
        if tag == "link":
            self.links.append(a)
        elif tag == "meta":
            self.metas.append(a)
        elif tag == "img":
            a["_header"] = bool(self.dentro_header)
            self.imgs.append(a)
        elif tag == "style":
            self._style = []
        elif tag in ("script", "noscript", "template"):
            self._skip += 1
        elif tag in ("title", "h1", "h2"):
            self._en.append(tag)
            self._buf = []
        if tag == "header":
            self.dentro_header += 1

    def handle_endtag(self, tag):
        if tag == "style" and self._style is not None:
            self.styles.append("".join(self._style))
            self._style = None
        elif tag in ("script", "noscript", "template"):
            self._skip = max(0, self._skip - 1)
        elif tag in ("title", "h1", "h2") and self._en and self._en[-1] == tag:
            self._en.pop()
            t = re.sub(r"\s+", " ", "".join(self._buf or [])).strip()
            if t:
                if tag == "title":
                    self.title = self.title or t
                else:
                    getattr(self, tag).append(t)
            self._buf = None
        if tag == "header":
            self.dentro_header = max(0, self.dentro_header - 1)

    def handle_data(self, data):
        if self._style is not None:
            self._style.append(data)
            return
        if self._skip:
            return
        if self._buf is not None:
            self._buf.append(data)
        self.texto_visible += len(data.strip())


def svgs_logo(html: str) -> list[str]:
    """SVG en línea que parecen logo (atributos con «logo» o dentro de <header>). Omite íconos de 24 px."""
    def icono(s):
        cab = s[: s.find(">") + 1].lower()
        w = re.search(r'\bwidth="(\d+)', cab)
        return "lucide" in cab or ("icon" in cab and "logo" not in cab) or bool(w and int(w.group(1)) <= 24)

    out = []
    for m in re.finditer(r"<svg\b[^>]*>.*?</svg>", html, flags=re.S | re.I):
        s = m.group(0)
        if icono(s):
            continue
        cab = s[: s.find(">") + 1].lower()
        antes = html[max(0, m.start() - 300): m.start()].lower()
        if "logo" in cab or re.search(r"logo[^<>]{0,120}>?\s*$", antes):
            out.append(s)
    for h in re.finditer(r"<header\b.*?</header>", html, flags=re.S | re.I):
        for m in re.finditer(r"<svg\b[^>]*>.*?</svg>", h.group(0), flags=re.S | re.I):
            if m.group(0) not in out and not icono(m.group(0)):
                out.append(m.group(0))
                break
    return out[:4]


# ───────────────────────── color ─────────────────────────
def _clamp(x):
    return max(0.0, min(1.0, x))


def hex_de_rgb(r, g, b):
    return "#{:02X}{:02X}{:02X}".format(*(int(round(_clamp(c) * 255)) for c in (r, g, b)))


def oklch_a_rgb(L, C, H):
    a, b = C * math.cos(math.radians(H)), C * math.sin(math.radians(H))
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    f = lambda c: 12.92 * c if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055
    return f(r), f(g), f(bb)


NUM = r"(-?[\d.]+)(%|deg)?"
RE_COLOR = re.compile(
    r"#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b"
    r"|rgba?\(\s*[\d.%\s,/]+\)"
    r"|hsla?\(\s*[\d.%deg\s,/-]+\)"
    r"|oklch\(\s*[\d.%\s/-]+\)"
)


def normaliza(c: str):
    """Devuelve (#RRGGBB, alfa) o None."""
    c = c.strip().lower()
    try:
        if c.startswith("#"):
            h = c[1:]
            if len(h) in (3, 4):
                h = "".join(ch * 2 for ch in h)
            a = int(h[6:8], 16) / 255 if len(h) == 8 else 1.0
            return "#" + h[:6].upper(), a
        nums = re.findall(NUM, c[c.index("(") + 1: c.rindex(")")])
        vals = [(float(v), u) for v, u in nums]
        alfa = 1.0
        if len(vals) >= 4:
            v, u = vals[3]
            alfa = v / 100 if u == "%" else v
        if c.startswith("rgb"):
            rgb = [(v / 100 if u == "%" else v / 255) for v, u in vals[:3]]
            return hex_de_rgb(*rgb), alfa
        if c.startswith("hsl"):
            h, s, l = vals[0][0] / 360, vals[1][0] / 100, vals[2][0] / 100
            r, g, b = colorsys.hls_to_rgb(h % 1, l, s)
            return hex_de_rgb(r, g, b), alfa
        if c.startswith("oklch"):
            L = vals[0][0] / 100 if vals[0][1] == "%" else vals[0][0]
            C = vals[1][0] * 0.004 if vals[1][1] == "%" else vals[1][0]
            H = vals[2][0] if len(vals) > 2 else 0
            return hex_de_rgb(*oklch_a_rgb(L, C, H)), alfa
    except (ValueError, IndexError):
        return None
    return None


def rgb01(hx):
    return tuple(int(hx[i: i + 2], 16) / 255 for i in (1, 3, 5))


def lab(hx):
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(c) for c in rgb01(hx))
    x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
    y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    return 116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))


def luminancia(hx):
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(c) for c in rgb01(hx))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contraste(a, b):
    la, lb = sorted((luminancia(a), luminancia(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def croma(hx):
    _, a, b = lab(hx)
    return math.hypot(a, b)


def agrupa(conteo: Counter, umbral=7.0):
    """Agrupa colores casi iguales (ΔE76 < umbral). Devuelve [(hex representante, frecuencia, variantes)]."""
    grupos = []
    for hx, n in conteo.most_common():
        L = lab(hx)
        for g in grupos:
            if math.dist(L, g["lab"]) < umbral:
                g["n"] += n
                g["variantes"].append(hx)
                break
        else:
            grupos.append({"hex": hx, "lab": L, "n": n, "variantes": [hx]})
    grupos.sort(key=lambda g: -g["n"])
    return [(g["hex"], g["n"], g["variantes"]) for g in grupos]


# ───────────────────────── CSS ─────────────────────────
def quitar_comentarios(css):
    return re.sub(r"/\*.*?\*/", "", css, flags=re.S)


def limpia_familia(f: str) -> str:
    f = f.strip().strip("'\"").strip()
    # next/font genera nombres como __Inter_d65c78 o __Instrument_Serif_Fallback_abc
    m = re.match(r"^__(.+?)(_Fallback)?_[0-9a-f]{5,8}$", f)
    if m:
        if m.group(2):
            return ""
        f = m.group(1).replace("_", " ")
    return f


GENERICAS = {"serif", "sans-serif", "monospace", "system-ui", "ui-sans-serif", "ui-serif", "ui-monospace", "cursive",
             "fantasy", "inherit", "initial", "unset", "-apple-system", "blinkmacsystemfont", "apple color emoji",
             "segoe ui emoji", "segoe ui symbol", "noto color emoji", "emoji", "math", "ui-rounded", "revert",
             # fuentes del sistema que suelen ir de respaldo, no son la marca
             "segoe ui", "helvetica neue", "helvetica", "arial", "georgia", "times new roman", "times", "courier new",
             "menlo", "monaco", "consolas", "liberation mono", "sfmono-regular", "noto sans", "cambria", "roboto"}


def es_respaldo(f: str) -> bool:
    return f.lower() in GENERICAS or f.lower().endswith(" fallback")


def analiza_css(css: str, res: dict):
    css = quitar_comentarios(css)
    # variables
    for nombre, valor in re.findall(r"(--[\w-]+)\s*:\s*([^;}{]+)", css):
        valor = valor.strip()
        if nombre.startswith("--tw-"):  # valores por defecto de Tailwind, no son la marca
            continue
        res["variables_raw"].setdefault(nombre, valor)
        m = RE_COLOR.search(valor)
        if m and RE_COLOR.fullmatch(valor.replace("!important", "").strip()):
            n = normaliza(m.group(0))
            if n:
                res["variables"].setdefault(nombre, n[0])
    # colores (solo opacos o casi)
    for c in RE_COLOR.findall(css):
        n = normaliza(c)
        if n and n[1] >= 0.6:
            res["colores"][n[0]] += 1
    # fuentes
    for decl in re.findall(r"font-family\s*:\s*([^;}{]+)", css):
        partes = [limpia_familia(p) for p in decl.split(",")]
        for p in partes:
            if p and not p.startswith("var(") and not es_respaldo(p):
                res["fuentes_uso"][p] += 1
                break
    for bloque in re.findall(r"@font-face\s*{([^}]*)}", css):
        fam = re.search(r"font-family\s*:\s*([^;]+)", bloque)
        if fam:
            nombre = limpia_familia(fam.group(1))
            if nombre and not es_respaldo(nombre):
                src = re.findall(r"url\(([^)]+)\)", bloque)
                peso = re.search(r"font-weight\s*:\s*([^;]+)", bloque)
                ff = res["font_face"].setdefault(nombre, {"pesos": set(), "archivos": 0})
                if peso:
                    ff["pesos"].add(peso.group(1).strip())
                ff["archivos"] += len(src)
    # variables de fuentes (next/font: --font-inter: "__Inter_xxx")
    for nombre, valor in res["variables_raw"].items():
        if "font" in nombre:
            p = limpia_familia(valor.split(",")[0])
            if p and not es_respaldo(p) and not p.startswith("var("):
                res["fuentes_vars"][nombre] = p
    return [u.strip("'\" ") for u in re.findall(r"@import\s+(?:url\()?['\"]?([^'\")\s;]+)", css)]


def familias_google(url):
    out = []
    q = urlparse(url).query
    for fam in re.findall(r"family=([^&]+)", q):
        out.append(re.sub(r"[:@].*$", "", fam).replace("+", " "))
    return out


# ───────────────────────── roles ─────────────────────────
PISTAS = {
    "fondo": ("background", "bg", "paper", "surface", "canvas", "base"),
    "texto": ("foreground", "fg", "text", "ink", "body"),
    "primario": ("primary", "brand", "main"),
    "acento": ("accent", "secondary", "highlight", "sand", "gold"),
}


def propone_roles(grupos, variables, theme_color, fondo_manifest=None):
    roles = {}
    usados = set()
    if fondo_manifest:
        roles["fondo"] = {"hex": fondo_manifest, "por": "background_color del manifest"}
        usados.add(fondo_manifest)
    # 1) por nombre de variable
    malos = ("muted", "hover", "ring", "border", "destructive", "input", "chart", "sidebar", "popover", "card", "dark")
    for rol, pistas in PISTAS.items():
        if rol in roles:
            continue
        for nombre, hx in variables.items():
            n = re.sub(r"^(color|tw|clr)-", "", nombre.lower().lstrip("-"))
            if any(x in n for x in malos) or hx in usados:
                continue
            if rol == "texto":
                ok = n in ("foreground", "fg", "text", "ink", "text-primary", "body-color") or re.fullmatch(r"(text|ink)(-\w+)?", n)
            else:
                ok = "foreground" not in n and any(re.search(rf"(^|-){p}($|-)", n) for p in pistas)
            if ok:
                roles[rol] = {"hex": hx, "por": f"variable {nombre}"}
                usados.add(hx)
                break
    freq = {}
    for hx, n, variantes in grupos:
        for v in variantes:
            freq[v] = n
    claros = [g for g in grupos if lab(g[0])[0] > 90]
    oscuros = [g for g in grupos if lab(g[0])[0] < 25]
    vivos = [g for g in grupos if croma(g[0]) > 18 and 20 < lab(g[0])[0] < 92]
    if "fondo" not in roles and claros:
        roles["fondo"] = {"hex": claros[0][0], "por": "el claro más frecuente"}
    if "texto" not in roles and oscuros:
        roles["texto"] = {"hex": oscuros[0][0], "por": "el oscuro más frecuente"}
    if "primario" not in roles:
        if theme_color and theme_color not in (roles.get("fondo", {}).get("hex"),):
            roles["primario"] = {"hex": theme_color, "por": "meta theme-color"}
        elif vivos:
            roles["primario"] = {"hex": vivos[0][0], "por": "el color con croma más frecuente"}
    if "acento" not in roles:
        for g in vivos:
            if g[0] != roles.get("primario", {}).get("hex") and math.dist(lab(g[0]), lab(roles.get("primario", {}).get("hex", "#000000"))) > 15:
                roles["acento"] = {"hex": g[0], "por": "segundo color con croma"}
                break
    for r in roles.values():
        r["frecuencia"] = freq.get(r["hex"], 0)
    return roles


# ───────────────────────── muestra ─────────────────────────
def fuente_pil(tam, negrita=False):
    from PIL import ImageFont
    for f in (["segoeuib.ttf", "arialbd.ttf", "DejaVuSans-Bold.ttf"] if negrita else ["segoeui.ttf", "arial.ttf", "DejaVuSans.ttf"]):
        for base in ("C:/Windows/Fonts", "/usr/share/fonts/truetype/dejavu", "/Library/Fonts", ""):
            try:
                return ImageFont.truetype(os.path.join(base, f) if base else f, tam)
            except OSError:
                continue
    return ImageFont.load_default()


def hace_muestra(salida, nombre, logos, roles, grupos, fuentes):
    from PIL import Image, ImageDraw
    W, H = 1200, 760
    fondo = roles.get("fondo", {}).get("hex", "#FFFFFF")
    tinta = roles.get("texto", {}).get("hex", "#111111")
    if contraste(fondo, tinta) < 4.5:
        tinta = "#111111" if luminancia(fondo) > 0.4 else "#F5F5F5"
    im = Image.new("RGB", (W, H), fondo)
    d = ImageDraw.Draw(im)
    d.text((48, 40), nombre, fill=tinta, font=fuente_pil(44, True))
    d.text((48, 98), "Marca visual extraída de su página", fill=tinta, font=fuente_pil(20))
    # logo (el primero que PIL pueda abrir)
    x = 48
    for lg in logos:
        p = lg.get("archivo")
        if not p or p.endswith(".svg"):
            continue
        try:
            lo = Image.open(os.path.join(salida, p)).convert("RGBA")
            lo.thumbnail((110, 110))
            im.paste(lo, (W - 48 - lo.width, 40), lo)
            break
        except Exception:
            continue
    # roles
    d.text((48, 160), "ROLES PROPUESTOS", fill=tinta, font=fuente_pil(16, True))
    for i, rol in enumerate(("fondo", "texto", "primario", "acento")):
        r = roles.get(rol)
        x0 = 48 + i * 280
        if not r:
            continue
        d.rounded_rectangle((x0, 190, x0 + 260, 330), 18, fill=r["hex"], outline=tinta, width=2)
        d.text((x0, 340), f"{rol}  {r['hex']}", fill=tinta, font=fuente_pil(20, True))
    # paleta frecuente
    d.text((48, 400), "COLORES MÁS FRECUENTES", fill=tinta, font=fuente_pil(16, True))
    for i, (hx, n, _) in enumerate(grupos[:10]):
        x0 = 48 + i * 110
        d.rectangle((x0, 430, x0 + 96, 510), fill=hx, outline=tinta, width=1)
        d.text((x0, 516), hx, fill=tinta, font=fuente_pil(15))
        d.text((x0, 536), f"×{n}", fill=tinta, font=fuente_pil(14))
    d.text((48, 590), "FUENTES", fill=tinta, font=fuente_pil(16, True))
    d.text((48, 618), " · ".join(fuentes[:5]) or "no se encontraron", fill=tinta, font=fuente_pil(30, True))
    d.text((48, 700), "Las muestras usan una fuente del sistema; los nombres son los que declara el CSS.", fill=tinta, font=fuente_pil(15))
    im.save(os.path.join(salida, "muestra.png"))


# ───────────────────────── principal ─────────────────────────
def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    url, salida = sys.argv[1], sys.argv[2]
    if not url.startswith("http"):
        url = "https://" + url
    os.makedirs(os.path.join(salida, "logos"), exist_ok=True)
    avisos = []

    html, _, final = bajar(url)
    lec = Lector()
    lec.feed(html)

    res = {"variables": {}, "variables_raw": {}, "colores": Counter(), "fuentes_uso": Counter(),
           "font_face": {}, "fuentes_vars": {}}
    google = []
    for st in lec.styles:
        analiza_css(st, res)
    for st in lec.inline:
        analiza_css("x{" + st + "}", res)

    # CSS enlazados
    cola = []
    for l in lec.links:
        rel = l.get("rel", "").lower()
        href = l.get("href")
        if not href:
            continue
        absu = urljoin(final, href)
        if "stylesheet" in rel or (rel == "preload" and l.get("as") == "style") or href.split("?")[0].endswith(".css"):
            cola.append(absu)
    # Next.js a veces enlaza el CSS solo dentro del payload: buscar rutas .css en el HTML
    for m in re.findall(r"[\"'](/[^\"'\s]+?\.css(?:\?[^\"'\s]*)?)[\"']", html):
        cola.append(urljoin(final, m))
    vistos, css_bajados = set(), []
    while cola and len(css_bajados) < MAX_CSS:
        u = cola.pop(0)
        if u in vistos:
            continue
        vistos.add(u)
        if not (mismo_sitio(u, final) or es_cdn_fuentes(u)):
            avisos.append(f"CSS de otro dominio omitido: {u}")
            continue
        if "fonts.googleapis.com" in u:
            google += familias_google(u)
        try:
            css, _, _ = bajar(u)
        except Exception as e:  # noqa: BLE001
            avisos.append(f"No se pudo bajar {u}: {e}")
            continue
        css_bajados.append(u)
        for imp in analiza_css(css, res):
            cola.append(urljoin(u, imp))
    if len(cola) and len(css_bajados) >= MAX_CSS:
        avisos.append(f"Se llegó al máximo de {MAX_CSS} CSS; {len(cola)} quedaron sin bajar.")
    for l in lec.links:
        if "fonts.googleapis.com" in l.get("href", ""):
            google += familias_google(l["href"])

    metas = {}
    for m in lec.metas:
        k = (m.get("name") or m.get("property") or "").lower()
        if k and m.get("content"):
            metas.setdefault(k, m["content"])
    theme = normaliza(metas["theme-color"])[0] if metas.get("theme-color") and normaliza(metas["theme-color"]) else None

    # manifest
    manifest = {}
    for l in lec.links:
        if "manifest" in l.get("rel", "").lower() and l.get("href"):
            try:
                txt, _, _ = bajar(urljoin(final, l["href"]))
                manifest = json.loads(txt)
            except Exception as e:  # noqa: BLE001
                avisos.append(f"No se pudo leer el manifest: {e}")
            break
    if not manifest:
        for ruta in ("/manifest.json", "/manifest.webmanifest", "/site.webmanifest"):
            try:
                txt, tipo, _ = bajar(urljoin(final, ruta))
                if txt.strip().startswith("{"):
                    manifest = json.loads(txt)
                    break
            except Exception:  # noqa: BLE001
                continue
    for k in ("theme_color", "background_color"):
        if manifest.get(k) and normaliza(manifest[k]):
            res["colores"][normaliza(manifest[k])[0]] += 3
    if theme:
        res["colores"][theme] += 3

    # logos
    candidatos = []
    for l in lec.links:
        rel = l.get("rel", "").lower()
        if any(r in rel for r in ("icon", "apple-touch-icon", "mask-icon")) and l.get("href"):
            candidatos.append({"tipo": rel, "url": urljoin(final, l["href"]), "tam": l.get("sizes", "")})
    if metas.get("og:image"):
        candidatos.append({"tipo": "og:image", "url": urljoin(final, metas["og:image"])})
    for i in lec.imgs:
        txt = " ".join(i.get(k, "") for k in ("src", "alt", "class", "id")).lower()
        if ("logo" in txt or i.get("_header")) and i.get("src"):
            candidatos.append({"tipo": "img logo" if "logo" in txt else "img en header", "url": urljoin(final, i["src"]), "alt": i.get("alt", "")})
    for ic in manifest.get("icons", [])[:4]:
        if ic.get("src"):
            candidatos.append({"tipo": "manifest icon", "url": urljoin(final, ic["src"]), "tam": ic.get("sizes", "")})
    if not any("icon" in c["tipo"] for c in candidatos):
        candidatos.append({"tipo": "favicon.ico", "url": urljoin(final, "/favicon.ico")})
    logos, vistas = [], set()
    for c in candidatos:
        if c["url"] in vistas or c["url"].startswith("data:"):
            continue
        vistas.add(c["url"])
        if not (mismo_sitio(c["url"], final) or "image" in c["tipo"] or urlparse(c["url"]).hostname in ("", None)):
            # imágenes de CDN propias (p. ej. Vercel/Next) se permiten si vienen del HTML
            pass
        try:
            datos, tipo, _ = bajar(c["url"], binario=True)
        except Exception as e:  # noqa: BLE001
            avisos.append(f"Logo no disponible ({c['tipo']}): {c['url']} · {e}")
            continue
        ext = os.path.splitext(urlparse(c["url"]).path)[1].lower() or ".bin"
        if "svg" in tipo:
            ext = ".svg"
        elif "png" in tipo:
            ext = ".png"
        elif "icon" in tipo or "ico" in tipo:
            ext = ".ico"
        elif "jpeg" in tipo:
            ext = ".jpg"
        elif "webp" in tipo:
            ext = ".webp"
        if ext == ".bin" or len(datos) < 60:
            continue
        huella = hash(datos)
        if huella in vistas:
            continue
        vistas.add(huella)
        nombre = re.sub(r"[^\w.-]+", "-", f"{len(logos) + 1:02d}-{c['tipo']}")[:40] + ext
        with open(os.path.join(salida, "logos", nombre), "wb") as f:
            f.write(datos)
        c.update({"archivo": f"logos/{nombre}", "bytes": len(datos)})
        logos.append(c)
    for n, s in enumerate(svgs_logo(html)):
        nombre = f"logos/svg-en-linea-{n + 1}.svg"
        if "xmlns" not in s[:200]:
            s = s.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"', 1)
        with open(os.path.join(salida, nombre), "w", encoding="utf8") as f:
            f.write(s)
        logos.append({"tipo": "svg en línea", "archivo": nombre, "bytes": len(s)})

    # colores y roles
    grupos = agrupa(res["colores"])
    bg_man = normaliza(manifest["background_color"])[0] if manifest.get("background_color") and normaliza(manifest["background_color"]) else None
    roles = propone_roles(grupos, res["variables"], theme, bg_man)

    # fuentes
    fuentes = []
    for f, _ in res["fuentes_uso"].most_common():
        if f not in fuentes:
            fuentes.append(f)
    for f in list(res["font_face"]) + list(res["fuentes_vars"].values()) + google:
        if f and f not in fuentes:
            fuentes.append(f)

    spa = lec.texto_visible < 400 or bool(re.search(r'<div id="(root|app|__next)">\s*</div>', html))
    if spa:
        avisos.append(f"La página parece una SPA o trae poco texto en el HTML ({lec.texto_visible} caracteres visibles): "
                      "se usó lo que hay (CSS enlazados, manifest y favicon).")

    nombre_marca = manifest.get("short_name") or (re.split(r"\s[—–|·-]\s", manifest["name"])[0] if manifest.get("name") else "") or metas.get("og:site_name") or (lec.title.split("|")[0].split("·")[0].split("—")[0].strip() if lec.title else urlparse(final).hostname)
    salida_json = {
        "url": url, "url_final": final, "fecha": date.today().isoformat(), "marca": nombre_marca,
        "es_spa": spa, "css_analizados": css_bajados,
        "logos": logos,
        "colores": {
            "roles_propuestos": roles,
            "theme_color": theme,
            "manifest": {k: manifest.get(k) for k in ("theme_color", "background_color") if manifest.get(k)},
            "variables": res["variables"],
            "frecuentes": [{"hex": h, "frecuencia": n, "variantes": v[:6]} for h, n, v in grupos[:24]],
        },
        "fuentes": {
            "principales": fuentes[:6],
            "uso_font_family": dict(res["fuentes_uso"].most_common(12)),
            "font_face": {k: {"pesos": sorted(v["pesos"]), "archivos": v["archivos"]} for k, v in res["font_face"].items()},
            "variables": res["fuentes_vars"],
            "google_fonts": sorted(set(google)),
        },
        "textos": {
            "title": lec.title, "description": metas.get("description") or metas.get("og:description", ""),
            "og_title": metas.get("og:title", ""), "h1": lec.h1[:5], "h2": lec.h2[:8],
            "esloganes": [t for t in [metas.get("og:title", "")] + lec.h1[:3] + lec.h2[:3] if t][:6],
        },
        "avisos": avisos,
    }
    with open(os.path.join(salida, "marca-visual.json"), "w", encoding="utf8") as f:
        json.dump(salida_json, f, ensure_ascii=False, indent=2)

    # markdown
    L = [f"# Marca visual · {nombre_marca}", "",
         f"Extraída de {url} el {salida_json['fecha']} con `scripts/extraer_marca.py`. Son **propuestas**: revísalas y "
         "corrige lo que no sea tu marca antes de usarlas en `personal/paletas.md`.", ""]
    if spa:
        L += ["> La página parece una SPA: el HTML trae poco. Se usó lo que hay (CSS, manifest, favicon).", ""]
    L += ["## Logo", ""]
    L += [f"- `{l['archivo']}` · {l['tipo']}" + (f" · {l.get('tam')}" if l.get("tam") else "") + (f" · {l.get('url')}" if l.get("url") else "") for l in logos] or ["- No se encontró logo."]
    L += ["", "## Colores (roles propuestos)", "", "| Rol | Hex | Por qué | Frecuencia |", "|---|---|---|---|"]
    for rol in ("fondo", "texto", "primario", "acento"):
        r = roles.get(rol)
        L.append(f"| {rol} | `{r['hex']}` | {r['por']} | {r['frecuencia']} |" if r else f"| {rol} | — | no se encontró | — |")
    L += ["", "**Más frecuentes** (agrupados): " + " · ".join(f"`{h}` ×{n}" for h, n, _ in grupos[:12]), ""]
    if theme:
        L.append(f"- theme-color: `{theme}`")
    if res["variables"]:
        L += ["", "<details><summary>Variables CSS de color</summary>", ""]
        L += [f"- `{k}`: `{v}`" for k, v in list(res["variables"].items())[:60]]
        L += ["", "</details>"]
    L += ["", "## Fuentes", ""]
    L += [f"- **{f}**" for f in fuentes[:6]] or ["- No se encontraron."]
    if google:
        L.append(f"- Google Fonts: {', '.join(sorted(set(google)))}")
    t = salida_json["textos"]
    L += ["", "## Textos clave", "", f"- **Title:** {t['title']}", f"- **Description:** {t['description']}"]
    L += [f"- **H1:** {h}" for h in t["h1"]] + [f"- **H2:** {h}" for h in t["h2"][:5]]
    if avisos:
        L += ["", "## Avisos", ""] + [f"- {a}" for a in avisos]
    L += ["", "Muestra: `muestra.png`."]
    with open(os.path.join(salida, "marca-visual.md"), "w", encoding="utf8") as f:
        f.write("\n".join(L) + "\n")

    try:
        hace_muestra(salida, nombre_marca, logos, roles, grupos, fuentes)
    except Exception as e:  # noqa: BLE001
        print(f"No se pudo generar muestra.png: {e}")

    print(json.dumps({"marca": nombre_marca, "spa": spa, "css": len(css_bajados), "logos": [l["archivo"] for l in logos],
                      "roles": {k: v["hex"] for k, v in roles.items()}, "fuentes": fuentes[:6], "avisos": len(avisos)},
                     ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
