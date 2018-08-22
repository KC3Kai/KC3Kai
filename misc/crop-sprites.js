'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const pngCrop = require('png-crop');

/*
 * Simple method to crop spritesmith png image into small pieces.
 *
 * Depends: npm install png-crop
 */

const thisScript = path.basename(process.argv[1]);
if (process.argv.length < 3) {
	console.info(`Usage: ${thisScript} <spritesmithMeta.json> [subFolderToWrite]`);
	return;
}

console.info(`Current working dir: ${process.cwd()}`);
const ssMetaFile = process.argv[2];
console.info(`Opening: ${ssMetaFile}...`);
const smith = JSON.parse(fs.readFileSync(ssMetaFile, 'utf8'));
const smithImage = smith.meta.image;
console.info(`Image file: ${smithImage}`);

const subFolder = process.argv[3] || '';
if (subFolder) {
	const fullPath = path.resolve('.', subFolder);
	try {
		fs.mkdirSync(fullPath);
	}
	catch (err) {
		if (err.code !== 'EEXIST') throw err;
	}
}

Object.keys(smith.frames).forEach(sprite => {
	const file = path.resolve('.', subFolder, sprite + '.png');
	const basename = path.basename(file);
	const frame = smith.frames[sprite].frame;
	const config = {
		left: frame.x,
		top: frame.y,
		width: frame.w,
		height: frame.h,
	};
	pngCrop.crop(smithImage, file, config, err => {
		if (err) {
			console.error(`Cropping [${basename}] with`, config, err);
		} else {
			console.info(`Cropped into [${basename}] with`, config);
		}
	});
});
