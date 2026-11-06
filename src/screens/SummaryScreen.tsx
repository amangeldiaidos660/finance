import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Icon, Text, TouchableRipple} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import type {DateRange, Flow} from '../data/types';
import {useFinance} from '../data/FinanceProvider';
import {dateKey, fromDateKey} from '../data/dates';
import {flowTotal} from '../data/statistics';
import {money} from '../data/money';
import {AppHeader, Card, Page, Sheet} from '../components/common';
import {Button, IconButton} from '../components/controls';
import {chooseDate} from '../components/DateButton';
import {HistoryList} from '../components/HistoryList';
import {colors, ui} from '../theme/theme';

function operationCount(value: number): string {
  const last = value % 10;
  const teen = value % 100 >= 11 && value % 100 <= 14;
  return value + ' ' + (teen ? 'операций' : last === 1 ? 'операция' : last >= 2 && last <= 4 ? 'операции' : 'операций');
}

export function SummaryScreen() {
  const {operations, today} = useFinance();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [menu, setMenu] = useState<Flow | 'add' | null>(null);
  const [count, setCount] = useState(40);
  const date = selectedDate ?? today;
  const range: DateRange = {kind: 'custom', start: date, end: date};
  const dailyOperations = operations.filter(operation => operation.date === date).sort((a, b) => b.createdAt - a.createdAt);
  const income = flowTotal(dailyOperations, 'income', range);
  const expense = flowTotal(dailyOperations, 'expense', range);
  const total = income - expense;
  const calendarDate = fromDateKey(date);
  const dayLabel = calendarDate.toLocaleDateString('ru-RU', {weekday: 'long', day: 'numeric', month: 'long', ...(date.slice(0, 4) !== today.slice(0, 4) ? {year: 'numeric' as const} : {})});
  const selectDay = (next: string) => {
    if (next < '1900-01-01' || next > today) { return; }
    setSelectedDate(next === today ? null : next);
    setCount(40);
  };
  const changeDay = (offset: number) => {
    const next = fromDateKey(date);
    next.setDate(next.getDate() + offset);
    selectDay(dateKey(next));
  };
  const openHistory = (flow: Flow) => {
    setMenu(null);
    navigation.navigate('History', {flow, range});
  };
  const addOperation = (flow: Flow, transfer = false) => {
    setMenu(null);
    navigation.navigate('Operation', {flow, date, ...(transfer ? {kind: 'transfer' as const} : {})});
  };

  return <View style={ui.fill}>
    <AppHeader title="Сводка дня" addLabel="Добавить операцию" onAdd={() => setMenu('add')}/>
    <Page>
      <Card style={styles.dateCard}>
        <IconButton icon="chevron-left" iconColor={colors.primary} size={22} disabled={date <= '1900-01-01'} accessibilityLabel="Предыдущий день" onPress={() => changeDay(-1)}/>
        <TouchableRipple rippleColor="transparent" style={ui.grow} accessibilityRole="button" accessibilityLabel="Выбрать дату сводки" onPress={() => chooseDate(date, selectDay, fromDateKey(today))}>
          <View style={styles.dateLabel}><Icon source="calendar-month-outline" color={colors.primary} size={24}/><Text style={[ui.label, styles.dayText]}>{dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}</Text></View>
        </TouchableRipple>
        <IconButton icon="chevron-right" iconColor={colors.primary} size={22} disabled={date >= today} accessibilityLabel="Следующий день" onPress={() => changeDay(1)}/>
      </Card>
      <Card decorated>
        <Text style={ui.heading}>Итог дня</Text>
        <Text style={[styles.amount, {color: total < 0 ? colors.red : total > 0 ? colors.green : colors.primary}]}>{total < 0 ? '−' : total > 0 ? '+' : ''}{money(Math.abs(total))}</Text>
        <Text style={ui.muted}>{operationCount(dailyOperations.length)}</Text>
      </Card>
      <View style={styles.cards}>
        {([{flow: 'income', title: 'Доходы', icon: 'tray-arrow-down', value: income, color: colors.green}, {flow: 'expense', title: 'Расходы', icon: 'tray-arrow-up', value: expense, color: colors.red}] as const).map(item => <Card key={item.flow} style={styles.flowCard}>
          <TouchableRipple rippleColor="transparent" style={styles.cardLink} accessibilityRole="button" accessibilityLabel={item.title + ' за выбранный день'} onPress={() => openHistory(item.flow)}>
            <View style={styles.cardContent}><Icon source={item.icon} color={colors.primary} size={24}/><Text style={ui.label}>{item.title}</Text><Text style={[styles.amount, {color: item.color}]}>{money(item.value)}</Text></View>
          </TouchableRipple>
          <View style={styles.cardMenu}><IconButton icon="dots-vertical" size={20} accessibilityLabel={'Действия: ' + item.title} onPress={() => setMenu(item.flow)}/></View>
        </Card>)}
      </View>
      <View style={styles.historyHeading}><Text style={[ui.heading, ui.grow]}>Операции за день</Text><Button compact onPress={() => navigation.navigate('History')}>Вся история</Button></View>
      <HistoryList operations={dailyOperations.slice(0, count)} showDate={false}/>
      {dailyOperations.length > count && <Button onPress={() => setCount(value => value + 40)}>Показать ещё</Button>}
      <Button mode="outlined" style={styles.addButton} onPress={() => setMenu('add')}>Добавить операцию</Button>
    </Page>
    <Sheet title={menu === 'income' ? 'Доходы за день' : menu === 'expense' ? 'Расходы за день' : 'Добавить операцию'} visible={menu !== null} onClose={() => setMenu(null)}>
      {menu === 'add' ? <>
        <Button mode="outlined" icon="arrow-bottom-left" onPress={() => addOperation('income')}>Добавить доход</Button>
        <Button mode="outlined" icon="arrow-top-right" onPress={() => addOperation('expense')}>Добавить расход</Button>
        <Button mode="outlined" icon="bank-transfer" onPress={() => addOperation('expense', true)}>Перевод между счетами</Button>
      </> : menu && <>
        <Button mode="outlined" icon="plus" onPress={() => addOperation(menu)}>{menu === 'income' ? 'Добавить доход' : 'Добавить расход'}</Button>
        <Button mode="outlined" icon="history" onPress={() => openHistory(menu)}>История за выбранный день</Button>
      </>}
    </Sheet>
  </View>;
}

const styles = StyleSheet.create({
  dateCard: {flexDirection: 'row', alignItems: 'center', padding: 4, gap: 4},
  dateLabel: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8},
  dayText: {flexShrink: 1, color: colors.text, textAlign: 'center'},
  amount: {fontSize: 14, lineHeight: 20, fontWeight: '700', fontVariant: ['tabular-nums']},
  cards: {flexDirection: 'row', gap: 12, alignItems: 'stretch'},
  flowCard: {flex: 1, minWidth: 0, padding: 0, gap: 0},
  cardLink: {flex: 1, borderRadius: 24, overflow: 'hidden'},
  cardContent: {padding: 12, minHeight: 100, gap: 6},
  cardMenu: {position: 'absolute', top: 4, right: 4},
  historyHeading: {flexDirection: 'row', alignItems: 'center', gap: 8},
  addButton: {alignSelf: 'center', borderWidth: 1, borderColor: colors.primary, marginTop: 4},
});
