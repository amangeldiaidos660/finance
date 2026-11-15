import React, {useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Icon, Text, TouchableRipple} from 'react-native-paper';
import {Button, Chip, IconButton, TextInput} from '../components/controls';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import type {Category, Flow} from '../data/types';
import {useFinance} from '../data/FinanceProvider';
import {archiveCategory, saveCategory} from '../data/repository';
import {newId} from '../data/firebase';
import {obligationCategory} from '../data/constants';
import {useAction} from '../data/useAction';
import {AppHeader, Card, ErrorNotice, Page, Sheet, Tabs} from '../components/common';
import {colors, ui} from '../theme/theme';
import {CardGrid} from '../components/CardGrid';
import {financeIcon} from '../theme/presentation';
import {matchesCategory} from '../data/statistics';

export function CategoriesScreen({route, navigation}: NativeStackScreenProps<RootStackParamList, 'Categories'>) {
  const {categories, operations, user} = useFinance();
  const [flow, setFlow] = useState<Flow>(route.params?.flow ?? 'expense');
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const id = useRef('');
  const action = useAction();
  const begin = (category: Category | null, parent: string | null = null) => {
    id.current = category?.id ?? newId(user!.uid);
    setEditing(category); setName(category?.name ?? ''); setParentId(category?.parentId ?? parent); setDeleting(false); action.clearError(); setOpen(true);
  };
  const historyCount = editing ? operations.filter(op => op.entries.some(entry => matchesCategory(entry, editing.id))).length : 0;
  const items = categories.filter(category => category.active && category.flow === flow).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  return <View style={ui.fill}>
    <AppHeader title="Категории" back addLabel="Добавить категорию" onAdd={() => begin(null)}/>
    <Page>
      <Tabs segmented value={flow} onChange={setFlow} items={[{value: 'expense', label: 'Расходы'}, {value: 'income', label: 'Доходы'}]}/>
      <CardGrid items={items.filter(category => !category.system && !category.parentId)} renderItem={(category, fullWidth) => <Card decorated={fullWidth} style={styles.tile}>
        <TouchableRipple rippleColor="transparent" style={styles.tileLink} accessibilityRole="button" accessibilityLabel={'Изменить ' + category.name} onPress={() => begin(category)}>
          <View style={[styles.tileContent, fullWidth && styles.wideContent]}>
            <Icon source={financeIcon(category.name)} color={colors.primary} size={26}/>
            <Text style={[styles.name, fullWidth && ui.grow]}>{category.name}</Text>
          </View>
        </TouchableRipple>
        <View style={styles.tileMenu}><IconButton icon="dots-vertical" accessibilityLabel={'Действия с категорией ' + category.name} onPress={() => begin(category)}/></View>
        {items.filter(child => child.parentId === category.id).map(child => <View key={child.id} style={[ui.between, {paddingHorizontal: 12}]}>
          <Text style={[ui.label, ui.grow]}>↳ {child.name}</Text><IconButton icon="dots-vertical" accessibilityLabel={'Изменить подкатегорию ' + child.name} onPress={() => begin(child)}/>
        </View>)}
        <Button compact icon="plus" onPress={() => begin(null, category.id)}>Подкатегория</Button>
      </Card>}/>
      {items.filter(category => category.system).map(category => {
        const obligation = category.id === obligationCategory(flow);
        return <Card key={category.id} decorated={obligation} style={styles.systemCard}>
          <TouchableRipple rippleColor="transparent" disabled={!obligation} accessibilityRole={obligation ? 'button' : undefined} accessibilityLabel={obligation ? 'Открыть обязательства' : category.name + ' · служебная категория'} style={styles.tileLink} onPress={() => navigation.navigate('Obligations')}>
            <View style={styles.systemContent}><Icon source={financeIcon(category.name)} size={26} color={colors.primary}/><Text style={[styles.name, ui.grow]}>{category.name}</Text><Icon source={obligation ? 'chevron-right' : 'lock-outline'} color={colors.muted} size={24}/></View>
          </TouchableRipple>
        </Card>;
      })}
      <Text style={ui.muted}>Через меню можно переименовать категорию, перенести её под другую или сделать самостоятельной. Сохранённые операции и их группировка не меняются. Обязательства и комиссия — служебные категории.</Text>
    </Page>
    <Sheet title={deleting ? 'Удалить категорию?' : editing ? 'Изменить категорию' : 'Новая категория'} visible={open} onClose={() => { if (!action.busy) { setOpen(false); } }}>
      {deleting ? <Text style={ui.label}>{historyCount ? `По этой категории есть операции в истории (${historyCount}). ` : ''}Категория будет удалена из выбора для новых операций. История сохранится.{editing?.childIds?.length ? ' Сначала перенесите или удалите её подкатегории.' : ''}</Text> : <>
        <TextInput mode="flat" label="Название категории" value={name} onChangeText={setName} maxLength={80} disabled={action.busy} style={ui.field}/>
        <Text style={ui.label}>Родительская категория</Text>
        <View style={ui.wrap}>
          <Chip selected={!parentId} disabled={action.busy} onPress={() => setParentId(null)}>Самостоятельная</Chip>
          {items.filter(category => !category.system && !category.parentId && category.id !== editing?.id).map(category => <Chip key={category.id} selected={parentId === category.id} disabled={action.busy || !!editing?.childIds?.length} onPress={() => setParentId(category.id)}>{category.name}</Chip>)}
        </View>
        <Text style={ui.muted}>{editing?.childIds?.length ? 'Чтобы перенести эту категорию, сначала перенесите или удалите её подкатегории.' : 'Изменения применяются только к новым операциям. Старые названия и структура в истории сохраняются.'}</Text>
      </>}
      <ErrorNotice text={action.error}/>
      <Button mode="contained" loading={action.busy} disabled={action.busy} onPress={() => action.run(async () => {
        if (deleting) { await archiveCategory(user!.uid, id.current); }
        else { await saveCategory(user!.uid, id.current, flow, name, parentId); }
        setOpen(false);
      })}>{deleting ? 'Удалить из выбора' : 'Сохранить'}</Button>
      {editing && !deleting && <Button textColor={colors.red} disabled={action.busy} onPress={() => { action.clearError(); setDeleting(true); }}>Удалить категорию</Button>}
      <Button disabled={action.busy} onPress={() => setOpen(false)}>Отмена</Button>
    </Sheet>
  </View>;
}

const styles = StyleSheet.create({
  tile: {flex: 1, padding: 0, gap: 0},
  tileLink: {flex: 1, borderRadius: 24, overflow: 'hidden'},
  tileContent: {padding: 12, paddingTop: 14, minHeight: 104, gap: 10},
  wideContent: {flexDirection: 'row', alignItems: 'center', minHeight: 64, paddingRight: 44},
  tileMenu: {position: 'absolute', top: 4, right: 4},
  name: {fontSize: 14, lineHeight: 20, fontWeight: '400', color: colors.text},
  systemCard: {padding: 0, gap: 0},
  systemContent: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 64},
});
