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

const VERSION = "V5.2";
const marginH = 90;
const baseColor = "#5D6D7E";
const color1 = "#AAB7B8";
const color2 = "#1F618D";
const color3 = '#EBEDEF';
const categoryColors = {
    "employee": "#F8C471",
    "formation": "#BB8FCE",
    "freelance": "#7DCEA0",
    "education": "#A5C4D4",
    "consultant": "#7DCEA0",
    "other": "#E5E8E8",
    "freelance - consultant": "#7DCEA0",
};
const companySizes = [{
    image: 'images/users1.png',
    name: '3-10',
    height: 12
}, {
    image: 'images/users2.png',
    name: '>200',
    height: 15
}, {
    image: 'images/users3.png',
    name: '>10000',
    height: 20
}];

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
const _multilines = (lines, styleMethod, size, align, color, highlightFirst = false) => {

    lines.forEach((l, i) => {
        let m = highlightFirst && i === 0 ? _strong : styleMethod;
        m(size, color).text(l, {
            "align": align
        });
    });
};
const _title = (txt) => _strong(16, baseColor).text(txt).moveDown(0.8);
const _subtitle = (txt) => _medium(12, baseColor).text(txt).moveDown(0);
const _reset = () => pdf.text("", marginH, pdf.y);
const _columns = (words, columnwidth, height, x0 = 0, y = 0) => {
    let x = x0 === 0 ? marginH + 10 : x0;
    let y0 = y === 0 ? pdf.y : y;
    let gap = 20;
    words.forEach((w, i) => {
        if (pdf.y > (y0 + height)) {
            x += columnwidth + gap;
        }
        if (w[1] >= 4)
            _regular(9, color2);
        else
            _light(9, baseColor);
        pdf.text(w[2] ? w[0].toUpperCase() : w[0], x, pdf.y > (y0 + height) || i === 0 ? y0 : pdf.y, {
            align: 'justify'
        });

    });
};
const _height = (txt) => pdf.heightOfString(txt);
const _width = (txt) => pdf.widthOfString(txt);
const _box = (x, y, w, h, col, title, txt, anchor = "top") => {
    pdf.lineWidth(0.4);
    pdf.fillColor(col);
    pdf.fillOpacity(0.3);
    pdf.stroke(col);
    // box
    pdf.rect(x, y, w, h)
        .fillAndStroke();
    pdf.fillOpacity(1);
    // box text
    _medium(14, col);
    pdf.text(txt, x + w / 2 - _width(txt) / 2, y + h / 2 - pdf.currentLineHeight() / 2);
    // title
    const anchorHeight = 6;
    const xa = x + w / 2;
    const ya1 = anchor === "top" ? y : y + h;
    const ya2 = anchor === "top" ? ya1 - anchorHeight : ya1 + anchorHeight;
    pdf.moveTo(xa, ya1)
        .lineTo(xa, ya2)
        .stroke();
    _light(9, col);
    pdf.text(title, xa - _width(title) / 2, anchor === "top" ? ya2 - anchorHeight - 2 : ya2);
};
const _vSeparator = (x, y, h, col) => {
    pdf.lineWidth(0.1);
    pdf.moveTo(x, y)
        .lineTo(x, y + h)
        .stroke(col);
    pdf.lineWidth(1);
};
const _hSeparator = (x, y, w, col) => {
    pdf.lineWidth(0.1);
    pdf.moveTo(x - w / 2, y)
        .lineTo(x + w / 2, y)
        .stroke(col);
    pdf.lineWidth(1);
};
const _titleSeparator = (x, y, w, col, title) => {
    _hSeparator(x, y, w, col);
    _light(11, col);
    let wt = _width("  " + title);
    let xt = x - wt / 2;
    let yt = y - pdf.currentLineHeight() / 2;
    pdf.rect(xt, yt, wt + 4, pdf.currentLineHeight())
        .fill("#ffffff");
    pdf.fillColor(col);
    pdf.text(`  ${title}`, xt, yt);

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
    // .then(doProfile())
    // .then(doSkills())
    .then(doFirstPage())
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
        _regular(8, "#2980B9")
            .text(l.name.toUpperCase(), x, pdf.y, {
                align: "left",
                link: `${l.url}`,
                underline: false
            });

        if (exp.links.length > 1)
            exp.links.slice(1).forEach((l, i) => {
                pdf.moveUp();
                x += pdf.widthOfString(exp.links[i].name) + 10;
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

function doFirstPage() {

    const ml = 40;

    return new Promise((resolve, reject) => {

        //
        // Column Experience
        //
        let y0 = pdf.y;

        _light(16, "#1F618D")
            .highlight(ml + 30, y0, pdf.widthOfString(`  Experience  `), pdf.currentLineHeight(), {
                color: color3
            })
            .text("  Experience", ml + 30, pdf.y);

        _light(16, "#1F618D")
            .highlight(ml + 320, y0, pdf.widthOfString(`  Profile  `), pdf.currentLineHeight(), {
                color: color3
            })
            .text("  Profile", ml + 320, y0);

        let y1 = pdf.y;

        // Separator
        _vSeparator(ml + 170, pdf.y, 300, color1);

        const exp = resume.statistics.experience.industry.filter(e => e.industry !== "Broadcast Media").sort((a, b) => b.sum_industry - a.sum_industry);

        // Block 0: Total years
        let x = ml + 60;
        const totalYears = exp.map(e => e.sum_industry).reduce((a, v) => a + v).toFixed(0);
        _light(30, color2).text(totalYears, x, pdf.y + 5);
        // pdf.circle(x + _width(totalYears +"")/2, pdf.y+ 10 - pdf.currentLineHeight(), 24).lineWidth(4).fillOpacity(0).strokeOpacity(0.2).stroke(color2);
        pdf.fillOpacity(1);
        pdf.strokeOpacity(1);
        _light(8, color2).text("YEARS", x + _width("y"), pdf.y - _height("years"));


        // Block 1: Industry Breakdown
        x = ml + 80;
        _titleSeparator(x, pdf.y + 15, 130, color1, "Industry");

        y0 = pdf.y;
        const x0 = ml + 160;
        let y = y0 + 8;
        x = x0;
        x = ml + 50;
        exp.forEach((e, i) => {
            let w = e.sum_industry * 10;
            pdf.fillOpacity(1);
            _light(9, color2).text(e.industry, x - _width(e.industry), y);
            pdf.fillOpacity(1 - 0.2 * i);
            _light(9, color2).text(Math.round(e.sum_industry).toFixed(0), x + 4, y);
            pdf.rect(x + 12, pdf.y - pdf.currentLineHeight(), w, 6).fill(color2);
            y = pdf.y - 1;
        });
        pdf.fillOpacity(1);



        // Block 2: Category Breakdown
        x = ml + 80;
        _titleSeparator(x, pdf.y + 20, 130, color1, "Contract Type");


        y = pdf.y + 20;

        const cats = resume.statistics.experience.category.sort((a, b) => b.sum_category - a.sum_category);
        x = ml + 35;
        const employeeYears = Math.round(cats.filter(e => e.category === "employee")[0].sum_category);
        const consultantYears = Math.round(cats.filter(e => e.category === "consultant" || e.category === "freelance" || e.category === "other").map(e => e.sum_category).reduce((a, v) => a + v));
        const r = consultantYears / employeeYears;
        let col = categoryColors.employee;
        let w = 40;
        let h = 30;
        _box(x, y, w, h, col, "employee", employeeYears + "", "top");
        //
        col = categoryColors.freelance;
        _box(x + w + 2, y, w * r, h, col, "freelance, consultant", consultantYears + "", "bottom");


        // Block 3: Company Size
        _titleSeparator(ml + 80, pdf.y + 20, 130, color1, "Company Size");
        y = pdf.y + 10;
        x = ml + 35;
        const yt = y;
        companySizes.forEach(s => {
            pdf.image(s.image, x, y, {
                height: s.height
            });
            _light(8, color1).text(s.name, x, yt + 20);
            x += s.height + 20;
            y = y - 2;

        });

        // Separators
        _hSeparator(300, pdf.y + 30, 500, color1);
        _vSeparator(ml + 170, pdf.y + 50, 250, color1);

        //
        //  SKILLS
        //
        y = pdf.y + 40;
        x = ml + 40;
        _light(16, color2)
            .highlight(x, y, pdf.widthOfString(`  Soft Skills  `), pdf.currentLineHeight(), {
                color: color3
            })
            .text("  Soft Skills", x, y);
        x = ml + 320;
        _light(16, color2)
            .highlight(x, y, pdf.widthOfString(`  Hard Skills  `), pdf.currentLineHeight(), {
                color: color3
            })
            .text("  Hard Skills", x, y);

        _titleSeparator(ml + 80, pdf.y + 15, 130, color1, "General");

        let skills = resume.skills.soft.sort((a, b) => a.localeCompare(b));
        x = ml + 82;
        y0 = pdf.y;
        pdf.moveDown(0.5);
        skills.forEach(s => {
            _light(10).text(s.toUpperCase(), x - _width(s.toUpperCase()) / 2, pdf.y + 1);
        });

        pdf.moveUp(1);
        x = ml + 220;
        _regular(8, color1).text("Non exhaustive list, sorted alphabetically (libraries, frameworks or tools commonly used in development, like  git, maven, hibernate, mysql , pynum, jquery, ..., are not listed)", x, y0 - 10, {
            align: "justify",
            width: 280
        });
        skills = resume.skills.hard.sort((a, b) => a[0].localeCompare(b[0]));
        _columns(skills, 80, 100, x, y0 + 30);

        _titleSeparator(ml + 80, pdf.y - 10, 130, color1, "Leadership");



       
        let y3 = pdf.y;

        _hSeparator(ml + 350, pdf.y + 45, 300, color1);

        x = ml + 320;
        y = pdf.y + 55;
        _light(16, color2)
            .highlight(x, y, pdf.widthOfString(`  Interests  `), pdf.currentLineHeight(), {
                color: color3
            })
            .text("  Interests", x, y);
        y = pdf.y + 10;
        x = ml + 260;
        h = 21;
        resume.hobbies.forEach(s => {
            pdf.image(s.image, x, y, {
                height: h
            });
            _light(8, color1).text(s.title, x + h / 2 - _width(s.title) / 2, y + h + 6);
            x += h * 3 + 20;

        });

        //
        // Profile
        //
        _regular(9, color1).text(resume.profile.description, ml + 215, y1 + 4, {
            align: "justify",
            width: 300
        });
        pdf.moveDown(1);
        y = pdf.y;
        resume.profile.axes.forEach(p => {
            _medium(9, color2).text(p.title, ml + 215, pdf.y);
            _regular(9, color1).text(p.description, ml + 215, pdf.y, {
                align: "justify",
                width: 300
            });
            pdf.moveDown(1);
        });
        pdf.image("images/right-arrow.png", ml + 190, y - pdf.currentLineHeight() / 2, {
            height: 16
        });

        y = y3 + 10;
        resume.leadership.forEach(s => {
            _light(9, color2);
            pdf.text(s.title.toUpperCase(), ml + 82 - _width(s.title.toUpperCase()) / 2, y);
            y = pdf.y;
            _regular(7, color1);
            pdf.text(s.definition, ml + 82 - Math.min(_width(s.definition) / 2, 120 / 2), y, {
                width: 120
            });
            y = pdf.y + 6;

        });
        _light(7, color1).text("(based on a test of T-Conseils SA)", ml + 32, pdf.y + 10);


        pdf.moveUp(0.5);


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
            .fill(color3);


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
        _multilines(lines, _regular, 10, "right", "#1F618D", true);
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
        pdf.circle(x, y, iconSize - 3).lineWidth(0).fillOpacity(1).strokeOpacity(1).fill(color3);
        pdf.image(`${s.logo}`, x - iconSize / 2, y - iconSize / 2, {
            height: iconSize
        });

        pdf.fillOpacity(1);
        pdf.strokeOpacity(1);
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
            pdf.image(`${h.image}`, marginH - 40, y0, {
                height: 20
            });

            pdf.moveDown(1);
        });


        resolve(pdf);

    });
}