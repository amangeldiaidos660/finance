import React, {useEffect, useState} from 'react';
import {ScrollView, View} from 'react-native';
import {Text} from 'react-native-paper';
import {IconButton, Chip} from '../components/controls';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import type {DateRange, Flow} from '../data/types';
import {useFinance} from '../data/FinanceProvider';
import {period} from '../data/dates';
import {categoryGroups, scopeTotal, balances} from '../data/statistics';
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
  const groups = categoryGroups(operations, flow, sortRange);
  const categoryColors = uniqueChartColors([...categories].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)));
  const accountColors = uniqueChartColors([...accounts].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id)));
  const categoryItems = groups.flatMap(group => [group, ...group.children]);
  const selected = categoryItems.find(group => group.key === categoryId);
  const distributionGroup = groups.find(group => group.key === categoryId);
  const distributionSlices = distributionGroup
    ? [...distributionGroup.children.map(group => ({id: group.key, name: group.scope.name, value: group.value, color: categoryColors.get(group.scope.id)!})), ...(distributionGroup.direct ? [{id: distributionGroup.key, name: 'Без подкатегории', value: distributionGroup.direct, color: categoryColors.get(distributionGroup.scope.id)!}] : [])]
    : groups.map(group => ({id: group.key, name: group.scope.name, value: group.value, color: categoryColors.get(group.scope.id)!}));
  const slices: ChartSlice[] = (tab === 'accounts'
    ? accounts.filter(account => account.active && account.kind !== 'credit').map(account => ({id: account.id, name: account.name, value: account.balance, color: accountColors.get(account.id)!}))
    : distributionSlices)
    .sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));
  const monthly = (kind: Flow, scoped = false) => Array.from({length: 12}, (_, month) => scopeTotal(operations, kind, period('month', new Date(year, month, 1)), scoped ? selected?.scope : undefined));
  const totals = balances(accounts);

  return <Page>
    <Tabs value={tab} onChange={value => { setTab(value); setCategoryId(null); }} items={distribution ? [{value: 'expense', label: 'Расходы'}, {value: 'income', label: 'Доходы'}, {value: 'accounts', label: 'Счета'}] : [{value: 'expense', label: 'Расходы'}, {value: 'income', label: 'Доходы'}]}/>
    {distribution ? <>
      <DonutChart items={slices} totalLabel={tab === 'accounts' ? 'Средства' : 'Итого'}/>
      {tab !== 'accounts' && <PeriodFilter value={range} onChange={setRange}/>}
      {tab !== 'accounts' && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ui.horizontal}>
        <Chip selected={!distributionGroup} onPress={() => setCategoryId(null)}>Все категории</Chip>
        {groups.filter(group => group.children.length).map(group => <Chip key={group.key} selected={group.key === categoryId} onPress={() => setCategoryId(group.key)}>{group.scope.name}</Chip>)}
      </ScrollView>}
      <Card><ChartLegend items={slices}/>{!slices.length && <Text style={ui.muted}>{tab === 'accounts' ? 'Добавьте счёт.' : 'За выбранный период операций нет.'}</Text>}</Card>
      {tab === 'accounts' && <Card><Text style={ui.muted}>На круговой диаграмме — соотношение средств на банковских счетах и депозитах. Кредитная задолженность учитывается отдельно.</Text><View style={ui.between}><Text style={ui.label}>Задолженность</Text><Text style={[ui.amount, {color: colors.red}]}>{money(totals.debt)}</Text></View><View style={ui.between}><Text style={ui.label}>Капитал</Text><Text style={ui.total}>{money(totals.capital)}</Text></View></Card>}
    </> : <>
      <View style={[ui.row, {justifyContent: 'center'}]}><IconButton icon="chevron-left" accessibilityLabel="Предыдущий год" disabled={year <= 1900} onPress={() => setYear(value => value - 1)}/><Text style={ui.heading}>{year}</Text><IconButton icon="chevron-right" accessibilityLabel="Следующий год" disabled={year >= 2199} onPress={() => setYear(value => value + 1)}/></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ui.horizontal}>
        <Chip selected={!selected} showSelectedCheck={false} style={[ui.chip, !selected && ui.chipSelected]} onPress={() => setCategoryId(null)}>Все</Chip>
        {categoryItems.map(group => <Chip key={group.key} selected={categoryId === group.key} showSelectedCheck={false} style={[ui.chip, categoryId === group.key && ui.chipSelected]} onPress={() => setCategoryId(group.key)}>{group.scope.parentId ? `${group.scope.parentName} → ` : ''}{group.scope.name}</Chip>)}
      </ScrollView>
      <Card><Text style={ui.label}>{selected ? (selected.scope.parentId ? `${selected.scope.parentName} → ` : '') + selected.scope.name : flow === 'income' ? 'Все доходы' : 'Все расходы'}</Text><MonthlyChart values={monthly(flow, true)} color={selected ? categoryColors.get(selected.scope.id) : flow === 'income' ? colors.green : colors.primary}/><Text style={ui.muted}>Суммы в тенге · к = тысячи, м = миллионы</Text></Card>
      <Text style={ui.section}>Доходы и расходы за год</Text>
      <View style={ui.row}><Chip icon="circle" textStyle={{color: colors.red}}>Расходы</Chip><Chip icon="circle" textStyle={{color: colors.green}}>Доходы</Chip></View>
      <Card><MonthlyChart values={monthly('expense')} second={monthly('income')}/><Text style={ui.muted}>Сравнение всех категорий. Переводы и погашение основного долга в доходы и расходы не входят.</Text></Card>
    </>}
  </Page>;
}
