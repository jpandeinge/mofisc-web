import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WorkSheet, utils, writeFile } from 'xlsx';
import { format as formatDate } from 'date-fns';
import { colors } from '../styles/colors';

const HEADER_SECTIONS = ['Income', 'Other Income', 'Expenses', 'Other Expenses', 'Summary'];

export type PdfReportMeta = {
  reportTitle?: string;
  accountLabel?: string;
  userName?: string;
  planLabel?: string;
  bankLabel?: string;
  periodStart?: Date;
  periodEnd?: Date;
  filters?: string[];
  generatedAt?: Date;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return [r, g, b];
};

let cachedBrandMarkPngDataUrl: string | null | undefined;

const getBrandMarkPngDataUrl = (sizePx: number): string | null => {
  if (cachedBrandMarkPngDataUrl !== undefined) return cachedBrandMarkPngDataUrl;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = sizePx;
    canvas.height = sizePx;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      cachedBrandMarkPngDataUrl = null;
      return null;
    }

    const radius = Math.round(sizePx * 0.25); // close to Tailwind rounded-lg on a w-8/h-8 mark
    const gradient = ctx.createLinearGradient(0, 0, sizePx, sizePx);
    gradient.addColorStop(0, colors.primary.dark);
    gradient.addColorStop(1, colors.primary.main);

    ctx.clearRect(0, 0, sizePx, sizePx);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(sizePx - radius, 0);
    ctx.quadraticCurveTo(sizePx, 0, sizePx, radius);
    ctx.lineTo(sizePx, sizePx - radius);
    ctx.quadraticCurveTo(sizePx, sizePx, sizePx - radius, sizePx);
    ctx.lineTo(radius, sizePx);
    ctx.quadraticCurveTo(0, sizePx, 0, sizePx - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();

    // White "M" centered
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(sizePx * 0.7)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    ctx.fillText('M', sizePx / 2, sizePx / 2 + sizePx * 0.08);

    cachedBrandMarkPngDataUrl = canvas.toDataURL('image/png');
    return cachedBrandMarkPngDataUrl;
  } catch {
    cachedBrandMarkPngDataUrl = null;
    return null;
  }
};

const formatGeneratedAt = (date: Date): string => {
  try {
    return formatDate(date, 'dd-MMM-yyyy HH:mm');
  } catch {
    return date.toLocaleString();
  }
};

const sanitizeFilenamePart = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

