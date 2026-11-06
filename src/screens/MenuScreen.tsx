import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Icon, Text, TouchableRipple} from 'react-native-paper';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {useFinance} from '../data/FinanceProvider';
import {Card, Page} from '../components/common';
import {colors, ui} from '../theme/theme';

export function MenuScreen({navigation}: NativeStackScreenProps<RootStackParamList, 'Menu'>) {
  const {user} = useFinance();
  const links = [
    {title: 'Финансовые обязательства', icon: 'calendar-check-outline', onPress: () => navigation.navigate('Obligations')},
    {title: 'Категории', icon: 'shape-outline', onPress: () => navigation.navigate('Categories')},
    {title: 'Лимиты расходов', icon: 'chart-bell-curve-cumulative', onPress: () => navigation.navigate('Limits')},
    {title: 'Круговые диаграммы', icon: 'chart-donut', onPress: () => navigation.navigate('Charts', {mode: 'distribution'})},
    {title: 'Динамика доходов и расходов', icon: 'chart-line', onPress: () => navigation.navigate('Charts', {mode: 'trend'})},
    {title: 'История и экспорт', icon: 'history', onPress: () => navigation.navigate('History')},
    {title: 'Настройки', icon: 'cog-outline', onPress: () => navigation.navigate('Settings')},
  ];
  return <Page>
    <Card decorated style={styles.profile}><Icon source="account-outline" size={28} color={colors.primary}/><Text style={ui.heading}>{user?.displayName || 'Мои финансы'}</Text><Text style={ui.muted}>{user?.email}</Text></Card>
    <View style={styles.links}>{links.map(link => <Card key={link.title} style={styles.linkCard}>
      <TouchableRipple rippleColor="transparent" onPress={link.onPress} accessibilityRole="button" style={styles.link}>
        <View style={styles.linkContent}><Icon source={link.icon} color={colors.primary} size={24}/><Text style={[ui.listTitle, ui.grow]}>{link.title}</Text></View>
      </TouchableRipple>
    </Card>)}</View>
  </Page>;
}

const styles = StyleSheet.create({
  profile: {minHeight: 104, gap: 8, padding: 14},
  links: {gap: 12},
  linkCard: {padding: 0, gap: 0},
  link: {borderRadius: 24, overflow: 'hidden'},
  linkContent: {flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 54, paddingHorizontal: 14, paddingVertical: 10},
});
