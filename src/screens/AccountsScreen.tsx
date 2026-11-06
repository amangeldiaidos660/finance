import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Icon, Menu, Text, TouchableRipple} from 'react-native-paper';
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
import {CardGrid} from '../components/CardGrid';
import {financeIcon} from '../theme/presentation';

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

  const openHistory = (account: Account) => navigation.navigate('History', {accountId: account.id});
  const accountMenu = (account: Account) => <Menu contentStyle={ui.menu} elevation={0} visible={menu === account.id} onDismiss={() => setMenu(null)} anchor={<IconButton icon="dots-vertical" size={20} accessibilityLabel={'Действия со счётом ' + account.name} onPress={() => setMenu(account.id)} style={{margin: 0}}/>}>
    {account.kind !== 'credit' && <Menu.Item rippleColor="transparent" titleStyle={ui.listTitle} theme={{colors: {onSurfaceVariant: colors.primary}}} title="Пополнить" leadingIcon="plus" onPress={() => closeMenu(() => navigation.navigate('Operation', {flow: 'income', accountId: account.id}))}/>}
    {account.kind !== 'credit' && <Menu.Item rippleColor="transparent" titleStyle={ui.listTitle} theme={{colors: {onSurfaceVariant: colors.primary}}} title="Перевести" leadingIcon="bank-transfer" onPress={() => closeMenu(() => navigation.navigate('Operation', {kind: 'transfer', accountId: account.id}))}/>}
    <Menu.Item rippleColor="transparent" titleStyle={ui.listTitle} theme={{colors: {onSurfaceVariant: colors.primary}}} title={account.kind === 'credit' ? 'Настройки кредита' : 'Название и комиссия'} leadingIcon="pencil-outline" onPress={() => closeMenu(() => navigation.navigate('AccountForm', {id: account.id}))}/>
    <Menu.Item rippleColor="transparent" titleStyle={ui.listTitle} theme={{colors: {onSurfaceVariant: colors.primary}}} title="Удалить" leadingIcon="trash-can-outline" onPress={() => closeMenu(() => { action.clearError(); setDeleting(account); })}/>
  </Menu>;

  return <View style={ui.fill}>
    <AppHeader title="Финансы" addLabel="Добавить счёт" onAdd={() => navigation.navigate('AccountForm')}/>
    <Page>
      {!active.length && <EmptyState title="Ваши счета" detail="Добавьте банковский счёт, депозит или кредит. Начальные остатки не считаются доходами."/>}
      {!!active.length && <Card style={styles.overview}>
        <View style={styles.overviewColumn}><Text style={ui.muted}>Средства</Text><Text style={[ui.amount, styles.summaryAmount]}>{money(totals.assets)}</Text></View>
        <View style={styles.overviewDivider}/>
        <View style={styles.overviewColumn}><Text style={ui.muted}>Задолженность</Text><Text style={[ui.amount, styles.summaryAmount, {color: colors.red}]}>{money(totals.debt)}</Text></View>
      </Card>}
      {groups.map(group => {
        const items = active.filter(account => account.kind === group.kind);
        if (!items.length) { return null; }
        return <View key={group.kind} style={styles.group}>
          <Text style={styles.groupTitle}>{group.name}</Text>
          {group.kind === 'credit' ? items.map(account => {
            const paid = repaymentTotal(operations, account.id, today.slice(0, 7));
            return <Card key={account.id}>
              <View style={ui.between}>
                <TouchableRipple rippleColor="transparent" style={ui.grow} accessibilityRole="button" accessibilityLabel={'История счёта ' + account.name} onPress={() => openHistory(account)}>
                  <View style={styles.creditHeading}><Icon source="bank-outline" color={colors.primary} size={24}/><Text style={styles.creditName}>{account.name}</Text><Text style={[ui.amount, styles.creditAmount]}>{money(account.balance)}</Text></View>
                </TouchableRipple>
                {accountMenu(account)}
              </View>
              <Text style={ui.muted}>Платёж <Text style={[ui.money, styles.money]}>{money(Math.min(account.monthlyPayment, account.balance))}</Text> · {shortDate(dueDate(account.paymentDay))}</Text>
              <View style={styles.creditDetails}>
                <View style={[ui.grow, styles.creditSource]}><Text style={ui.muted}>Со счёта: {accounts.find(item => item.id === account.paymentAccountId)?.name ?? 'не выбран'}</Text><Text style={ui.muted}>Погашено в этом месяце: <Text style={[ui.money, styles.money]}>{money(paid)}</Text></Text></View>
                <Button mode="contained" disabled={!account.balance} onPress={() => navigation.navigate('Operation', {kind: 'repayment', targetId: account.id, accountId: account.paymentAccountId ?? undefined})}>Погасить</Button>
              </View>
            </Card>;
          }) : <CardGrid items={items} renderItem={(account, fullWidth) => <Card decorated={fullWidth} style={styles.tile}>
            <TouchableRipple rippleColor="transparent" style={styles.tileLink} accessibilityRole="button" accessibilityLabel={'История счёта ' + account.name} onPress={() => openHistory(account)}>
              <View style={styles.tileContent}>
                <Icon source={account.kind === 'deposit' ? 'database-outline' : financeIcon(account.name, 'credit-card-outline')} color={colors.primary} size={24}/>
                <Text style={styles.accountName}>{account.name}{settings.defaultAccountId === account.id ? ' ★' : ''}</Text>
                <Text style={[ui.amount, styles.accountAmount]}>{money(account.balance)}</Text>
                {account.fee > 0 && <Text style={ui.muted}>Комиссия: <Text style={[ui.money, styles.money]}>{money(account.fee)}</Text></Text>}
              </View>
            </TouchableRipple>
            <View style={styles.tileMenu}>{accountMenu(account)}</View>
          </Card>}/>}
        </View>;
      })}
      {!!active.length && <Card style={styles.capital}>
        <Text style={styles.capitalTitle}>Общий капитал</Text><Text style={[ui.total, styles.capitalAmount]}>{money(totals.capital)}</Text>
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

const styles = StyleSheet.create({
  money: {fontWeight: '700'},
  overview: {flexDirection: 'row', alignItems: 'stretch', gap: 12, paddingVertical: 10},
  overviewColumn: {flex: 1, minWidth: 0, gap: 6},
  overviewDivider: {width: 1, backgroundColor: colors.border},
  summaryAmount: {fontSize: 14, fontWeight: '700', textAlign: 'left'},
  group: {gap: 12},
  groupTitle: {fontSize: 16, color: colors.muted},
  tile: {flex: 1, padding: 0, gap: 0},
  tileLink: {flex: 1, borderRadius: 24, overflow: 'hidden'},
  tileContent: {padding: 12, minHeight: 100, gap: 6},
  tileMenu: {position: 'absolute', top: 4, right: 4},
  accountName: {fontSize: 14, lineHeight: 20, fontWeight: '400', color: colors.text},
  accountAmount: {fontSize: 14, fontWeight: '700', textAlign: 'left'},
  creditHeading: {flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap'},
  creditName: {fontSize: 14, fontWeight: '400', color: colors.text, flexShrink: 1},
  creditAmount: {fontSize: 14, fontWeight: '700', color: colors.red, marginLeft: 'auto'},
  creditDetails: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12},
  creditSource: {minWidth: 120, gap: 4},
  capital: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, backgroundColor: colors.accentSurface},
  capitalTitle: {fontSize: 14, fontWeight: '400', color: colors.text},
  capitalAmount: {flexGrow: 1, fontSize: 14, fontWeight: '700'},
});
