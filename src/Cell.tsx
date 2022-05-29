import React, { ReactNode } from 'react';
import { Text, StyleProp, TextStyle, ViewStyle } from 'react-native';
import * as Animatable from 'react-native-animatable';

type CellProps = {
  value: string;
  focused: boolean;
  filled: boolean;
  showMask: boolean; 
  cellSize: number;
  cellSpacing: number;

  mask?: string | ReactNode;
  maskDelay?: number;
  placeholder?: string | ReactNode;

  cellStyle?: StyleProp<ViewStyle>;
  cellStyleFilled?: StyleProp<ViewStyle>;
  cellStyleFocused?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  textStyleFocused?: StyleProp<TextStyle>;

  animated: boolean;
  animationFocused: Animatable.Animation;

  testID: string;
};

export const Cell = ({
  value,
  focused,
  filled,
  cellSize,
  cellSpacing,
  cellStyle,
  cellStyleFocused,
  textStyle,
  textStyleFocused,
  mask,
  showMask,
  placeholder,
  animated,
  animationFocused,
  testID,
}: CellProps) => {
  const isMaskText = typeof mask === 'string';
  const isPlaceholderText = typeof placeholder === 'string';
  const maskComponent = (showMask && !isMaskText) ? mask : null;
  const placeholderComponent = !isPlaceholderText ? placeholder : null;

  let cellText = null;
  if (filled || placeholder !== null) {
    if (showMask && isMaskText) {
      cellText = mask;
    } else if (!filled && isPlaceholderText) {
      cellText = placeholder;
    } else if (value) {
      cellText = value;
    }
  }
  const isCellText = typeof cellText === 'string';

  return (
    <Animatable.View
      testID={testID}
      style={[
        {
          width: cellSize,
          height: cellSize,
          marginLeft: cellSpacing / 2,
          marginRight: cellSpacing / 2,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        },
        cellStyle,
        focused ? cellStyleFocused : {},
        filled ? filled : {},
      ] as ViewStyle[]}

      animation={animated ? animationFocused : undefined}
      iterationCount="infinite"
      duration={500}
    >
      {isCellText && !maskComponent && 
        <Text style={[textStyle, focused ? textStyleFocused : {}]}>{cellText}</Text>
      }
      {(!isCellText && !maskComponent) && placeholderComponent}
      {isCellText && maskComponent}
    </Animatable.View>
  );
};

