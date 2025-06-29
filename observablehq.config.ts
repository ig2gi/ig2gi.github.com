// See https://observablehq.com/framework/config for documentation.


const pages = [
  { name: "G/P", path: "/index" },
  { name: "Overview", path: "/overview" },
  { name: "Timeline", path: "/timeline" },
  { name: "Resume (CV)", path: "/resume" },
  { name: "Portfolio", path: "/portfolio" },
  { name: "Photography", path: "/photography" },
]


const header = ({ path }) => {

  const _links = pages.map(p => `<span style="font-weight:${path === p.path ? "bold" : "normal"}"><a href=${p.path}>${p.name}</a></span>`).join("")

  return `
    <div style="display: flex; flex-grow: 1; align-items: center; justify-content: start; white-space: nowrap; column-gap: 2em;">
      ${_links}
      <div style="margin-left: auto;"><img src="/images/eye.jpg"  width=42></div>
    </div>
  `

}

export default {
  // The app’s title; used in the sidebar and webpage titles.
  title: "Gilbert Perrin",

  // The pages and sections in the sidebar. If you don’t specify this option,
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
