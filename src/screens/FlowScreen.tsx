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
import {categoryGroups, categoryLimit, flowTotal, type CategoryGroup} from '../data/statistics';
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
  const groups = categoryGroups(operations, flow, range);
  const total = flowTotal(operations, flow, range);
  const renderGroup = (group: CategoryGroup, child = false): React.ReactNode => {
    const category = categories.find(item => item.id === group.scope.id);
    const parent = categories.find(item => item.id === category?.parentId);
    const currentPlacement = category?.active && category.name === group.scope.name && (category.parentId ?? null) === group.scope.parentId && (parent?.name ?? '') === group.scope.parentName;
    const limit = category ? categoryLimit(category, obligations) : null;
    const current = flowTotal(operations, 'expense', period('month'), group.scope.id);
    const exceeded = limit !== null && current > limit;
    return <View key={group.key} style={[ui.categoryRow, child && {marginLeft: 16}]}>
      <View style={ui.row}>
        <TouchableRipple rippleColor="transparent" style={ui.grow} accessibilityRole="button" accessibilityLabel={'История категории ' + group.scope.name} onPress={() => navigation.navigate('History', {categoryScope: group.scope, flow, range: {...range}})}>
          <View style={[ui.between, {paddingVertical: 5}]}><Text style={[ui.label, ui.grow]}>{child ? '↳ ' : ''}{group.scope.name}</Text><Text style={{fontSize: 14, color: colors.secondary}}>{money(group.value)}</Text></View>
        </TouchableRipple>
        {currentPlacement && category.id !== FEE_CATEGORY && <IconButton icon="plus" mode="outlined" size={18} iconColor={colors.primary} style={ui.iconButton} accessibilityLabel={`Добавить: ${category.name}`} onPress={() => navigation.navigate('Operation', {flow, categoryId: category.id})}/>}
      </View>
      {flow === 'expense' && showLimit && currentPlacement && <>
        <Text style={[ui.muted, exceeded && {color: colors.red}]}>{limit === null ? 'Лимит не установлен' : <>Этот месяц: <Text style={ui.money}>{money(current)} / {money(limit)}</Text>{exceeded ? ' · превышение' : ''}</>}</Text>
        {limit !== null && <ProgressBar progress={limit > 0 ? Math.min(current / limit, 1) : current > 0 ? 1 : 0} color={exceeded ? colors.red : colors.primary} style={{height: 5, borderRadius: 4, backgroundColor: colors.track}}/>}
      </>}
      {!!group.children.length && group.direct > 0 && <Button compact onPress={() => navigation.navigate('History', {categoryScope: {...group.scope, branch: false}, flow, range: {...range}})}>Без подкатегории: {money(group.direct)}</Button>}
      {group.children.map(item => renderGroup(item, true))}
    </View>;
  };

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
        {!groups.length && <Text style={ui.muted}>За выбранный период операций нет.</Text>}
        {groups.map(group => renderGroup(group))}
        <Button compact onPress={() => navigation.navigate('Categories', {flow})}>Управлять категориями</Button>
      </Card>
    </Page>
  </View>;
}

export const IncomeScreen = () => <FlowScreen flow="income"/>;
export const ExpensesScreen = () => <FlowScreen flow="expense"/>;
