import React, {
  ReactNode,
  RefObject,
  MutableRefObject,
  forwardRef,
  useRef,
  useState,
  useEffect,
  useImperativeHandle
} from 'react';
import {
  StyleSheet,
  StyleProp,
  TextInputProps,
  TextStyle,
  ViewStyle,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  TextInputKeyPressEventData,
  I18nManager,
  TextInput,
  View
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Cell } from './Cell';

const styles = StyleSheet.create({
  containerDefault: {},
  cellDefault: {
    borderColor: 'gray',
    borderWidth: 1,
  },
  cellFocusedDefault: {
    borderColor: 'black',
    borderWidth: 2,
  },
  textStyleDefault: {
    color: 'gray',
    fontSize: 24,
  },
  textStyleFocusedDefault: {
    color: 'black',
  },
});

export type Props = {
  value?: string;
  codeLength?: number;
  cellSize?: number;
  cellSpacing?: number;
  placeholder?: string | ReactNode;
  mask?: string | ReactNode;
  maskDelay?: number;

  password?: boolean;
  autoFocus?: boolean;
  restrictToNumbers?: boolean;

  containerStyle?: StyleProp<ViewStyle>;
  cellStyle?: StyleProp<ViewStyle>;
  cellStyleFilled?: StyleProp<ViewStyle>;
  cellStyleFocused?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  textStyleFocused?: StyleProp<TextStyle>;

  animated?: boolean;
  animationFocused?: Animatable.Animation;

  onFulfill?: (value: string) => void;
  onChangeText?: TextInputProps['onChangeText'];
  onBackspace?: () => void;
  onTextChange?: TextInputProps['onChangeText'];
  testID?: string;

  onFocus?: TextInputProps['onFocus'],
  onBlur?: TextInputProps['onBlur'],
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad';
  editable?: boolean;
  inputProps?: TextInputProps;
  
  disableFullscreenUI?: boolean;
};

type AnimationOpts = { animation?: Animatable.Animation, duration?: number};
export type ControlsViaRefApi = {
  animate: (opts?: AnimationOpts) => Promise<unknown>;
  shake: () => Promise<unknown>;
  focus: () => void;
  blur: () => void;
  clear: () => void;
};

export const PACKAGE_SELECTOR_PREFIX = 'rn-resmooth-pincode-input';
  
