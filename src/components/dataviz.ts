import { html } from "npm:htl"

export interface PortfolioItem {
    id: number,
    title: string,
    year: number[],
    description: string,
    company: string,
    technology: string[],
    url: URL,
    image: URL,
    open: boolean
}

function getCard(item: PortfolioItem, images): HTMLElement {
    const techList = Array.isArray(item.technology) ? item.technology : String(item.technology).split(/\s*\/\s*|\s+/);
    const techs = techList.map(t => html`<span class="pf-chip">${t}</span>`);
    const yearStr = item.year.join("–");
    return html`<div class="pf-card">
        <div class="pf-card-body">
            <div class="pf-card-meta">
                <span class="pf-year">${yearStr}</span>
                <span class="pf-company">${item.company}</span>
                ${item.open ? html`<a class="pf-open-btn" href="${item.url}" target="_blank" rel="noopener">OPEN</a>` : null}
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
    return [...items]
        .sort((a, b) => Math.max(...b.year) - Math.max(...a.year))
        .map(i => getCard(i, images))
}
