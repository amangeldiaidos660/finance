import React from 'react';
import {KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {ActivityIndicator, Appbar, Button, Icon, Surface, Text, TextInput, TouchableRipple} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors, ui} from '../theme/theme';
import type {RootStackParamList} from '../navigation/types';

export function Page({children}: React.PropsWithChildren) {
  return <ScrollView style={ui.fill} contentContainerStyle={ui.page} keyboardShouldPersistTaps="handled">{children}</ScrollView>;
}

export function Card({children}: React.PropsWithChildren) {
  return <Surface elevation={0} style={ui.card}>{children}</Surface>;
}

export function ErrorNotice({text, retry}: {text: string; retry?: () => void}) {
  if (!text) { return null; }
  return <View style={ui.error} accessibilityLiveRegion="polite"><Text style={ui.errorText}>{text}</Text>{retry && <Button onPress={retry}>Повторить</Button>}</View>;
}

export function EmptyState({title, detail, icon = 'wallet-outline'}: {title: string; detail: string; icon?: string}) {
  return <View style={styles.empty}><Icon source={icon} size={42} color={colors.primary}/><Text style={ui.section}>{title}</Text><Text style={[ui.muted, styles.centered]}>{detail}</Text></View>;
}

export function Loading({label = 'Загружаем данные…'}: {label?: string}) {
  return <View style={ui.center}><ActivityIndicator size="large"/><Text style={ui.muted}>{label}</Text></View>;
}

export function AppHeader({title, back = false}: {title: string; back?: boolean}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return <Appbar.Header style={{backgroundColor: colors.background}}>
    {back ? <Appbar.BackAction onPress={() => navigation.goBack()} color={colors.muted}/> : <Appbar.Action icon="menu" accessibilityLabel="Открыть меню" onPress={() => navigation.navigate('Menu')} color={colors.muted}/>}
    <Appbar.Content title={title} titleStyle={{fontSize: 23, fontWeight: '700'}}/>
  </Appbar.Header>;
}

export function Tabs<T extends string>({value, items, onChange}: {value: T; items: {value: T; label: string}[]; onChange: (value: T) => void}) {
  return <View style={ui.row}>{items.map(item => <TouchableRipple key={item.value} style={ui.grow} accessibilityRole="tab" accessibilityState={{selected: value === item.value}} onPress={() => onChange(item.value)}>
    <View style={ui.tab}><Text style={[ui.tabLabel, value === item.value && ui.tabActive]}>{item.label}</Text><View style={value === item.value ? ui.underline : ui.underlineEmpty}/></View>
  </TouchableRipple>)}</View>;
}

export function MoneyField({value, onChange, label = 'Сумма, ₸', disabled = false}: {value: string; onChange: (value: string) => void; label?: string; disabled?: boolean}) {
  return <TextInput mode="outlined" label={label} value={value} onChangeText={onChange} keyboardType="decimal-pad" maxLength={16} disabled={disabled} style={ui.field}/>;
}

export function Sheet({visible, onClose, children, title}: React.PropsWithChildren<{visible: boolean; onClose: () => void; title: string}>) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
    <KeyboardAvoidingView behavior="height" style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Закрыть окно"/>
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.handle}/>
        <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <Text style={ui.heading}>{title}</Text>{children}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  empty: {paddingVertical: 36, paddingHorizontal: 16, alignItems: 'center', gap: 10},
  centered: {textAlign: 'center'},
  overlay: {flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end'},
  sheet: {maxHeight: '90%', backgroundColor: colors.background, borderTopLeftRadius: 22, borderTopRightRadius: 22},
  handle: {height: 4, width: 48, borderRadius: 2, backgroundColor: '#A7A7AA', alignSelf: 'center', marginTop: 12, marginBottom: 6},
  sheetContent: {padding: 20, gap: 16, paddingBottom: 28},
});
