import { ExportedFileFormat } from '@/lib/types';

export function formatData(data: any, format: ExportedFileFormat): string {
  if (!data || data.length === 0) return '';
  if (format === 'CSV') {
    return convertToCSV(data);
  } else if (format === 'JSON') {
    return JSON.stringify(data, null, 2);
  }
  return '';
}

export function convertToCSV(data: any) {
  if (!data || data.length === 0) return '';

  const originalHeaders = Object.keys(data[0]);
  const headers = originalHeaders.map(header => header === 'assetId' ? 'symbol' : header);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = originalHeaders.map(header => {
      const value = row[header];
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}
