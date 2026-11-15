import type {Category, Flow} from './types';

export const palette = ['#F16D66', '#E64C91', '#AF58C1', '#906DC3', '#747CC5', '#55A8E8', '#40B8E0', '#3DC1CF', '#EEA52C', '#68B77C'];
export const FEE_CATEGORY = 'transfer-fees';
export const obligationCategory = (flow: Flow) => `obligations-${flow}`;

const expenseNames = ['Продукты', 'Образование', 'Транспорт', 'Здоровье', 'Отдых и развлечения', 'Кафе и рестораны', 'Покупки, одежда', 'Спорт, фитнес'];
const incomeNames = ['Заработная плата', 'Стипендия, пособия', 'Бизнес', 'Проценты от вкладов', 'Иные доходы'];

export function initialCategories(): Category[] {
  const result: Category[] = [];
  for (const flow of ['expense', 'income'] as const) {
    const names = flow === 'expense' ? expenseNames : incomeNames;
    names.forEach((name, index) => result.push({id: `${flow}-${index}`, name, flow, color: palette[index % palette.length]!, limit: null, system: false, active: true, order: index}));
    result.push({id: obligationCategory(flow), name: 'Обязательства', flow, color: '#536EB5', limit: null, system: true, active: true, order: 90});
  }
  result.push({id: FEE_CATEGORY, name: 'Комиссия за переводы', flow: 'expense', color: '#9CA3AF', limit: null, system: true, active: true, order: 99});
  return result.map(category => ({...category, parentId: null, childIds: []}));
}
