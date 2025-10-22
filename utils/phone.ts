export function normalizePhone(phone: string) {
  if (!phone) return '';

  // Keep only digits
  let p = phone.replace(/\D/g, '');

  // If already starts with 961 (after removing +)
  if (p.startsWith('961')) {
    return '+' + p;
  }

  // Remove any leading zeros and add +961
  p = p.replace(/^0+/, '');
  return '+961' + p;
}
