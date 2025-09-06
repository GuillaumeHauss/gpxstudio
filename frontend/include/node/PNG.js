"use strict";

class PNG {
	constructor() {
		this.width = 0;
		this.height = 0;
		this.bitDepth = 0;
		this.colorType = 0;
		this.compressionMethod = 0;
		this.filterMethod = 0;
		this.interlaceMethod = 0;
		this.colors = 0;
		this.alpha = false;
		this.pixelBits = 0;
		this.palette = null;
		this.pixels = null;
		this.trns = null;
	}
	getWidth() { return this.width; }
	setWidth(width) { this.width = width; }
	getHeight() { return this.height; }
	setHeight(height) { this.height = height; }
	getBitDepth() { return this.bitDepth; }
	setBitDepth(bitDepth) {
		if (![2, 4, 8, 16].includes(bitDepth)) throw new Error("invalid bith depth " + bitDepth);
		this.bitDepth = bitDepth;
	}
	getColorType() { return this.colorType; }
	setColorType(colorType) {
		let colors = 0, alpha = false;
		switch (colorType) {
			case 0: colors = 1; break;
			case 2: colors = 3; break;
			case 3: colors = 1; break;
			case 4: colors = 2; alpha = true; break;
			case 6: colors = 4; alpha = true; break;
			default: throw new Error("invalid color type");
		}
		this.colors = colors;
		this.alpha = alpha;
		this.colorType = colorType;
	}
	getCompressionMethod() { return this.compressionMethod; }
	setCompressionMethod(compressionMethod) {
		if (compressionMethod !== 0) throw new Error("invalid compression method " + compressionMethod);
		this.compressionMethod = compressionMethod;
	}
	getFilterMethod() { return this.filterMethod; }
	setFilterMethod(filterMethod) {
		if (filterMethod !== 0) throw new Error("invalid filter method " + filterMethod);
		this.filterMethod = filterMethod;
	}
	getInterlaceMethod() { return this.interlaceMethod; }
	setInterlaceMethod(interlaceMethod) {
		if (interlaceMethod !== 0 && interlaceMethod !== 1) throw new Error("invalid interlace method " + interlaceMethod);
		this.interlaceMethod = interlaceMethod;
	}
	setTRNS(trns) { this.trns = trns; }
	setPalette(palette) {
		if (palette.length % 3 !== 0) throw new Error("incorrect PLTE chunk length");
		if (palette.length > (2 ** this.bitDepth * 3)) throw new Error("palette has more colors than 2^bitdepth");
		this.palette = palette;
	}
	getPalette() { return this.palette; }
	getPixel(x, y) {
		if (!this.pixels) throw new Error("pixel data is empty");
		if (x >= this.width || y >= this.height) throw new Error("x,y position out of bound");
		const i = this.colors * this.bitDepth / 8 * (y * this.width + x);
		const pixels = this.pixels;
		// ...existing code for pixel switch...
		// For brevity, copy switch logic from bundle.js
		let alpha;
		switch (this.colorType) {
			case 0: return [pixels[i], pixels[i], pixels[i], 255];
			case 2: return [pixels[i], pixels[i + 1], pixels[i + 2], 255];
			case 3:
				alpha = 255;
				if (this.trns != null && this.trns[pixels[i]] != null) alpha = this.trns[pixels[i]];
				return [this.palette[pixels[i] * 3 + 0], this.palette[pixels[i] * 3 + 1], this.palette[pixels[i] * 3 + 2], alpha];
			case 4: return [pixels[i], pixels[i], pixels[i], pixels[i + 1]];
			case 6: return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
		}
	}
	getRGBA8Array() {
		const data = new Array(this.width * this.height * 4);
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				const pixelData = this.getPixel(x, y);
				data[(y * this.width + x) * 4 + 0] = pixelData[0];
				data[(y * this.width + x) * 4 + 1] = pixelData[1];
				data[(y * this.width + x) * 4 + 2] = pixelData[2];
				data[(y * this.width + x) * 4 + 3] = pixelData[3];
			}
		}
		return data;
	}
}

export default PNG;
