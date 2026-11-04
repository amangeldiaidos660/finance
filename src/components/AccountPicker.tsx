import React, {useState} from 'react';
import {List, RadioButton, Text} from 'react-native-paper';
import {Button} from './controls';
import type {Account} from '../data/types';
import {money} from '../data/money';
import {Sheet} from './common';
import {ui} from '../theme/theme';

export function AccountPicker({accounts, value, onChange, label = 'Выберите счёт', allowAsk = false, disabled = false, compact = false}: {accounts: Account[]; value: string | null; onChange: (id: string | null) => void; label?: string; allowAsk?: boolean; disabled?: boolean; compact?: boolean}) {
  const [open, setOpen] = useState(false);
  const selected = accounts.find(account => account.id === value);
  const choose = (id: string | null) => { onChange(id); setOpen(false); };
  return <>
    <Button mode="outlined" compact={compact} style={compact ? {width: '100%'} : undefined} labelStyle={compact ? {fontSize: 11, marginHorizontal: 2} : undefined} icon={compact ? undefined : "wallet-outline"} onPress={() => setOpen(true)} disabled={disabled}>{selected?.name ?? (allowAsk ? 'Спрашивать каждый раз' : label)}</Button>
    <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
      {allowAsk && <List.Item style={ui.listItem} titleStyle={ui.listTitle} descriptionStyle={ui.listDescription} title="Спрашивать каждый раз" onPress={() => choose(null)} right={() => <RadioButton status={value === null ? 'checked' : 'unchecked'} onPress={() => choose(null)}/>}/>}
      {accounts.map(account => <List.Item style={ui.listItem} titleStyle={ui.listTitle} descriptionStyle={ui.listDescription} key={account.id} title={account.name} description={money(account.balance)} onPress={() => choose(account.id)} right={() => <RadioButton status={value === account.id ? 'checked' : 'unchecked'} onPress={() => choose(account.id)}/>}/>)}
      {!accounts.length && <Text style={ui.muted}>Подходящих счетов пока нет. Сначала создайте счёт на странице «Счета».</Text>}
    </Sheet>
  </>;
}
