const iconRules: [RegExp, string][] = [
  [/комисси|перевод/i, 'bank-transfer'],
  [/обязательств/i, 'file-document-outline'],
  [/процент|^%/i, 'percent-outline'],
  [/депозит|вклад|ины.*доход/i, 'database-outline'],
  [/аренд|дом|home/i, 'home-outline'],
  [/тариф|связь|телефон|интернет/i, 'cellphone'],
  [/продукт|магазин/i, 'basket-outline'],
  [/кафе|ресторан|питан/i, 'silverware-fork-knife'],
  [/покупк|одежд/i, 'shopping-outline'],
  [/образован|стипенди|учеб/i, 'school-outline'],
  [/транспорт|такси|авто/i, 'bus'],
  [/здоров|лекар|медицин/i, 'heart-pulse'],
  [/спорт|фитнес/i, 'dumbbell'],
  [/отдых|развлеч|отпуск/i, 'beach'],
  [/заработ|зарплат|бизнес/i, 'briefcase-outline'],
  [/бонус|карт|kaspi|halyk/i, 'credit-card-outline'],
  [/кредит/i, 'bank-outline'],
];

export function financeIcon(name: string, fallback = 'shape-outline'): string {
  return iconRules.find(([pattern]) => pattern.test(name))?.[1] ?? fallback;
}

const chartPalette = ['#F16D66', '#E64C91', '#AF58C1', '#906DC3', '#747CC5', '#55A8E8', '#40B8E0', '#3DC1CF', '#EEA52C', '#68B77C'];

function generatedColor(index: number): string {
  const hue = (index * 137.507764 + 19) % 360;
  const saturation = 0.58 + (index % 3) * 0.09;
  const lightness = 0.42 + (Math.floor(index / 3) % 4) * 0.055;
  const amplitude = saturation * Math.min(lightness, 1 - lightness);
  const channel = (offset: number) => {
    const k = (offset + hue / 30) % 12;
    return Math.round(255 * (lightness - amplitude * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0');
  };
  return ('#' + channel(0) + channel(8) + channel(4)).toUpperCase();
}

export function uniqueChartColors(items: {id: string; color?: string}[]): Map<string, string> {
  const result = new Map<string, string>();
  const used = new Set<string>();
  let next = 0;
  for (const item of items) {
    let color = /^#[0-9a-f]{6}$/i.test(item.color ?? '') ? item.color!.toUpperCase() : '';
    while (!color || used.has(color)) {
      color = chartPalette[next] ?? generatedColor(next - chartPalette.length);
      next += 1;
    }
    used.add(color);
    result.set(item.id, color);
  }
  return result;
}
