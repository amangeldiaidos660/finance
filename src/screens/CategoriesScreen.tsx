import React, {useRef, useState} from 'react';
import {View} from 'react-native';
import {Button, FAB, IconButton, List, Text, TextInput} from 'react-native-paper';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import type {Category, Flow} from '../data/types';
import {useFinance} from '../data/FinanceProvider';
import {archiveCategory, saveCategory} from '../data/repository';
import {newId} from '../data/firebase';
import {obligationCategory} from '../data/constants';
import {useAction} from '../data/useAction';
import {Card, ErrorNotice, Page, Sheet, Tabs} from '../components/common';
import {colors, ui} from '../theme/theme';

export function CategoriesScreen({route, navigation}: NativeStackScreenProps<RootStackParamList, 'Categories'>) {
  const {categories, operations, user} = useFinance();
  const [flow, setFlow] = useState<Flow>(route.params?.flow ?? 'expense');
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const id = useRef('');
  const action = useAction();
  const begin = (category: Category | null) => {
    id.current = category?.id ?? newId(user!.uid);
    setEditing(category); setName(category?.name ?? ''); setDeleting(false); action.clearError(); setOpen(true);
  };
  const historyCount = editing ? operations.filter(op => op.entries.some(entry => entry.categoryId === editing.id)).length : 0;
  return <View style={ui.fill}>
    <Page>
      <Tabs value={flow} onChange={setFlow} items={[{value: 'expense', label: 'Расходы'}, {value: 'income', label: 'Доходы'}]}/>
      {categories.filter(category => category.active && category.flow === flow).sort((a, b) => a.order - b.order).map(category => <Card key={category.id}>
        <List.Item title={category.name} titleNumberOfLines={2} titleStyle={{fontSize: 18, fontWeight: '600'}} style={{padding: 0}} left={() => <List.Icon icon="circle-outline" color={colors.primary}/>} right={() => category.system
          ? <IconButton icon={category.id === obligationCategory(flow) ? 'chevron-right' : 'lock-outline'} accessibilityLabel={category.id === obligationCategory(flow) ? 'Открыть обязательства' : 'Служебная категория'} onPress={category.id === obligationCategory(flow) ? () => navigation.navigate('Obligations') : undefined}/>
          : <IconButton icon="dots-vertical" accessibilityLabel={`Изменить ${category.name}`} onPress={() => begin(category)}/>}/>
      </Card>)}
      <Text style={ui.muted}>Название категории можно изменить через меню справа. Обязательства и комиссия — служебные категории. Подкатегории обязательств настраиваются на отдельной странице.</Text>
    </Page>
    <FAB icon="plus" color="#FFFFFF" style={ui.fab} accessibilityLabel="Добавить категорию" onPress={() => begin(null)}/>
    <Sheet title={deleting ? 'Удалить категорию?' : editing ? 'Изменить категорию' : 'Новая категория'} visible={open} onClose={() => { if (!action.busy) { setOpen(false); } }}>
      {deleting ? <Text style={ui.label}>{historyCount ? `По этой категории есть операции в истории (${historyCount}). ` : ''}Категория будет удалена из выбора для новых операций. История сохранится.</Text> : <TextInput mode="outlined" label="Название категории" value={name} onChangeText={setName} maxLength={80} disabled={action.busy} style={ui.field}/>}
      <ErrorNotice text={action.error}/>
      <Button mode="contained" loading={action.busy} disabled={action.busy} onPress={() => action.run(async () => {
        if (deleting) { await archiveCategory(user!.uid, id.current); }
        else { await saveCategory(user!.uid, id.current, flow, name); }
        setOpen(false);
      })}>{deleting ? 'Удалить из выбора' : 'Сохранить'}</Button>
      {editing && !deleting && <Button textColor={colors.red} disabled={action.busy} onPress={() => { action.clearError(); setDeleting(true); }}>Удалить категорию</Button>}
      <Button disabled={action.busy} onPress={() => setOpen(false)}>Отмена</Button>
    </Sheet>
  </View>;
}
