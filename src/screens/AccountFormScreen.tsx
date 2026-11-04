import React, {useRef, useState} from 'react';
import {Button, SegmentedButtons, Text, TextInput} from 'react-native-paper';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {useFinance} from '../data/FinanceProvider';
import {newId} from '../data/firebase';
import {createAccount, updateAccount} from '../data/repository';
import {moneyInput, parseMoney} from '../data/money';
import {useAction} from '../data/useAction';
import type {AccountKind} from '../data/types';
import {Card, ErrorNotice, MoneyField, Page} from '../components/common';
import {AccountPicker} from '../components/AccountPicker';
import {ui} from '../theme/theme';

export function AccountFormScreen({route, navigation}: NativeStackScreenProps<RootStackParamList, 'AccountForm'>) {
  const {accounts, settings, user} = useFinance();
  const existing = accounts.find(account => account.id === route.params?.id);
  const id = useRef(existing?.id ?? newId(user!.uid));
  const [kind, setKind] = useState<AccountKind>(existing?.kind ?? 'bank');
  const [name, setName] = useState(existing?.name ?? '');
  const [balance, setBalance] = useState(existing ? moneyInput(existing.openingBalance) : '');
  const [fee, setFee] = useState(moneyInput(existing?.fee ?? 0));
  const [monthly, setMonthly] = useState(existing ? moneyInput(existing.monthlyPayment) : '');
  const [day, setDay] = useState(String(existing?.paymentDay ?? 1));
  const [source, setSource] = useState<string | null>(existing?.paymentAccountId ?? null);
  const action = useAction();
  const save = () => action.run(async () => {
    const input = {id: id.current, kind, name, openingBalance: existing?.openingBalance ?? parseMoney(balance || '0', kind !== 'credit'), fee: kind === 'credit' ? 0 : parseMoney(fee || '0', true), monthlyPayment: kind === 'credit' ? parseMoney(monthly) : 0, paymentDay: Number(day), paymentAccountId: source};
    if (existing) { await updateAccount(user!.uid, existing.id, input); }
    else { await createAccount(user!.uid, input); }
    navigation.goBack();
  });

  return <Page>
    {!existing && <SegmentedButtons value={kind} onValueChange={value => setKind(value as AccountKind)} buttons={[{value: 'bank', label: 'Счёт', disabled: action.busy}, {value: 'deposit', label: 'Депозит', disabled: action.busy}, {value: 'credit', label: 'Кредит', disabled: action.busy}]}/>}
    <Card>
      {kind === 'credit' ? <Text style={ui.heading}>{existing?.name ?? `Кредит ${settings.nextCreditNumber}`}</Text> : <TextInput mode="outlined" label="Название счёта" value={name} onChangeText={setName} maxLength={80} disabled={action.busy} style={ui.field}/>}
      {!existing && <MoneyField label={kind === 'credit' ? 'Оставшийся долг, ₸' : 'Начальная сумма, ₸'} value={balance} onChange={setBalance} disabled={action.busy}/>}
      {existing && <Text style={ui.muted}>Остаток изменяется только операциями. Начальную сумму после создания редактировать нельзя.</Text>}
      {kind !== 'credit' && <><MoneyField label="Комиссия за исходящий перевод, ₸" value={fee} onChange={setFee} disabled={action.busy}/><Text style={ui.muted}>0 — без комиссии. Комиссия списывается дополнительно к сумме перевода.</Text></>}
      {kind === 'credit' && <>
        <MoneyField label="Ежемесячный платёж, ₸" value={monthly} onChange={setMonthly} disabled={action.busy}/>
        <TextInput mode="outlined" label="Число платежа (1–31)" keyboardType="number-pad" value={day} onChangeText={setDay} maxLength={2} disabled={action.busy} style={ui.field}/>
        <Text style={ui.muted}>Если такого числа в месяце нет, показываем последний день месяца. Автоматического списания нет.</Text>
        <AccountPicker accounts={accounts.filter(account => account.active && account.kind === 'bank')} value={source} onChange={setSource} label="Счёт погашения" disabled={action.busy}/>
        <Text style={ui.muted}>При каждом погашении можно выбрать другой счёт. Проценты отдельно не рассчитываются.</Text>
      </>}
    </Card>
    <ErrorNotice text={action.error}/>
    <Button mode="contained" loading={action.busy} disabled={action.busy} onPress={save}>Сохранить</Button>
  </Page>;
}
