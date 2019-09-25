const PDFDocument = require('pdfkit');
const fs = require('fs');
const doc = new PDFDocument({
    autoFirstPage: false
});

const resumeData = loadResume();

doc.pipe(fs.createWriteStream('./timeline/gperrin-resume.pdf')); // write to PDF
const marginH = 72;
doc.addPage({
    margins: {
        top: 50,
        bottom: 50,
        left: marginH,
        right: marginH
    }
});

doc.fontSize(10);
doc.fillColor("#5D6D7E");
doc.font('Helvetica-Bold');

doc.fontSize(14)
    .text('Work Experience')
    .moveDown(1);

doc.font('Helvetica');

doc.save().moveTo(marginH - 50, 100).fillColor("red").lineTo(marginH - 50, 300);


resumeData.filter(d => d.type === "experience")
    .forEach(exp => {
        const items = exp.description.split(". ");
        doc.fontSize(12)
            .fillColor("#5D6D7E")
            .text(exp.title, marginH, doc.y)
            .moveDown(0);

        doc.fontSize(16)
            .fillColor("#EAECEE")
            .font('Helvetica-Bold')
            .text(exp.years.length == 1 ? exp.years[0] : exp.years[1], doc.x - 50, doc.y);

        doc.font('Helvetica')
            .fontSize(10)
            .fillColor("#2980B9")
            .text(exp.company.name, marginH + 10, doc.y - 20, {
                link: exp.links.length > 0 ? exp.links[0].url : "",
                underline: false
            })
            .moveDown(0.3);

        if (exp.company.logo && exp.company.logo.indexOf(".svg") === -1) {
            doc.image(`timeline/images/${exp.company.logo}`, doc.x - 10, doc.y - doc.heightOfString(exp.company.name) - 5, {
                height: 10
            });
        }
        items.forEach(i => {
            doc.rect(doc.x - 5, doc.y + 3, 1, 1).fill("#5D6D7E");
            doc.fontSize(9)
                .text(i, marginH + 10, doc.y, {
                    align: "justify",
                    width: 420
                });
        });

        doc.moveDown(0.8);

    });

// finalize the PDF and end the stream
doc.end();



function loadResume() {
    const events = JSON.parse(fs.readFileSync('./timeline/events.json'));

    events.forEach(d => {
        d.dates = d.dates.map(d => new Date(d));
        //this.dates.push(...d.dates);
        d.years = [...new Set(d.dates.map(d => d.getFullYear()))];
        //d.duration = duration(d.dates);
    });
    return events;

    //console.log(resumeData);

}