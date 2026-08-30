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

export function downloadDataUrl(dataUrl: string, filename: string): boolean {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/i.exec(dataUrl);
  if (!match) {
    return false;
  }
  const mime = match[1] || 'application/octet-stream';
  const isBase64 = Boolean(match[2]);
  const payload = match[3] || '';
  const bytes = isBase64
    ? Uint8Array.from(atob(payload), (char) => char.charCodeAt(0))
    : Uint8Array.from(decodeURIComponent(payload), (char) =>
        char.charCodeAt(0),
      );
  return downloadBlob(new Blob([bytes], { type: mime }), filename);
}
