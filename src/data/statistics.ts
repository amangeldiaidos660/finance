import type {Account, Category, DateRange, Entry, Flow, Obligation, Operation} from './types';
import {obligationCategory} from './constants';

export function isFlow(entry: Entry, flow: Flow): boolean {
  return entry.kind === flow || (flow === 'expense' && entry.kind === 'fee');
}

export function inRange(operation: Operation, range: DateRange): boolean {
  return operation.date >= range.start && operation.date <= range.end;
}

export function flowTotal(operations: Operation[], flow: Flow, range: DateRange, categoryId?: string): number {
  return operations.filter(op => inRange(op, range)).reduce((total, op) => total + op.entries
    .filter(entry => isFlow(entry, flow) && (!categoryId || entry.categoryId === categoryId))
    .reduce((sum, entry) => sum + entry.amount, 0), 0);
}

export function categoryLimit(category: Category, obligations: Obligation[]): number | null {
  return category.id === obligationCategory('expense')
    ? obligations.filter(item => item.active && item.flow === 'expense').reduce((sum, item) => sum + item.amount, 0)
    : category.limit;
}

export function balances(accounts: Account[]) {
  const active = accounts.filter(account => account.active);
  const assets = active.filter(account => account.kind !== 'credit').reduce((sum, account) => sum + account.balance, 0);
  const debt = active.filter(account => account.kind === 'credit').reduce((sum, account) => sum + account.balance, 0);
  return {assets, debt, capital: assets - debt};
}

export function repaymentTotal(operations: Operation[], creditId: string, month: string): number {
  return operations.filter(op => op.date.startsWith(month)).reduce((total, op) => total + op.entries
    .filter(entry => entry.kind === 'debt-reduction' && entry.accountId === creditId)
    .reduce((sum, entry) => sum + entry.amount, 0), 0);
}
