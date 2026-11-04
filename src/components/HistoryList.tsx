import React from 'react';
import {View} from 'react-native';
import {Divider, Text} from 'react-native-paper';
import type {Entry, Operation} from '../data/types';
import {money} from '../data/money';
import {shortDate} from '../data/dates';
import {Card, EmptyState} from './common';
import {colors, ui} from '../theme/theme';

export const entryLabels: Record<Entry['kind'], string> = {
  income: 'Доход', expense: 'Расход', 'transfer-in': 'Перевод: зачисление', 'transfer-out': 'Перевод: списание',
  fee: 'Комиссия за переводы', repayment: 'Погашение кредита', 'debt-reduction': 'Уменьшение долга', opening: 'Начальный остаток / долг',
};

export function HistoryList({operations, entryFilter}: {operations: Operation[]; entryFilter?: (entry: Entry) => boolean}) {
  const visible = [...operations].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .map(operation => ({operation, entries: operation.entries.filter(entry => !entryFilter || entryFilter(entry))})).filter(item => item.entries.length);
  if (!visible.length) { return <EmptyState icon="history" title="Операций пока нет" detail="Добавленные операции появятся здесь."/>; }
  return <View style={ui.gap}>{visible.map(({operation, entries}) => <Card key={operation.id}>
    <Text style={ui.muted}>{shortDate(operation.date)}</Text>
    {entries.map((entry, index) => {
      const incoming = entry.kind === 'income' || entry.kind === 'transfer-in';
      const negative = ['expense', 'transfer-out', 'fee', 'repayment', 'debt-reduction'].includes(entry.kind);
      return <View key={entry.id} style={{gap: 5}}>
        {index > 0 && <Divider style={ui.divider}/>}
        <View style={ui.between}><Text style={[ui.label, ui.grow]}>{entry.obligationName || entry.categoryName || entryLabels[entry.kind]}</Text><Text style={[ui.amount, {fontSize: 15, color: incoming ? colors.green : negative ? colors.red : colors.secondary}]}>{incoming ? '+' : negative ? '−' : ''}{money(entry.amount)}</Text></View>
        <Text style={ui.muted}>{entry.accountName} · {entryLabels[entry.kind]}</Text>
      </View>;
    })}
    {!!operation.comment && <Text style={ui.label}>{operation.comment}</Text>}
  </Card>)}</View>;
}
