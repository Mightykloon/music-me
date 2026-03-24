// Basic profanity filter - catches common slurs and offensive terms
// This list is intentionally kept to severe/hateful terms only
const BLOCKED_PATTERNS = [
  // Racial slurs
  /\bn[i1]gg[aeu3]r?s?\b/i,
  /\bk[i1]ke[s]?\b/i,
  /\bsp[i1]c[ks]?\b/i,
  /\bch[i1]nk[s]?\b/i,
  /\bw[e3]tb[a4]ck[s]?\b/i,
  /\bg[o0]{2}k[s]?\b/i,
  /\bcoon[s]?\b/i,
  // Homophobic slurs
  /\bf[a4]gg?[o0]t[s]?\b/i,
  /\btr[a4]nn[yie][s]?\b/i,
  /\bdyke[s]?\b/i,
  // Gendered slurs
  /\bc[u\*]nt[s]?\b/i,
  /\bwh[o0]re[s]?\b/i,
  /\bsl[u\*]t[s]?\b/i,
  // Ableist slurs
  /\br[e3]t[a4]rd(ed|s)?\b/i,
  // General hate
  /\bn[a4]z[i1][s]?\b/i,
];

export function containsProfanity(text: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
}

export function filterProfanity(text: string): string {
  let filtered = text;
  for (const pattern of BLOCKED_PATTERNS) {
    filtered = filtered.replace(pattern, (match) => "*".repeat(match.length));
  }
  return filtered;
}
