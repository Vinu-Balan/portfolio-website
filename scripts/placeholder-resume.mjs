// Writes a minimal valid one-page PDF to public/resume.pdf so links work before the real file is added.
import { writeFileSync, existsSync } from 'node:fs';

const target = new URL('../public/resume.pdf', import.meta.url);
if (existsSync(target) && !process.argv.includes('--force')) {
  console.log('public/resume.pdf already exists; pass --force to overwrite.');
  process.exit(0);
}
const text = 'Placeholder resume - replace public/resume.pdf with the real file.';
const stream = `BT /F1 14 Tf 72 720 Td (${text}) Tj ET`;
const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
  `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
];
let pdf = '%PDF-1.4\n';
const offsets = objects.map((body, i) => {
  const offset = pdf.length;
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  return offset;
});
const xref = pdf.length;
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
writeFileSync(target, pdf, 'latin1');
console.log('Wrote placeholder public/resume.pdf');
