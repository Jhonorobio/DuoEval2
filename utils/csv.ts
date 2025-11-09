
export const downloadCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }

  const headers = Object.keys(data[0]);

  const escapeCell = (cell: any) => {
    const str = String(cell === null || cell === undefined ? '' : cell);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(h => escapeCell(h)).join(',');
  const dataRows = data.map(row => headers.map(header => escapeCell(row[header])).join(','));

  const csvContent = [headerRow, ...dataRows].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
