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

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

function getCard(item: PortfolioItem, images): HTMLElement {
    const techList = Array.isArray(item.technology) ? item.technology : String(item.technology).split(/\s*\/\s*|\s+/);
    const techs = techList.map(t => html`<span class="pf-chip">${t}</span>`);
    const yearStr = item.year.join("–");
    return html`<div class="pf-card">
        <div class="pf-card-body">
            <div class="pf-card-meta">
                <span class="pf-num">[${pad(item.id)}]</span>
                <span class="pf-year">${yearStr}</span>
                <span class="pf-company">${item.company}</span>
            </div>
            <div class="pf-title">${item.title}</div>
            <p class="pf-desc">${item.description}</p>
        </div>
        <div class="pf-image-wrap">
            <img src="${images[item.id]?.href}" alt="${item.title}">
        </div>
        <div class="pf-techs">${techs}</div>
    </div>`
}

export function getCards(items: PortfolioItem[], images): HTMLElement[] {
    if (!items || items.length === 0) return []
    return items.map(i => getCard(i, images))
}
