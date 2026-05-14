// See https://observablehq.com/framework/config for documentation.

const scrollScript = `<script>
(function() {
  function init() {
    var hdr = document.getElementById('observablehq-header');
    if (!hdr) return;
    function update() { hdr.classList.toggle('scrolled', window.scrollY > 8); }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
</` + `script>`;

const pages = [
  { name: "Gilbert Perrin", path: "/index" },
  { name: "Timeline", path: "/timeline" },
  { name: "Resume", path: "/resume" },
  { name: "DataViz", path: "/dataviz" },
  { name: "Photography", path: "/photography" },
  { name: "Contact", path: "/contact" },
]

const header = ({ path }) => `
  <div class="home-header">
    <a class="hh-name" href="/index"><span class="hh-name-accent">g</span>ilbert&nbsp;<span class="hh-name-accent">p</span>errin</a>
    <nav class="hh-nav">
      ${pages.slice(1).map(p =>
        `<a href="${p.path}"${p.path === path ? ' class="active"' : ''}>${p.name.toLowerCase()}</a>`
      ).join('')}
    </nav>
  </div>
  ${scrollScript}
`

export default {
  // The app's title; used in the sidebar and webpage titles.
  title: "Gilbert Perrin",

  // The pages and sections in the sidebar. If you don't specify this option,
  // all pages will be listed in alphabetical order. Listing pages explicitly
  // lets you organize them into sections and have unlisted pages.
  pages: pages,

  // Content to add to the head of the page, e.g. for a favicon:
  header: header,

  // The path to the source root.
  root: "src",

  style: "style/main.css",

  // Some additional configuration options and their defaults:
  theme: "air", // try "light", "dark", "slate", etc.
  //header: "Hello", // what to show in the header (HTML)
  // footer: "Built with Observable.", // what to show in the footer (HTML)
  sidebar: false, // whether to show the sidebar
  // toc: true, // whether to show the table of contents
  pager: false, // whether to show previous & next links in the footer
  // output: "dist", // path to the output root for build
  // search: true, // activate search
  // linkify: true, // convert URLs in Markdown to links
  typographer: false, // smart quotes and other typographic improvements
  // preserveExtension: false, // drop .html from URLs
  // preserveIndex: false, // drop /index from URLs
};
