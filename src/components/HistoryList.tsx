import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Divider, Icon, Text} from 'react-native-paper';
import type {Entry, Operation} from '../data/types';
import {money} from '../data/money';
import {shortDate} from '../data/dates';
import {Card, EmptyState} from './common';
import {colors, ui} from '../theme/theme';
import {financeIcon} from '../theme/presentation';

export const entryLabels: Record<Entry['kind'], string> = {
  income: 'Доход', expense: 'Расход', 'transfer-in': 'Перевод: зачисление', 'transfer-out': 'Перевод: списание',
  fee: 'Комиссия за переводы', repayment: 'Погашение кредита', 'debt-reduction': 'Уменьшение долга', opening: 'Начальный остаток / долг',
};

export function HistoryList({operations, entryFilter, showDate = true}: {operations: Operation[]; entryFilter?: (entry: Entry) => boolean; showDate?: boolean}) {
  const visible = [...operations].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .flatMap(operation => operation.entries.filter(entry => !entryFilter || entryFilter(entry)).map(entry => ({operation, entry})));
  if (!visible.length) { return <EmptyState icon="history" title="Операций пока нет" detail="За выбранный период нет подходящих записей."/>; }
  return <Card style={styles.card}>{visible.map(({operation, entry}, index) => {
    const incoming = entry.kind === 'income' || entry.kind === 'transfer-in';
    const negative = ['expense', 'transfer-out', 'fee', 'repayment', 'debt-reduction'].includes(entry.kind);
    const title = entry.obligationName || entry.categoryName || entryLabels[entry.kind];
    const fallback = entry.kind === 'opening' ? 'wallet-outline' : ['transfer-in', 'transfer-out'].includes(entry.kind) ? 'bank-transfer' : 'cash-multiple';
    return <React.Fragment key={operation.id + ':' + entry.id}>
      {index > 0 && <Divider style={ui.divider}/>}
      <View style={styles.row}>
        <View style={styles.icon}><Icon source={financeIcon(title, fallback)} size={22} color={colors.primary}/></View>
        <View style={styles.description}><Text style={styles.title}>{title}</Text><Text style={ui.muted}>{entry.accountName} · {entryLabels[entry.kind]}{operation.comment ? ' · ' + operation.comment : ''}</Text></View>
        <View style={styles.values}>
          <Text style={[styles.amount, {color: incoming ? colors.green : negative ? colors.red : colors.secondary}]}>{incoming ? '+' : negative ? '−' : ''}{money(entry.amount)}</Text>
          {showDate && <Text style={styles.date}>{shortDate(operation.date)}</Text>}
        </View>
      </View>
    </React.Fragment>;
  })}</Card>;
}

const styles = StyleSheet.create({
  card: {gap: 0, paddingHorizontal: 12, paddingVertical: 8},
  row: {flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 10},
  icon: {paddingTop: 3},
  description: {flex: 1, minWidth: 0, gap: 5},
  title: {fontSize: 14, lineHeight: 20, color: colors.text, fontWeight: '400'},
  values: {alignItems: 'flex-end', maxWidth: '45%', gap: 5},
  amount: {fontSize: 14, lineHeight: 20, fontWeight: '400', fontVariant: ['tabular-nums'], textAlign: 'right'},
  date: {fontSize: 14, lineHeight: 20, color: colors.muted, textAlign: 'right'},
});
