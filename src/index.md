---
theme: air
toc: false
style: style/main.css
---

<div class="hero-page">

  <nav class="hp-nav">
    <a href="/index" class="active">01 HOME</a>
    <a href="/timeline">02 TIMELINE</a>
    <a href="/resume">03 RESUME</a>
    <a href="/dataviz">04 DATAVIZ</a>
    <a href="/photography">05 PHOTOGRAPHY</a>
  </nav>

  <div class="hp-watermark" aria-hidden="true">GP</div>

  <div class="hp-tagline">
    <p>I turn complex data into clear,<br>usable experiences — where product,<br>design and engineering converge.</p>
    <span class="hp-scroll">[SCROLL TO EXPLORE]</span>
  </div>

  <div class="hp-thumbnails">
    <figure class="hp-thumb">
      <figcaption>[01]</figcaption>
      <img src="/images/portfolio/travelmap.png" alt="Travel Map">
    </figure>
    <figure class="hp-thumb">
      <figcaption>[02]</figcaption>
      <img src="/images/portfolio/dashboards.png" alt="Dashboards">
    </figure>
    <figure class="hp-thumb">
      <figcaption>[03]</figcaption>
      <img src="/images/portfolio/circos.jpeg" alt="Circos">
    </figure>
    <figure class="hp-thumb">
      <figcaption>[04]</figcaption>
      <img src="/images/portfolio/sgmap.png" alt="World Map">
    </figure>
  </div>

</div>

```js
{
  function tick() {
    const timeEl = document.getElementById('hp-time');
    const dateEl = document.getElementById('hp-date');
    if (!timeEl || !dateEl) return;
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('fr-FR', {
      timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit'
    }) + ' [FR]';
    dateEl.textContent = now.toLocaleDateString('en-US', {
      timeZone: 'Europe/Paris', month: 'long', day: 'numeric', year: 'numeric'
    }).toUpperCase();
  }
  tick();
  const t = setInterval(tick, 1000);
  invalidation.then(() => clearInterval(t));
}
```

<div class="profile-sections">

  <div class="ps">
    <div class="ps-label">
      <strong>Profile</strong>
      01 — WHO I AM
    </div>
    <div class="ps-body">
      <img src="/images/cover.png" class="ps-image" alt="recursion">
      <span class="ps-caption">recursion ©gilbertperrin 2008</span>
      <p>I'm a <b>product, design, and engineering leader</b> with a data‑ and facts‑driven mindset, focused on <b>turning complex business needs into clear, usable experiences.</b> My background blends Product Management, Data Visualization, Data Engineering, and Frontend Engineering — grounded in curiosity about the underlying domain and strong attention to detail.</p>
      <p>I've been working at <a href="https://www.sophiagenetics.com/" target="_blank">Sophia Genetics</a> for over 11 years, building tools and platforms at the intersection of data and healthcare.</p>
    </div>
  </div>

  <div class="ps">
    <div class="ps-label">
      <strong>Expertise</strong>
      02 — WHAT I DO
    </div>
    <div class="ps-body">
      <p><b>Product Management</b> — I frame ambiguous problems into actionable roadmaps, bridging business stakeholders and engineering teams with structured reasoning and clear communication.</p>
      <p><b>Data Visualization</b> — I build interactive charts and dashboards that make complex datasets legible. D3.js has been my core tool for over a decade, from genomics platforms to business metrics.</p>
      <p><b>Frontend Engineering</b> — I write production code. From UI prototypes to full data pipelines, I step in and build when it matters — not just specify.</p>
    </div>
  </div>

  <div class="ps">
    <div class="ps-label">
      <strong>Approach</strong>
      03 — HOW I WORK
    </div>
    <div class="ps-body">
      <p>I am recognised for my <b>high-level communication skills and structured reasoning</b>. I help teams frame problems clearly, make faster decisions and share knowledge across departments — in major presentations as much as in day-to-day collaboration.</p>
      <p>I'm a <b>hands-on person who steps in to move work forward.</b> I combine this with a track record of building dashboards spanning business outcomes, platform usage, and software development metrics.</p>
      <p>I have fully embraced AI and machine learning in my routine work, while maintaining <b>critical thinking</b> as a defining trait — grounded in both reasoning skills and fundamental AI/ML knowledge gained through certifications. I bring a strong vision of what it means to deliver AI tools in highly regulated environments like healthcare.</p>
      <img src="/images/walker-dreamer.svg" class="ps-image" alt="Walker Dreamer">
    </div>
  </div>

  <div class="ps">
    <div class="ps-label">
      <strong>Background</strong>
      04 — ORIGINS
    </div>
    <div class="ps-body">
      <p>I hold a first master's degree in <b>Mathematics, Fluid Mechanics, and Thermodynamics</b>, followed by a second master's in <b>Computer Science</b>. That blend of rigorous science and applied engineering has shaped how I think about every problem.</p>
      <p>I've always been passionate about data and the art of telling stories through <b>data visualizations</b> — that sweet spot where logic and design come together. Outside of work, I love reading, running, and <b>photography</b>, which keep me creative and observant.</p>
      <div class="ps-links">
        <a href="/timeline">View Timeline →</a>
        <a href="/dataviz">See DataViz →</a>
        <a href="https://www.linkedin.com/in/gilbertperrin/" target="_blank">LinkedIn →</a>
      </div>
    </div>
  </div>

</div>
