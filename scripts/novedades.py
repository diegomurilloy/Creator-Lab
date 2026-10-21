# Arma la página de novedades de Creator Lab a partir de NOVEDADES.md.
# Uso: python scripts/novedades.py salida.html [--desde AAAA-MM-DD]
#   --desde: solo las entradas posteriores a esa fecha (la última actualización de la persona).
import argparse
import html
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def entradas(texto):
    bloques = re.split(r"^## ", texto, flags=re.M)[1:]
    for b in bloques:
        cab, _, cuerpo = b.partition("\n")
        fecha, _, titulo = cab.partition("·")
        yield fecha.strip(), titulo.strip(), cuerpo.strip()


def inline(t):
    t = html.escape(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    return re.sub(r"`(.+?)`", r"<code>\1</code>", t)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("salida")
    ap.add_argument("--desde", default="")
    a = ap.parse_args()
    items = [e for e in entradas((RAIZ / "NOVEDADES.md").read_text(encoding="utf-8")) if e[0] > a.desde]
    secciones = []
    for fecha, titulo, cuerpo in items:
        lis = "".join(f"<li>{inline(l[2:])}</li>" for l in cuerpo.splitlines() if l.startswith("- "))
        secciones.append(f'<section><p class="f">{html.escape(fecha)}</p><h2>{html.escape(titulo)}</h2><ul>{lis}</ul></section>')
    cuerpo = "".join(secciones) or '<p class="vacio">Ya tienes todo lo nuevo. No hay novedades desde tu última actualización.</p>'
    pagina = PLANTILLA.replace("{{SECCIONES}}", cuerpo)
    Path(a.salida).write_text(pagina, encoding="utf-8")
    print(f"{len(items)} entradas -> {a.salida}")


PLANTILLA = """<title>Novedades de Creator Lab</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@500&display=swap">
<style>
/* Una columna de lectura: cada actualización es una sección con su fecha. */
:root { --bg:#f5f6f4; --paper:#fff; --ink:#15191c; --muted:#5d666c; --line:#dfe3e0; --accent:#2f6f5e;
  --display:"Bricolage Grotesque",system-ui,sans-serif; --body:"IBM Plex Sans",system-ui,sans-serif; --mono:"IBM Plex Mono",ui-monospace,monospace; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#0f1312; --paper:#161c1a; --ink:#e7ece9; --muted:#9aa5a0; --line:#27302d; --accent:#7fd1b4; color-scheme:dark; } }
:root[data-theme="dark"] { --bg:#0f1312; --paper:#161c1a; --ink:#e7ece9; --muted:#9aa5a0; --line:#27302d; --accent:#7fd1b4; color-scheme:dark; }
body { background:var(--bg); color:var(--ink); font:16px/1.6 var(--body); padding-block:32px 64px;
  padding-left:max(16px, env(safe-area-inset-left, 0px)); padding-right:max(16px, env(safe-area-inset-right, 0px)); }
main { max-width:680px; margin:0 auto; display:grid; gap:20px; }
h1 { font:700 clamp(30px,6vw,44px)/1.05 var(--display); margin:0; letter-spacing:-0.02em; text-wrap:balance; }
.lead { color:var(--muted); margin:0; }
section { background:var(--paper); border:1px solid var(--line); border-radius:12px; padding:18px 20px; }
.f { font:500 12px var(--mono); color:var(--accent); letter-spacing:.06em; margin:0; text-transform:uppercase; }
h2 { font:700 22px/1.2 var(--display); margin:4px 0 10px; }
ul { margin:0; padding-left:20px; display:grid; gap:8px; }
code { font:13px var(--mono); background:var(--bg); padding:1px 5px; border-radius:4px; }
.vacio { color:var(--muted); }
</style>
<main>
<h1>Novedades de Creator Lab</h1>
<p class="lead">Lo que llegó en tu última actualización. Todo lo tuyo (marca, guiones, preferencias) se quedó igual.</p>
{{SECCIONES}}
</main>
"""

if __name__ == "__main__":
    main()
