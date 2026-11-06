import React, {useState} from 'react';
import {Icon, List, Text} from 'react-native-paper';
import {Button} from './controls';
import type {Account} from '../data/types';
import {money} from '../data/money';
import {Sheet} from './common';
import {colors, ui} from '../theme/theme';

export function AccountPicker({accounts, value, onChange, label = 'Выберите счёт', allowAsk = false, disabled = false, compact = false, labelStyle, contentStyle}: {accounts: Account[]; value: string | null; onChange: (id: string | null) => void; label?: string; allowAsk?: boolean; disabled?: boolean; compact?: boolean; labelStyle?: React.ComponentProps<typeof Button>['labelStyle']; contentStyle?: React.ComponentProps<typeof Button>['contentStyle']}) {
  const [open, setOpen] = useState(false);
  const selected = accounts.find(account => account.id === value);
  const choose = (id: string | null) => { onChange(id); setOpen(false); };
  return <>
    <Button mode="outlined" compact={compact} style={compact ? {width: '100%'} : undefined} contentStyle={contentStyle} labelStyle={[compact ? {fontSize: 14, marginHorizontal: 2} : undefined, labelStyle]} icon={compact ? undefined : "wallet-outline"} onPress={() => setOpen(true)} disabled={disabled}>{selected?.name ?? (allowAsk ? 'Спрашивать каждый раз' : label)}</Button>
    <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
      {allowAsk && <List.Item rippleColor="transparent" style={ui.listItem} titleStyle={ui.listTitle} descriptionStyle={ui.listDescription} accessibilityRole="radio" accessibilityState={{checked: value === null}} title="Спрашивать каждый раз" onPress={() => choose(null)} right={() => <Icon source={value === null ? 'radiobox-marked' : 'radiobox-blank'} color={value === null ? colors.primary : colors.muted} size={20}/>}/>}
      {accounts.map(account => <List.Item rippleColor="transparent" style={ui.listItem} titleStyle={ui.listTitle} descriptionStyle={ui.money} key={account.id} accessibilityRole="radio" accessibilityState={{checked: value === account.id}} title={account.name} description={money(account.balance)} onPress={() => choose(account.id)} right={() => <Icon source={value === account.id ? 'radiobox-marked' : 'radiobox-blank'} color={value === account.id ? colors.primary : colors.muted} size={20}/>}/>)}
      {!accounts.length && <Text style={ui.muted}>Подходящих счетов пока нет. Сначала создайте счёт на странице «Счета».</Text>}
    </Sheet>
  </>;
}
