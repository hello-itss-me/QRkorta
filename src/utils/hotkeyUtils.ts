export const formatKeyEvent = (e: React.KeyboardEvent): string => {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Meta');

  const key = e.key.toLowerCase();
  if (!['control', 'alt', 'shift', 'meta'].includes(key)) {
    if (key === ' ') {
      parts.push('Space');
    } else {
      parts.push(key.charAt(0).toUpperCase() + key.slice(1));
    }
  }

  return parts.join('+');
};
