import React, {useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Icon, Text} from 'react-native-paper';
import {Button, IconButton, SegmentedButtons, TextInput} from '../components/controls';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import type {Flow, Obligation} from '../data/types';
import {useFinance} from '../data/FinanceProvider';
import {newId} from '../data/firebase';
import {archiveObligation, saveObligation} from '../data/repository';
import {money, moneyInput, parseMoney} from '../data/money';
import {useAction} from '../data/useAction';
import {AppHeader, Card, EmptyState, ErrorNotice, MoneyField, Page, Sheet, Tabs} from '../components/common';
import {colors, ui} from '../theme/theme';
import {financeIcon} from '../theme/presentation';
import {fromDateKey} from '../data/dates';

export function ObligationsScreen({navigation}: NativeStackScreenProps<RootStackParamList, 'Obligations'>) {
  const {obligations, completions, user, today} = useFinance();
  const [flow, setFlow] = useState<Flow>('expense');
  const [formFlow, setFormFlow] = useState<Flow>('expense');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Obligation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const id = useRef('');
  const action = useAction();
  const month = today.slice(0, 7);
  const monthDate = fromDateKey(today);
  const monthName = monthDate.toLocaleDateString('ru-RU', {month: 'long'});
  const monthTitle = monthName.charAt(0).toUpperCase() + monthName.slice(1) + ' ' + monthDate.getFullYear();
  const items = obligations.filter(item => item.active && item.flow === flow).sort((a, b) => a.createdAt - b.createdAt);
  const done = (item: Obligation) => completions.some(completion => completion.month === month && completion.obligationId === item.id);
  const begin = (item: Obligation | null) => {
    id.current = item?.id ?? newId(user!.uid); setEditing(item); setDeleting(false);
    setName(item?.name ?? ''); setDescription(item?.description ?? ''); setAmount(item ? moneyInput(item.amount) : '');
    setFormFlow(item?.flow ?? flow); action.clearError(); setOpen(true);
  };
  return <View style={ui.fill}>
    <AppHeader title="Обязательства" back addLabel="Добавить обязательство" onAdd={() => begin(null)}/>
    <Page>
      <Tabs segmented value={flow} onChange={setFlow} items={[{value: 'expense', label: 'Расходы'}, {value: 'income', label: 'Доходы'}]}/>
      <Card decorated accentPosition="top">
        <Text style={[ui.heading, styles.monthTitle]}>{monthTitle}</Text>
        <View style={ui.between}><Text style={[ui.label, ui.grow]}>На месяц</Text><Text style={ui.total}>{money(items.reduce((sum, item) => sum + item.amount, 0))}</Text></View>
        <View style={ui.between}><Text style={[ui.muted, ui.grow]}>Осталось по плану</Text><Text style={ui.total}>{money(items.filter(item => !done(item)).reduce((sum, item) => sum + item.amount, 0))}</Text></View>
      </Card>
      {!items.length && <EmptyState icon="calendar-check-outline" title="Нет обязательств" detail="Добавьте аренду, тариф или другой ежемесячный доход либо расход."/>}
      {items.map(item => <Card key={item.id}>
        <View style={ui.between}><Icon source={financeIcon(item.name, 'calendar-check-outline')} size={26} color={colors.primary}/><Text style={[ui.heading, ui.grow]}>{item.name}</Text><IconButton icon="dots-vertical" accessibilityLabel={'Изменить ' + item.name} onPress={() => begin(item)}/></View>
        {!!item.description && <Text style={ui.label}>{item.description}</Text>}
        <View style={styles.payment}><Text style={[ui.total, styles.amount]}>{money(item.amount)}</Text><Button mode="contained" icon={done(item) ? 'check' : undefined} disabled={done(item)} onPress={() => navigation.navigate('Operation', {flow: item.flow, obligationId: item.id, categoryId: item.categoryId})}>{done(item) ? 'Выполнено' : flow === 'expense' ? 'Оплатить' : 'Получить'}</Button></View>
        <Text style={ui.muted}>Обязательства / {item.name} · {month}</Text>
      </Card>)}
      <Text style={ui.muted}>Каждое обязательство выполняется один раз в месяц. В следующем месяце оно снова доступно. Дата берётся из записанной операции.</Text>
    </Page>
    <Sheet title={deleting ? 'Удалить обязательство?' : editing ? 'Изменить обязательство' : 'Новое обязательство'} visible={open} onClose={() => { if (!action.busy) { setOpen(false); } }}>
      {deleting ? <Text style={ui.label}>«{editing?.name}» больше не будет появляться в следующих месяцах. Сохранённые операции останутся в истории. Автоматический лимит будет пересчитан.</Text> : <>
        <TextInput mode="flat" label="Название подкатегории" placeholder="Например, аренда" value={name} onChangeText={setName} maxLength={80} disabled={action.busy} style={ui.field}/>
        <MoneyField value={amount} onChange={setAmount} disabled={action.busy}/>
        <TextInput mode="flat" label="Описание" value={description} onChangeText={setDescription} maxLength={300} disabled={action.busy} style={ui.field}/>
        <SegmentedButtons value={formFlow} onValueChange={value => setFormFlow(value as Flow)} buttons={[{value: 'expense', label: 'Расход', disabled: !!editing || action.busy}, {value: 'income', label: 'Доход', disabled: !!editing || action.busy}]}/>
      </>}
      <ErrorNotice text={action.error}/>
      <Button mode="contained" disabled={action.busy} loading={action.busy} onPress={() => action.run(async () => {
        if (deleting) { await archiveObligation(user!.uid, id.current); }
        else { await saveObligation(user!.uid, {id: id.current, name, description, flow: formFlow, amount: parseMoney(amount)}); }
        setOpen(false);
      })}>{deleting ? 'Удалить' : 'Сохранить'}</Button>
      {!!editing && !deleting && <Button textColor={colors.red} disabled={action.busy} onPress={() => { action.clearError(); setDeleting(true); }}>Удалить обязательство</Button>}
    </Sheet>
  </View>;
}

const styles = StyleSheet.create({
  monthTitle: {minHeight: 48, paddingTop: 4},
  payment: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingVertical: 4},
  amount: {textAlign: 'left', fontSize: 14},
});
