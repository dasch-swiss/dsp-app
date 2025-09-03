export function unescapeHtml(str: string) {
  const unescapeMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
  };
  return str.replace(/&(amp|lt|gt|quot|#039);/g, match => unescapeMap[match]);
}
