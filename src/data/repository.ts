import {getDocsFromServer, runTransaction} from '@react-native-firebase/firestore';
import {database, profileDocument, userCollection, userDocument} from './firebase';
import {FEE_CATEGORY, initialCategories, obligationCategory, palette} from './constants';
import {assertMoney, money} from './money';
import {assertDate, dateKey} from './dates';
import type {Account, AccountInput, Category, Entry, Flow, Obligation, Operation, OperationInput, Settings} from './types';

function nameValue(value: string): string {
  const name = value.trim();
  if (!name || name.length > 80) { throw new Error('Введите название длиной от 1 до 80 символов.'); }
  return name;
}

function activeAccount(value: unknown): Account {
  const account = value as Account | undefined;
  if (!account?.active) { throw new Error('Счёт удалён или недоступен. Выберите другой счёт.'); }
  return account;
}

function paymentDetails(input: Pick<AccountInput, 'monthlyPayment' | 'paymentDay' | 'paymentAccountId'>) {
  assertMoney(input.monthlyPayment);
  if (!Number.isInteger(input.paymentDay) || input.paymentDay < 1 || input.paymentDay > 31) {
    throw new Error('Число платежа должно быть от 1 до 31.');
  }
  if (!input.paymentAccountId) { throw new Error('Выберите банковский счёт для погашения кредита.'); }
}

export async function initializeUser(uid: string): Promise<void> {
  await runTransaction(database(), async transaction => {
    const profile = profileDocument(uid);
    const snapshot = await transaction.get(profile);
    if (snapshot.exists()) { return; }
    transaction.set(profile, {schemaVersion: 1, createdAt: Date.now()});
    transaction.set(userDocument(uid, 'settings', 'main'), {defaultAccountId: null, nextCreditNumber: 1});
    for (const category of initialCategories()) {
      transaction.set(userDocument(uid, 'categories', category.id), category);
    }
  });
}

export async function createAccount(uid: string, input: AccountInput): Promise<void> {
  assertMoney(input.openingBalance, input.kind !== 'credit');
  assertMoney(input.fee, true);
  if (input.kind === 'credit') { paymentDetails(input); }
  const name = input.kind === 'credit' ? '' : nameValue(input.name);
  const ref = userDocument(uid, 'accounts', input.id);
  const settingsRef = userDocument(uid, 'settings', 'main');
  await runTransaction(database(), async transaction => {
    const existing = await transaction.get(ref);
    if (existing.exists()) { return; }
    const settings = (await transaction.get(settingsRef)).data() as Settings;
    let paymentAccount: Account | null = null;
    if (input.kind === 'credit' && input.paymentAccountId) {
      paymentAccount = activeAccount((await transaction.get(userDocument(uid, 'accounts', input.paymentAccountId))).data());
      if (paymentAccount.kind !== 'bank') { throw new Error('Для погашения кредита выберите банковский счёт.'); }
    }
    const account: Account = {
      id: input.id,
      kind: input.kind,
      name: input.kind === 'credit' ? `Кредит ${settings.nextCreditNumber}` : name,
      balance: input.openingBalance,
      openingBalance: input.openingBalance,
      fee: input.kind === 'credit' ? 0 : input.fee,
      monthlyPayment: input.kind === 'credit' ? input.monthlyPayment : 0,
      paymentDay: input.kind === 'credit' ? input.paymentDay : 1,
      paymentAccountId: paymentAccount?.id ?? null,
      linkedCreditIds: [],
      lastOperationId: `opening-${input.id}`,
      active: true,
      createdAt: Date.now(),
    };
    transaction.set(ref, account);
    if (paymentAccount) {
      transaction.update(userDocument(uid, 'accounts', paymentAccount.id), {linkedCreditIds: [...paymentAccount.linkedCreditIds, input.id]});
      transaction.update(settingsRef, {nextCreditNumber: settings.nextCreditNumber + 1});
    }
    const opening: Operation = {
      id: `opening-${input.id}`,
      kind: 'opening',
      date: dateKey(),
      createdAt: Date.now(),
      comment: input.kind === 'credit' ? 'Начальная задолженность' : 'Начальный остаток',
      amount: input.openingBalance,
      fee: 0,
      obligationId: null,
      entries: [{id: 'opening', accountId: input.id, accountName: account.name, kind: 'opening', amount: input.openingBalance, categoryId: null, categoryName: '', obligationName: ''}],
    };
    transaction.set(userDocument(uid, 'operations', opening.id), opening);
  });
}

