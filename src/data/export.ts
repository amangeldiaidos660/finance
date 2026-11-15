import {Dirs, FileSystem} from 'react-native-file-access';
import Share from 'react-native-share';
import {generatePDF} from 'react-native-html-to-pdf';
import * as XLSX from 'xlsx';
import {fetchAllOperations} from './repository';
import {shortDate} from './dates';
import type {Entry, Operation} from './types';
import {categoryPathName} from './statistics';

export type ExportFormat = 'pdf' | 'xlsx' | 'csv';
const labels: Record<Entry['kind'], string> = {income: 'Доход', expense: 'Расход', 'transfer-in': 'Перевод: зачисление', 'transfer-out': 'Перевод: списание', fee: 'Комиссия за переводы', repayment: 'Погашение кредита', 'debt-reduction': 'Уменьшение долга', opening: 'Начальный остаток / долг'};
const headers = ['Дата', 'Тип', 'Счёт', 'Категория', 'Обязательство', 'Сумма, ₸', 'Изменение остатка / долга, ₸', 'Комментарий', 'ID операции'];
const htmlEntities: Record<string, string> = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};

function rowsFor(operations: Operation[]): (string | number)[][] {
  return operations.flatMap(operation => operation.entries.map(entry => {
    const negative = ['expense', 'transfer-out', 'fee', 'repayment', 'debt-reduction'].includes(entry.kind);
    return [shortDate(operation.date), labels[entry.kind], entry.accountName, categoryPathName(entry), entry.obligationName, entry.amount / 100, entry.amount / 100 * (negative ? -1 : 1), operation.comment, operation.id];
  }));
}

function escapeHtml(value: string | number): string {
  return String(value).replace(/[&<>"']/g, character => htmlEntities[character]!);
}

function csvValue(value: string | number): string {
  if (typeof value === 'number') { return value.toFixed(2).replace('.', ','); }
  const safe = /^[\s]*[=+@\-]/.test(value) || /^[\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function exportHistory(uid: string, format: ExportFormat): Promise<void> {
  const operations = await fetchAllOperations(uid);
  const rows = rowsFor(operations);
  if (!rows.length) { throw new Error('История пуста. Добавьте хотя бы один счёт или операцию.'); }
  const folder = `${Dirs.CacheDir}/finance-exports`;
  await FileSystem.mkdir(folder);
  const previous = await FileSystem.statDir(folder);
  await Promise.all(previous.filter(file => file.type === 'file' && file.lastModified < Date.now() - 86_400_000).map(file => FileSystem.unlink(file.path)));
  const filename = `finance-${Date.now()}`;
  const path = `${folder}/${filename}.${format}`;
  let mime = 'text/csv';
  if (format === 'csv') {
    const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(csvValue).join(';')).join('\r\n');
    await FileSystem.writeFile(path, csv, 'utf8');
  } else if (format === 'xlsx') {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    sheet['!cols'] = [{wch: 12}, {wch: 26}, {wch: 24}, {wch: 28}, {wch: 26}, {wch: 18}, {wch: 27}, {wch: 40}, {wch: 30}];
    sheet['!autofilter'] = {ref: `A1:I${rows.length + 1}`};
    for (let index = 2; index <= rows.length + 1; index++) {
      for (const column of ['F', 'G']) { const cell = sheet[`${column}${index}`]; if (cell) { cell.z = '#,##0.00'; } }
    }
    XLSX.utils.book_append_sheet(workbook, sheet, 'История');
    await FileSystem.writeFile(path, XLSX.write(workbook, {type: 'base64', bookType: 'xlsx'}), 'base64');
    mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else {
    const visibleHeaders = headers.slice(0, 8);
    const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>@page{margin:24px}body{font-family:sans-serif;color:#202238;font-size:9px}h1{font-size:22px;color:#008DB5}table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}th,td{text-align:left;padding:6px;border-bottom:1px solid #ddd;overflow-wrap:anywhere}th{background:#E8F4F8}tr{page-break-inside:avoid}p{color:#666}</style></head><body><h1>Финансы · полная история</h1><p>Валюта: казахстанский тенге (₸). Экспорт: ${escapeHtml(new Date().toLocaleDateString('ru-RU'))}. Записей: ${rows.length}.</p><table><thead><tr>${visibleHeaders.map(title => `<th>${escapeHtml(title)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.slice(0, 8).map(value => `<td>${escapeHtml(typeof value === 'number' ? value.toFixed(2) : value)}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
    const result = await generatePDF({html, fileName: filename, width: 842, height: 595});
    if (!result.filePath) { throw new Error('Не удалось создать PDF. Попробуйте другой формат.'); }
    await FileSystem.mv(result.filePath, path);
    mime = 'application/pdf';
  }
  await Share.open({url: `file://${path}`, type: mime, title: 'Экспорт истории', filename: `${filename}.${format}`, failOnCancel: false});
}
