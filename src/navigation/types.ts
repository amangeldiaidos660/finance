import type {DateRange, Flow} from '../data/types';

export type RootStackParamList = {
  Main: undefined;
  Menu: undefined;
  AccountForm: {id?: string} | undefined;
  Operation: {date?: string; flow?: Flow; kind?: 'transfer' | 'repayment'; categoryId?: string; accountId?: string; targetId?: string; obligationId?: string} | undefined;
  Categories: {flow?: Flow} | undefined;
  Limits: undefined;
  Obligations: undefined;
  Charts: {mode: 'distribution' | 'trend'};
  History: {accountId?: string; categoryId?: string; flow?: Flow; range?: DateRange} | undefined;
  Settings: undefined;
};

export type BottomTabParamList = {Summary: undefined; Accounts: undefined; Expenses: undefined; Income: undefined};