export async function updateAccount(uid: string, id: string, input: Pick<AccountInput, 'name' | 'fee' | 'monthlyPayment' | 'paymentDay' | 'paymentAccountId'>): Promise<void> {
  assertMoney(input.fee, true);
  await runTransaction(database(), async transaction => {
    const ref = userDocument(uid, 'accounts', id);
    const account = activeAccount((await transaction.get(ref)).data());
    if (account.kind !== 'credit') {
      transaction.update(ref, {name: nameValue(input.name), fee: input.fee});
      return;
    }
    paymentDetails(input);
    const nextRef = userDocument(uid, 'accounts', input.paymentAccountId!);
    const next = activeAccount((await transaction.get(nextRef)).data());
    if (next.kind !== 'bank') { throw new Error('Для погашения нужен банковский счёт.'); }
    const previousRef = account.paymentAccountId ? userDocument(uid, 'accounts', account.paymentAccountId) : null;
    const previous = previousRef ? (await transaction.get(previousRef)).data() as Account : null;
    transaction.update(ref, {monthlyPayment: input.monthlyPayment, paymentDay: input.paymentDay, paymentAccountId: next.id});
    if (previous?.id !== next.id) {
      if (previousRef && previous) { transaction.update(previousRef, {linkedCreditIds: previous.linkedCreditIds.filter(item => item !== id)}); }
      transaction.update(nextRef, {linkedCreditIds: [...next.linkedCreditIds, id]});
    }
  });
}

export async function archiveAccount(uid: string, id: string): Promise<void> {
  await runTransaction(database(), async transaction => {
    const ref = userDocument(uid, 'accounts', id);
    const account = activeAccount((await transaction.get(ref)).data());
    const settingsRef = userDocument(uid, 'settings', 'main');
    const settings = (await transaction.get(settingsRef)).data() as Settings;
    const sourceRef = account.paymentAccountId ? userDocument(uid, 'accounts', account.paymentAccountId) : null;
    const source = sourceRef ? (await transaction.get(sourceRef)).data() as Account : null;
    if (account.balance !== 0) {
      throw new Error(account.kind === 'credit'
        ? `Нельзя удалить кредит: осталось погасить ${money(account.balance)}.`
        : `Нельзя удалить счёт: остаток — ${money(account.balance)}. Переведите деньги на другой счёт или учтите расход.`);
    }
    if (account.linkedCreditIds.length) { throw new Error('Этот счёт выбран для погашения кредитов. Сначала укажите другой счёт в настройках этих кредитов.'); }
    transaction.update(ref, {active: false});
    if (sourceRef && source) { transaction.update(sourceRef, {linkedCreditIds: source.linkedCreditIds.filter(item => item !== id)}); }
    if (settings.defaultAccountId === id) { transaction.update(settingsRef, {defaultAccountId: null}); }
  });
}

export async function setDefaultAccount(uid: string, id: string | null): Promise<void> {
  await runTransaction(database(), async transaction => {
    if (id) {
      const account = activeAccount((await transaction.get(userDocument(uid, 'accounts', id))).data());
      if (account.kind === 'credit') { throw new Error('Кредит нельзя выбрать счётом по умолчанию.'); }
    }
    transaction.update(userDocument(uid, 'settings', 'main'), {defaultAccountId: id});
  });
}

export async function saveCategory(uid: string, id: string, flow: Flow, name: string): Promise<void> {
  const title = nameValue(name);
  await runTransaction(database(), async transaction => {
    const ref = userDocument(uid, 'categories', id);
    const existing = (await transaction.get(ref)).data() as Category | undefined;
    if (existing?.system) { throw new Error('Название служебной категории изменять нельзя.'); }
    if (existing && !existing.active) { throw new Error('Категория удалена. Создайте новую.'); }
    if (existing) {
      transaction.update(ref, {name: title});
    } else {
      transaction.set(ref, {id, name: title, flow, active: true, system: false, limit: null, color: palette[Date.now() % palette.length], order: Date.now()});
    }
  });
}

