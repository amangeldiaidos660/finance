import React, {useState} from 'react';
import {Text} from 'react-native-paper';
import {Button} from '../components/controls';
import {useFinance} from '../data/FinanceProvider';
import {setDefaultAccount} from '../data/repository';
import {logout} from '../data/auth';
import {useAction} from '../data/useAction';
import {AccountPicker} from '../components/AccountPicker';
import {Card, ErrorNotice, Page, Sheet} from '../components/common';
import {ui} from '../theme/theme';

export function SettingsScreen() {
  const {accounts, settings, user} = useFinance();
  const [leaving, setLeaving] = useState(false);
  const action = useAction();
  return <Page>
    <Card>
      <Text style={ui.heading}>Счёт по умолчанию</Text>
      <Text style={ui.muted}>Подставляется в новые доходы и расходы. Вы всегда можете изменить счёт в форме. Для кредита используется его собственный счёт погашения.</Text>
      <AccountPicker accounts={accounts.filter(account => account.active && account.kind !== 'credit')} value={settings.defaultAccountId} onChange={value => action.run(() => setDefaultAccount(user!.uid, value))} allowAsk disabled={action.busy}/>
    </Card>
    <Card><Text style={ui.label}>Валюта: казахстанский тенге (₸)</Text><Text style={ui.muted}>Учёт ведётся с точностью до тиына. Периоды и даты операций используют календарь устройства.</Text></Card>
    <ErrorNotice text={action.error}/>
    <Button mode="outlined" icon="logout" disabled={action.busy} onPress={() => setLeaving(true)}>Выйти из аккаунта</Button>
    <Sheet visible={leaving} onClose={() => { if (!action.busy) { setLeaving(false); } }} title="Выйти из аккаунта?">
      <Text style={ui.label}>Данные останутся в вашем аккаунте Google и будут доступны после следующего входа.</Text>
      <ErrorNotice text={action.error}/>
      <Button mode="contained" disabled={action.busy} loading={action.busy} onPress={() => action.run(logout)}>Выйти</Button>
    </Sheet>
  </Page>;
}
