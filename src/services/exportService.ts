import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { SchoolSettings } from '../types/lms';

export interface ExportTablePayload {
  reportTitle: string;
  reportSubtitle: string;
  periodLabel: string;
  filenameBase: string;
  headers: string[];
  rows: (string | number)[][];
  includeSignatureBlock?: boolean;
  schoolSettings: SchoolSettings;
}

export function exportToCsv(payload: ExportTablePayload): void {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    payload.headers.map(escapeCell).join(','),
    ...payload.rows.map((row) => row.map(escapeCell).join(',')),
  ];

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${payload.filenameBase}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToXlsx(payload: ExportTablePayload): void {
  const worksheetData = [
    [payload.schoolSettings.schoolName.toUpperCase()],
    [payload.schoolSettings.address],
    [`NPSN: ${payload.schoolSettings.npsn} | Tahun Ajaran: ${payload.schoolSettings.academicYear} (${payload.schoolSettings.semester})`],
    [],
    [payload.reportTitle],
    [`Periode / Filter: ${payload.periodLabel}`],
    [`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`],
    [],
    payload.headers,
    ...payload.rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan LMS');
  XLSX.writeFile(wb, `${payload.filenameBase}.xlsx`);
}

export function exportToPdf(payload: ExportTablePayload): void {
  const doc = new jsPDF({
    orientation: payload.headers.length > 6 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const { schoolSettings } = payload;

  // Header Sekolah
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(schoolSettings.pdfHeaderSubtitle, pageWidth / 2, 13, { align: 'center' });

  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(schoolSettings.schoolName.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `${schoolSettings.address}  |  NPSN: ${schoolSettings.npsn}`,
    pageWidth / 2,
    25,
    { align: 'center' }
  );

  // Garis Kop Surat
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(14, 28, pageWidth - 14, 28);
  doc.setLineWidth(0.2);
  doc.line(14, 29.2, pageWidth - 14, 29.2);

  // Judul Laporan & Meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(payload.reportTitle.toUpperCase(), 14, 37);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Keterangan: ${payload.reportSubtitle}`, 14, 42);
  doc.text(
    `Periode: ${payload.periodLabel}   |   Tahun Ajaran: ${schoolSettings.academicYear} (${schoolSettings.semester})   |   Dicetak: ${new Date().toLocaleString('id-ID')}`,
    14,
    47
  );

  // Tabel Utama
  autoTable(doc, {
    startY: 52,
    head: [payload.headers],
    body: payload.rows.map((r) => r.map((c) => String(c ?? '-'))),
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14, bottom: 25 },
  });

  // Ruang Tanda Tangan
  const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 75;
  if (payload.includeSignatureBlock !== false) {
    let sigY = finalY + 12;
    if (sigY + 35 > pageHeight - 15) {
      doc.addPage();
      sigY = 25;
    }

    const rightColX = pageWidth - 75;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `Jakarta, ${new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}`,
      rightColX,
      sigY
    );
    doc.text('Mengetahui, Kepala Sekolah', rightColX, sigY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolSettings.principalName, rightColX, sigY + 24);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${schoolSettings.principalNip}`, rightColX, sigY + 29);
  }

  // Nomor Halaman di setiap halaman
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Dokumen Resmi LMS ${schoolSettings.schoolName} — Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  doc.save(`${payload.filenameBase}.pdf`);
}
