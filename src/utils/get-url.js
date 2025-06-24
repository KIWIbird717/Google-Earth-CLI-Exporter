"use strict"

const https = require('https');
const http = require('http');

/**
 * Fetches a URL with optional auto-retry functionality
 * @param {string} url - The URL to fetch
 * @param {boolean} autoRetry - Whether to enable auto-retry on failure
 * @returns {Promise<Buffer>} The response data as a Buffer
 */
module.exports = async function getUrl(url, autoRetry = true) {
	return await autoRetry
		? _autoRetry(() => _getUrl(url), function log(_, __, backOff) {
			console.error(`Retrying ${url} in ${backOff} ${backOff === 1 ? 'second' : 'seconds'}.`);
		}, function gaveUp(ex, tries, _) {
			console.error(`Gave up after ${tries} ${tries === 1 ? 'try' : 'tries'}.`);
			throw ex;
		})
		: _getUrl(url);
}

/**
 * Internal function to fetch a URL
 * @param {string} url - The URL to fetch
 * @returns {Promise<Buffer>} The response data as a Buffer
 */
async function _getUrl(url) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		(/^https:/.test(url) ? https : http).get(url, resp => {
			if (resp.statusCode !== 200) {
				reject(`Error: HTTP status code ${resp.statusCode} for ${url}`);
				return;
			}
			resp.on("data", d => chunks.push(d))
			    .on("end", () => resolve(Buffer.concat(chunks)))
			    .on("error", reject)
		}).on("error", reject);
	});
}

/**
 * Auto-retry function with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {Function} log - Logging function
 * @param {Function} gaveUp - Function called when all retries are exhausted
 * @param {number} MAX_TRIES - Maximum number of retry attempts
 * @param {number} MAX_BACKOFF_SECS - Maximum backoff time in seconds
 * @returns {Promise<any>} The result of the function
 */
async function _autoRetry(fn, log = null, gaveUp = null, MAX_TRIES = 5, MAX_BACKOFF_SECS = 16) {
	for (let tries = 1, backOff = 1;; tries++, backOff = Math.min(2 * backOff, MAX_BACKOFF_SECS)) {
		try {
			return await fn();
		} catch (ex) {
			if (tries >= MAX_TRIES) return gaveUp && gaveUp(ex, tries, backOff);
			log && log(ex, tries, backOff);
			await new Promise((r, _) => setTimeout(r, 1000 * backOff));
		}
	}
}