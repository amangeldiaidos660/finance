import {StyleSheet} from 'react-native';
import {MD3LightTheme} from 'react-native-paper';

export const colors = {
  background: '#F5F5F5', surface: '#FFFFFF', text: '#14152D', secondary: '#505263',
  muted: '#9799A4', primary: '#00A7D5', pale: '#C5E9F2', green: '#4EB451',
  red: '#E46B50', border: '#E7E7EB', chart: '#F16D66',
};

export const theme = {
  ...MD3LightTheme,
  roundness: 5,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: '#FFFFFF',
    primaryContainer: colors.pale,
    onPrimaryContainer: '#087FA2',
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.background,
    onSurface: colors.text,
    onSurfaceVariant: colors.muted,
    outline: '#B7B8C0',
    outlineVariant: colors.border,
    error: '#C44938',
    elevation: {...MD3LightTheme.colors.elevation, level1: '#FFFFFF', level2: '#FFFFFF', level3: '#FFFFFF'},
  },
};

export const ui = StyleSheet.create({
  fill: {flex: 1, backgroundColor: colors.background},
  page: {padding: 16, paddingBottom: 110, gap: 16},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 18},
  row: {flexDirection: 'row', alignItems: 'center', gap: 8},
  between: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8},
  wrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  grow: {flex: 1},
  gap: {gap: 14},
  card: {backgroundColor: colors.surface, borderRadius: 18, padding: 18, gap: 14},
  heading: {fontSize: 23, fontWeight: '700', color: colors.text},
  section: {fontSize: 20, color: colors.secondary, marginTop: 6},
  label: {fontSize: 16, color: colors.secondary},
  muted: {fontSize: 13, color: colors.muted, lineHeight: 20},
  amount: {fontSize: 18, fontWeight: '600', color: colors.green, fontVariant: ['tabular-nums']},
  total: {fontSize: 21, fontWeight: '700', color: colors.primary, fontVariant: ['tabular-nums']},
  error: {backgroundColor: '#FCEBE7', borderRadius: 12, padding: 12, gap: 6},
  errorText: {color: '#A53E2E', fontSize: 14, lineHeight: 20},
  info: {backgroundColor: '#E8F4F8', borderRadius: 12, padding: 12},
  fab: {position: 'absolute', right: 20, bottom: 20, borderRadius: 32, backgroundColor: colors.primary},
  dotted: {flex: 1, minWidth: 6, height: 1, borderBottomWidth: 1, borderStyle: 'dotted', borderColor: '#CED0D7', alignSelf: 'flex-end', marginBottom: 7},
  chip: {backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border},
  chipSelected: {backgroundColor: colors.pale, borderColor: colors.pale},
  field: {backgroundColor: colors.surface},
  horizontal: {gap: 8, paddingVertical: 4},
  tab: {flex: 1, alignItems: 'center', paddingVertical: 12, gap: 7},
  tabLabel: {fontSize: 16, color: colors.secondary},
  tabActive: {fontWeight: '700', color: colors.text},
  underline: {width: 44, height: 4, borderRadius: 3, backgroundColor: colors.primary},
  underlineEmpty: {width: 44, height: 4},
  divider: {marginVertical: 4, backgroundColor: colors.border},
  badge: {minWidth: 40, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 8, alignItems: 'center'},
});
