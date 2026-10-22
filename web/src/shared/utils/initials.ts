/** Инициалы для аватарки без картинки: «Daria F» → «DF», «ivanov_sergey» → «IS», почта — по имени ящика. */
export function initials(name: string): string {
  const words = name
    .split("@")[0]
    .split(/[\s._-]+/)
    .filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "").slice(0, 2);

  return letters.toUpperCase();
}
