import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {ProgressBar, Text, TouchableRipple} from 'react-native-paper';
import {Button, IconButton, Switch} from '../components/controls';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import type {DateRange, Flow} from '../data/types';
import {useFinance} from '../data/FinanceProvider';
import {period} from '../data/dates';
import {categoryLimit, flowTotal} from '../data/statistics';
import {money} from '../data/money';
import {FEE_CATEGORY} from '../data/constants';
import {AppHeader, Card, Page} from '../components/common';
import {PeriodFilter} from '../components/PeriodFilter';
import {colors, ui} from '../theme/theme';

export function FlowScreen({flow}: {flow: Flow}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {categories, operations, obligations, today} = useFinance();
  const [range, setRange] = useState<DateRange>(() => period('month'));
  const [showLimit, setShowLimit] = useState(false);
  useEffect(() => { setRange(previous => previous.kind === 'custom' ? previous : period(previous.kind)); }, [today]);
  const categoryTotals = new Map(categories.map(category => [category.id, flowTotal(operations, flow, range, category.id)]));
  const items = categories.filter(category => category.flow === flow && (category.active || categoryTotals.get(category.id)! > 0)).sort((a, b) => categoryTotals.get(b.id)! - categoryTotals.get(a.id)! || a.order - b.order || a.id.localeCompare(b.id));
  const total = flowTotal(operations, flow, range);

  return <View style={ui.fill}>
    <AppHeader title="Финансы" addLabel={flow === 'income' ? 'Добавить доход' : 'Добавить расход'} onAdd={() => navigation.navigate('Operation', {flow})}/>
    <Page>
      <PeriodFilter value={range} onChange={setRange}/>
      <View style={ui.between}><Text style={[ui.section, {fontWeight: '400'}]}>{flow === 'expense' ? 'Расходы' : 'Доходы'}</Text><Text style={ui.total}>Итого: {money(total)}</Text></View>
      <Card>
        {flow === 'expense' && <View style={ui.between}>
          <View style={ui.row}><Text style={ui.muted}>Показать лимит</Text><Switch accessibilityLabel="Показать лимиты расходов" value={showLimit} onValueChange={setShowLimit}/></View>
          <Button mode="outlined" compact onPress={() => navigation.navigate('Limits')}>Лимиты</Button>
        </View>}
        {items.map(category => {
          const value = categoryTotals.get(category.id)!;
          const limit = categoryLimit(category, obligations);
          const current = flowTotal(operations, 'expense', period('month'), category.id);
          const exceeded = limit !== null && current > limit;
          return <View key={category.id} style={ui.categoryRow}>
            <View style={ui.row}>
              <TouchableRipple rippleColor="transparent" style={ui.grow} accessibilityRole="button" accessibilityLabel={'История категории ' + category.name} onPress={() => navigation.navigate('History', {categoryId: category.id, flow, range: {...range}})}>
                <View style={[ui.between, {paddingVertical: 5}]}>
                  <Text style={[ui.label, ui.grow]}>{category.name}{!category.active ? ' · удалена' : ''}</Text>
                  <Text style={{fontSize: 14, flexShrink: 1, textAlign: 'right', color: value ? colors.secondary : colors.muted}}>{money(value)}</Text>
                </View>
              </TouchableRipple>
              {category.active && category.id !== FEE_CATEGORY && <IconButton icon="plus" mode="outlined" size={18} iconColor={colors.primary} style={ui.iconButton} accessibilityLabel={`Добавить: ${category.name}`} onPress={() => navigation.navigate('Operation', {flow, categoryId: category.id})}/>}
            </View>
            {flow === 'expense' && showLimit && <>
              <Text style={[ui.muted, exceeded && {color: colors.red}]}>{limit === null ? 'Лимит не установлен' : <>Этот месяц: <Text style={[ui.money, exceeded && {color: colors.red}]}>{money(current)} / {money(limit)}</Text>{exceeded ? ' · превышение' : ''}</>}</Text>
              {limit !== null && <ProgressBar progress={limit > 0 ? Math.min(current / limit, 1) : current > 0 ? 1 : 0} color={exceeded ? colors.red : colors.primary} style={{height: 5, borderRadius: 4, backgroundColor: colors.track}}/>}
            </>}
          </View>;
        })}
        <Button compact onPress={() => navigation.navigate('Categories', {flow})}>Управлять категориями</Button>
      </Card>
    </Page>
  </View>;
}

export const IncomeScreen = () => <FlowScreen flow="income"/>;
export const ExpensesScreen = () => <FlowScreen flow="expense"/>;
