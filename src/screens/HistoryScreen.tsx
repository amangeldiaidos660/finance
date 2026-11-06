import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {Text} from 'react-native-paper';
import {Button, Chip} from '../components/controls';
import {useFinance} from '../data/FinanceProvider';
import {exportHistory, type ExportFormat} from '../data/export';
import {inRange, isFlow} from '../data/statistics';
import {periodLabel} from '../data/dates';
import type {Entry} from '../data/types';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {useAction} from '../data/useAction';
import {HistoryList} from '../components/HistoryList';
import {ErrorNotice, Page, Sheet} from '../components/common';
import {ui} from '../theme/theme';

export function HistoryScreen({route}: NativeStackScreenProps<RootStackParamList, 'History'>) {
  const {operations, accounts, categories, user} = useFinance();
  const {accountId, categoryId, flow, range} = route.params ?? {};
  const scoped = Boolean(accountId || categoryId || flow || range);
  const title = accountId ? accounts.find(account => account.id === accountId)?.name ?? 'История счёта' : categoryId ? categories.find(category => category.id === categoryId)?.name ?? 'История категории' : flow === 'income' ? 'Доходы' : flow === 'expense' ? 'Расходы' : '';
  const [filter, setFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [count, setCount] = useState(40);
  const [open, setOpen] = useState(false);
  const action = useAction();
  useEffect(() => { setFilter('all'); setCount(40); }, [accountId, categoryId, flow, range?.start, range?.end]);
  const matchesEntry = (entry: Entry) => (!accountId || entry.accountId === accountId)
    && (!categoryId || entry.categoryId === categoryId)
    && (!flow || isFlow(entry, flow))
    && (filter === 'income' || filter === 'expense' ? isFlow(entry, filter) : true);
  const selected = operations.filter(operation => (!range || inRange(operation, range))
    && (filter !== 'transfer' || ['transfer', 'repayment'].includes(operation.kind))
    && operation.entries.some(matchesEntry)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const download = (format: ExportFormat) => action.run(async () => { await exportHistory(user!.uid, format); setOpen(false); });
  return <Page>
    {!!title && <Text style={ui.heading}>{title}</Text>}
    <View style={ui.between}><Text style={[ui.muted, ui.grow]}>{range ? periodLabel(range) : 'За всё время'}</Text>{!scoped && <Button mode="outlined" icon="export-variant" onPress={() => { action.clearError(); setOpen(true); }}>Экспорт</Button>}</View>
    {!categoryId && !flow && <View style={ui.wrap}>{([{id: 'all', title: 'Все'}, {id: 'expense', title: 'Расходы'}, {id: 'income', title: 'Доходы'}, {id: 'transfer', title: 'Переводы'}] as const).map(item => <Chip key={item.id} selected={filter === item.id} showSelectedCheck={false} style={[ui.chip, filter === item.id && ui.chipSelected]} onPress={() => { setFilter(item.id); setCount(40); }}>{item.title}</Chip>)}</View>}
    <HistoryList operations={selected.slice(0, count)} entryFilter={matchesEntry}/>
    {selected.length > count && <Button onPress={() => setCount(value => value + 40)}>Показать ещё ({selected.length - count})</Button>}
    <Sheet visible={open} onClose={() => { if (!action.busy) { setOpen(false); } }} title="Экспорт всей истории">
      <Text style={ui.muted}>В файл попадут все операции за всё время, включая переводы, комиссии, начальные остатки и историю удалённых счетов и категорий. Фильтр на экране не ограничивает экспорт. Для получения полной истории нужен интернет.</Text>
      <ErrorNotice text={action.error}/>
      <Button mode="outlined" icon="export-variant" disabled={action.busy} onPress={() => download('pdf')}>PDF</Button>
      <Button mode="outlined" icon="export-variant" disabled={action.busy} onPress={() => download('xlsx')}>Excel (.xlsx)</Button>
      <Button mode="outlined" icon="export-variant" disabled={action.busy} onPress={() => download('csv')}>CSV</Button>
      {action.busy && <Button loading disabled>Подготовка файла…</Button>}
    </Sheet>
  </Page>;
}
