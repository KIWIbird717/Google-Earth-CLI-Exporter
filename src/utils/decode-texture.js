"use strict"

const bmp = require('bmp-js');
const decodeDXT = require('decode-dxt');

/**
 * Decodes a texture based on its format
 * @param {import('../../types').Texture} texture - The texture object to decode
 * @returns {import('../../types').DecodedTexture} The decoded texture data
 */
function decodeTexture(texture) {
	switch (texture.textureFormat) {
		// jpeg (saved as .jpg)
		case 1:
			return { extension: 'jpg' , buffer: new Buffer(texture.bytes) };
		// dxt1 (saved as .bmp)
		case 6:
			const bytes = texture.bytes
			const buf = new Buffer(bytes);
			const abuf = new Uint8Array(buf).buffer;
			const imageDataView = new DataView(abuf, 0, bytes.length);
			const rgbaData = decodeDXT(imageDataView, texture.width, texture.height, 'dxt1');
			const bmpData = [];

			// ABGR
			for (let i = 0; i < rgbaData.length; i += 4) {
				bmpData.push(255);
				bmpData.push(rgbaData[i + 2]);
				bmpData.push(rgbaData[i + 1]);
				bmpData.push(rgbaData[i + 0]);
			}

			const rawData = bmp.encode({
				data: bmpData, width: texture.width, height: texture.height,
			});
			
			return { extension: 'bmp', buffer: Buffer.from(rawData.data) }
		default:
			throw `unknown textureFormat ${texture.textureFormat}`
	}
}

module.exports = {
	decodeTexture
}