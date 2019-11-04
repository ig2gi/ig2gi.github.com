const PDFDocument = require('pdfkit');
const fs = require('fs');
const mt = require('moment');
const rd = require('./resume-data');

//
//
// ================================================
//
// Useful Constants
//
// ================================================
//
//

const VERSION = "V4.0";
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
const resume = rd('./timeline/events.json');
const certificates = resume.getCertificates();
const experiences = resume.getExperiences();
const educations = resume.getEducations();


//
//
// ================================================
//
// Initialize PDF Document and provides 
// useful styling methods.
//
// ================================================
//
//
const doc = initializeDocument();
const strong = (size, color) => font("Bold", size, color);
const medium = (size, color) => font("Medium", size, color);
const regular = (size, color) => font("Regular", size, color);
const light = (size, color) => font("Light", size, color);
const font = (style, size = 9, color = baseColor) => {
    doc.font(`webfonts/DINNextLTPro-${style}.ttf`);
    return doc.fontSize(size).fillColor(color);
};
const multilines = (lines, styleMethod, size, align = "left", color = baseColor) => {
    lines.forEach(l => {
        styleMethod(size, color).text(l, {
            "align": align
        });
    });
};
const _title = (txt) => strong(16, baseColor).text(txt).moveDown(0.8);
const _subtitle = (txt) => medium(12, baseColor).text(txt).moveDown(0);
const _reset = () => doc.text("", marginH, doc.y);



//
//
// ================================================
//
// PDF Functions for generating content
//
// ================================================
//
//

