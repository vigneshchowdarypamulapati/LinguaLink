const Tesseract = require('tesseract.js');
const { pdfToPng } = require('pdf-to-png-converter');

/**
 * Extract text from scanned PDFs using OCR
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextWithOCR(pdfBuffer) {
    try {
        console.log('Starting OCR extraction...');
        const pngPages = await pdfToPng(pdfBuffer, {
            disableFontFace: true,
            useSystemFonts: true,
            viewportScale: 2.0,
            pagesToProcess: [1, 2, 3]
        });
        
        if (!pngPages || pngPages.length === 0) {
            console.log('No pages converted from PDF');
            return '';
        }
        
        console.log(`Converted ${pngPages.length} pages to images, running OCR...`);
        
        let fullText = '';
        for (const page of pngPages) {
            const { data: { text } } = await Tesseract.recognize(
                page.content,
                'eng+spa+fra+deu+ita+por+rus+jpn+chi_sim+hin',
                { logger: m => console.log(`OCR: ${m.status}`) }
            );
            fullText += text + '\n';
        }
        
        console.log(`OCR extracted ${fullText.length} characters`);
        return fullText.trim();
    } catch (err) {
        console.error('OCR extraction failed:', err);
        return '';
    }
}

module.exports = { extractTextWithOCR };
