const Tesseract = require('tesseract.js');
const { createWorker } = require('tesseract.js');

// Initialize Tesseract worker
let worker = null;

async function initializeWorker() {
  if (!worker) {
    worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
  }
  return worker;
}

// Regular expressions for extracting information
const patterns = {
  total: /(?:total|amount|sum|balance)[\s:]*[$]?\s*(\d+(?:\.\d{2})?)/i,
  date: /(?:date|purchase date)[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})/i,
  vendor: /(?:from|vendor|store|merchant)[\s:]*([^\n]+)/i
};

// Helper function to extract date from text
function extractDate(text) {
  const match = text.match(patterns.date);
  if (!match) return null;

  const dateStr = match[1];
  // Try different date formats
  const formats = [
    'MM/DD/YYYY',
    'MM-DD-YYYY',
    'YYYY/MM/DD',
    'YYYY-MM-DD'
  ];

  for (const format of formats) {
    const date = parseDate(dateStr, format);
    if (date) return date;
  }

  return null;
}

// Helper function to parse date string
function parseDate(dateStr, format) {
  const parts = dateStr.split(/[-\/]/);
  if (parts.length !== 3) return null;

  let year, month, day;

  if (format.startsWith('YYYY')) {
    [year, month, day] = parts;
  } else {
    [month, day, year] = parts;
  }

  // Convert to numbers
  year = parseInt(year);
  month = parseInt(month) - 1; // JavaScript months are 0-based
  day = parseInt(day);

  // Handle 2-digit years
  if (year < 100) {
    year += 2000;
  }

  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
}

// Helper function to extract vendor name
function extractVendor(text) {
  const match = text.match(patterns.vendor);
  if (!match) {
    // Try to find the first line that looks like a business name
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.length > 3 && line.length < 50 && !line.match(/^\d/)) {
        return line.trim();
      }
    }
  }
  return match ? match[1].trim() : 'Unknown Vendor';
}

// Helper function to extract total amount
function extractTotal(text) {
  const match = text.match(patterns.total);
  if (!match) return 0;

  const amount = parseFloat(match[1]);
  return isNaN(amount) ? 0 : amount;
}

// Main function to process receipt
async function processReceipt(imageBuffer) {
  try {
    const worker = await initializeWorker();
    
    // Perform OCR on the image
    const { data: { text } } = await worker.recognize(imageBuffer);

    // Extract information
    const total = extractTotal(text);
    const date = extractDate(text);
    const vendor = extractVendor(text);

    return {
      total,
      date: date || new Date(),
      vendor,
      rawText: text
    };
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error('Failed to process receipt');
  }
}

// Cleanup function to terminate worker
async function cleanup() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

module.exports = {
  processReceipt,
  cleanup
}; 