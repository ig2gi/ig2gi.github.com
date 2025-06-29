import { html } from "npm:htl"


export interface PortfolioItem {

    id: number,
    title: string,
    year: number[],
    description: string,
    company: string,
    technology: string[],
    url: URL,
    image: URL

}

function getCard(item: PortfolioItem, images): string {
    return html`
        <div class="card">
            <h2><b>${item.title}</b> <span class="red" style="float:right;">link</span></h2>
            <p style="text-align:justify;">
                ${item.description}
            </p>
            <figure class="portfolio-item">
                <img src="${images[item.id]?.href}" >
                <figcaption> ${item.technology}</figcaption>
            </figure>
            <p style="text-align: left;">
                <span class="chip small"><small>${item.company}</small></span>
                <span class="chip"><small class="blue">${item.year.join("-")}</small></span>
            </p>
        </div>
    `
}

export function getCards(items: PortfolioItem[], images): string[] {
    if (!items || items.length === 0)
        return []
    return items.map(i => getCard(i, images))
}


