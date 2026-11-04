import React from 'react';
import {View} from 'react-native';
import {Button, Icon, Text} from 'react-native-paper';
import {loginWithGoogle} from '../data/auth';
import {useAction} from '../data/useAction';
import {ErrorNotice} from '../components/common';
import {colors, ui} from '../theme/theme';

export function LoginScreen() {
  const action = useAction();
  return <View style={ui.center}>
    <Icon source="wallet-outline" size={72} color={colors.primary}/>
    <Text style={[ui.heading, {fontSize: 32}]}>Финансы</Text>
    <Text style={[ui.label, {textAlign: 'center', lineHeight: 25}]}>Счета, расходы и доходы{ '\n' }в одном месте</Text>
    <View style={{height: 16}}/>
    <Button icon="google" mode="contained" contentStyle={{height: 52}} disabled={action.busy} loading={action.busy} onPress={() => action.run(loginWithGoogle)}>Войти через Google</Button>
    <Text style={[ui.muted, {textAlign: 'center'}]}>Ваши записи сохраняются в вашем аккаунте.{ '\n' }Валюта учёта — тенге.</Text>
    <ErrorNotice text={action.error}/>
  </View>;
}

export function ConfigurationScreen() {
  return <View style={ui.center}>
    <Icon source="cloud-outline" size={60} color={colors.primary}/>
    <Text style={ui.heading}>Подключение аккаунта</Text>
    <Text style={[ui.label, {textAlign: 'center', lineHeight: 25}]}>Вход пока недоступен. Подключение облачного сервиса ещё не завершено.</Text>
  </View>;
}
