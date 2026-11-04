import React, {useRef, useState} from 'react';
import {View} from 'react-native';
import {Button, FAB, IconButton, SegmentedButtons, Text, TextInput} from 'react-native-paper';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import type {Flow, Obligation} from '../data/types';
import {useFinance} from '../data/FinanceProvider';
import {newId} from '../data/firebase';
import {archiveObligation, saveObligation} from '../data/repository';
import {money, moneyInput, parseMoney} from '../data/money';
import {useAction} from '../data/useAction';
import {Card, EmptyState, ErrorNotice, MoneyField, Page, Sheet, Tabs} from '../components/common';
import {colors, ui} from '../theme/theme';

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
  const items = obligations.filter(item => item.active && item.flow === flow).sort((a, b) => a.createdAt - b.createdAt);
  const done = (item: Obligation) => completions.some(completion => completion.month === month && completion.obligationId === item.id);
  const begin = (item: Obligation | null) => {
    id.current = item?.id ?? newId(user!.uid); setEditing(item); setDeleting(false);
    setName(item?.name ?? ''); setDescription(item?.description ?? ''); setAmount(item ? moneyInput(item.amount) : '');
    setFormFlow(item?.flow ?? flow); action.clearError(); setOpen(true);
  };
  return <View style={ui.fill}>
    <Page>
      <Tabs value={flow} onChange={setFlow} items={[{value: 'expense', label: 'Расходы'}, {value: 'income', label: 'Доходы'}]}/>
      <Text style={ui.muted}>Каждое обязательство выполняется один раз в месяц. В следующем месяце оно снова доступно. Дата берётся из записанной операции.</Text>
      <Card><View style={ui.between}><Text style={ui.label}>На месяц</Text><Text style={ui.total}>{money(items.reduce((sum, item) => sum + item.amount, 0))}</Text></View><View style={ui.between}><Text style={ui.muted}>Осталось по плану</Text><Text style={ui.label}>{money(items.filter(item => !done(item)).reduce((sum, item) => sum + item.amount, 0))}</Text></View></Card>
      {!items.length && <EmptyState icon="calendar-check-outline" title="Нет обязательств" detail="Добавьте аренду, тариф или другой ежемесячный доход либо расход."/>}
      {items.map(item => <Card key={item.id}>
        <View style={ui.between}><Text style={[ui.heading, ui.grow]}>{item.name}</Text><IconButton icon="dots-vertical" accessibilityLabel={`Изменить ${item.name}`} onPress={() => begin(item)}/></View>
        {!!item.description && <Text style={ui.label}>{item.description}</Text>}
        <View style={ui.between}><Text style={ui.total}>{money(item.amount)}</Text><Button icon={done(item) ? 'check' : 'plus'} disabled={done(item)} onPress={() => navigation.navigate('Operation', {flow: item.flow, obligationId: item.id, categoryId: item.categoryId})}>{done(item) ? 'Выполнено' : flow === 'expense' ? 'Оплатить' : 'Получить'}</Button></View>
        <Text style={ui.muted}>Обязательства / {item.name} · {month}</Text>
      </Card>)}
    </Page>
    <FAB icon="plus" color="#FFFFFF" style={ui.fab} accessibilityLabel="Добавить обязательство" onPress={() => begin(null)}/>
    <Sheet title={deleting ? 'Удалить обязательство?' : editing ? 'Изменить обязательство' : 'Новое обязательство'} visible={open} onClose={() => { if (!action.busy) { setOpen(false); } }}>
      {deleting ? <Text style={ui.label}>«{editing?.name}» больше не будет появляться в следующих месяцах. Сохранённые операции останутся в истории. Автоматический лимит будет пересчитан.</Text> : <>
        <TextInput mode="outlined" label="Название подкатегории" placeholder="Например, аренда" value={name} onChangeText={setName} maxLength={80} disabled={action.busy} style={ui.field}/>
        <MoneyField value={amount} onChange={setAmount} disabled={action.busy}/>
        <TextInput mode="outlined" label="Описание" value={description} onChangeText={setDescription} maxLength={300} disabled={action.busy} style={ui.field}/>
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
