import React, {useState} from 'react';
import {ScrollView, View} from 'react-native';
import {Button, Chip, Text} from 'react-native-paper';
import {dateKey, period, periodLabel} from '../data/dates';
import type {DateRange, PeriodKind} from '../data/types';
import {Sheet, ErrorNotice} from './common';
import {chooseDate} from './DateButton';
import {ui} from '../theme/theme';

const items: {kind: PeriodKind; label: string}[] = [{kind: 'custom', label: 'Период'}, {kind: 'week', label: 'Неделя'}, {kind: 'month', label: 'Месяц'}, {kind: 'quarter', label: 'Квартал'}, {kind: 'year', label: 'Год'}, {kind: 'all', label: 'Все'}];

export function PeriodFilter({value, onChange}: {value: DateRange; onChange: (range: DateRange) => void}) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(value.start);
  const [end, setEnd] = useState(value.end);
  return <View style={ui.gap}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ui.horizontal}>
      {items.map(item => <Chip key={item.kind} showSelectedCheck={false} selected={item.kind === value.kind} style={[ui.chip, item.kind === value.kind && ui.chipSelected]} onPress={() => {
        if (item.kind === 'custom') { setStart(value.kind === 'all' ? period('month').start : value.start); setEnd(value.kind === 'all' ? dateKey() : value.end); setOpen(true); }
        else { onChange(period(item.kind)); }
      }}>{item.label}</Chip>)}
    </ScrollView>
    <Text style={ui.muted}>{periodLabel(value)}</Text>
    <Sheet title="Выберите период" visible={open} onClose={() => setOpen(false)}>
      <Button mode="outlined" onPress={() => chooseDate(start, setStart)}>Начало: {start}</Button>
      <Button mode="outlined" onPress={() => chooseDate(end, setEnd)}>Конец: {end}</Button>
      <ErrorNotice text={start > end ? 'Начало периода должно быть раньше его окончания.' : ''}/>
      <Button mode="contained" disabled={start > end} onPress={() => { onChange({kind: 'custom', start, end}); setOpen(false); }}>Применить</Button>
    </Sheet>
  </View>;
}
