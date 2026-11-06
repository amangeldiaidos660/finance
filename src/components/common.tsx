import React from 'react';
import {KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import {ActivityIndicator, Appbar, Icon, Surface, Text, TouchableRipple} from 'react-native-paper';
import {Button, IconButton, TextInput} from './controls';
import {CardAccent} from './CardAccent';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors, ui} from '../theme/theme';
import type {RootStackParamList} from '../navigation/types';

export function Page({children}: React.PropsWithChildren) {
  return <ScrollView style={ui.fill} contentContainerStyle={ui.page} keyboardShouldPersistTaps="handled">{children}</ScrollView>;
}

export function Card({children, decorated = false, accentPosition, style}: React.PropsWithChildren<{decorated?: boolean; accentPosition?: 'top' | 'bottom'; style?: StyleProp<ViewStyle>}>) {
  return <Surface elevation={0} style={[ui.card, style]}>{decorated && <CardAccent position={accentPosition}/>}{children}</Surface>;
}

export function ErrorNotice({text, retry}: {text: string; retry?: () => void}) {
  if (!text) { return null; }
  return <View style={ui.error} accessibilityLiveRegion="polite"><Text style={ui.errorText}>{text}</Text>{retry && <Button onPress={retry}>Повторить</Button>}</View>;
}

export function EmptyState({title, detail, icon = 'wallet-outline'}: {title: string; detail: string; icon?: string}) {
  return <View style={styles.empty}><Icon source={icon} size={42} color={colors.primary}/><Text style={[ui.section, styles.emptyTitle]}>{title}</Text><Text style={[ui.muted, styles.centered]}>{detail}</Text></View>;
}

export function Loading({label = 'Загружаем данные…'}: {label?: string}) {
  return <View style={ui.center}><ActivityIndicator size="large"/><Text style={ui.muted}>{label}</Text></View>;
}

export function AppHeader({title, back = false, onAdd, addLabel}: {title: string; back?: boolean; onAdd?: () => void; addLabel?: string}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return <Appbar.Header style={ui.header}>
    {back ? <Appbar.BackAction rippleColor="transparent" onPress={() => navigation.goBack()} color={colors.primary}/> : <Appbar.Action rippleColor="transparent" icon="menu" accessibilityLabel="Открыть меню" onPress={() => navigation.navigate('Menu')} color={colors.primary}/>}
    <Appbar.Content title={title} titleStyle={ui.headerTitle}/>
    {onAdd && <IconButton icon="plus" size={20} iconColor="#FFFFFF" style={ui.headerAdd} accessibilityLabel={addLabel} onPress={onAdd}/>}
  </Appbar.Header>;
}

export function Tabs<T extends string>({value, items, onChange, segmented = false}: {value: T; items: {value: T; label: string}[]; onChange: (value: T) => void; segmented?: boolean}) {
  return <View style={[ui.row, segmented && styles.segments]}>{items.map(item => <TouchableRipple rippleColor="transparent" key={item.value} style={[ui.grow, segmented && styles.segment, segmented && value === item.value && styles.segmentSelected]} accessibilityRole="tab" accessibilityState={{selected: value === item.value}} onPress={() => onChange(item.value)}>
    <View style={segmented ? styles.segmentContent : ui.tab}><Text style={[ui.tabLabel, value === item.value && (segmented ? styles.segmentLabel : ui.tabActive)]}>{item.label}</Text>{!segmented && <View style={value === item.value ? ui.underline : ui.underlineEmpty}/>}</View>
  </TouchableRipple>)}</View>;
}

export function MoneyField({value, onChange, label = 'Сумма, ₸', disabled = false}: {value: string; onChange: (value: string) => void; label?: string; disabled?: boolean}) {
  return <TextInput mode="flat" label={label} value={value} onChangeText={onChange} keyboardType="decimal-pad" maxLength={16} disabled={disabled} style={[ui.field, ui.money]}/>;
}

export function Sheet({visible, onClose, children, title}: React.PropsWithChildren<{visible: boolean; onClose: () => void; title: string}>) {
  return <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
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
  segments: {backgroundColor: colors.surface, borderRadius: 24, padding: 4, gap: 0},
  segment: {borderRadius: 20, overflow: 'hidden'},
  segmentSelected: {backgroundColor: colors.accentSurface},
  segmentContent: {alignItems: 'center', paddingVertical: 9, paddingHorizontal: 8},
  segmentLabel: {color: colors.primary},
  empty: {paddingVertical: 44, paddingHorizontal: 16, alignItems: 'center', gap: 20},
  centered: {textAlign: 'center'},
  emptyTitle: {fontWeight: '400', color: colors.secondary, textAlign: 'center'},
  overlay: {flex: 1, backgroundColor: '#27313D70', justifyContent: 'flex-end'},
  sheet: {maxHeight: '90%', backgroundColor: colors.background, borderTopLeftRadius: 26, borderTopRightRadius: 26},
  handle: {height: 4, width: 48, borderRadius: 2, backgroundColor: '#A4ACB8', alignSelf: 'center', marginTop: 12, marginBottom: 12},
  sheetContent: {padding: 16, gap: 12, paddingBottom: 20},
});