export const SmoothPinCodeInput = forwardRef(({
  value = '',
  placeholder = '',
  codeLength = 4,
  password = false,
  cellSize = 48,
  cellSpacing = 4,
  cellStyle = styles.cellDefault,
  cellStyleFocused = styles.cellFocusedDefault,
  containerStyle = styles.containerDefault,
  animated = true,
  animationFocused = 'pulse',
  mask = '*',
  maskDelay = 200,
  autoFocus = false,
  textStyle = styles.textStyleDefault,
  textStyleFocused = styles.textStyleFocusedDefault,
  disableFullscreenUI = true,
  restrictToNumbers = false,
  editable = true,
  keyboardType = 'numeric',
  inputProps = {},
  onTextChange,
  onFulfill,
  onFocus,
  onBlur,
  onBackspace,
  testID,
}: Props, ref) => {
  const [focused, setFocused] = useState(false);
  const [shouldDelayShowingMask, setShouldDelayShowingMask] = useState(false);
  const animatedViewRef = useRef() as RefObject<Animatable.View & View>;
  const inputRef = useRef() as MutableRefObject<TextInput>;
  const maskDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>();

  const onCodeEntered = (code: string) => {
    if (restrictToNumbers) {
      code = (code.match(/[0-9]/g) || []).join('');
    }

    onTextChange?.(code);

    if (code.length === codeLength) {
      onFulfill?.(code);
    }

    // handle password mask
    // only when input new char
    const shouldDelayShowingMask = password && code.length > value.length;

    setShouldDelayShowingMask(shouldDelayShowingMask);

    if (shouldDelayShowingMask) { // mask password after delay
      if (maskDelayTimeoutRef.current) {
        clearTimeout(maskDelayTimeoutRef.current);
      }
      maskDelayTimeoutRef.current = setTimeout(() => {
        setShouldDelayShowingMask(false);
      }, maskDelay);
    }
  };

  const onKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (event.nativeEvent.key === 'Backspace' && value === '') {
      onBackspace?.();
    }
  };

  const onFocused = (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
    console.log('Focused!');
    setFocused(true);
    onFocus?.(event);
  };

  const onBlurred = (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocused(false);
    onBlur?.(event);
  };

  const animate = ({ animation = 'shake', duration = 650 }: AnimationOpts) => {
    if (!animated) {
      return new Promise((_, reject) => reject(new Error('Animations are disabled')));
    }
    return animatedViewRef.current?.[animation]?.(duration);
  };

  const controlsViaRefApi = {
    animate,
    shake: () => animate({animation: 'shake'}),
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    clear: () => inputRef.current?.clear(),
  } as ControlsViaRefApi;

  useImperativeHandle(ref, () => controlsViaRefApi);

  useEffect(() => {
    if (!ref) {
      return;
    }

    // API for controlling basic features via refs
    (ref as MutableRefObject<ControlsViaRefApi>).current = {
      animate,
      shake: () => animate({animation: 'shake'}),
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => inputRef.current?.clear(),
    } as ControlsViaRefApi;
  }, [inputRef.current]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef.current]);

  return (
    <Animatable.View
      ref={animatedViewRef}
      style={[getStyleForAnimatableViewContainer(cellSize, codeLength, cellSpacing), containerStyle]}
    >
      <View
        testID={`${PACKAGE_SELECTOR_PREFIX}-cells-wrapper`}
        style={{
          position: 'absolute', margin: 0, height: '100%',
          flexDirection: I18nManager.isRTL ? 'row-reverse': 'row',
          alignItems: 'center',
        }}
      >
        { Array(codeLength).fill(undefined).map((_, idx) => {
          const pinCodeChar = value.charAt(idx);
          const filled = idx < value.length;
          const isLastCell = idx === value.length - 1;

          return (
            <Cell
              key={idx}
              testID={`${PACKAGE_SELECTOR_PREFIX}-cell-${idx}`}
              value={pinCodeChar}
              focused={focused && idx === value.length}
              filled={filled}
              mask={mask}
              animated={animated}
              animationFocused={animationFocused}
              showMask={filled && (password && (!shouldDelayShowingMask || !isLastCell))}
              placeholder={placeholder}
              cellSize={cellSize}
              cellSpacing={cellSpacing}
              cellStyle={cellStyle}
              textStyle={textStyle}
              textStyleFocused={textStyleFocused}
              cellStyleFocused={cellStyleFocused}
            />
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        value={value}
        disableFullscreenUI={disableFullscreenUI}
        onChangeText={onCodeEntered}
        onKeyPress={onKeyPress}
        onFocus={onFocused}
        onBlur={onBlurred}
        spellCheck={false}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        numberOfLines={1}
        caretHidden
        maxLength={codeLength}
        selection={{
          start: value.length,
          end: value.length,
        }}
        style={{
          flex: 1,
          opacity: 0,
          textAlign: 'center',
        }}
        testID={testID ?? `${PACKAGE_SELECTOR_PREFIX}-input`}
        editable={editable}
        {...inputProps} />
    </Animatable.View>
  );
});
SmoothPinCodeInput.displayName = 'SmoothPinCodeInput';

const getStyleForAnimatableViewContainer = (cellSize: number, codeLength: number, cellSpacing: number) => {
  return {
    alignItems: 'stretch',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
    width: cellSize * codeLength + cellSpacing * (codeLength - 1),
    height: cellSize,
  } as ViewStyle;
};
