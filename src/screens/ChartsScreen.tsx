import React, {useEffect, useState} from 'react';
import {ScrollView, View} from 'react-native';
import {Text} from 'react-native-paper';
import {IconButton, Chip} from '../components/controls';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import type {DateRange, Flow} from '../data/types';
import {useFinance} from '../data/FinanceProvider';
import {period} from '../data/dates';
import {flowTotal, balances} from '../data/statistics';
import {money} from '../data/money';
import {uniqueChartColors} from '../theme/presentation';
import {ChartLegend, DonutChart, MonthlyChart, type ChartSlice} from '../components/Charts';
import {Card, Page, Tabs} from '../components/common';
import {PeriodFilter} from '../components/PeriodFilter';
import {colors, ui} from '../theme/theme';

export function ChartsScreen({route}: NativeStackScreenProps<RootStackParamList, 'Charts'>) {
  const {categories, accounts, operations, today} = useFinance();
  const distribution = route.params.mode === 'distribution';
  const [tab, setTab] = useState<Flow | 'accounts'>('expense');
  const [range, setRange] = useState<DateRange>(() => period('month'));
  const [year, setYear] = useState(new Date().getFullYear());
  const [categoryId, setCategoryId] = useState<string | null>(null);
  useEffect(() => { setRange(previous => previous.kind === 'custom' ? previous : period(previous.kind)); }, [today]);
  const flow: Flow = tab === 'income' ? 'income' : 'expense';
  const sortRange = distribution ? range : period('year', new Date(year, 0, 1));
  const categoryTotals = new Map(categories.map(category => [category.id, flowTotal(operations, flow, sortRange, category.id)]));
  const categoryColors = uniqueChartColors([...categories].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)));
  const accountColors = uniqueChartColors([...accounts].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id)));
  const categoryItems = categories.filter(category => category.flow === flow && (category.active || operations.some(op => op.entries.some(entry => entry.categoryId === category.id)))).sort((a, b) => categoryTotals.get(b.id)! - categoryTotals.get(a.id)! || a.order - b.order || a.id.localeCompare(b.id));
  const slices: ChartSlice[] = (tab === 'accounts'
    ? accounts.filter(account => account.active && account.kind !== 'credit').map(account => ({id: account.id, name: account.name, value: account.balance, color: accountColors.get(account.id)!}))
    : categoryItems.map(category => ({id: category.id, name: category.name, value: categoryTotals.get(category.id)!, color: categoryColors.get(category.id)!})))
    .sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));
  const monthly = (kind: Flow, selected?: string) => Array.from({length: 12}, (_, month) => flowTotal(operations, kind, period('month', new Date(year, month, 1)), selected));
  const totals = balances(accounts);

  return <Page>
    <Tabs value={tab} onChange={value => { setTab(value); setCategoryId(null); }} items={distribution ? [{value: 'expense', label: 'Расходы'}, {value: 'income', label: 'Доходы'}, {value: 'accounts', label: 'Счета'}] : [{value: 'expense', label: 'Расходы'}, {value: 'income', label: 'Доходы'}]}/>
    {distribution ? <>
      <DonutChart items={slices} totalLabel={tab === 'accounts' ? 'Средства' : 'Итого'}/>
      {tab !== 'accounts' && <PeriodFilter value={range} onChange={setRange}/>}
      <Card><ChartLegend items={slices}/>{!slices.length && <Text style={ui.muted}>Добавьте счёт или категорию.</Text>}</Card>
      {tab === 'accounts' && <Card><Text style={ui.muted}>На круговой диаграмме — соотношение средств на банковских счетах и депозитах. Кредитная задолженность учитывается отдельно.</Text><View style={ui.between}><Text style={ui.label}>Задолженность</Text><Text style={[ui.amount, {color: colors.red}]}>{money(totals.debt)}</Text></View><View style={ui.between}><Text style={ui.label}>Капитал</Text><Text style={ui.total}>{money(totals.capital)}</Text></View></Card>}
    </> : <>
      <View style={[ui.row, {justifyContent: 'center'}]}><IconButton icon="chevron-left" accessibilityLabel="Предыдущий год" disabled={year <= 1900} onPress={() => setYear(value => value - 1)}/><Text style={ui.heading}>{year}</Text><IconButton icon="chevron-right" accessibilityLabel="Следующий год" disabled={year >= 2199} onPress={() => setYear(value => value + 1)}/></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ui.horizontal}>
        <Chip selected={!categoryId} showSelectedCheck={false} style={[ui.chip, !categoryId && ui.chipSelected]} onPress={() => setCategoryId(null)}>Все</Chip>
        {categoryItems.map(category => <Chip key={category.id} selected={categoryId === category.id} showSelectedCheck={false} style={[ui.chip, categoryId === category.id && ui.chipSelected]} onPress={() => setCategoryId(category.id)}>{category.name}</Chip>)}
      </ScrollView>
      <Card><Text style={ui.label}>{categoryItems.find(category => category.id === categoryId)?.name ?? (flow === 'income' ? 'Все доходы' : 'Все расходы')}</Text><MonthlyChart values={monthly(flow, categoryId ?? undefined)} color={categoryId ? categoryColors.get(categoryId) : flow === 'income' ? colors.green : colors.primary}/><Text style={ui.muted}>Суммы в тенге · к = тысячи, м = миллионы</Text></Card>
      <Text style={ui.section}>Доходы и расходы за год</Text>
      <View style={ui.row}><Chip icon="circle" textStyle={{color: colors.red}}>Расходы</Chip><Chip icon="circle" textStyle={{color: colors.green}}>Доходы</Chip></View>
      <Card><MonthlyChart values={monthly('expense')} second={monthly('income')}/><Text style={ui.muted}>Сравнение всех категорий. Переводы и погашение основного долга в доходы и расходы не входят.</Text></Card>
    </>}
  </Page>;
}
