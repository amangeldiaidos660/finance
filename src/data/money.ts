export const MAX_MONEY = 9_000_000_000_000;

export function assertMoney(value: number, allowZero = false): number {
  if (!Number.isSafeInteger(value) || value < (allowZero ? 0 : 1) || value > MAX_MONEY) {
    throw new Error(allowZero ? 'Введите сумму от 0 до 90 000 000 000 ₸.' : 'Введите положительную сумму, не больше 90 000 000 000 ₸.');
  }
  return value;
}

export function parseMoney(text: string, allowZero = false): number {
  const value = text.replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(value)) {
    throw new Error('Введите сумму цифрами, не больше двух знаков после запятой.');
  }
  const [whole = '0', decimal = ''] = value.split('.');
  return assertMoney(Number(whole) * 100 + Number(decimal.padEnd(2, '0')), allowZero);
}

export function money(value: number): string {
  return `${(value / 100).toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ₸`;
}

export function moneyInput(value: number): string {
  return (value / 100).toFixed(2).replace(/\.00$/, '');
}

export function calculate(expression: string): number {
  const input = expression.replace(/,/g, '.').replace(/\s/g, '');
  if (!/^\d+(?:\.\d{0,2})?(?:[+\-*/]\d+(?:\.\d{0,2})?)*$/.test(input)) {
    throw new Error('Завершите ввод суммы или выражения.');
  }
  const parts = input.match(/\d+(?:\.\d*)?|[+\-*/]/g) ?? [];
  let term = Number(parts[0]);
  let total = 0;
  let sign = 1;
  for (let i = 1; i < parts.length; i += 2) {
    const operator = parts[i];
    const value = Number(parts[i + 1]);
    if (operator === '*') {
      term *= value;
    } else if (operator === '/') {
      if (value === 0) { throw new Error('На ноль делить нельзя.'); }
      term /= value;
    } else {
      total += sign * term;
      sign = operator === '-' ? -1 : 1;
      term = value;
    }
  }
  return assertMoney(Math.round((total + sign * term) * 100));
}
