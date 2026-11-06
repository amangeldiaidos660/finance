import React, {useId, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Defs, LinearGradient, Path, Rect, Stop} from 'react-native-svg';

export function CardAccent({position = 'bottom'}: {position?: 'top' | 'bottom'}) {
  const gradient = 'card-accent-' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const [size, setSize] = useState({width: 0, height: 0});
  const width = size.width * 0.62;
  const height = Math.min(size.height, width * 250 / 480);
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.clip} onLayout={({nativeEvent}) => {
    const {width: nextWidth, height: nextHeight} = nativeEvent.layout;
    setSize(previous => previous.width === nextWidth && previous.height === nextHeight ? previous : {width: nextWidth, height: nextHeight});
  }}>
    {width > 0 && height > 0 && <Svg width={width} height={height} viewBox="0 0 480 250" preserveAspectRatio="none" style={[styles.graph, position === 'top' ? {top: 0} : {bottom: 0}]}>
      <Defs><LinearGradient id={gradient} x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0%" stopColor="#E0F8FF" stopOpacity={0}/><Stop offset="100%" stopColor="#DDF7FE" stopOpacity={1}/></LinearGradient></Defs>
      <Rect width={480} height={250} fill={'url(#' + gradient + ')'}/>
      <Path d="M 58 237 L 150 135 Q 171 112 201 112 L 418 112 Q 450 112 475 80 M 155 237 L 358 3" fill="none" stroke="#42D3F4" strokeWidth={1.6} strokeLinecap="round"/>
    </Svg>}
  </View>;
}

const styles = StyleSheet.create({
  clip: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 24, overflow: 'hidden'},
  graph: {position: 'absolute', right: 0},
});
