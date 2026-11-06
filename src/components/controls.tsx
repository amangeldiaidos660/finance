import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Button as PaperButton, Chip as PaperChip, IconButton as PaperIconButton, SegmentedButtons as PaperSegmentedButtons, TextInput as PaperTextInput} from 'react-native-paper';
import {colors, ui} from '../theme/theme';

export function Button({style, contentStyle, labelStyle, mode = 'text', buttonColor, ...props}: React.ComponentProps<typeof PaperButton>) {
  const iconLabelStyle = props.icon || props.loading ? {marginHorizontal: props.compact ? 8 : mode === 'text' ? 16 : 24} : undefined;
  return <PaperButton {...props} rippleColor="transparent" mode={mode} buttonColor={buttonColor ?? (mode === 'outlined' ? colors.surface : undefined)} style={[ui.button, style]} contentStyle={[ui.buttonContent, contentStyle]} labelStyle={[ui.buttonLabel, iconLabelStyle, labelStyle]}/>;
}

export function Chip({style, textStyle, selected, disabled, ...props}: React.ComponentProps<typeof PaperChip>) {
  return <PaperChip {...props} rippleColor="transparent" selected={selected} disabled={disabled} elevated={false} showSelectedOverlay={false} style={[ui.chip, selected && ui.chipSelected, style]} textStyle={[styles.chipText, {color: disabled ? '#969EAC' : selected ? colors.primaryText : colors.secondary}, textStyle]}/>;
}

export function TextInput({mode = 'flat', style, outlineStyle, underlineStyle, outlineColor, activeOutlineColor, underlineColor, activeUnderlineColor, ...props}: React.ComponentProps<typeof PaperTextInput>) {
  if (mode === 'outlined') {
    return <PaperTextInput dense textColor={colors.text} {...props} mode="outlined" style={[ui.field, style]} outlineColor={outlineColor ?? 'transparent'} activeOutlineColor={activeOutlineColor ?? 'transparent'} outlineStyle={[styles.outline, outlineStyle]}/>;
  }
  return <PaperTextInput dense textColor={colors.text} {...props} mode="flat" style={[ui.field, style]} underlineColor={underlineColor ?? 'transparent'} activeUnderlineColor={activeUnderlineColor ?? 'transparent'} underlineStyle={[styles.underline, underlineStyle]}/>;
}

export function IconButton({style, mode, iconColor, ...props}: React.ComponentProps<typeof PaperIconButton>) {
  return <PaperIconButton {...props} rippleColor="transparent" mode={mode} iconColor={iconColor ?? colors.muted} style={[ui.iconButton, mode === 'outlined' && styles.iconSurface, style]}/>;
}

export function SegmentedButtons(props: React.ComponentProps<typeof PaperSegmentedButtons>) {
  return <PaperSegmentedButtons {...props} style={[styles.segments, props.style]} buttons={props.buttons.map(button => ({...button, rippleColor: 'transparent', checkedColor: colors.primaryText, uncheckedColor: colors.text, style: [styles.segment, button.style], labelStyle: [ui.buttonLabel, button.labelStyle]}))}/>;
}

export function Switch({value, onValueChange, disabled = false, accessibilityLabel}: {value: boolean; onValueChange: (value: boolean) => void; disabled?: boolean; accessibilityLabel?: string}) {
  return <Pressable accessibilityRole="switch" accessibilityState={{checked: value, disabled}} accessibilityLabel={accessibilityLabel} disabled={disabled} onPress={() => onValueChange(!value)} style={styles.switchTouch}>
    <View style={[styles.switchTrack, {backgroundColor: value ? colors.primary : colors.track}]}><View style={[styles.switchThumb, {alignSelf: value ? 'flex-end' : 'flex-start'}]}/></View>
  </Pressable>;
}

const styles = StyleSheet.create({
  switchTouch: {minWidth: 40, minHeight: 36, justifyContent: 'center', alignItems: 'center'},
  switchTrack: {width: 32, height: 18, borderRadius: 9, padding: 2},
  switchThumb: {width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFFFFF'},
  outline: {borderRadius: 16},
  underline: {display: 'none'},
  chipText: {fontSize: 14, fontWeight: '400', letterSpacing: 0, marginVertical: 6},
  iconSurface: {backgroundColor: colors.background},
  segments: {backgroundColor: colors.field, padding: 5, borderRadius: 20, gap: 4},
  segment: {borderWidth: 0, borderRadius: 15, borderTopLeftRadius: 15, borderBottomLeftRadius: 15, borderTopRightRadius: 15, borderBottomRightRadius: 15, overflow: 'hidden'},
});
