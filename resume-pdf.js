const PDFDocument = require('pdfkit');
const fs = require('fs');
const mt = require('moment');
const Resume = require('./resume-data');

//
//
// ================================================
//
// Useful Constants
//
// ================================================
//
//

const VERSION = "V4.2";
const marginH = 90;
const baseColor = "#5D6D7E";
const color1 = "#AAB7B8";
const categoryColors = {
    "employee": "#F8C471",
    "formation": "#BB8FCE",
    "freelance": "#7DCEA0",
    "education": "#A5C4D4",
    "consultant": "#7DCEA0",
    "other": "#E5E8E8",
    "freelance - consultant": "#7DCEA0",
};

//
//
// ================================================
//
// Load Data
//
// ================================================
//
//
const resume = Resume.load('./timeline/events.json');


//
//
// ================================================
//
// Provides  useful styling methods on top 
// of PDFKIT library.
//
// ================================================
//

// main instance of the pdf document
let pdf;

// helper methods
const _strong = (size, color) => _font("Bold", size, color);
const _medium = (size, color) => _font("Medium", size, color);
const _regular = (size, color) => _font("Regular", size, color);
const _light = (size, color) => _font("Light", size, color);
const _font = (style, size = 9, color = baseColor) => {
    pdf.font(`webfonts/DINNextLTPro-${style}.ttf`);
    return pdf.fontSize(size).fillColor(color);
};
const _multilines = (lines, styleMethod, size, align = "left", color = baseColor) => {
    lines.forEach(l => {
        styleMethod(size, color).text(l, {
            "align": align
        });
    });
};
const _title = (txt) => _strong(16, baseColor).text(txt).moveDown(0.8);
const _subtitle = (txt) => _medium(12, baseColor).text(txt).moveDown(0);
const _reset = () => pdf.text("", marginH, pdf.y);
const _columns = (words, columnwidth, height) => {
    let x = marginH + 10;
    let y0 = pdf.y;
    let gap = 20;
    words.forEach(w => {
        if (pdf.y > (y0 + height)) {
            x += columnwidth + gap;
        }
        if (w[1] >= 4)
            _regular(9);
        else
            _light(9);
        pdf.text(w[2] ? w[0].toUpperCase() : w[0], x, pdf.y > (y0 + height) ? y0 : pdf.y, {
            align: 'justify'
        });

    });
};

//
//
// ================================================
//
// Launch PDF Generation
//
// ================================================
//
//

startDocument()
    .then(doHeader())
    .then(doProfile())
    .then(doSkills())
    .then(doEvents(resume.getExperience(), "Work Experience", false))
    .then(doEvents(resume.getEducation(), "Education", true))
    .then(doEvents(resume.getCertificates(), "Certificates", false))
    .then(doHobbies())
    .then(endDocument());


//
//
// ================================================
//
// PDF Functions for generating content 
// (resume sections)
//
// ================================================
//
//

/**
 * Initialises pdf document
 *
 * @returns Promise
 */
function startDocument() {
    return new Promise((resolve, reject) => {

        pdf = new PDFDocument({
            autoFirstPage: false,
            margins: {
                top: 80,
                bottom: 10,
                left: marginH,
                right: 10
            },
            layout: "portrait",
            size: "A4",
            bufferPages: true

        });

        pdf.pipe(fs.createWriteStream('./timeline/gperrin-resume.pdf')); // write to PDF

        pdf.addPage();

        resolve(pdf);

    });
}



