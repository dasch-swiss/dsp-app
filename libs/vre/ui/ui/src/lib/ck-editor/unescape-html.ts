export function unescapeHtml(str: string) {
  const unescapeMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
  };
  return str.replace(/&(amp|lt|gt|quot|#039);/g, match => unescapeMap[match]);
}
