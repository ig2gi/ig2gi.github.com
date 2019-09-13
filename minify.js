const minify = require('@node-minify/core');
const gcc = require('@node-minify/google-closure-compiler');
const fs = require('fs');

const path = 'timeline/timeline.min.js';
try {
    if (fs.existsSync(path)) {
        fs.unlinkSync(path);
    }
} catch (err) {
    console.error(err);
}


minify({
    compressor: gcc,
    input: 'timeline/timeline-core.js',
    output: 'timeline/timeline-core.min.js',
    options: {
        createSourceMap: false,
        compilationLevel: 'ADVANCED',
        languageIn: 'ECMASCRIPT6'
    },
    callback: function (err, min) {}
});