function doEvents(data, title, newPageAtEnd = false) {
    return new Promise((resolve, reject) => {
        //
        _title(title);
        //
        data.forEach(event => {

            if (pdf.y > 650) {
                pdf.addPage();
                _strong(16)
                    .text(`${title} cont.`)
                    .moveDown(1);
            }

            // YEAR
            _light(20, color1)
                .text(event.years.length == 1 ? event.years[0] : event.years[1], pdf.x - 1.5 * pdf.widthOfString("1000"), pdf.y);

            const yYear = pdf.y - pdf.heightOfString("1000");
            const x1 = pdf.x + pdf.widthOfString("2") / 2 - 2;
            const y1 = pdf.y - 2;

            // DURATION & END DATE
            let y2 = y1;
            const h = 10;
            _regular(8, color1).text(event.periodAsStringShort[1], x1 + 4, y2);
            y2 += pdf.heightOfString("O") + 2;
            _regular(6, color1).text(`(${event.durationAsString})`, x1 + 4, y2, {
                oblique: true
            });
            y2 += 2 * h / 3 + 4;


            // TITLE
            if (event.type === "experience") {
                _medium(12, "#2980B9")
                    .text(event.company.name, marginH, yYear + 2, {
                        link: event.company.url,
                        underline: false
                    }).moveDown(0.5);
            } else
                _medium(12)
                .text(event.title, marginH, yYear + 2)
                .moveDown(0.5);

            // INDUSTRY
            _strong(8);
            let ind = event.industry + (!event.subIndustry || event.subIndustry === "" ? "" : " - " + event.subIndustry);
            let height = pdf.currentLineHeight();
            pdf.moveUp(2);
            _regular(9, "#1F618D")
                .highlight(pdf.x + 440 - pdf.widthOfString(` ${ind} `), pdf.y, pdf.widthOfString(` ${ind}  `), height, {
                    color: "#D5DBDB"
                })
                .text(ind.toLowerCase(), pdf.x, pdf.y, {
                    align: "right",
                    width: 440
                });

            // CATEGORY
            if (event.type === "experience") {
                const col = categoryColors[event.category];
                _strong(6, col)
                    .text(event.category.toUpperCase(), pdf.x, pdf.y, {
                        align: "right",
                        width: 440
                    });

            }

            // CONTENT
            pdf.moveDown(0.5);
            getWriter(event.type, event.category)(event);

            // START DATE
            if (pdf.y < y2) {
                _regular(9).text(" ", 0, y2);
            }
            _regular(8, color1).text(event.periodAsStringShort[0], x1 + 4, pdf.y);

            // END EVENT (YEAR LINE)
            pdf.moveTo(x1, y1 - 3)
                .lineTo(x1, pdf.y)
                .lineWidth(0.5)
                .stroke(color1)
                .strokeOpacity(0.6);


            pdf.text("", marginH, pdf.y).moveDown(2);


        });

        if (newPageAtEnd)
            pdf.addPage();

        resolve(pdf);

    });

}

function getWriter(type, category) {
    switch (type) {
        case "experience":
            return experienceWriter;

        case "formation":
            return certificateWriter;

        default:
            return experienceWriter;
    }
}


function experienceWriter(exp) {

    if (exp.isSingle)
        writeSingleExperience(exp, false);
    else
        exp.events.forEach(e => {
            writeSingleExperience(e, true);
            pdf.moveDown(0.5);
        });

}

function writeSingleExperience(event, showPeriod) {
    // sub title
    let y0 = pdf.y;
    _medium(10)
        .text(event.title, marginH, pdf.y);
    pdf.moveDown(0.2);

    // PERIOD
    if (showPeriod) {
        let p = event.periodAsString;
        _regular(8, color1).text(p.join(" - "), pdf.x, y0, {
            align: "right",
            width: 440
        });

        pdf.moveDown(0.3);
    }

    // description
    const items = event.description.split(". ");
    items.forEach(i => {
        pdf.rect(marginH + 5, pdf.y + 3, 1, 1).fill("#5D6D7E");
        _regular(9)
            .text(i, marginH + 10, pdf.y, {
                align: "justify",
                width: 420
            });
    });
}


