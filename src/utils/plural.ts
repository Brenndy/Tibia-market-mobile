// Polish plural rules: 1 = one, 2-4 (excluding 12-14) = few, rest = many.
// English collapses all three onto one word, so passing EN translation keys
// still works — every form resolves to the same English string.
export function pluralKey<K extends string>(count: number, keys: { one: K; few: K; many: K }): K {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (count === 1) return keys.one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return keys.few;
  return keys.many;
}
