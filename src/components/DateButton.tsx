import React from 'react';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import {Button} from 'react-native-paper';
import {dateKey, fromDateKey, shortDate} from '../data/dates';

export function chooseDate(value: string, onChange: (value: string) => void, maximumDate?: Date) {
  DateTimePickerAndroid.open({value: fromDateKey(value), mode: 'date', maximumDate, minimumDate: new Date(1900, 0, 1), onChange: (event, date) => { if (event.type === 'set' && date) { onChange(dateKey(date)); } }});
}

export function DateButton({value, onChange, label, disabled = false}: {value: string; onChange: (value: string) => void; label?: string; disabled?: boolean}) {
  return <Button mode="outlined" icon="calendar-blank-outline" disabled={disabled} onPress={() => chooseDate(value, onChange, new Date())}>{label ? `${label}: ` : ''}{shortDate(value)}</Button>;
}
