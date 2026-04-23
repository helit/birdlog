export function normalizeForSearch(s: string): string {
  return s
    .toLocaleLowerCase("sv")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}
