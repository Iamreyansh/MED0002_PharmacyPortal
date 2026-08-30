export function downloadBlob(data: Blob, filename: string): boolean {
  if (typeof URL.createObjectURL !== 'function') {
    return false;
  }
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}
