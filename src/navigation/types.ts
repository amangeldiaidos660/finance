import type {Flow} from '../data/types';

export type RootStackParamList = {
  Main: undefined;
  Menu: undefined;
  AccountForm: {id?: string} | undefined;
  Operation: {flow?: Flow; kind?: 'transfer' | 'repayment'; categoryId?: string; accountId?: string; targetId?: string; obligationId?: string} | undefined;
  Categories: {flow?: Flow} | undefined;
  Limits: undefined;
  Obligations: undefined;
  Charts: {mode: 'distribution' | 'trend'};
  History: undefined;
  Settings: undefined;
};

export type BottomTabParamList = {Accounts: undefined; Expenses: undefined; Income: undefined};
