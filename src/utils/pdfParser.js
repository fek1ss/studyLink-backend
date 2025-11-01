const fs = require('fs').promises;
const pdf = require('pdf-parse');

/**
 * Extract plain text from a PDF file.
 * Accepts either:
 * - a filesystem path to a PDF file (string),
 * - a Buffer containing PDF data,
 * - a multer file object (with .path or .buffer).
 *
 * @param {string|Buffer|object} input
 * @returns {Promise<string>} extracted text
 */
async function extractTextFromPdf(input) {
	let buffer;

	if (!input) throw new Error('No input provided to extractTextFromPdf');

	if (Buffer.isBuffer(input)) {
		buffer = input;
	} else if (typeof input === 'string') {
		// treat as file path
		buffer = await fs.readFile(input);
	} else if (input && typeof input === 'object') {
		// multer file object can have .buffer (if in-memory) or .path
		if (input.buffer && Buffer.isBuffer(input.buffer)) {
			buffer = input.buffer;
		} else if (input.path && typeof input.path === 'string') {
			buffer = await fs.readFile(input.path);
		} else {
			throw new Error('Unsupported file object for PDF parsing');
		}
	} else {
		throw new Error('Unsupported input type for extractTextFromPdf');
	}

	const data = await pdf(buffer);
	// pdf-parse returns { text, numpages, info, metadata, version }
	return (data && data.text) ? String(data.text) : '';
}

module.exports = { extractTextFromPdf };