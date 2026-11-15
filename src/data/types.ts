export type Flow = 'income' | 'expense';
export type AccountKind = 'bank' | 'deposit' | 'credit';
export type PeriodKind = 'custom' | 'week' | 'month' | 'quarter' | 'year' | 'all';
export type OperationKind = Flow | 'transfer' | 'repayment' | 'opening';
export type EntryKind = Flow | 'transfer-in' | 'transfer-out' | 'fee' | 'repayment' | 'debt-reduction' | 'opening';

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  balance: number;
  openingBalance: number;
  fee: number;
  monthlyPayment: number;
  paymentDay: number;
  paymentAccountId: string | null;
  linkedCreditIds: string[];
  lastOperationId: string;
  active: boolean;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  flow: Flow;
  color: string;
  limit: number | null;
  system: boolean;
  active: boolean;
  order: number;
  parentId?: string | null;
  childIds?: string[];
}

export interface Obligation {
  id: string;
  name: string;
  description: string;
  flow: Flow;
  amount: number;
  categoryId: string;
  active: boolean;
  createdAt: number;
}

export interface Completion {
  id: string;
  obligationId: string;
  month: string;
  operationId: string;
}

export interface Entry {
  id: string;
  accountId: string;
  accountName: string;
  kind: EntryKind;
  amount: number;
  categoryId: string | null;
  categoryName: string;
  parentCategoryId?: string | null;
  parentCategoryName?: string;
  obligationName: string;
}

export interface CategoryScope {
  id: string;
  name: string;
  parentId: string | null;
  parentName: string;
  branch: boolean;
}

export interface Operation {
  id: string;
  kind: OperationKind;
  date: string;
  createdAt: number;
  comment: string;
  amount: number;
  fee: number;
  obligationId: string | null;
  entries: Entry[];
}

export interface Settings {
  defaultAccountId: string | null;
  nextCreditNumber: number;
}

export interface DateRange {
  kind: PeriodKind;
  start: string;
  end: string;
}

export interface OperationInput {
  id: string;
  kind: Flow | 'transfer' | 'repayment';
  amount: number;
  date: string;
  accountId: string;
  targetId: string | null;
  categoryId: string | null;
  obligationId: string | null;
  comment: string;
}

export interface AccountInput {
  id: string;
  kind: AccountKind;
  name: string;
  openingBalance: number;
  fee: number;
  monthlyPayment: number;
  paymentDay: number;
  paymentAccountId: string | null;
}
