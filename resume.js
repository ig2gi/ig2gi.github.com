const PDFDocument = require('pdfkit');
const fs = require('fs');
const mt = require('moment');

//
//
// ================================================
//
// Useful Constants
//
// ================================================
//
//
const defaultDiffFormatter = (y, m) => [y === 0 ? "" : `${y} year${y > 1 ? "s": ""}`, m === 0 ? "" : `${m} month${m > 1 ? "s": ""}`]; // returns only years and months
const shortFormatter = (y, m) => {
    if (y === 0)
        return `${m}m`;
    if (m === 0)
        return `${y}y`;
    return `${y}y ${m}m`;
};

const marginH = 90;
const baseColor = "#5D6D7E";
const color1 = "#AAB7B8";
const categoryColors = {
    "employee": "#F8C471",
    "formation": "#BB8FCE",
    "freelance": "#7DCEA0",
    "consultant": "#7DCEA0",
    "other": "#7FB3D5",
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
const resumeData = loadResume();
const certificates = resumeData.events.filter(d => d.type === "formation" && d.diploma === "certificate");
const experiences = resumeData.events.filter(d => d.type === "experience");
const educations = resumeData.events.filter(d => d.type === "formation" && d.diploma !== "certificate");


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

            const x1 = doc.x + doc.widthOfString("2") / 2;
            const y1 = doc.y - 2;

            // DURATION
            let s = diff(event.duration, shortFormatter);
            regular(9, color1).text(s, x1 + 12, y1);

            // TITLE
            medium(12)
                .text(event.title, marginH, doc.y - 2 * doc.heightOfString("1000"))
                .moveDown(0);

            // INDUSTRY
            strong(8);
            let ind = event.industry + (!event.subIndustry || event.subIndustry === "" ? "" : " - " + event.subIndustry);
            let height = doc.currentLineHeight();
            doc.moveUp();
            regular(8, "#1F618D")
                .highlight(doc.x + 440 - doc.widthOfString(` ${ind} `), doc.y, doc.widthOfString(` ${ind}  `), height, {
                    color: "#D5DBDB"
                })
                .text(ind.toLowerCase(), doc.x, doc.y, {
                    align: "right",
                    width: 440
                });

            // CONTENT
            getWriter(event.type)(event);


            // END EVENT (YEAR LINE)
            doc.moveTo(x1, y1 - 3)
                .lineTo(x1, doc.y)
                .stroke(color1)
                .strokeOpacity(0.6);

            doc.polygon([x1 + 2, y1], [x1 + 10, y1 + 5], [x1 + 2, y1 + 10]);
            doc.fill(categoryColors[event.category]);

            doc.text("", marginH, doc.y).moveDown(2);


        });

        if (newPageAtEnd)
            doc.addPage();

        resolve(doc);

    });


}

function getWriter(type) {
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

    const items = exp.description.split(". ");
    regular(10, "#2980B9")
        .text(exp.company.name, marginH + 10, doc.y, {
            link: exp.links.length > 0 ? exp.links[0].url : "",
            underline: false
        })
        .moveDown(0.1);
    /*
            if (exp.company.logo && exp.company.logo.indexOf(".svg") === -1) {
                doc.image(`timeline/images/${exp.company.logo}`, doc.x - 10, doc.y - doc.heightOfString(exp.company.name) - 5, {
                    height: 10
                });
            }
            */

    items.forEach(i => {
        doc.rect(doc.x - 5, doc.y + 3, 1, 1).fill("#5D6D7E");
        regular(9)
            .text(i, marginH + 10, doc.y, {
                align: "justify",
                width: 420
            });
    });

}


