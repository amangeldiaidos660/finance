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
    <Card><Avatar.Text label={(user?.displayName || user?.email || 'Ф').slice(0, 1).toUpperCase()} size={48} color={colors.primaryText} style={{backgroundColor: colors.pale, borderRadius: 16}}/><Text style={ui.heading}>{user?.displayName || 'Мои финансы'}</Text><Text style={ui.muted}>{user?.email}</Text></Card>
    <Card>
      <List.Item style={ui.listItem} titleStyle={ui.listTitle} title="Финансовые обязательства" titleNumberOfLines={2} left={props => <List.Icon {...props} color={colors.primary} icon="calendar-check-outline"/>} onPress={() => navigation.navigate('Obligations')}/>
      <List.Item style={ui.listItem} titleStyle={ui.listTitle} title="Категории" left={props => <List.Icon {...props} color={colors.primary} icon="shape-outline"/>} onPress={() => navigation.navigate('Categories')}/>
      <List.Item style={ui.listItem} titleStyle={ui.listTitle} title="Лимиты расходов" left={props => <List.Icon {...props} color={colors.primary} icon="chart-bell-curve-cumulative"/>} onPress={() => navigation.navigate('Limits')}/>
      <Divider style={ui.divider}/>
      <List.Item style={ui.listItem} titleStyle={ui.listTitle} title="Круговые диаграммы" left={props => <List.Icon {...props} color={colors.primary} icon="chart-donut"/>} onPress={() => navigation.navigate('Charts', {mode: 'distribution'})}/>
      <List.Item style={ui.listItem} titleStyle={ui.listTitle} title="Динамика доходов и расходов" titleNumberOfLines={2} left={props => <List.Icon {...props} color={colors.primary} icon="chart-line"/>} onPress={() => navigation.navigate('Charts', {mode: 'trend'})}/>
      <Divider style={ui.divider}/>
      <List.Item style={ui.listItem} titleStyle={ui.listTitle} title="История и экспорт" left={props => <List.Icon {...props} color={colors.primary} icon="history"/>} onPress={() => navigation.navigate('History')}/>
      <List.Item style={ui.listItem} titleStyle={ui.listTitle} title="Настройки" left={props => <List.Icon {...props} color={colors.primary} icon="cog-outline"/>} onPress={() => navigation.navigate('Settings')}/>
    </Card>
  </Page>;
}
