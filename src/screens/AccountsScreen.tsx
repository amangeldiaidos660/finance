import React, {useState} from 'react';
import {View} from 'react-native';
import {Menu, Text} from 'react-native-paper';
import {Button, IconButton} from '../components/controls';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useFinance} from '../data/FinanceProvider';
import {archiveAccount} from '../data/repository';
import {balances, repaymentTotal} from '../data/statistics';
import {dueDate, shortDate} from '../data/dates';
import {money} from '../data/money';
import {useAction} from '../data/useAction';
import type {Account, AccountKind} from '../data/types';
import type {RootStackParamList} from '../navigation/types';
import {AppHeader, Card, EmptyState, ErrorNotice, Page, Sheet} from '../components/common';
import {colors, ui} from '../theme/theme';

const groups: {kind: AccountKind; name: string}[] = [{kind: 'bank', name: 'Банковские счета'}, {kind: 'deposit', name: 'Депозиты'}, {kind: 'credit', name: 'Кредиты'}];

export function AccountsScreen() {
  const {accounts, operations, settings, user, today} = useFinance();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [menu, setMenu] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Account | null>(null);
  const action = useAction();
  const totals = balances(accounts);
  const active = accounts.filter(account => account.active).sort((a, b) => a.createdAt - b.createdAt);
  const closeMenu = (callback: () => void) => { setMenu(null); callback(); };

  return <View style={ui.fill}>
    <AppHeader title="Финансы" addLabel="Добавить счёт" onAdd={() => navigation.navigate('AccountForm')}/>
    <Page>
      {!active.length && <EmptyState title="Ваши счета" detail="Добавьте банковский счёт, депозит или кредит. Начальные остатки не считаются доходами."/>}
      {groups.map(group => {
        const items = active.filter(account => account.kind === group.kind);
        if (!items.length) { return null; }
        return <View key={group.kind} style={ui.gap}>
          <Text style={ui.muted}>{group.name}</Text>
          <Card>{items.map(account => {
            const paid = repaymentTotal(operations, account.id, today.slice(0, 7));
            return <View key={account.id} style={ui.accountRow}>
              <View style={ui.row}>
                <Text style={[ui.label, ui.accountName]}>{account.name}{settings.defaultAccountId === account.id ? ' ★' : ''}</Text>
                <Text style={[ui.amount, account.kind === 'credit' && {color: colors.red}]}>{money(account.balance)}</Text>
                <Menu contentStyle={ui.menu} elevation={0} visible={menu === account.id} onDismiss={() => setMenu(null)} anchor={<IconButton icon="dots-vertical" size={20} accessibilityLabel={`Действия со счётом ${account.name}`} onPress={() => setMenu(account.id)} style={{margin: 0}}/>}>
                  {account.kind !== 'credit' && <Menu.Item titleStyle={ui.listTitle} theme={{colors: {onSurfaceVariant: colors.primary}}} title="Пополнить" leadingIcon="plus" onPress={() => closeMenu(() => navigation.navigate('Operation', {flow: 'income', accountId: account.id}))}/>}
                  {account.kind !== 'credit' && <Menu.Item titleStyle={ui.listTitle} theme={{colors: {onSurfaceVariant: colors.primary}}} title="Перевести" leadingIcon="bank-transfer" onPress={() => closeMenu(() => navigation.navigate('Operation', {kind: 'transfer', accountId: account.id}))}/>}
                  <Menu.Item titleStyle={ui.listTitle} theme={{colors: {onSurfaceVariant: colors.primary}}} title={account.kind === 'credit' ? 'Настройки кредита' : 'Название и комиссия'} leadingIcon="pencil-outline" onPress={() => closeMenu(() => navigation.navigate('AccountForm', {id: account.id}))}/>
                  <Menu.Item titleStyle={ui.listTitle} theme={{colors: {onSurfaceVariant: colors.primary}}} title="Удалить" leadingIcon="trash-can-outline" onPress={() => closeMenu(() => { action.clearError(); setDeleting(account); })}/>
                </Menu>
              </View>
              {account.kind !== 'credit' && account.fee > 0 && <Text style={ui.muted}>Комиссия исходящего перевода: {money(account.fee)}</Text>}
              {account.kind === 'credit' && <>
                <Text style={ui.muted}>Платёж {money(Math.min(account.monthlyPayment, account.balance))} · {shortDate(dueDate(account.paymentDay))}</Text>
                <Text style={ui.muted}>Со счёта: {accounts.find(item => item.id === account.paymentAccountId)?.name ?? 'не выбран'}</Text>
                <View style={ui.between}><Text style={[ui.muted, ui.grow]}>Погашено в этом месяце: {money(paid)}</Text><Button disabled={!account.balance} onPress={() => navigation.navigate('Operation', {kind: 'repayment', targetId: account.id, accountId: account.paymentAccountId ?? undefined})}>Погасить</Button></View>
              </>}
            </View>;
          })}</Card>
        </View>;
      })}
      {!!active.length && <Card>
        <View style={ui.between}><Text style={ui.label}>Средства</Text><Text style={ui.amount}>{money(totals.assets)}</Text></View>
        <View style={ui.between}><Text style={ui.label}>Задолженность</Text><Text style={[ui.amount, {color: colors.red}]}>{money(totals.debt)}</Text></View>
        <View style={[ui.between, ui.summary]}><Text style={[ui.label, {fontWeight: '700'}]}>Общий капитал</Text><Text style={ui.total}>{money(totals.capital)}</Text></View>
      </Card>}
      {!!active.length && <Text style={ui.muted}>Счёт по умолчанию можно выбрать в меню → Настройки. Все платежи и переводы проводятся вручную.</Text>}
    </Page>
    <Sheet title="Удалить счёт?" visible={!!deleting} onClose={() => { if (!action.busy) { setDeleting(null); } }}>
      <Text style={ui.label}>Счёт «{deleting?.name}» исчезнет из выбора для новых операций. Все записи в истории останутся.</Text>
      <ErrorNotice text={action.error}/>
      <Button mode="contained" loading={action.busy} disabled={action.busy} onPress={() => action.run(async () => { if (user && deleting) { await archiveAccount(user.uid, deleting.id); setDeleting(null); } })}>Удалить</Button>
      <Button disabled={action.busy} onPress={() => setDeleting(null)}>Отмена</Button>
    </Sheet>
  </View>;
}
