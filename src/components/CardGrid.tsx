import React from 'react';
import {StyleSheet, View} from 'react-native';

export function CardGrid<T extends {id: string}>({items, renderItem}: {items: T[]; renderItem: (item: T, fullWidth: boolean) => React.ReactNode}) {
  const rows = Array.from({length: Math.ceil(items.length / 2)}, (_, index) => items.slice(index * 2, index * 2 + 2));
  return <View style={styles.grid}>{rows.map(row => <View key={row[0]!.id} style={styles.row}>
    {row.map(item => <View key={item.id} style={styles.cell}>{renderItem(item, row.length === 1)}</View>)}
  </View>)}</View>;
}

const styles = StyleSheet.create({
  grid: {gap: 12},
  row: {flexDirection: 'row', gap: 12, alignItems: 'stretch'},
  cell: {flex: 1, minWidth: 0},
});
