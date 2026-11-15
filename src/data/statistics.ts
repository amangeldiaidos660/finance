import type {Account, Category, CategoryScope, DateRange, Entry, Flow, Obligation, Operation} from './types';
import {obligationCategory} from './constants';

export function isFlow(entry: Entry, flow: Flow): boolean {
  return entry.kind === flow || (flow === 'expense' && entry.kind === 'fee');
}

export function inRange(operation: Operation, range: DateRange): boolean {
  return operation.date >= range.start && operation.date <= range.end;
}

export function flowTotal(operations: Operation[], flow: Flow, range: DateRange, categoryId?: string): number {
  return operations.filter(op => inRange(op, range)).reduce((total, op) => total + op.entries
    .filter(entry => isFlow(entry, flow) && (!categoryId || matchesCategory(entry, categoryId)))
    .reduce((sum, entry) => sum + entry.amount, 0), 0);
}

export function matchesCategory(entry: Entry, id: string): boolean {
  return entry.categoryId === id || entry.parentCategoryId === id;
}

export function categoryPathName(entry: Entry): string {
  return entry.parentCategoryId ? `${entry.parentCategoryName} → ${entry.categoryName}` : entry.categoryName;
}

export function matchesCategoryScope(entry: Entry, scope: CategoryScope): boolean {
  if (scope.branch && entry.parentCategoryId === scope.id && entry.parentCategoryName === scope.name) { return true; }
  return entry.categoryId === scope.id && entry.categoryName === scope.name
    && (entry.parentCategoryId ?? null) === scope.parentId && (entry.parentCategoryName ?? '') === scope.parentName;
}

export interface CategoryGroup {
  key: string;
  scope: CategoryScope;
  value: number;
  direct: number;
  children: CategoryGroup[];
}

export function categoryGroups(operations: Operation[], flow: Flow, range: DateRange): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup>();
  for (const operation of operations) {
    if (!inRange(operation, range)) { continue; }
    for (const entry of operation.entries) {
      if (!isFlow(entry, flow) || !entry.categoryId) { continue; }
      const id = entry.parentCategoryId ?? entry.categoryId;
      const name = entry.parentCategoryId ? entry.parentCategoryName ?? '' : entry.categoryName;
      const key = JSON.stringify([id, name]);
      let group = groups.get(key);
      if (!group) {
        group = {key, scope: {id, name, parentId: null, parentName: '', branch: true}, value: 0, direct: 0, children: []};
        groups.set(key, group);
      }
      group.value += entry.amount;
      if (entry.parentCategoryId) {
        const childKey = JSON.stringify([id, name, entry.categoryId, entry.categoryName]);
        let child = group.children.find(item => item.key === childKey);
        if (!child) {
          child = {key: childKey, scope: {id: entry.categoryId, name: entry.categoryName, parentId: id, parentName: name, branch: false}, value: 0, direct: 0, children: []};
          group.children.push(child);
        }
        child.value += entry.amount;
        child.direct += entry.amount;
      } else {
        group.direct += entry.amount;
      }
    }
  }
  const compare = (a: CategoryGroup, b: CategoryGroup) => b.value - a.value || a.key.localeCompare(b.key);
  for (const group of groups.values()) { group.children.sort(compare); }
  return [...groups.values()].sort(compare);
}

export function scopeTotal(operations: Operation[], flow: Flow, range: DateRange, scope?: CategoryScope): number {
  return operations.filter(op => inRange(op, range)).reduce((total, op) => total + op.entries
    .filter(entry => isFlow(entry, flow) && (!scope || matchesCategoryScope(entry, scope)))
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
