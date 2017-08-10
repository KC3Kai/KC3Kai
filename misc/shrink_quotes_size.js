'use strict';

const os = require('os');
const fs = require('fs');

/**
 * Shrink `quotes_size_full.json` to a smaller file,
 * which removes those voice numbers without any seasonal line.
 */
const input = './quotes_size_full.json',
	output = '../src/data/quotes_size.json';

console.info(`Current working dir: ${process.cwd()}`);
const quoteSize = JSON.parse(fs.readFileSync(input, 'utf8'));
console.info(`File read from ${input}`);

let before = 0, after = 0;
Object.keys(quoteSize).forEach(shipId => {
	Object.keys(quoteSize[shipId]).forEach(voiceNum => {
		const voiceKeys = quoteSize[shipId][voiceNum];
		const vlen = Object.keys(voiceKeys).length;
		before += vlen;
		if(vlen < 2) delete quoteSize[shipId][voiceNum]; else after += vlen;
	});
});
console.info(`Voice lines shrunk from ${before} to ${after}`);

const formattedJson = JSON.stringify(quoteSize, undefined, '\t')
	.replace(/\n/g, os.EOL)
	+ os.EOL;
fs.writeFileSync(output, formattedJson, 'utf8');
console.info(`File written to ${output}`);
