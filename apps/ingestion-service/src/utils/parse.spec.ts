import { toDate, toNumber } from './parse';

describe('toNumber', () => {
  it('приводит строку к числу', () => expect(toNumber('12.5')).toBe(12.5));
  it('оставляет число как есть', () => expect(toNumber(7)).toBe(7));
  it('null, undefined и пустая строка дают null', () => {
    expect(toNumber(null)).toBeNull();
    expect(toNumber(undefined)).toBeNull();
    expect(toNumber('')).toBeNull();
  });
  it('мусор даёт null, а не NaN', () => expect(toNumber('abc')).toBeNull());
  it('ноль остаётся нулём', () => expect(toNumber('0.0')).toBe(0));
});

describe('toDate', () => {
  it('парсит ISO-строку', () =>
    expect(toDate('2026-08-15T10:00:00Z')?.toISOString()).toBe('2026-08-15T10:00:00.000Z'));
  it('null и мусор дают null', () => {
    expect(toDate(null)).toBeNull();
    expect(toDate('не дата')).toBeNull();
  });
});
