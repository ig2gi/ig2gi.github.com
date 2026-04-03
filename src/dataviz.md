---
title: DataViz
toc: false
---

<div class="page-full">
  <div class="page-full-watermark">DATAVIZ</div>
</div>

```js
import {getCards} from "./components/dataviz.js"
```

```js
const images = {
    1: FileAttachment("images/portfolio/travelmap.png"),
    2: FileAttachment("images/portfolio/dashboards.png"),
    3: FileAttachment("images/portfolio/protos.png"),
    4: FileAttachment("images/portfolio/sgmap.png"),
    5: FileAttachment("images/portfolio/prevent.png"),
    6: FileAttachment("images/portfolio/illusion.png"),
    7: FileAttachment("images/portfolio/gtc.png"),
    8: FileAttachment("images/portfolio/refseq.png"),
    9: FileAttachment("images/portfolio/cancer-small.png"),
    10: FileAttachment("images/portfolio/circos.jpeg"),
    11: FileAttachment("images/portfolio/ias.png"),
    12: FileAttachment("images/portfolio/cv_1.png"),
    13: FileAttachment("images/portfolio/w5.png"),
    14: FileAttachment("images/portfolio/w4.png"),
    15: FileAttachment("images/portfolio/w3.png"),
    16: FileAttachment("images/portfolio/w2.png"),
    17: FileAttachment("images/portfolio/philo.png"),
}
```

```js
const portfolioItems = FileAttachment("./data/dataviz.json").json()
```

<div class="pf-grid">
  ${getCards(portfolioItems, images)}
</div>