function initializeDocument() {
    const doc = new PDFDocument({
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

    doc.pipe(fs.createWriteStream('./timeline/gperrin-resume.pdf')); // write to PDF
    return doc;
}



function writeEvents(data, title, newPageAtEnd = false) {
    return new Promise((resolve, reject) => {
        //
        _title(title);
        //
        data.forEach(event => {

            if (doc.y > 650) {
                doc.addPage();
                strong(16)
                    .text(`${title} cont.`)
                    .moveDown(1);
            }



            // YEAR
            light(20, color1)
                .text(event.years.length == 1 ? event.years[0] : event.years[1], doc.x - 1.5 * doc.widthOfString("1000"), doc.y);

            const yYear = doc.y - doc.heightOfString("1000");
            const x1 = doc.x + doc.widthOfString("2") / 2 - 2;
            const y1 = doc.y - 2;

            // DURATION
            let y2 = y1;
            const h = 10;
            regular(8, color1).text(event.periodAsStringShort[1], x1 + 4, y2);
            y2 += doc.heightOfString("O") + 2;
            /*
            doc.image(`images/arrow3.png`, x1+4, y2, {
                height: h
            });
            y2 += h/3;*/
            regular(6, color1).text(`(${event.durationAsString})`, x1 + 4, y2, {
                oblique: true
            });
            y2 += 2 * h / 3 + 4;



            // TITLE
            if (event.type === "experience")
                medium(12, "#2980B9")
                .text(event.company.name, marginH, yYear + 2, {
                    link: event.company.url,
                    underline: false
                }).moveDown(0.5);
            else
                medium(12)
                .text(event.title, marginH, yYear + 2)
                .moveDown(0.5);

            // INDUSTRY
            strong(8);
            let ind = event.industry + (!event.subIndustry || event.subIndustry === "" ? "" : " - " + event.subIndustry);
            let height = doc.currentLineHeight();
            doc.moveUp(2);
            regular(9, "#1F618D")
                .highlight(doc.x + 440 - doc.widthOfString(` ${ind} `), doc.y, doc.widthOfString(` ${ind}  `), height, {
                    color: "#D5DBDB"
                })
                .text(ind.toLowerCase(), doc.x, doc.y, {
                    align: "right",
                    width: 440
                });



            // CONTENT
            doc.moveDown(0.5);
            getWriter(event.type, event.category)(event);

            if (doc.y < y2) {
                regular(9).text(" ", 0, y2);
            }
            regular(8, color1).text(event.periodAsStringShort[0], x1 + 4, doc.y);

            // END EVENT (YEAR LINE)
            doc.moveTo(x1, y1 - 3)
                .lineTo(x1, doc.y)
                .lineWidth(0.5)
                .stroke(color1)
                .strokeOpacity(0.6);


            //doc.circle(x1, y1 + 6, 4).fill(categoryColors[event.category]);


            doc.text("", marginH, doc.y).moveDown(2);


        });

        if (newPageAtEnd)
            doc.addPage();

        resolve(doc);

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
            doc.moveDown(0.5);
        });

}

function writeSingleExperience(event, showPeriod) {
    // sub title
    let y0 = doc.y;
    medium(10)
        .text(event.title, marginH, doc.y);
    doc.moveDown(0.2);

    // PERIOD
    if (showPeriod) {
        let p = event.periodAsString;
        regular(8, color1).text(p.join(" - "), doc.x, y0, {
            align: "right",
            width: 440
        });

        doc.moveDown(0.3);
    }

    // description
    const items = event.description.split(". ");
    items.forEach(i => {
        doc.rect(marginH + 5, doc.y + 3, 1, 1).fill("#5D6D7E");
        regular(9)
            .text(i, marginH + 10, doc.y, {
                align: "justify",
                width: 420
            });
    });
}


function certificateWriter(exp) {

    const desc = exp.description;
    medium(10, "#2980B9")
        .text(exp.company.name, marginH + 10, doc.y, {
            link: exp.company.url,
            underline: false
        })
        .moveDown(0.1);


    regular(9)
        .text(desc, marginH + 10, doc.y, {
            align: "justify",
            width: 420
        });

    if (exp.links && exp.links.length > 0) {
        doc.moveDown();
        let t = "Certificate(s): ".toUpperCase();
        regular(8, "#B2BABB").text(t);
        let x = doc.x + doc.widthOfString(t) + 5;
        doc.moveUp();
        let l = exp.links[0];
        let w = doc.widthOfString(l.name) + 5;
        regular(8, "#2980B9")
            .text(l.name.toUpperCase(), x, doc.y, {
                align: "left",
                link: `${l.url}`,
                underline: false
            });

        if (exp.links.length > 1)
            exp.links.slice(1).forEach(l => {
                doc.moveUp();
                x += w;
                regular(8, "#2980B9")
                    .text(l.name.toUpperCase(), x, doc.y, {
                        align: "left",
                        link: `${l.url}`,
                        underline: false
                    });
            });
    }


}

function writeFirstPage() {

    return new Promise((resolve, reject) => {

        // profiles
        _title("Profile");

        doc.moveUp(0.5);

        regular(9).text(resume.profile.description, marginH + 10, doc.y, {
            align: "justify",
            width: 420
        });
        _reset();
        doc.moveDown(1);
        resume.profile.axes.forEach(p => writeProfile(p));
        doc.moveDown(1);

        // soft skills
        _title("Top 6 Soft Skills");
        doc.moveUp(0.5);
        let skills = resume.softSkills.sort((a, b) => a.localeCompare(b)).join("  ");
        light(9).text(skills.toUpperCase(), marginH + 10, doc.y);

        doc.moveDown(2);
        _reset();

        // hard skills

        _title("Hard Skills");
        doc.moveUp(0.5);

        regular(8).text("Non exhaustive list, sorted alphabetically (libraries, frameworks or tools commonly used in development, like  git, maven, hibernate, mysql , pynum, jquery, ..., are not listed)", marginH + 10, doc.y, {
            align: "justify",
            width: 420
        });
        doc.moveDown(1);
        const hskills = resume.hardSkills.sort((a, b) => a[0].localeCompare(b[0]));
        columns(hskills, 100, 80);


        doc.moveDown(3);


        doc.addPage();
        resolve(doc);

    });
}

function writeProfile(profile) {
    _subtitle(profile.title);
    doc.moveDown(0.3);
    regular(9).text(profile.description, marginH + 10, doc.y, {
        align: "justify",
        width: 420
    });
    _reset();
    doc.moveDown(1);
}

function startDocument() {
    return new Promise((resolve, reject) => {

        doc.addPage();

        // Header rectangle background
        doc.rect(0, 0, 630, 170)
            .fill('#EBEDEF');


        // Profile Header
        const r = 50;
        const xc = 45 + 2 * r;
        const yc = 2 * r - 20;

        doc.circle(xc, yc, r + 16).lineWidth(0).fillOpacity(0).lineWidth(1).stroke("white");
        doc.fillOpacity(1);

        // SOCIAL

        drawItemsOnCircle(resume.social, xc, yc, r, -3 * Math.PI / 4, -Math.PI / 10, "left", "#2980B9", 8);
        drawItemsOnCircle(resume.contact, xc, yc, r, -Math.PI / 3, Math.PI / 10, "right", "#566573", 9, 11, false);
        drawItemsOnCircle(resume.aptitudes, xc, yc, r, Math.PI / 20, Math.PI / 10, "right", "#1F618D", 9);

        // CONTACT

        doc.save();
        doc.circle(xc, yc, r).clip();
        doc.image(`images/me.jpg`, xc - r, yc - r, {
            height: 2 * r
        });
        doc.restore();



        // HEADER 
        light(25).text(resume.name, 5, 16, {
            align: "right"
        });
        let lines = resume.headerTitle.split(/[\\._]/g);
        multilines(lines, regular, 10, "right", "#1F618D");
        doc.moveDown(1);
        doc.moveTo(480, doc.y - 8).lineTo(585, doc.y - 8).lineWidth(1).stroke("white");
        lines = resume.headerInfo.split(/[\\._]/g);
        multilines(lines, regular, 10, "right", "#566573");
        doc.moveDown(1);
        doc.moveTo(480, doc.y - 8).lineTo(585, doc.y - 8).lineWidth(1).stroke("white");
        lines = resume.languages.map(d => `${d.level} - ${d.name.toUpperCase()}`);
        multilines(lines, regular, 8, "right", "#566573");

        doc.text("", marginH, 180);

        resolve(doc);

    });
}

function drawItemsOnCircle(items, xc, yc, r, startAngle, stepAngle, align, color, fontSize, iconSize = 12, underline = true) {
    let angle = startAngle;
    items.forEach(s => {
        let x = xc + (r + 16) * Math.cos(angle);
        let y = yc + (r + 16) * Math.sin(angle);
        doc.image(`${s.logo}`, x - iconSize / 2, y - iconSize / 2, {
            height: iconSize
        });
        const offsetX = 10;
        regular(fontSize, color).text(s.name, align === "left" ? x - doc.widthOfString(s.name) - offsetX : x + offsetX, y + -iconSize / 2 + doc.heightOfString(s.name) / 6, {
            align: "left",
            link: s.link,
            underline: underline && s.link !== ""
        });
        angle += stepAngle;
    });
}

function columns(words, columnwidth, height) {
    let x = marginH + 10;
    let y0 = doc.y;
    let gap = 20;
    words.forEach(w => {
        if (doc.y > (y0 + height)) {
            x += columnwidth + gap;
        }
        if (w[1] >= 4)
            regular(9);
        else
            light(9);
        doc.text(w[2] ? w[0].toUpperCase() : w[0], x, doc.y > (y0 + height) ? y0 : doc.y, {
            align: 'justify'
        });

    });
}

function endDocument() {
    return new Promise((resolve, reject) => {
        const range = doc.bufferedPageRange(); // => { start: 0, count: 2 }}
        for (let i = 0; i < range.start + range.count; i++) {


            doc.switchToPage(i);

            // TOP
            if (i !== 0) { // skip frontpage

                regular(9).text(`Gilbert Perrin Resume`, 0, 10, {
                    align: "right",
                    margins: {
                        bottom: 0
                    }
                });
                light(6).text(`Page ${i + 1} of ${range.count}`, 0, 20, {
                    align: "right"
                });

                let x = 10;
                let y = 10;
                resume.contact.forEach(s => {
                    doc.image(`${s.logo}`, x, y, {
                        height: 8
                    });
                    regular(7, "#2980B9").text(s.name, x + 10, y, {
                        align: "left",
                        link: s.link,
                        underline: s.link !== ""
                    });
                    x += doc.widthOfString(s.name) + 20;
                });

            }


            // BOTTOM
            light(8).text(`generated ${mt().format('MMM D YYYY, h:mm')} (Node.js® and PDFKit) - ${VERSION} - © gilbert perrin 2019`, 20, 820, {
                align: "left",
                margins: {
                    bottom: 0
                },
            });
            const categories = ["Employee", "Freelance - Consultant", "Formation", "Education", "Other"];
            let x = 330;
            categories.forEach((c, i) => {
                x += i === 0 ? 0 : doc.widthOfString(categories[i - 1]) + 10;
                doc.rect(x - 4, 820, 3, 6).fill(categoryColors[c.toLowerCase()]);
                light(8).text(c, x, 820, {
                    align: "left",
                    margins: {
                        bottom: 0
                    }
                });
            });
        }

        // finalize the PDF and end the stream
        doc.end();

        resolve(doc);

    });
}

function writeHobbies() {

    return new Promise((resolve, reject) => {

        // profiles
        _title("Additional Activities & Interests");

        // doc.moveUp(0.5);

        resume.hobbies.forEach(h => {
            // title
            let y0 = doc.y;
            medium(12).text(h.title, marginH, doc.y);
            // description
            let listIndex = h.description.indexOf("-");
            let s = listIndex === -1 ? h.description : h.description.slice(0, listIndex);
            regular(9).text(s, marginH + 10, doc.y, {
                align: "justify",
                width: 420
            });
            // list of things, if needed
            if (listIndex >= 0) {
                doc.moveDown(0.5);
                let things = h.description.slice(listIndex + 1, h.description.length).split("-");
                things.forEach(item => {
                    regular(9).text("- " + item, marginH + 10, doc.y, {
                        align: "justify",
                        width: 420
                    });
                });
            }
            // image
            doc.image(`images/${h.image}`, marginH - 40, y0, {
                height: 20
            });

            doc.moveDown(1);
        });


        resolve(doc);

    });
}



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
    .then(writeFirstPage())
    .then(writeEvents(experiences, "Work Experience", false))
    .then(writeEvents(educations, "Education", true))
    .then(writeEvents(certificates, "Certificates", false))
    .then(writeHobbies())
    .then(endDocument());