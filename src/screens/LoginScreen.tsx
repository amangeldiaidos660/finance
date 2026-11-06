import React from 'react';
import {View} from 'react-native';
import {Icon, Text} from 'react-native-paper';
import {Button} from '../components/controls';
import {loginWithGoogle} from '../data/auth';
import {useAction} from '../data/useAction';
import {ErrorNotice} from '../components/common';
import {colors, ui} from '../theme/theme';

export function LoginScreen() {
  const action = useAction();
  return <View style={ui.center}>
    <View style={ui.loginBadge}><Icon source="wallet-outline" size={48} color={colors.primary}/></View>
    <Text style={[ui.heading, {fontSize: 16, lineHeight: 22}]}>Финансы</Text>
    <Text style={[ui.label, {textAlign: 'center', lineHeight: 20}]}>Счета, расходы и доходы{ '\n' }в одном месте</Text>
    <View style={{height: 16}}/>
    <Button icon="google" mode="contained" style={{alignSelf: 'stretch'}} contentStyle={{height: 40}} disabled={action.busy} loading={action.busy} onPress={() => action.run(loginWithGoogle)}>Войти через Google</Button>
    <Text style={[ui.muted, {textAlign: 'center'}]}>Ваши записи сохраняются в вашем аккаунте.{ '\n' }Валюта учёта — тенге.</Text>
    <ErrorNotice text={action.error}/>
  </View>;
}

export function ConfigurationScreen() {
  return <View style={ui.center}>
    <Icon source="cloud-outline" size={60} color={colors.primary}/>
    <Text style={ui.heading}>Подключение аккаунта</Text>
    <Text style={[ui.label, {textAlign: 'center', lineHeight: 20}]}>Вход пока недоступен. Подключение облачного сервиса ещё не завершено.</Text>
  </View>;
}