export async function archiveCategory(uid: string, id: string): Promise<void> {
  await runTransaction(database(), async transaction => {
    const ref = userDocument(uid, 'categories', id);
    const category = (await transaction.get(ref)).data() as Category | undefined;
    if (!category?.active) { throw new Error('Категория уже удалена.'); }
    if (category.system) { throw new Error('Эта категория нужна для учёта обязательств или комиссий и не удаляется.'); }
    transaction.update(ref, {active: false});
  });
}

export async function saveLimit(uid: string, id: string, limit: number | null): Promise<void> {
  if (limit !== null) { assertMoney(limit, true); }
  await runTransaction(database(), async transaction => {
    const ref = userDocument(uid, 'categories', id);
    const category = (await transaction.get(ref)).data() as Category | undefined;
    if (!category?.active || category.flow !== 'expense') { throw new Error('Категория расходов недоступна.'); }
    if (id === obligationCategory('expense')) { throw new Error('Лимит обязательств рассчитывается по суммам подкатегорий.'); }
    transaction.update(ref, {limit});
  });
}

export async function saveObligation(uid: string, input: Pick<Obligation, 'id' | 'name' | 'description' | 'flow' | 'amount'>): Promise<void> {
  const name = nameValue(input.name);
  assertMoney(input.amount);
  if (input.description.length > 300) { throw new Error('Описание не должно превышать 300 символов.'); }
  await runTransaction(database(), async transaction => {
    const ref = userDocument(uid, 'obligations', input.id);
    const existing = (await transaction.get(ref)).data() as Obligation | undefined;
    if (existing && !existing.active) { throw new Error('Обязательство удалено. Создайте новое.'); }
    if (existing && existing.flow !== input.flow) { throw new Error('Тип существующего обязательства менять нельзя. Создайте новое обязательство.'); }
    transaction.set(ref, {...input, name, description: input.description.trim(), categoryId: obligationCategory(input.flow), active: true, createdAt: existing?.createdAt ?? Date.now()});
  });
}

export async function archiveObligation(uid: string, id: string): Promise<void> {
  await runTransaction(database(), async transaction => {
    const ref = userDocument(uid, 'obligations', id);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) { throw new Error('Обязательство не найдено.'); }
    transaction.update(ref, {active: false});
  });
}

