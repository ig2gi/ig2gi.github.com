import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  integrations: [react(), mdx()],
  // $…$ and $$…$$ in Markdown/MDX are typeset with KaTeX at build time (no JS on the page)
  markdown: {
    remarkPlugins: [remarkMath],
    // \arraystretch gives matrices room between rows (superscripts and subscripts touch at 1)
    rehypePlugins: [[rehypeKatex, { macros: { '\\arraystretch': '1.3' } }]],
  },
  output: 'static',
  site: 'https://ig2gi.github.io',
  srcDir: './src',
  outDir: './dist',
  publicDir: './public',
  trailingSlash: 'never',
});