function certificateWriter(exp) {

    const desc = exp.description;
    regular(10, "#2980B9")
        .text(exp.company.name, marginH + 10, doc.y, {
            link: exp.links.length > 0 ? exp.company.link : "",
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

function writeProfile() {

    return new Promise((resolve, reject) => {

        _title("Profile");

        _subtitle(resumeData.profile1.title);
        doc.moveDown(0.3);
        regular(9).text(resumeData.profile1.description, marginH + 10, doc.y, {
            align: "justify",
            width: 420
        });
        _reset();
        doc.moveDown(1);

        _subtitle(resumeData.profile2.title);
        doc.moveDown(0.3);
        regular(9).text(resumeData.profile2.description, marginH + 10, doc.y, {
            align: "justify",
            width: 420
        });

        _reset();
        doc.moveDown(2);
        
        const yimg = doc.y;
        _subtitle("Soft Skills");
       
        medium(9).text("Top 4", marginH + 10, doc.y).moveDown(0.1);
        
        resumeData.softSkills.forEach(s => {
            light(9).text(s.toUpperCase(), marginH + 20, doc.y);
        });
        const ximg = doc.x + 120;
        doc.image(`images/softskills.png`, ximg, yimg, {
            height: 80
        }).link(ximg, yimg , 80, 80, "http://ig2gi.github.com/timeline/index.html");
        regular(6).text("See ig2gi.github.com for more details." , ximg, yimg + 80);

        doc.moveDown(2);
        _reset();
        
        _subtitle("Hard Skills");



        doc.moveDown(3);
      

        doc.addPage();
        resolve(doc);

    });
}

function startDocument() {
    return new Promise((resolve, reject) => {

        doc.addPage();
        doc.fillColor(baseColor);


        doc.rect(0, 0, 620 , 160)
        .fill('#EBEDEF');


        // Profile Header
        const r = 50;
        const xc = 45 + 2 * r;
        const yc =  2 * r - 20;

        doc.circle(xc, yc, r + 16).lineWidth(0).fillOpacity(0).lineWidth(1).stroke("white");
        doc.fillOpacity(1);

        // SOCIAL

        drawItemsOnCircle(resumeData.social, xc, yc, r, -3 * Math.PI / 4, -Math.PI / 10, "left", "#2980B9", 8);
        drawItemsOnCircle(resumeData.contact, xc, yc, r, -Math.PI / 3, Math.PI / 10, "right","#566573", 9, 11, false);
        drawItemsOnCircle(resumeData.aptitudes, xc, yc, r, Math.PI / 20, Math.PI / 10, "right", "#1F618D",9);

        // CONTACT

        doc.save();
        doc.circle(xc, yc, r).clip();
        doc.image(`images/me.jpg`, xc - r, yc - r, {
            height: 2 * r
        });
        doc.restore();



        // HEADER 
        light(25).text(resumeData.name, 5, 16, {
            align: "right"
        });
        let lines = resumeData.headerTitle.split(/[\\._]/g);
        multilines(lines, regular, 10, "right", "#1F618D");
        doc.moveDown(1);
        doc.moveTo(480, doc.y - 8).lineTo(585, doc.y - 8).lineWidth(1).stroke("white");
        lines = resumeData.headerInfo.split(/[\\._]/g);
        multilines(lines, regular, 10, "right", "#566573");
        doc.moveDown(1);
        doc.moveTo(480, doc.y - 8).lineTo(585, doc.y - 8).lineWidth(1).stroke("white");
        lines = resumeData.languages.map(d => `${d.level} - ${d.name.toUpperCase()}`);
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
        regular(fontSize, color).text(s.name, align === "left" ? x - doc.widthOfString(s.name) - offsetX : x + offsetX, y + - iconSize / 2 + doc.heightOfString(s.name) / 6, {
            align: "left",
            link: s.link,
            underline: underline && s.link !== ""
        });
        angle += stepAngle;
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
                resumeData.contact.forEach(s => {
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
            light(7).text(`generated ${mt().format('MMM D YYYY, h:mm')} (Node.js® and PDFKit) - © gilbert perrin 2019`, 20, 820, {
                align: "left",
                margins: {
                    bottom: 0
                },
            });
            const categories = ["Employee", "Freelance - Consultant", "Formation", "Other"];
            let x = 400;
            categories.forEach((c, i) => {
                x += i === 0 ? 0 : doc.widthOfString(categories[i - 1]) + 10;
                doc.rect(x - 4, 820, 3, 6).fill(categoryColors[c.toLowerCase()]);
                light(7).text(c, x, 820, {
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


//
//
// ================================================
//
// Utility Functions
//
// ================================================
//
//
function loadResume() {
    const resume = JSON.parse(fs.readFileSync('./timeline/events.json'));

    resume.events.forEach(d => {
        d.dates = d.dates.map(d => new Date(d));
        d.years = [...new Set(d.dates.map(d => d.getFullYear()))];
        d.duration = duration(d.dates);
    });
    return resume;

}


function diff(time, formatter = defaultDiffFormatter, approx = true) {
    let y = time[0];
    let m = time[1];
    let d = time[2];
    // day
    let dm = Math.floor(d / 30);
    if (dm > 0) {
        d = d - dm * 30;
        m += dm;
    }
    if (approx && d > 20) {
        d = 0;
        m++;
    }
    // month
    let my = Math.floor(m / 12);
    if (my > 0) {
        m = m - my * 12;
        y += my;
    }
    if (approx && m > 10) {
        m = 0;
        y++;
    }
    return formatter(y, m, d);
}


function duration(dates) {
    const starts = mt(dates[0]);
    const ends = mt(dates.length === 1 ? new Date() : dates[1]);
    const duration = mt.duration(ends.diff(starts));
    let y = duration.years();
    let m = duration.months();
    let d = duration.days();
    return [y, m, d];
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
    .then(writeProfile())
    .then(writeEvents(certificates, "Certificates"))
    .then(writeEvents(experiences, "Work Experience"))
    .then(writeEvents(educations, "Education"))
    .then(endDocument());