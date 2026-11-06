import React from 'react';
import {useWindowDimensions, View} from 'react-native';
import {Text} from 'react-native-paper';
import Svg, {Circle, Line, Path, Rect, Text as SvgText} from 'react-native-svg';
import {money} from '../data/money';
import {colors, ui} from '../theme/theme';

export interface ChartSlice {id: string; name: string; value: number; color: string}
const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

export function DonutChart({items, totalLabel = 'Итого'}: {items: ChartSlice[]; totalLabel?: string}) {
  const size = Math.min(useWindowDimensions().width - 64, 310);
  const radius = size * 0.39;
  const circumference = 2 * Math.PI * radius;
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let progress = 0;
  return <View style={{alignItems: 'center', paddingVertical: 12}}>
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} accessibilityLabel={total ? `${totalLabel}: ${money(total)}` : 'Нет данных для диаграммы'}>
      <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.track} strokeWidth={20}/>
      {items.filter(item => item.value > 0).map(item => {
        const fraction = item.value / total;
        const offset = -progress * circumference;
        progress += fraction;
        return <Circle key={item.id} cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={item.color} strokeWidth={20} strokeDasharray={`${fraction * circumference} ${circumference}`} strokeDashoffset={offset} rotation={-90} origin={`${size / 2}, ${size / 2}`}/>;
      })}
      <SvgText x={size / 2} y={size / 2 - 10} textAnchor="middle" fontSize={14} fill={colors.muted}>{total ? totalLabel : 'Пока нет операций'}</SvgText>
      <SvgText x={size / 2} y={size / 2 + 18} textAnchor="middle" fontSize={14} fontWeight="400" fill={colors.text}>{money(total)}</SvgText>
    </Svg>
  </View>;
}

export function ChartLegend({items}: {items: ChartSlice[]}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return <View style={ui.gap}>{items.map(item => <View style={ui.row} key={item.id}>
    <View style={[ui.badge, {backgroundColor: item.color}]}><Text style={{color: '#FFFFFF', fontSize: 14}}>{total ? (item.value / total * 100).toFixed(1) : '0.0'}%</Text></View>
    <Text style={[ui.label, ui.grow]}>{item.name}</Text>
    <Text style={{color: item.value ? colors.secondary : colors.muted, fontSize: 14}}>{money(item.value)}</Text>
  </View>)}</View>;
}

function axisText(value: number): string {
  const tenge = value / 100;
  if (tenge >= 1_000_000) { return `${+(tenge / 1_000_000).toFixed(1)}м`; }
  if (tenge >= 1_000) { return `${+(tenge / 1_000).toFixed(1)}к`; }
  return String(Math.round(tenge));
}

export function MonthlyChart({values, second, color = colors.primary}: {values: number[]; second?: number[]; color?: string}) {
  const width = Math.max(240, useWindowDimensions().width - 68);
  const height = 242;
  const top = 20;
  const plotHeight = 158;
  const maximum = Math.max(...values, ...(second ?? []), 10_000);
  const upper = maximum * 1.1;
  const axisLabels = [0, 1, 2, 3, 4].map(tick => axisText(upper * (1 - tick / 4)));
  const left = Math.max(56, ...axisLabels.map(label => label.length * 9 + 12));
  const slot = (width - left - 10) / 12;
  const pointY = (value: number) => top + plotHeight * (1 - value / upper);
  const path = values.map((value, index) => `${index ? 'L' : 'M'} ${left + slot * (index + 0.5)} ${pointY(value)}`).join(' ');
  return <Svg width={width} height={height} accessibilityLabel={second ? 'Помесячное сравнение расходов и доходов' : 'Динамика по месяцам'}>
    {[0, 1, 2, 3, 4].map(tick => {
      const y = top + plotHeight * tick / 4;
      return <React.Fragment key={tick}><Line x1={left} x2={width - 5} y1={y} y2={y} stroke={colors.border} strokeDasharray="4 6"/><SvgText x={left - 6} y={y + 4} textAnchor="end" fontSize={14} fill={colors.muted}>{axisLabels[tick]}</SvgText></React.Fragment>;
    })}
    {second ? values.map((value, index) => <React.Fragment key={index}>
      <Rect x={left + slot * index + slot * 0.1} y={pointY(value)} width={slot * 0.34} height={plotHeight * value / upper} rx={2} fill={colors.red}/>
      <Rect x={left + slot * index + slot * 0.53} y={pointY(second[index] ?? 0)} width={slot * 0.34} height={plotHeight * (second[index] ?? 0) / upper} rx={2} fill={colors.green}/>
    </React.Fragment>) : <><Path d={path} fill="none" stroke={color} strokeWidth={2.5}/>{values.map((value, index) => <Circle key={index} cx={left + slot * (index + 0.5)} cy={pointY(value)} r={3} fill={color}/>)}</>}
    {monthNames.map((label, index) => {
      const x = left + slot * (index + 0.5);
      const y = top + plotHeight + 12;
      return <SvgText key={label} x={x} y={y} rotation={-90} origin={[x, y]} textAnchor="end" fontSize={14} fill={colors.muted}>{label}</SvgText>;
    })}
  </Svg>;
}
