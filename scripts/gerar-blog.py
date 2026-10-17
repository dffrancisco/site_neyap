"""Gera blog/<slug>/index.html e blog/index.html a partir de artigos .md com frontmatter.
Uso: python3 scripts/gerar-blog.py <pasta-dos-md>
"""
import sys, json, html, pathlib, datetime, re
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
  <main id="conteudo">
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
    m = re.search(r"<h1>(.*?)</h1>", conteudo, re.S)
    titulo_h1 = m.group(1) if m else esc(meta["title"])
    if m: conteudo = conteudo[:m.start()] + conteudo[m.end():]
    body = f"""    <header class="relative overflow-hidden bg-petroleo pt-36 pb-16 md:pt-44 md:pb-20">
      <div class="mx-auto max-w-[820px] px-4">
        <nav class="text-[13px] text-white/60"><a href="/" class="hover:text-white">Início</a> / <a href="/blog/" class="hover:text-white">Blog</a></nav>
        <p class="mt-6 font-mono text-[12px] uppercase tracking-[0.14em] text-[#8fd3df]">Publicado em {dia}</p>
        <h1 class="mt-4 font-display text-[34px] font-extrabold leading-[1.1] !text-white sm:text-[46px]">{titulo_h1}</h1>
        <p class="mt-5 max-w-2xl text-[18px] leading-relaxed text-white/75">{esc(meta["description"])}</p>
      </div>
    </header>
    <article class="artigo mx-auto max-w-[720px] px-4 pt-14 pb-10">
{conteudo}
    </article>
    <aside class="mx-auto mb-24 max-w-[720px] px-4">
      <div class="rounded-[22px] bg-neyap-ink p-8 text-white sm:p-10">
        <p class="font-mono text-[12px] uppercase tracking-[0.14em] text-[#8fd3df]">Neyap Insights</p>
        <p class="mt-3 font-display text-[26px] font-bold leading-snug">Veja quanto o WhatsApp da sua loja vende e perde, por vendedor.</p>
        <a data-wa-cta href="https://wa.me/556120994303?text=Ol%C3%A1%2C%20quero%20conhecer%20o%20Neyap" target="_blank" rel="noopener" class="btn-primary mt-6">Falar no WhatsApp</a>
      </div>
    </aside>"""
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
body = f"""    <header class="bg-petroleo pt-36 pb-16 md:pt-44 md:pb-20">
      <div class="mx-auto max-w-[820px] px-4">
        <p class="font-mono text-[12px] uppercase tracking-[0.14em] text-[#8fd3df]">Blog</p>
        <h1 class="mt-4 font-display text-[40px] font-extrabold leading-tight !text-white sm:text-[52px]">Blog do Neyap</h1>
        <p class="mt-4 text-lg text-white/75">Vendas e atendimento no WhatsApp, na prática do balcão.</p>
      </div>
    </header>
    <section class="mx-auto max-w-[820px] px-4 pt-6 pb-24">
      <ul>
{itens}
      </ul>
    </section>"""
ld = {"@context": "https://schema.org", "@type": "Blog", "name": "Blog do Neyap", "url": f"{SITE}/blog/", "inLanguage": "pt-BR"}
(raiz / "blog" / "index.html").write_text(HEAD.format(title="Blog do Neyap: vendas e atendimento no WhatsApp",
    desc="Artigos práticos sobre vendas, atendimento e relatórios no WhatsApp para lojas e equipes comerciais.",
    url=f"{SITE}/blog/", site=SITE, ogtype="website", ld=json.dumps(ld, ensure_ascii=False), body=body), encoding="utf-8", newline="\n")
print("\n".join(s for _, _, s in artigos))