function certificateWriter(exp) {

    const desc = exp.description;
    _medium(10, "#2980B9")
        .text(exp.company.name, marginH + 10, pdf.y, {
            link: exp.company.url,
            underline: false
        })
        .moveDown(0.1);


    _regular(9)
        .text(desc, marginH + 10, pdf.y, {
            align: "justify",
            width: 420
        });

    if (exp.links && exp.links.length > 0) {
        pdf.moveDown();
        let t = "Certificate(s): ".toUpperCase();
        _regular(8, "#B2BABB").text(t);
        let x = pdf.x + pdf.widthOfString(t) + 5;
        pdf.moveUp();
        let l = exp.links[0];
        let w = pdf.widthOfString(l.name) + 5;
        _regular(8, "#2980B9")
            .text(l.name.toUpperCase(), x, pdf.y, {
                align: "left",
                link: `${l.url}`,
                underline: false
            });

        if (exp.links.length > 1)
            exp.links.slice(1).forEach(l => {
                pdf.moveUp();
                x += w;
                _regular(8, "#2980B9")
                    .text(l.name.toUpperCase(), x, pdf.y, {
                        align: "left",
                        link: `${l.url}`,
                        underline: false
                    });
            });
    }


}

function doSkills() {

    return new Promise((resolve, reject) => {

        const skillInfo = resume.skills;

        // soft skills
        _title("Top 6 Soft Skills");
        pdf.moveUp(0.5);
        let skills = skillInfo.soft.sort((a, b) => a.localeCompare(b)).join("  ");
        _light(9).text(skills.toUpperCase(), marginH + 10, pdf.y);

        pdf.moveDown(2);
        _reset();

        // hard skills

        _title("Hard Skills");
        pdf.moveUp(0.5);

        _regular(8).text("Non exhaustive list, sorted alphabetically (libraries, frameworks or tools commonly used in development, like  git, maven, hibernate, mysql , pynum, jquery, ..., are not listed)", marginH + 10, pdf.y, {
            align: "justify",
            width: 420
        });
        pdf.moveDown(1);
        skills = skillInfo.hard.sort((a, b) => a[0].localeCompare(b[0]));
        _columns(skills, 100, 80);


        pdf.moveDown(3);


        pdf.addPage();
        resolve(pdf);

    });
}

function doProfile() {

    const writeProfile = (profile) => {
        _subtitle(profile.title);
        pdf.moveDown(0.3);
        _regular(9).text(profile.description, marginH + 10, pdf.y, {
            align: "justify",
            width: 420
        });
        _reset();
        pdf.moveDown(1);
    };

    return new Promise((resolve, reject) => {

        // profiles
        _title("Profile");

        pdf.moveUp(0.5);

        const profileInfo = resume.profile;

        _regular(9).text(profileInfo.description, marginH + 10, pdf.y, {
            align: "justify",
            width: 420
        });
        _reset();
        pdf.moveDown(1);
        profileInfo.axes.forEach(p => writeProfile(p));
        pdf.moveDown(1);

        resolve(pdf);

    });
}




function doHeader() {
    return new Promise((resolve, reject) => {

        // Header rectangle background
        pdf.rect(0, 0, 630, 170)
            .fill('#EBEDEF');


        // Profile Header
        const r = 50;
        const xc = 45 + 2 * r;
        const yc = 2 * r - 20;

        pdf.circle(xc, yc, r + 16).lineWidth(0).fillOpacity(0).lineWidth(1).stroke("white");
        pdf.fillOpacity(1);

        // SOCIAL

        drawItemsOnCircle(resume.socialNetworks, xc, yc, r, -3 * Math.PI / 4, -Math.PI / 10, "left", "#2980B9", 8);
        drawItemsOnCircle(resume.contactInfo, xc, yc, r, -Math.PI / 3, Math.PI / 10, "right", "#566573", 9, 11, false);
        drawItemsOnCircle(resume.aptitudes, xc, yc, r, Math.PI / 20, Math.PI / 10, "right", "#1F618D", 9);

        // CONTACT
        const personalInfo = resume.personalInfo;

        pdf.save();
        pdf.circle(xc, yc, r).clip();
        pdf.image(personalInfo.picture, xc - r, yc - r, {
            height: 2 * r
        });
        pdf.restore();

        // HEADER 
        _light(25).text(personalInfo.name, 5, 16, {
            align: "right"
        });

        const headerInfo = resume.header;

        let lines = headerInfo.title.split(/[\\._]/g);
        _multilines(lines, _regular, 10, "right", "#1F618D");
        pdf.moveDown(1);
        pdf.moveTo(480, pdf.y - 8).lineTo(585, pdf.y - 8).lineWidth(1).stroke("white");
        lines = headerInfo.description.split(/[\\._]/g);
        _multilines(lines, _regular, 10, "right", "#566573");
        pdf.moveDown(1);
        pdf.moveTo(480, pdf.y - 8).lineTo(585, pdf.y - 8).lineWidth(1).stroke("white");
        lines = resume.languages.map(d => `${d.level} - ${d.name.toUpperCase()}`);
        _multilines(lines, _regular, 8, "right", "#566573");

        pdf.text("", marginH, 180);

        resolve(pdf);

    });
}

