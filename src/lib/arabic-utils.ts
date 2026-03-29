// Normalize Arabic text for fuzzy matching
export function normalizeArabic(text: string): string {
  return text
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ة]/g, "ه")
    .replace(/[ى]/g, "ي")
    .replace(/[ؤ]/g, "و")
    .replace(/[ئ]/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

// Check if two Arabic names match smartly
// Matches if first 2 names match, or first name + first few chars of second
export function arabicNamesMatch(input: string, stored: string): boolean {
  const normInput = normalizeArabic(input).split(" ").filter(Boolean);
  const normStored = normalizeArabic(stored).split(" ").filter(Boolean);
  
  if (normInput.length === 0 || normStored.length === 0) return false;
  
  // Exact match
  if (normalizeArabic(input) === normalizeArabic(stored)) return true;
  
  // First name must match
  if (normInput[0] !== normStored[0]) return false;
  
  // If only first name provided, it's a partial match
  if (normInput.length === 1) return true;
  
  // Check second name
  if (normInput.length >= 2 && normStored.length >= 2) {
    // Second name exact match
    if (normInput[1] === normStored[1]) return true;
    // Second name starts with input
    if (normStored[1].startsWith(normInput[1]) && normInput[1].length >= 2) return true;
    if (normInput[1].startsWith(normStored[1]) && normStored[1].length >= 2) return true;
  }
  
  return false;
}

// Get match score (higher = better match)
export function getMatchScore(input: string, stored: string): number {
  const normInput = normalizeArabic(input).split(" ").filter(Boolean);
  const normStored = normalizeArabic(stored).split(" ").filter(Boolean);
  
  let score = 0;
  const minLen = Math.min(normInput.length, normStored.length);
  
  for (let i = 0; i < minLen; i++) {
    if (normInput[i] === normStored[i]) {
      score += 3;
    } else if (normStored[i].startsWith(normInput[i]) || normInput[i].startsWith(normStored[i])) {
      score += 1;
    }
  }
  
  return score;
}
