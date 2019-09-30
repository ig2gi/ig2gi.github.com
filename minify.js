const minify = require('@node-minify/core');
const gcc = require('@node-minify/google-closure-compiler');
const csso = require('@node-minify/csso');
const fs = require('fs');


const clean = function (paths) {
    paths.forEach(p => {
        try {
            if (fs.existsSync(p)) {
                fs.unlinkSync(p);
            }
        } catch (err) {
            console.error(err);
        }
    });

};

clean(['timeline/timeline.min.js', 'timeline/timeline.min.css']);


minify({
    compressor: gcc,
    input: 'timeline/timeline-core.js',
    output: 'timeline/timeline-core.min.js',
    options: {
        createSourceMap: false,
        compilationLevel: 'SIMPLE',
        languageIn: 'ECMASCRIPT6'
    },
    callback: function (err, min) {}
});

minify({
    compressor: csso,
    input: 'timeline/timeline.css',
    output: 'timeline/timeline.min.css',
    callback: function (err, min) {}
});