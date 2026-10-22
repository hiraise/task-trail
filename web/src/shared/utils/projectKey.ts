// A key suggested from the project name (ADR-0026): the user may keep it or type their own.
// The result fits ProjectKey of the contract or is empty.

const MAX_KEY_LENGTH = 10;

/**
 * First letters of the name's words, upper-case; a single word gives its first three letters.
 * Only letters and digits, no leading digits, at most 10 characters. A result shorter than
 * 2 characters is an empty string: the user types the key.
 */
export const suggestProjectKey = (name: string): string => {
  const words = name.split(/[^\p{L}0-9]+/u).filter(Boolean);
  const chars =
    words.length === 1 ? Array.from(words[0]).slice(0, 3) : words.map((word) => Array.from(word)[0]);
  const key = Array.from(chars.join("").toUpperCase().replace(/^[0-9]+/, ""))
    .slice(0, MAX_KEY_LENGTH)
    .join("");

  return key.length < 2 ? "" : key;
};
