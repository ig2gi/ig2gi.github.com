const PDFDocument = require('pdfkit');
const fs = require('fs');
const mt = require('moment');


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

const resumeData = loadResume();
const doc = initializeDocument();
const strong = (size, color) => font("Bold", size, color);
const medium = (size, color) => font("Medium", size, color);
const regular = (size, color) => font("Regular", size, color);
const light = (size, color) => font("Light", size, color);
const font = (style, size = 9, color = baseColor) => {
    doc.font(`webfonts/DINNextLTPro-${style}.ttf`);
    return doc.fontSize(size).fillColor(color);
};

const certificates = buildEvents(resumeData.events.filter(d => d.type === "formation" && d.diploma === "certificate"), "Certificates");
const experience = buildEvents(resumeData.events.filter(d => d.type === "experience"), "Work Experience");
const education = buildEvents(resumeData.events.filter(d => d.type === "formation" && d.diploma !== "certificate"), "Education");
const end = endDocument();

certificates
    .then(experience)
    .then(education)
    .then(end);

//
//
// ================================================
//
// Functions
//
// ================================================
//
//


/**
 *
 *
 */
function initializeDocument() {
    const doc = new PDFDocument({
        autoFirstPage: false,
        margins: {
            top: 50,
            bottom: 10,
            left: marginH,
            right: 10
        },
        layout: "portrait",
        size: "A4",
        bufferPages: true

    });

    doc.pipe(fs.createWriteStream('./timeline/gperrin-resume.pdf')); // write to PDF

    doc.addPage();

    doc.fillColor(baseColor);
    return doc;
}




/**
 *
 *
 * @param {*} data
 * @param {*} title
 * @returns
 */
function buildEvents(data, title) {
    return new Promise((resolve, reject) => {
        //
        strong(16)
            .text(title)
            .moveDown(1);
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
                .text(event.years.length == 1 ? event.years[0] : event.years[1], doc.x - 1.5 * doc.widthOfString("1000"), doc.y  );

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
                .highlight(doc.x + 440 - doc.widthOfString(` ${ind} `), doc.y , doc.widthOfString(` ${ind}  `), height, {
                    color: "#D5DBDB"
                })
                .text(ind.toLowerCase(), doc.x, doc.y , {
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

            doc.text("", marginH, doc.y).moveDown(3);


        });

        resolve(doc);

    });


}

/**
 *
 *
 * @param {*} type
 * @returns
 */
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

/**
 *
 *
 * @param {*} exp
 */
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

/**
 *
 *
 * @param {*} exp
 */
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
        let x = doc.x + doc.widthOfString(t) +  5;
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

/**
 *
 *
 * @returns
 */
function endDocument() {
    return new Promise((resolve, reject) => {
        const range = doc.bufferedPageRange(); // => { start: 0, count: 2 }}
        for (let i = 0; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            // top
            regular(9).text(`Gilbert Perrin Resume`, 0, 10, {
                align: "right",
                margins: {
                    bottom: 0
                }
            });
            light(6).text(`Page ${i + 1} of ${range.count}`, 0, 20, {
                align: "right"
            });
            // bottom
            light(7).text(`automatically generated with Node.js & pdfkit`, 0, 820, {
                align: "right",
                margins: {
                    bottom: 0
                }
            });
            light(7, "#2980B9").text(`http://ig2gi.github.io`, 20, 820, {
                align: "left",
                margins: {
                    bottom: 0
                },
                link: "http://ig2gi.github.io",
                underline: true
            });
            const categories = ["Employee", "Freelance - Consultant", "Formation", "Other"];
            let x = 180;
            categories.forEach((c, i) => {
                x += i === 0 ? 0 : doc.widthOfString(categories[i-1]) + 10;
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




/**
 *
 *
 * @returns
 */
function loadResume() {
    const resume = JSON.parse(fs.readFileSync('./timeline/events.json'));

    resume.events.forEach(d => {
        d.dates = d.dates.map(d => new Date(d));
        d.years = [...new Set(d.dates.map(d => d.getFullYear()))];
        d.duration = duration(d.dates);
    });
    return resume;

}



/**
 *
 *
 * @param {*} dates
 * @returns
 */
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


/**
 *
 *
 * @param {*} dates
 * @returns
 */
function duration(dates) {
    const starts = mt(dates[0]);
    const ends = mt(dates.length === 1 ? new Date() : dates[1]);
    const duration = mt.duration(ends.diff(starts));
    let y = duration.years();
    let m = duration.months();
    let d = duration.days();
    return [y, m, d];
}