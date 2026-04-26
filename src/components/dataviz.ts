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

// ── Lightbox ──────────────────────────────────────────────────────────────────

function ensureLightbox(): HTMLElement {
    let lb = document.getElementById("pf-lightbox") as HTMLElement | null;
    if (lb) return lb;

    lb = document.createElement("div");
    lb.id = "pf-lightbox";
    lb.className = "pf-lightbox";
    lb.innerHTML = `
        <div class="pf-lightbox-backdrop"></div>
        <button class="pf-lightbox-close" aria-label="Close">×</button>
        <img class="pf-lightbox-img" src="" alt="">
    `;
    document.body.appendChild(lb);

    const close = () => {
        lb!.classList.remove("pf-lightbox--open");
        document.body.style.overflow = "";
    };

    lb.querySelector(".pf-lightbox-backdrop")!.addEventListener("click", close);
    lb.querySelector(".pf-lightbox-close")!.addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

    return lb;
}

function openLightbox(src: string, alt: string): void {
    const lb = ensureLightbox();
    (lb.querySelector(".pf-lightbox-img") as HTMLImageElement).src = src;
    (lb.querySelector(".pf-lightbox-img") as HTMLImageElement).alt = alt;
    lb.classList.add("pf-lightbox--open");
    document.body.style.overflow = "hidden";
}

// ── Card ──────────────────────────────────────────────────────────────────────

function getCard(item: PortfolioItem, images): HTMLElement {
    const techList = Array.isArray(item.technology) ? item.technology : String(item.technology).split(/\s*\/\s*|\s+/);
    const techs = techList.map(t => html`<span class="pf-chip">${t}</span>`);
    const yearStr = item.year.join("–");
    const src = images[item.id]?.href ?? "";

    return html`<div class="pf-card">
        <div class="pf-image-wrap" onclick=${() => openLightbox(src, item.title)}>
            <img src="${src}" alt="${item.title}">
        </div>
        <div class="pf-card-body">
            <div class="pf-card-meta">
                <span class="pf-year">${yearStr}</span>
                <span class="pf-company">${item.company}</span>
                ${item.open ? html`<a class="pf-open-btn" href="${item.url}" target="_blank" rel="noopener">OPEN ↗</a>` : null}
            </div>
            <div class="pf-title">${item.title}</div>
            <p class="pf-desc" data-tooltip="${item.description}">${item.description}</p>
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
