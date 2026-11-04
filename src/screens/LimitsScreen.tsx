import React, {useState} from 'react';
import {View} from 'react-native';
import {Text} from 'react-native-paper';
import {Button} from '../components/controls';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import type {Category} from '../data/types';
import {useFinance} from '../data/FinanceProvider';
import {categoryLimit, flowTotal} from '../data/statistics';
import {period} from '../data/dates';
import {money, moneyInput, parseMoney} from '../data/money';
import {obligationCategory} from '../data/constants';
import {saveLimit} from '../data/repository';
import {useAction} from '../data/useAction';
import {Card, ErrorNotice, MoneyField, Page, Sheet} from '../components/common';
import {colors, ui} from '../theme/theme';

export function LimitsScreen({navigation}: NativeStackScreenProps<RootStackParamList, 'Limits'>) {
  const {categories, operations, obligations, user, today} = useFinance();
  const [editing, setEditing] = useState<Category | null>(null);
  const [amount, setAmount] = useState('');
  const action = useAction();
  const now = new Date(`${today}T12:00:00`);
  const current = period('month', now);
  const previous = period('month', new Date(now.getFullYear(), now.getMonth() - 1, 1));
  return <Page>
    <Text style={ui.muted}>Лимиты действуют каждый календарный месяц. Превышение подсвечивается, но не блокирует запись расхода.</Text>
    {categories.filter(category => category.active && category.flow === 'expense').sort((a, b) => a.order - b.order).map(category => {
      const limit = categoryLimit(category, obligations);
      const total = flowTotal(operations, 'expense', current, category.id);
      const auto = category.id === obligationCategory('expense');
      return <Card key={category.id}>
        <Text style={ui.heading}>{category.name}</Text>
        <View style={ui.between}>
          <Text style={[ui.label, ui.grow, {color: limit === null || total > limit ? colors.red : colors.primary}]}>{limit === null ? 'Лимит не установлен' : `Лимит: ${money(limit)}`}</Text>
          <Button mode="outlined" compact onPress={() => {
            if (auto) { navigation.navigate('Obligations'); }
            else { action.clearError(); setEditing(category); setAmount(category.limit === null ? '' : moneyInput(category.limit)); }
          }}>{auto ? 'Обязательства' : limit === null ? 'Установить' : 'Изменить'}</Button>
        </View>
        {auto && <Text style={ui.muted}>Рассчитан автоматически из сумм активных подкатегорий обязательств.</Text>}
        <View style={ui.between}><Text style={ui.muted}>Прошлый месяц</Text><Text style={ui.label}>{money(flowTotal(operations, 'expense', previous, category.id))}</Text></View>
        <View style={ui.between}><Text style={ui.muted}>Текущий месяц</Text><Text style={ui.label}>{money(total)}</Text></View>
      </Card>;
    })}
    <Sheet title={editing?.name ?? 'Лимит'} visible={!!editing} onClose={() => { if (!action.busy) { setEditing(null); } }}>
      <MoneyField label="Ежемесячный лимит, ₸" value={amount} onChange={setAmount} disabled={action.busy}/>
      <ErrorNotice text={action.error}/>
      <Button mode="contained" disabled={action.busy} loading={action.busy} onPress={() => action.run(async () => { if (editing) { await saveLimit(user!.uid, editing.id, parseMoney(amount, true)); setEditing(null); } })}>Сохранить</Button>
      {editing?.limit !== null && <Button disabled={action.busy} onPress={() => action.run(async () => { if (editing) { await saveLimit(user!.uid, editing.id, null); setEditing(null); } })}>Убрать лимит</Button>}
    </Sheet>
  </Page>;
}
