import React from 'react';
import {View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Icon, Text} from 'react-native-paper';
import {Button} from '../components/controls';
import type {BottomTabParamList, RootStackParamList} from './types';
import {useFinance} from '../data/FinanceProvider';
import {logout} from '../data/auth';
import {useAction} from '../data/useAction';
import {AppHeader, ErrorNotice, Loading} from '../components/common';
import {AccountsScreen} from '../screens/AccountsScreen';
import {AccountFormScreen} from '../screens/AccountFormScreen';
import {ExpensesScreen, IncomeScreen} from '../screens/FlowScreen';
import {OperationScreen} from '../screens/OperationScreen';
import {CategoriesScreen} from '../screens/CategoriesScreen';
import {LimitsScreen} from '../screens/LimitsScreen';
import {ObligationsScreen} from '../screens/ObligationsScreen';
import {ChartsScreen} from '../screens/ChartsScreen';
import {HistoryScreen} from '../screens/HistoryScreen';
import {MenuScreen} from '../screens/MenuScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {ConfigurationScreen, LoginScreen} from '../screens/LoginScreen';
import {colors, ui} from '../theme/theme';

const Bottom = createBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationTheme = {...DefaultTheme, colors: {...DefaultTheme.colors, primary: colors.primary, background: colors.background, card: colors.background, text: colors.text, border: colors.border}};

function BottomTabs() {
  const insets = useSafeAreaInsets();
  return <Bottom.Navigator initialRouteName="Accounts" screenOptions={{headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarStyle: [ui.tabBar, {height: 66 + insets.bottom, paddingBottom: Math.max(insets.bottom, 8)}], tabBarLabelStyle: {fontSize: 12, fontWeight: '600', marginBottom: 4}, tabBarHideOnKeyboard: true}}>
    <Bottom.Screen name="Accounts" component={AccountsScreen} options={{title: 'Счета', tabBarIcon: ({size}) => <Icon source="wallet-outline" color={colors.primary} size={size}/>}}/>
    <Bottom.Screen name="Expenses" component={ExpensesScreen} options={{title: 'Расходы', tabBarIcon: ({size}) => <Icon source="arrow-top-right" color={colors.primary} size={size}/>}}/>
    <Bottom.Screen name="Income" component={IncomeScreen} options={{title: 'Доходы', tabBarIcon: ({size}) => <Icon source="arrow-bottom-left" color={colors.primary} size={size}/>}}/>
  </Bottom.Navigator>;
}

export function AppNavigation() {
  const {configured, user, loading, error, cached, retry} = useFinance();
  const action = useAction();
  if (!configured) { return <ConfigurationScreen/>; }
  if (loading) { return <Loading/>; }
  if (!user) { return <LoginScreen/>; }
  if (error) { return <View style={ui.center}><Text style={ui.heading}>Не удалось загрузить данные</Text><ErrorNotice text={error} retry={retry}/><ErrorNotice text={action.error}/><Button disabled={action.busy} onPress={() => action.run(logout)}>Выйти из аккаунта</Button></View>; }
  return <View style={ui.fill}>
    <NavigationContainer key={user.uid} theme={navigationTheme}>
      <Stack.Navigator screenOptions={({route}) => ({contentStyle: {backgroundColor: colors.background}, header: ({back, options}) => <AppHeader title={options.title ?? route.name} back={!!back}/>})}>
        <Stack.Screen name="Main" component={BottomTabs} options={{title: 'Финансы', headerShown: false}}/>
        <Stack.Screen name="Menu" component={MenuScreen} options={{title: 'Меню'}}/>
        <Stack.Screen name="AccountForm" component={AccountFormScreen} options={({route}) => ({title: route.params?.id ? 'Настройки счёта' : 'Новый счёт'})}/>
        <Stack.Screen name="Operation" component={OperationScreen} options={{headerShown: false, presentation: 'fullScreenModal'}}/>
        <Stack.Screen name="Categories" component={CategoriesScreen} options={{title: 'Категории', headerShown: false}}/>
        <Stack.Screen name="Limits" component={LimitsScreen} options={{title: 'Лимиты'}}/>
        <Stack.Screen name="Obligations" component={ObligationsScreen} options={{title: 'Обязательства', headerShown: false}}/>
        <Stack.Screen name="Charts" component={ChartsScreen} options={({route}) => ({title: route.params.mode === 'trend' ? 'Динамика' : 'Диаграмма'})}/>
        <Stack.Screen name="History" component={HistoryScreen} options={{title: 'История'}}/>
        <Stack.Screen name="Settings" component={SettingsScreen} options={{title: 'Настройки'}}/>
      </Stack.Navigator>
    </NavigationContainer>
    {cached && <View style={{paddingHorizontal: 12, paddingVertical: 5, backgroundColor: colors.pale}}><Text style={{fontSize: 11, color: colors.secondary}}>Показаны сохранённые данные. Для записи операций нужен интернет.</Text></View>}
  </View>;
}
