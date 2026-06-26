#!/usr/bin/env node
/**
 * html2pdf.js — render a concept-book HTML page to PDF using Playwright.
 *
 * Usage:
 *   node scripts/html2pdf.js --input <path/to/book.html> --output <path/to/book.pdf>
 *
 * Waits for MathJax to finish typesetting before printing.
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : null;
  };
  const input = get('--input');
  const output = get('--output');
  if (!input || !output) {
    console.error('Usage: node html2pdf.js --input <html> --output <pdf>');
    process.exit(1);
  }
  return { input: path.resolve(input), output: path.resolve(output) };
}

async function run() {
  const { input, output } = parseArgs();

  if (!fs.existsSync(input)) {
    console.error(`Input file not found: ${input}`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(output), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`file://${input}`, { waitUntil: 'networkidle' });

  // Wait for MathJax to finish typesetting if present
  await page.evaluate(() => {
    if (window.MathJax?.startup?.promise) {
      return window.MathJax.startup.promise;
    }
  }).catch(() => {});

  // Small buffer for any late renders
  await page.waitForTimeout(500);

  await page.pdf({
    path: output,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '18mm', right: '18mm' },
  });

  await browser.close();
  console.log(`PDF written → ${output}`);
}

run().catch(err => {
  console.error(err.message);
  process.exit(1);
});
