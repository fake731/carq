// Normalize phone numbers - strip country codes and prefixes
export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
  // Remove common prefixes: +968, 00968, 968, +971, 00971, etc.
  cleaned = cleaned.replace(/^(\+|00)?(968|971|966|965|974|973|972|970|962|961|20|212|216|213)/, "");
  // Remove leading zero if present
  cleaned = cleaned.replace(/^0+/, "");
  return cleaned;
}

// Check if two phone numbers match regardless of format
export function phonesMatch(a: string, b: string): boolean {
  return normalizePhone(a) === normalizePhone(b);
}
