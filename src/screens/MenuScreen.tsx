import React from 'react';
import {Avatar, Divider, List, Text} from 'react-native-paper';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {useFinance} from '../data/FinanceProvider';
import {Card, Page} from '../components/common';
import {colors, ui} from '../theme/theme';

export function MenuScreen({navigation}: NativeStackScreenProps<RootStackParamList, 'Menu'>) {
  const {user} = useFinance();
  return <Page>
    <Card><Avatar.Text label={(user?.displayName || user?.email || 'Ф').slice(0, 1).toUpperCase()} size={48} style={{backgroundColor: colors.pale}}/><Text style={ui.heading}>{user?.displayName || 'Мои финансы'}</Text><Text style={ui.muted}>{user?.email}</Text></Card>
    <Card>
      <List.Item title="Финансовые обязательства" titleNumberOfLines={2} left={props => <List.Icon {...props} icon="calendar-check-outline"/>} onPress={() => navigation.navigate('Obligations')}/>
      <List.Item title="Категории" left={props => <List.Icon {...props} icon="shape-outline"/>} onPress={() => navigation.navigate('Categories')}/>
      <List.Item title="Лимиты расходов" left={props => <List.Icon {...props} icon="chart-bell-curve-cumulative"/>} onPress={() => navigation.navigate('Limits')}/>
      <Divider/>
      <List.Item title="Круговые диаграммы" left={props => <List.Icon {...props} icon="chart-donut"/>} onPress={() => navigation.navigate('Charts', {mode: 'distribution'})}/>
      <List.Item title="Динамика доходов и расходов" titleNumberOfLines={2} left={props => <List.Icon {...props} icon="chart-line"/>} onPress={() => navigation.navigate('Charts', {mode: 'trend'})}/>
      <Divider/>
      <List.Item title="История и экспорт" left={props => <List.Icon {...props} icon="history"/>} onPress={() => navigation.navigate('History')}/>
      <List.Item title="Настройки" left={props => <List.Icon {...props} icon="cog-outline"/>} onPress={() => navigation.navigate('Settings')}/>
    </Card>
  </Page>;
}
