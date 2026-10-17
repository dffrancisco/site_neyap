"""Gera blog/<slug>/index.html e blog/index.html a partir de artigos .md com frontmatter.
Uso: python3 scripts/gerar-blog.py <pasta-dos-md>
"""
import sys, json, html, pathlib, datetime
import markdown, yaml

SITE = "https://neyap.com.br"
raiz = pathlib.Path(__file__).resolve().parent.parent
origem = pathlib.Path(sys.argv[1])

HEAD = """<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <meta name="description" content="{desc}" />
  <meta name="robots" content="index, follow" />
  <meta name="theme-color" content="#267d8f" />
  <link rel="canonical" href="{url}" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <meta property="og:type" content="{ogtype}" />
  <meta property="og:site_name" content="Neyap" />
  <meta property="og:locale" content="pt_BR" />
  <meta property="og:url" content="{url}" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{desc}" />
  <meta property="og:image" content="{site}/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">{ld}</script>
  <script type="module" src="/src/main.js"></script>
</head>
<body class="bg-white text-neyap-body antialiased">
  <!-- @include partials/header.html -->
  <main id="conteudo" class="pt-28 pb-20">
{body}
  </main>
  <!-- @include partials/footer.html -->
</body>
</html>
"""

def esc(s): return html.escape(str(s), quote=True)

artigos = []
for f in sorted(origem.glob("*.md")):
    txt = f.read_text(encoding="utf-8")
    _, fm, corpo = txt.split("---", 2)
    meta = yaml.safe_load(fm)
    slug = meta["slug"]; url = f"{SITE}/blog/{slug}/"
    data = str(meta["date"])
    conteudo = markdown.markdown(corpo, extensions=["extra", "sane_lists"])
    ld = [
        {"@context": "https://schema.org", "@type": "Article", "headline": meta["title"],
         "description": meta["description"], "datePublished": data, "dateModified": data,
         "inLanguage": "pt-BR", "mainEntityOfPage": url, "image": f"{SITE}/og-image.png",
         "author": {"@type": "Organization", "name": "Neyap"},
         "publisher": {"@type": "Organization", "name": "Vyzo Tecnologia",
                       "logo": {"@type": "ImageObject", "url": f"{SITE}/icon-512.png"}}},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Início", "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": f"{SITE}/blog/"},
            {"@type": "ListItem", "position": 3, "name": meta["title"], "item": url}]},
    ]
    dia = datetime.date.fromisoformat(data).strftime("%d/%m/%Y")
    body = f"""    <article class="artigo mx-auto max-w-[720px] px-4">
      <nav class="mb-6 text-[13px] text-neyap-muted"><a href="/">Início</a> / <a href="/blog/">Blog</a></nav>
      <p class="mb-2 text-[13px] text-neyap-muted">Publicado em {dia}</p>
{conteudo}
    </article>"""
    out = raiz / "blog" / slug / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(HEAD.format(title=esc(meta["title"] + " | Neyap") if len(meta["title"]) <= 51 else esc(meta["title"]),
                               desc=esc(meta["description"]), url=url, site=SITE, ogtype="article",
                               ld=json.dumps(ld, ensure_ascii=False), body=body), encoding="utf-8", newline="\n")
    artigos.append((data, meta, slug))

artigos.sort(key=lambda a: (a[0], a[2]), reverse=True)
itens = "\n".join(
    f"""      <li class="border-b border-neyap-border py-6"><a href="/blog/{s}/" class="font-display text-xl font-semibold text-neyap-ink hover:text-neyap-brand">{esc(m['title'])}</a>
        <p class="mt-2 text-neyap-body">{esc(m['description'])}</p></li>""" for _, m, s in artigos)
body = f"""    <section class="mx-auto max-w-[720px] px-4">
      <h1 class="font-display text-4xl font-bold text-neyap-ink">Blog do Neyap</h1>
      <p class="mt-3 text-lg">Vendas e atendimento no WhatsApp, na prática do balcão.</p>
      <ul class="mt-8">
{itens}
      </ul>
    </section>"""
ld = {"@context": "https://schema.org", "@type": "Blog", "name": "Blog do Neyap", "url": f"{SITE}/blog/", "inLanguage": "pt-BR"}
(raiz / "blog" / "index.html").write_text(HEAD.format(title="Blog do Neyap: vendas e atendimento no WhatsApp",
    desc="Artigos práticos sobre vendas, atendimento e relatórios no WhatsApp para lojas e equipes comerciais.",
    url=f"{SITE}/blog/", site=SITE, ogtype="website", ld=json.dumps(ld, ensure_ascii=False), body=body), encoding="utf-8", newline="\n")
print("\n".join(s for _, _, s in artigos))