function drawItemsOnCircle(items, xc, yc, r, startAngle, stepAngle, align, color, fontSize, iconSize = 12, underline = true) {
    let angle = startAngle;
    items.forEach(s => {
        let x = xc + (r + 16) * Math.cos(angle);
        let y = yc + (r + 16) * Math.sin(angle);
        pdf.image(`${s.logo}`, x - iconSize / 2, y - iconSize / 2, {
            height: iconSize
        });
        const offsetX = 10;
        _regular(fontSize, color).text(s.name, align === "left" ? x - pdf.widthOfString(s.name) - offsetX : x + offsetX, y + -iconSize / 2 + pdf.heightOfString(s.name) / 6, {
            align: "left",
            link: s.link,
            underline: underline && s.link !== ""
        });
        angle += stepAngle;
    });
}


function endDocument() {
    return new Promise((resolve, reject) => {
        const range = pdf.bufferedPageRange(); // => { start: 0, count: 2 }}
        for (let i = 0; i < range.start + range.count; i++) {


            pdf.switchToPage(i);

            // TOP
            if (i !== 0) { // skip frontpage

                _regular(9).text(`Gilbert Perrin Resume`, 0, 10, {
                    align: "right",
                    margins: {
                        bottom: 0
                    }
                });
                _light(6).text(`Page ${i + 1} of ${range.count}`, 0, 20, {
                    align: "right"
                });

                let x = 10;
                let y = 10;
                resume.contactInfo.forEach(s => {
                    pdf.image(`${s.logo}`, x, y, {
                        height: 8
                    });
                    _regular(7, "#2980B9").text(s.name, x + 10, y, {
                        align: "left",
                        link: s.link,
                        underline: s.link !== ""
                    });
                    x += pdf.widthOfString(s.name) + 20;
                });

            }


            // BOTTOM
            _light(8).text(`generated ${mt().format('MMM D YYYY, h:mm')} (Node.js® and PDFKit) - ${VERSION} - © gilbert perrin 2019`, 20, 820, {
                align: "center",
                margins: {
                    bottom: 0
                },
            });
        }

        // finalize the PDF and end the stream
        pdf.end();

        resolve(pdf);

    });
}

function doHobbies() {

    return new Promise((resolve, reject) => {

        // profiles
        _title("Additional Activities & Interests");

        // doc.moveUp(0.5);

        resume.hobbies.forEach(h => {
            // title
            let y0 = pdf.y;
            _medium(12).text(h.title, marginH, pdf.y);
            // description
            let listIndex = h.description.indexOf("-");
            let s = listIndex === -1 ? h.description : h.description.slice(0, listIndex);
            _regular(9).text(s, marginH + 10, pdf.y, {
                align: "justify",
                width: 420
            });
            // list of things, if needed
            if (listIndex >= 0) {
                pdf.moveDown(0.5);
                let things = h.description.slice(listIndex + 1, h.description.length).split("-");
                things.forEach(item => {
                    _regular(9).text("- " + item, marginH + 10, pdf.y, {
                        align: "justify",
                        width: 420
                    });
                });
            }
            // image
            pdf.image(`images/${h.image}`, marginH - 40, y0, {
                height: 20
            });

            pdf.moveDown(1);
        });


        resolve(pdf);

    });
}