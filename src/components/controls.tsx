import React from 'react';
import {StyleSheet} from 'react-native';
import {Button as PaperButton, Chip as PaperChip, IconButton as PaperIconButton, SegmentedButtons as PaperSegmentedButtons, TextInput as PaperTextInput} from 'react-native-paper';
import {colors, ui} from '../theme/theme';

export function Button({style, contentStyle, labelStyle, mode = 'text', buttonColor, ...props}: React.ComponentProps<typeof PaperButton>) {
  return <PaperButton {...props} mode={mode} buttonColor={buttonColor ?? (mode === 'outlined' ? colors.surface : undefined)} style={[ui.button, style]} contentStyle={[ui.buttonContent, contentStyle]} labelStyle={[ui.buttonLabel, labelStyle]}/>;
}

export function Chip({style, textStyle, selected, disabled, ...props}: React.ComponentProps<typeof PaperChip>) {
  return <PaperChip {...props} selected={selected} disabled={disabled} elevated={false} showSelectedOverlay={false} style={[ui.chip, selected && ui.chipSelected, style]} textStyle={[styles.chipText, {color: disabled ? '#969EAC' : selected ? colors.primaryText : colors.secondary}, textStyle]}/>;
}

export function TextInput({mode = 'flat', style, outlineStyle, underlineStyle, outlineColor, activeOutlineColor, underlineColor, activeUnderlineColor, ...props}: React.ComponentProps<typeof PaperTextInput>) {
  if (mode === 'outlined') {
    return <PaperTextInput textColor={colors.text} {...props} mode="outlined" style={[ui.field, style]} outlineColor={outlineColor ?? 'transparent'} activeOutlineColor={activeOutlineColor ?? colors.primary} outlineStyle={[styles.outline, outlineStyle]}/>;
  }
  return <PaperTextInput textColor={colors.text} {...props} mode="flat" style={[ui.field, style]} underlineColor={underlineColor ?? 'transparent'} activeUnderlineColor={activeUnderlineColor ?? colors.primary} underlineStyle={[styles.underline, underlineStyle]}/>;
}

export function IconButton({style, mode, iconColor, ...props}: React.ComponentProps<typeof PaperIconButton>) {
  return <PaperIconButton {...props} mode={mode} iconColor={iconColor ?? colors.muted} style={[ui.iconButton, mode === 'outlined' && styles.iconSurface, style]}/>;
}

export function SegmentedButtons(props: React.ComponentProps<typeof PaperSegmentedButtons>) {
  return <PaperSegmentedButtons {...props} style={[styles.segments, props.style]} buttons={props.buttons.map(button => ({...button, checkedColor: colors.primaryText, uncheckedColor: colors.text, style: [styles.segment, button.style], labelStyle: [ui.buttonLabel, button.labelStyle]}))}/>;
}

const styles = StyleSheet.create({
  outline: {borderRadius: 16},
  underline: {display: 'none'},
  chipText: {fontSize: 14, fontWeight: '600', letterSpacing: 0, marginVertical: 10},
  iconSurface: {backgroundColor: colors.background},
  segments: {backgroundColor: colors.field, padding: 5, borderRadius: 20, gap: 4},
  segment: {borderWidth: 0, borderRadius: 15, borderTopLeftRadius: 15, borderBottomLeftRadius: 15, borderTopRightRadius: 15, borderBottomRightRadius: 15, overflow: 'hidden'},
});