const buildPdfFilename = (base: string, generatedAt: Date): string => {
  const stamp = generatedAt
    .toISOString()
    .replace(/[:]/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');
  const safeBase = sanitizeFilenamePart(base) || 'report';
  return `${safeBase}_${stamp}.pdf`;
};

const drawBrandHeaderAndFooter = (
  doc: jsPDF,
  meta: PdfReportMeta,
  pageNumber: number
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginX = 14;
  const headerTop = 10;
  const headerHeight = 30;

  const [textR, textG, textB] = hexToRgb(colors.text.primary);
  const [mutedR, mutedG, mutedB] = hexToRgb(colors.text.secondary);

  // Logo mark (matches the in-app brand mark: gradient square + "M")
  const logoX = marginX;
  const logoY = headerTop;
  const logoSize = 10;

  // Prefer a rasterized mark that matches the web gradient precisely (no external assets).
  const markPng = getBrandMarkPngDataUrl(96);
  if (markPng) {
    doc.addImage(markPng, 'PNG', logoX, logoY, logoSize, logoSize, undefined, 'FAST');
  } else {
    // Fallback: simple two-tone mark if canvas is unavailable
    const darkRgb = hexToRgb(colors.primary.dark);
    const mainRgb = hexToRgb(colors.primary.main);
    doc.setFillColor(darkRgb[0], darkRgb[1], darkRgb[2]);
    doc.roundedRect(logoX, logoY, logoSize, logoSize, 2, 2, 'F');
    doc.setFillColor(mainRgb[0], mainRgb[1], mainRgb[2]);
    doc.roundedRect(logoX + 1.2, logoY + 1.2, logoSize - 2.4, logoSize - 2.4, 1.6, 1.6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('M', logoX + logoSize / 2, logoY + 7.2, { align: 'center' });
  }

  // App name + report title
  doc.setTextColor(textR, textG, textB);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Mofisc', marginX + 14, headerTop + 6.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(meta.reportTitle || 'Report', marginX + 14, headerTop + 13.8);

  // Right-side metadata
  const generatedAt = meta.generatedAt || new Date();
  const rightX = pageWidth - marginX;
  doc.setTextColor(mutedR, mutedG, mutedB);
  doc.setFontSize(8);

  const identityParts = [
    meta.accountLabel || 'Personal Account',
    meta.planLabel ? `Plan: ${meta.planLabel}` : null,
    meta.bankLabel ? `Bank: ${meta.bankLabel}` : null,
  ].filter(Boolean) as string[];

  const periodLine =
    meta.periodStart && meta.periodEnd
      ? `Period: ${formatDate(meta.periodStart, 'dd-MMM-yyyy')} - ${formatDate(meta.periodEnd, 'dd-MMM-yyyy')}`
      : '';

  const rightLines = [
    `Generated ${formatGeneratedAt(generatedAt)}`,
    identityParts.join(' • '),
    meta.userName ? `Name: ${meta.userName}` : null,
    periodLine || null,
  ].filter(Boolean) as string[];

  rightLines.forEach((line, index) => {
    doc.text(line, rightX, headerTop + 5.6 + index * 5.6, { align: 'right' });
  });

  // Divider under header
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(marginX, headerTop + headerHeight, pageWidth - marginX, headerTop + headerHeight);

  // Footer
  const footerY = pageHeight - 8;
  doc.setTextColor(mutedR, mutedG, mutedB);
  doc.setFontSize(7);
  // Optional filter line above footer (only if provided)
  if (meta.filters && meta.filters.length > 0) {
    const filterText = `Filters: ${meta.filters.join(' • ')}`;
    const wrapped = doc.splitTextToSize(filterText, pageWidth - marginX * 2);
    doc.text(wrapped, marginX, footerY - 8);
  }

  const pageLabel = `Page ${pageNumber}`;
  const year = new Date().getFullYear();
  const combinedLeft = `Confidential • Data shown reflects your plan limits • Mofisc © ${year} All rights reserved`;

  // Ensure footer text doesn't collide with the right-aligned page label.
  const gap = 6;
  const maxLeftWidth = pageWidth - marginX * 2 - doc.getTextWidth(pageLabel) - gap;
  const leftText =
    doc.getTextWidth(combinedLeft) <= maxLeftWidth
      ? combinedLeft
      : `Data shown reflects your plan limits • Mofisc © ${year} All rights reserved`;

  doc.text(leftText, marginX, footerY);
  doc.text(pageLabel, pageWidth - marginX, footerY, { align: 'right' });
};

export const downloadPDF = async (
  data: any[][],
  title: string,
  isTransactionTable: boolean = false,
  meta: PdfReportMeta = {}
) => {
  const orientation = data[0]?.length > 7 ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation, format: 'a4' });
  doc.setProperties({
    title: meta.reportTitle || title,
    subject: 'Exported report',
    author: 'Mofisc',
    creator: 'Mofisc',
  });

  autoTable(doc, {
    head: [data[0]],
    body: data.slice(1),
    margin: { top: 48, left: 14, right: 14, bottom: 14 },
    didDrawPage: (hookData) => {
      drawBrandHeaderAndFooter(doc, meta, hookData.pageNumber);
    },
    styles: {
      cellPadding: 1,
      fontSize: 8,
      textColor: [0, 0, 0],
      fillColor: [255, 255, 255],
    },
    headStyles: {
      fillColor: [200, 200, 200],
      fontStyle: 'bold'
    },
    didParseCell: function (cellData) {
      // Never style body rows like headers (fixes "first transaction row looks like header").
      if (cellData.section === 'head') return;

      // For Income/Expense reports, render section title rows (e.g. "Income", "Expenses") as separators.
      if (!isTransactionTable) {
        const firstCell = (cellData as any)?.row?.raw?.[0];
        if (typeof firstCell === 'string' && HEADER_SECTIONS.includes(firstCell)) {
          cellData.cell.styles.fillColor = [200, 200, 200];
          cellData.cell.styles.fontStyle = 'bold';
          cellData.cell.styles.textColor = [0, 0, 0];
        }
      }
    },
  });

  const generatedAt = meta.generatedAt || new Date();
  doc.save(buildPdfFilename(title, generatedAt));
};

export const downloadExcel = (data: any[][], title: string, isTransactionTable: boolean = false) => {
  const worksheet = utils.aoa_to_sheet(data);
  const workbook = utils.book_new();

  // Format headers
  const range = utils.decode_range(worksheet['!ref'] || 'A1');

  for (let rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
    const firstCellAddress = utils.encode_cell({ r: rowNum, c: 0 });
    const firstCell = worksheet[firstCellAddress];

    if (isTransactionTable) {
      if (rowNum === 0) {
        for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
          const cellAddress = utils.encode_cell({ r: rowNum, c: colNum });
          applyHeaderStyle(worksheet, cellAddress);
        }
      }
    } else {
      if (firstCell && (rowNum === 0 || HEADER_SECTIONS.includes(firstCell.v as string))) {
        for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
          const cellAddress = utils.encode_cell({ r: rowNum, c: colNum });
          if (!worksheet[cellAddress]) {
            worksheet[cellAddress] = { v: '', t: 's' };
          }
          applyHeaderStyle(worksheet, cellAddress);
        }
      }
    }
  }

  // Auto-size columns
  const colWidths = data.reduce((widths, row) => {
    row.forEach((cell, i) => {
      const cellValue = cell ? String(cell) : '';
      widths[i] = Math.max(widths[i] || 0, cellValue.length);
    });
    return widths;
  }, [] as number[]);

  worksheet['!cols'] = colWidths.map(w => ({ wch: w + 2 }));

  utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  writeFile(workbook, `${title}.xlsx`);
};

function applyHeaderStyle(worksheet: WorkSheet, cellAddress: string) {
  if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
  worksheet[cellAddress].s = {
    ...worksheet[cellAddress].s,
    font: { bold: true },
    fill: {
      fgColor: { rgb: "C0C0C0" },
      patternType: "solid"
    },
    alignment: { horizontal: "center" }
  };
}
