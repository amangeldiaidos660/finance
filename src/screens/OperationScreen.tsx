import React, {useRef, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Appbar, Text} from 'react-native-paper';
import {Button, Chip, TextInput} from '../components/controls';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {useFinance} from '../data/FinanceProvider';
import {newId} from '../data/firebase';
import {saveOperation} from '../data/repository';
import {calculate, money, moneyInput} from '../data/money';
import {FEE_CATEGORY, obligationCategory} from '../data/constants';
import {shortDate} from '../data/dates';
import {useAction} from '../data/useAction';
import {AccountPicker} from '../components/AccountPicker';
import {chooseDate} from '../components/DateButton';
import {ErrorNotice} from '../components/common';
import {colors, ui} from '../theme/theme';

export function OperationScreen({route, navigation}: NativeStackScreenProps<RootStackParamList, 'Operation'>) {
  const {accounts, categories, obligations, completions, settings, today, user} = useFinance();
  const initial = route.params;
  const credit = accounts.find(account => account.id === initial?.targetId && account.kind === 'credit');
  const initialObligation = obligations.find(item => item.id === initial?.obligationId);
  const id = useRef(newId(user!.uid));
  const flow = initial?.flow ?? initialObligation?.flow ?? 'expense';
  const [mode, setMode] = useState<'manual' | 'transfer'>(initial?.kind ? 'transfer' : 'manual');
  const [expression, setExpression] = useState(initialObligation ? moneyInput(initialObligation.amount) : credit ? moneyInput(Math.min(credit.monthlyPayment, credit.balance)) : '');
  const [categoryId, setCategoryId] = useState<string | null>(initialObligation?.categoryId ?? initial?.categoryId ?? null);
  const [obligationId, setObligationId] = useState<string | null>(initial?.obligationId ?? null);
  const [accountId, setAccountId] = useState<string | null>(initial?.accountId ?? credit?.paymentAccountId ?? settings.defaultAccountId);
  const [targetId, setTargetId] = useState<string | null>(initial?.targetId ?? null);
  const [date, setDate] = useState(initial?.date ?? today);
  const [comment, setComment] = useState(initialObligation?.description ?? '');
  const action = useAction();
  const source = accounts.find(account => account.id === accountId && account.active);
  const target = accounts.find(account => account.id === targetId && account.active);
  const activeAccounts = accounts.filter(account => account.active);
  const sourceAccounts = activeAccounts.filter(account => target?.kind === 'credit' && mode === 'transfer' ? account.kind === 'bank' : account.kind !== 'credit');
  const flowCategories = categories.filter(category => category.active && category.flow === flow && category.id !== FEE_CATEGORY).sort((a, b) => a.order - b.order);
  const selectedCategory = flowCategories.find(category => category.id === categoryId);
  const rootCategoryId = selectedCategory?.parentId ?? categoryId;
  const subcategories = flowCategories.filter(category => category.parentId === rootCategoryId);
  const choices = obligations.filter(item => item.active && item.flow === flow);
  const keypad = [['−', '+', '×', '÷'], ['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['.', '0', '⌫']];

  const key = (value: string) => {
    action.clearError();
    const mapped: Record<string, string> = {'−': '-', '×': '*', '÷': '/'};
    if (value === '⌫') { setExpression(text => text.slice(0, -1)); return; }
    const next = mapped[value] ?? value;
    setExpression(text => {
      if (text.length >= 40) { return text; }
      if ('+-*/'.includes(next)) { return !text ? text : /[+\-*/]$/.test(text) ? text.slice(0, -1) + next : text + next; }
      const last = text.split(/[+\-*/]/).pop() ?? '';
      if (next === '.' && last.includes('.')) { return text; }
      if (last.includes('.') && (last.split('.')[1]?.length ?? 0) >= 2) { return text; }
      return text + (next === '.' && !last ? '0.' : next);
    });
  };

  const save = () => action.run(async () => {
    await saveOperation(user!.uid, {
      id: id.current,
      kind: mode === 'manual' ? flow : target?.kind === 'credit' ? 'repayment' : 'transfer',
      amount: calculate(expression), date, accountId: accountId ?? '',
      targetId: mode === 'transfer' ? targetId : null,
      categoryId: mode === 'manual' ? categoryId : null,
      obligationId: mode === 'manual' ? obligationId : null,
      comment,
    });
    navigation.goBack();
  });

  return <SafeAreaView style={ui.fill} edges={['top', 'bottom']}>
    <Appbar style={[ui.header, styles.header]}><Appbar.Action rippleColor="transparent" icon="close" color={colors.primary} disabled={action.busy} onPress={() => navigation.goBack()} accessibilityLabel="Закрыть"/><Appbar.Content title={initial?.kind === 'repayment' ? 'Погашение кредита' : flow === 'income' ? 'Пополнение' : 'Расход'} titleStyle={[ui.headerTitle, styles.headerTitle]}/></Appbar>
    <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
      <Text style={styles.expression} accessibilityLiveRegion="polite">{expression || '0,00'}<Text style={styles.currency}> ₸</Text></Text>
      {initial?.kind !== 'repayment' && <View style={ui.wrap}>
        <Chip textStyle={styles.chipText} selected={mode === 'manual'} showSelectedCheck={false} disabled={action.busy} style={[ui.chip, mode === 'manual' && ui.chipSelected]} onPress={() => { setMode('manual'); action.clearError(); }}>{flow === 'income' ? 'Ручное пополнение' : 'Ручной расход'}</Chip>
        <Chip textStyle={styles.chipText} selected={mode === 'transfer'} showSelectedCheck={false} disabled={action.busy} style={[ui.chip, mode === 'transfer' && ui.chipSelected]} onPress={() => { setMode('transfer'); action.clearError(); }}>Между своими счетами</Chip>
      </View>}
      {mode === 'manual' ? <>
        <Text style={ui.muted}>Категория</Text>
        <View style={styles.chips}>{flowCategories.filter(category => !category.parentId).map(category => <Chip key={category.id} disabled={action.busy} selected={category.id === rootCategoryId} showSelectedCheck={false} style={[ui.chip, category.id === rootCategoryId && {backgroundColor: colors.primary}]} textStyle={[styles.chipText, {color: category.id === rootCategoryId ? '#FFFFFF' : colors.secondary}]} onPress={() => { setCategoryId(category.id); setObligationId(null); action.clearError(); }}>{category.name}</Chip>)}</View>
        {!!subcategories.length && <>
          <Text style={ui.muted}>Подкатегория</Text>
          <View style={styles.chips}>
            <Chip disabled={action.busy} selected={categoryId === rootCategoryId} onPress={() => { setCategoryId(rootCategoryId); action.clearError(); }}>Без подкатегории</Chip>
            {subcategories.map(category => <Chip key={category.id} disabled={action.busy} selected={categoryId === category.id} onPress={() => { setCategoryId(category.id); setObligationId(null); action.clearError(); }}>{category.name}</Chip>)}
          </View>
        </>}
        {categoryId === obligationCategory(flow) && <>
          <Text style={ui.muted}>Обязательство · {date.slice(0, 7)}</Text>
          <View style={ui.wrap}>{choices.map(item => {
            const done = completions.some(completion => completion.obligationId === item.id && completion.month === date.slice(0, 7));
            return <Chip textStyle={styles.chipText} key={item.id} disabled={done || action.busy} selected={item.id === obligationId} icon={done ? 'check' : undefined} style={[ui.chip, item.id === obligationId && ui.chipSelected]} onPress={() => { setObligationId(item.id); setExpression(moneyInput(item.amount)); setComment(item.description); action.clearError(); }}>{item.name}{done ? ' · выполнено' : ''}</Chip>;
          })}</View>
          {!choices.length && <Button contentStyle={styles.buttonContent} labelStyle={styles.buttonLabel} onPress={() => navigation.navigate('Obligations')}>Создать обязательство</Button>}
        </>}
      </> : <>
        <Text style={ui.muted}>Откуда списать</Text>
        <AccountPicker contentStyle={styles.buttonContent} labelStyle={styles.buttonLabel} accounts={sourceAccounts} value={accountId} onChange={setAccountId} disabled={action.busy}/>
        <Text style={ui.muted}>Куда зачислить</Text>
        <AccountPicker contentStyle={styles.buttonContent} labelStyle={styles.buttonLabel} accounts={activeAccounts.filter(account => account.id !== accountId && (initial?.kind !== 'repayment' || account.kind === 'credit'))} value={targetId} onChange={setTargetId} label="Счёт или кредит" disabled={action.busy}/>
        <Text style={ui.muted}>Комиссия: <Text style={ui.money}>{money(source?.fee ?? 0)}</Text>. Списывается дополнительно со счёта отправителя.</Text>
        {target?.kind === 'credit' && <Text style={ui.muted}>Остаток долга: <Text style={ui.money}>{money(target.balance)}</Text>. Сумма платежа уменьшит долг.</Text>}
      </>}
      <TextInput mode="flat" dense={false} placeholder="Комментарий" accessibilityLabel="Комментарий к операции" value={comment} onChangeText={setComment} maxLength={300} disabled={action.busy} style={[ui.field, styles.commentField]}/>
    </ScrollView>
    <View style={styles.keyboard}>
      <ErrorNotice text={action.error}/>
      {keypad.map((row, index) => <View style={styles.keyRow} key={index}>
        {row.map(value => <Button key={value} mode="contained" buttonColor={colors.surface} textColor={colors.secondary} disabled={action.busy} style={styles.key} contentStyle={styles.keyContent} labelStyle={styles.keyText} onPress={() => key(value)} onLongPress={value === '⌫' ? () => setExpression('') : undefined} accessibilityLabel={value === '⌫' ? 'Удалить цифру; удерживайте, чтобы очистить' : value}>{value}</Button>)}
        {index === 1 && <Button mode="contained" disabled={action.busy} buttonColor={colors.track} textColor={colors.text} style={styles.key} contentStyle={styles.keyContent} labelStyle={styles.sideText} onPress={() => chooseDate(date, setDate, new Date())}>{shortDate(date)}</Button>}
        {index === 2 && <View style={[styles.key, styles.accountKey]}><AccountPicker accounts={sourceAccounts} value={accountId} onChange={setAccountId} label="Счёт" compact contentStyle={styles.keyContent} labelStyle={styles.sideText} disabled={action.busy}/></View>}
        {index === 3 && <Button mode="contained" buttonColor={colors.surface} textColor={colors.primary} disabled={action.busy} style={styles.key} contentStyle={styles.keyContent} labelStyle={styles.keyText} onPress={() => action.run(async () => setExpression(moneyInput(calculate(expression))))}>=</Button>}
        {index === 4 && <Button mode="contained" disabled={action.busy} loading={action.busy} buttonColor={colors.primary} style={styles.key} contentStyle={styles.keyContent} labelStyle={styles.keyText} onPress={save} accessibilityLabel="Сохранить операцию">✓</Button>}
      </View>)}
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  header: {height: 64, paddingRight: 10},
  headerTitle: {fontSize: 25, lineHeight: 32, fontWeight: '700'},
  form: {padding: 16, gap: 20, paddingBottom: 20},
  commentField: {fontSize: 16, lineHeight: 24},
  chipText: {fontSize: 14, fontWeight: '600', marginVertical: 10},
  buttonContent: {minHeight: 46},
  buttonLabel: {fontSize: 14, fontWeight: '700'},
  expression: {fontSize: 44, lineHeight: 54, color: colors.text, fontWeight: '700', textAlign: 'center', paddingVertical: 22, fontVariant: ['tabular-nums']},
  currency: {fontSize: 24, lineHeight: 30, color: colors.muted},
  chips: {flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8},
  keyboard: {padding: 8, gap: 6, backgroundColor: colors.background},
  keyRow: {flexDirection: 'row', gap: 6},
  key: {flex: 1, borderRadius: 15, minWidth: 0, elevation: 0, shadowOpacity: 0},
  keyContent: {height: 48, minHeight: 48},
  keyText: {fontSize: 25, lineHeight: 30, marginVertical: 6, marginHorizontal: 0, fontWeight: '600'},
  sideText: {fontSize: 11, marginHorizontal: 0, fontWeight: '700'},
  accountKey: {justifyContent: 'center', backgroundColor: colors.surface},
});
