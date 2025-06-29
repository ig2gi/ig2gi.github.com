---
title: Portfolio
toc: false
---

<style>

    figure.portfolio-item {
        max-width:200px;
        max-height:200px;
        display:block;
        margin:auto;
    }

    figure.portfolio-item figcaption{
        text-align:center;
    }

    span.chip {
        background: lightgrey;
        color: black;
        padding: 3px;
        border-radius: 5px;
    }

    div.card {
        width:250px;
        background-color:white; 
    }

    div.cards {
        display: flex;
        flex-wrap: wrap;
        align-content: stretch;
        gap: 10px 10px;
        justify-content:flex-start;
    }

</style>

```js
import {getCards} from "./components/portfolio.js"
```

```js
// limitation of Observable HQ framework
// need to reference explicitly images :-( to be copied in the dist directory during build
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
const portfolioItems = FileAttachment("./data/portfolio.json").json()
```

#### Portfolio

Selected data visualization projects from my professional and personal work over the years.


<div class="cards">
    ${getCards(portfolioItems, images)}
</div>