export async function saveOperation(uid: string, input: OperationInput): Promise<void> {
  assertMoney(input.amount);
  assertDate(input.date);
  if (input.comment.length > 300) { throw new Error('Комментарий не должен превышать 300 символов.'); }
  if (!input.accountId) { throw new Error('Выберите счёт.'); }
  const operationRef = userDocument(uid, 'operations', input.id);
  await runTransaction(database(), async transaction => {
    if ((await transaction.get(operationRef)).exists()) { return; }
    const sourceRef = userDocument(uid, 'accounts', input.accountId);
    const source = activeAccount((await transaction.get(sourceRef)).data());
    if (source.kind === 'credit') { throw new Error('Для списания или пополнения выберите банковский счёт либо депозит.'); }
    const transfer = input.kind === 'transfer' || input.kind === 'repayment';
    const targetRef = transfer && input.targetId ? userDocument(uid, 'accounts', input.targetId) : null;
    const target = targetRef ? activeAccount((await transaction.get(targetRef)).data()) : null;
    let category: Category | null = null;
    let obligation: Obligation | null = null;
    const completionId = input.obligationId ? `${input.obligationId}_${input.date.slice(0, 7)}` : null;
    const completionRef = completionId ? userDocument(uid, 'completions', completionId) : null;
    if (!transfer) {
      if (!input.categoryId) { throw new Error('Выберите категорию.'); }
      category = (await transaction.get(userDocument(uid, 'categories', input.categoryId))).data() as Category;
      if (!category?.active || category.flow !== input.kind) { throw new Error('Категория недоступна для этой операции.'); }
      if (category.id === FEE_CATEGORY) { throw new Error('Комиссия записывается автоматически при переводе.'); }
      if (category.id === obligationCategory(input.kind as Flow) && !input.obligationId) { throw new Error('Выберите обязательство в списке подкатегорий.'); }
      if (input.obligationId) {
        obligation = (await transaction.get(userDocument(uid, 'obligations', input.obligationId))).data() as Obligation;
        if (!obligation?.active || obligation.flow !== input.kind || obligation.categoryId !== category.id) { throw new Error('Обязательство недоступно для этой категории.'); }
        if (completionRef && (await transaction.get(completionRef)).exists()) { throw new Error('Это обязательство уже выполнено за выбранный месяц. Выберите другой месяц или обязательство.'); }
      }
    }
    if (transfer && (!target || !targetRef)) { throw new Error('Выберите счёт зачисления.'); }
    if (target?.id === source.id) { throw new Error('Для перевода нужны два разных счёта.'); }
    if (input.kind === 'repayment' && target?.kind !== 'credit') { throw new Error('Выберите кредит для погашения.'); }
    if (target?.kind === 'credit' && source.kind !== 'bank') { throw new Error('Погашение кредита выполняется с банковского счёта.'); }
    const fee = transfer ? source.fee : 0;
    const debit = input.kind === 'income' ? 0 : input.amount + fee;
    if (source.balance < debit) { throw new Error(`Недостаточно средств на счёте «${source.name}». Доступно ${money(source.balance)}, требуется ${money(debit)}${fee ? `, включая комиссию ${money(fee)}` : ''}.`); }
    if (target?.kind === 'credit' && input.amount > target.balance) { throw new Error(`Сумма погашения больше оставшегося долга: ${money(target.balance)}.`); }
    const sourceBalance = source.balance + (input.kind === 'income' ? input.amount : -debit);
    assertMoney(sourceBalance, true);
    const entries: Entry[] = [];
    const entry = (account: Account, kind: Entry['kind'], amount: number, selectedCategory: Category | null = null): Entry => ({
      id: `${input.id}-${entries.length}`,
      accountId: account.id,
      accountName: account.name,
      kind,
      amount,
      categoryId: selectedCategory?.id ?? null,
      categoryName: selectedCategory?.name ?? '',
      obligationName: obligation?.name ?? '',
    });
    let targetBalance: number | null = null;
    if (target) {
      targetBalance = target.balance + (target.kind === 'credit' ? -input.amount : input.amount);
      assertMoney(targetBalance, true);
      entries.push(entry(source, target.kind === 'credit' ? 'repayment' : 'transfer-out', input.amount));
      if (fee > 0) {
        entries.push({...entry(source, 'fee', fee), categoryId: FEE_CATEGORY, categoryName: 'Комиссия за переводы'});
      }
      entries.push(entry(target, target.kind === 'credit' ? 'debt-reduction' : 'transfer-in', input.amount));
    } else {
      entries.push(entry(source, input.kind as Flow, input.amount, category));
    }
    const operation: Operation = {
      id: input.id,
      kind: target?.kind === 'credit' ? 'repayment' : input.kind,
      date: input.date,
      createdAt: Date.now(),
      comment: input.comment.trim(),
      amount: input.amount,
      fee,
      obligationId: transfer ? null : input.obligationId,
      entries,
    };
    transaction.update(sourceRef, {balance: sourceBalance, lastOperationId: input.id});
    if (targetRef && targetBalance !== null) { transaction.update(targetRef, {balance: targetBalance, lastOperationId: input.id}); }
    transaction.set(operationRef, operation);
    if (!transfer && completionRef && obligation) {
      transaction.set(completionRef, {id: completionId, obligationId: obligation.id, month: input.date.slice(0, 7), operationId: input.id});
    }
  });
}

export async function fetchAllOperations(uid: string): Promise<Operation[]> {
  const snapshot = await getDocsFromServer(userCollection(uid, 'operations'));
  return snapshot.docs.map(item => ({...item.data(), id: item.id}) as Operation)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}
