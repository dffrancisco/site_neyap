import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';

// Cabeçalho e rodapé compartilhados: <!-- @include partials/x.html -->
const includes = () => ({
  name: 'html-includes',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) =>
      html.replace(/<!--\s*@include\s+([\w/.-]+)\s*-->/g, (_, f) =>
        readFileSync(resolve(__dirname, f), 'utf-8')),
  },
});

// Toda pasta com index.html vira uma página (/, /autopecas/, /privacidade/, /blog/<slug>/)
const pages = { main: resolve(__dirname, 'index.html') };
for (const dir of ['autopecas', 'privacidade', 'blog']) {
  const base = resolve(__dirname, dir);
  if (existsSync(resolve(base, 'index.html'))) pages[dir] = resolve(base, 'index.html');
  if (dir === 'blog' && existsSync(base)) {
    for (const slug of readdirSync(base, { withFileTypes: true })) {
      const f = resolve(base, slug.name, 'index.html');
      if (slug.isDirectory() && existsSync(f)) pages[`blog-${slug.name}`] = f;
    }
  }
}

export default defineConfig({
  plugins: [includes(), tailwindcss()],
  build: {
    target: 'es2020',
    cssMinify: true,
    rollupOptions: {
      input: pages,
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});
