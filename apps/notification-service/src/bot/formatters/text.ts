export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function cut(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '.';
}
