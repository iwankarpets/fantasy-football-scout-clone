/**
 * Приблизительная транслитерация кириллицы в латиницу для поиска по именам FPL
 * («Салах» → «salah»). Точного совпадения не требуется: дальше работает
 * нечёткий поиск по триграммам. Не-кириллические символы остаются как есть.
 */
const MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

const HAS_CYRILLIC = /[а-яё]/i;

export function transliterate(input: string): string {
  const lower = input.toLowerCase();
  if (!HAS_CYRILLIC.test(lower)) {
    return lower;
  }
  return Array.from(lower, (ch) => MAP[ch] ?? ch).join('');
}
