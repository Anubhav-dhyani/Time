import Papa from 'papaparse';
import fs from 'fs';
import xlsx from 'xlsx';

export function parseCSVFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { data } = Papa.parse(content, { header: true, skipEmptyLines: true });
  return data;
}

export function parseExcelFile(filePath) {
  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet);
}
