// See https://observablehq.com/framework/config for documentation.

const pages = [
  { name: "Gilbert Perrin", path: "/index" },
  { name: "Timeline", path: "/timeline" },
  { name: "Resume", path: "/resume" },
  { name: "DataViz", path: "/dataviz" },
  { name: "Photography", path: "/photography" },
  { name: "Contact", path: "/contact" },
]

const header = ({ path }) => {
  if (path === "/index") return `
    <div class="home-header">
      <span class="hh-name">GILBERT PERRIN</span>
      <span class="hh-keywords">PRODUCT &middot; DESIGN &middot; ENGINEERING</span>
      <span class="hh-clock">
        <span id="hp-time">—</span>
        &nbsp;
        <span id="hp-date">—</span>
      </span>
    </div>
  `;

  const page = pages.find(p => p.path === path);
  const pageName = page ? page.name.toUpperCase() : path.replace("/", "").toUpperCase();

  return `
    <div class="home-header">
      <span class="hh-breadcrumb">
        <a href="/index">GILBERT PERRIN</a>
        <span class="hh-sep">/</span>
        <span class="hh-page">${pageName}</span>
      </span>
      <span class="hh-keywords">PRODUCT &middot; DESIGN &middot; ENGINEERING</span>
      <div class="header-logo"><img src="/images/eye.jpg" width="42" alt="Gilbert Perrin"></div>
    </div>
  `
}

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
