import * as XLSX from 'xlsx';
import { StockItem } from '../types';

export const exportToExcel = (items: StockItem[]) => {
  // Format data for Excel (Translate headers to Turkish)
  const data = items.map(item => ({
    'Barkod': item.barcode,
    'Adet': item.quantity,
    'Son Okuma Tarihi': new Date(item.lastScannedAt).toLocaleString('tr-TR'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Stok Listesi");

  // Generate filename with date
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `stok_takip_${dateStr}.xlsx`);
};