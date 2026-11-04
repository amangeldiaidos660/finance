import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {ProgressBar, Switch, Text} from 'react-native-paper';
import {Button, IconButton} from '../components/controls';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import type {DateRange, Flow} from '../data/types';
import {useFinance} from '../data/FinanceProvider';
import {period} from '../data/dates';
import {categoryLimit, flowTotal, inRange, isFlow} from '../data/statistics';
import {money} from '../data/money';
import {FEE_CATEGORY} from '../data/constants';
import {AppHeader, Card, Page} from '../components/common';
import {PeriodFilter} from '../components/PeriodFilter';
import {HistoryList} from '../components/HistoryList';
import {colors, ui} from '../theme/theme';

export function FlowScreen({flow}: {flow: Flow}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {categories, operations, obligations, today} = useFinance();
  const [range, setRange] = useState<DateRange>(() => period('month'));
  const [showLimit, setShowLimit] = useState(false);
  const [count, setCount] = useState(20);
  useEffect(() => { setRange(previous => previous.kind === 'custom' ? previous : period(previous.kind)); }, [today]);
  useEffect(() => { setCount(20); }, [range]);
  const items = categories.filter(category => category.flow === flow && (category.active || flowTotal(operations, flow, range, category.id) > 0)).sort((a, b) => a.order - b.order);
  const history = operations.filter(operation => inRange(operation, range) && operation.entries.some(entry => isFlow(entry, flow))).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const total = flowTotal(operations, flow, range);

  return <View style={ui.fill}>
    <AppHeader title="Финансы" addLabel={flow === 'income' ? 'Добавить доход' : 'Добавить расход'} onAdd={() => navigation.navigate('Operation', {flow})}/>
    <Page>
      <PeriodFilter value={range} onChange={setRange}/>
      <View style={ui.between}><Text style={[ui.section, {fontWeight: '400'}]}>{flow === 'expense' ? 'Расходы' : 'Доходы'}</Text><Text style={ui.total}>Итого: {money(total)}</Text></View>
      <Card>
        {flow === 'expense' && <View style={ui.between}>
          <View style={ui.row}><Text style={ui.muted}>Показать лимит</Text><Switch value={showLimit} onValueChange={setShowLimit}/></View>
          <Button mode="outlined" compact onPress={() => navigation.navigate('Limits')}>Лимиты</Button>
        </View>}
        {items.map(category => {
          const value = flowTotal(operations, flow, range, category.id);
          const limit = categoryLimit(category, obligations);
          const current = flowTotal(operations, 'expense', period('month'), category.id);
          const exceeded = limit !== null && current > limit;
          return <View key={category.id} style={ui.categoryRow}>
            <View style={ui.row}>
              <Text style={[ui.label, ui.grow]}>{category.name}{!category.active ? ' · удалена' : ''}</Text>
              <Text style={{fontSize: 15, color: value ? colors.secondary : colors.muted}}>{money(value)}</Text>
              {category.active && category.id !== FEE_CATEGORY && <IconButton icon="plus" mode="outlined" size={18} iconColor={colors.primary} style={ui.iconButton} accessibilityLabel={`Добавить: ${category.name}`} onPress={() => navigation.navigate('Operation', {flow, categoryId: category.id})}/>}
            </View>
            {flow === 'expense' && showLimit && <>
              <Text style={[ui.muted, exceeded && {color: colors.red}]}>{limit === null ? 'Лимит не установлен' : `Этот месяц: ${money(current)} / ${money(limit)}${exceeded ? ' · превышение' : ''}`}</Text>
              {limit !== null && <ProgressBar progress={limit > 0 ? Math.min(current / limit, 1) : current > 0 ? 1 : 0} color={exceeded ? colors.red : colors.primary} style={{height: 5, borderRadius: 4, backgroundColor: colors.track}}/>}
            </>}
          </View>;
        })}
        <Button compact onPress={() => navigation.navigate('Categories', {flow})}>Управлять категориями</Button>
      </Card>
      <Text style={ui.section}>История</Text>
      <HistoryList operations={history.slice(0, count)} entryFilter={entry => isFlow(entry, flow)}/>
      {history.length > count && <Button onPress={() => setCount(value => value + 30)}>Показать ещё</Button>}
    </Page>
  </View>;
}

export const IncomeScreen = () => <FlowScreen flow="income"/>;
export const ExpensesScreen = () => <FlowScreen flow="expense"/>;
