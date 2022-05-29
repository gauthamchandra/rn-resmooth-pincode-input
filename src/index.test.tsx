import React, { MutableRefObject, useState, createRef, forwardRef } from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { SmoothPinCodeInput, ControlsViaRefApi, PACKAGE_SELECTOR_PREFIX } from './index';

describe('<SmoothPinCodeInput />', () => {
  const INPUT_TEST_ID = `${PACKAGE_SELECTOR_PREFIX}-input`;

  beforeEach(() => {
    jest.resetModules();
  });

  describe('Rendering', () => {
    it('renders the correct amount of cells as specified by the code length and in the correct order', () => {
      const props = { codeLength: 8, value: '12345678' };
      // first try left to right (for languages like English)
      const { getAllByTestId } = setup(props);
      const cells = getAllByTestId(`${PACKAGE_SELECTOR_PREFIX}-cell-`, { exact: false });

      expect(cells).toHaveLength(8);

      cells.forEach((cell, idx) => {
        expect(cell).toHaveTextContent(props.value.charAt(idx));
      });
    });

    it('renders the cells in reverse order when dealing with right to left (RTL) languages via flex-direction', () => {
      jest.isolateModules(() => {
        jest.doMock('react-native/Libraries/ReactNative/I18nManager', () => {
          const original = jest.requireActual('react-native/Libraries/ReactNative/I18nManager');

          return {
            ...original,
            isRTL: true,
          };
        });

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { SmoothPinCodeInput, PACKAGE_SELECTOR_PREFIX } = require('./index');
        const { getByTestId } = setup({ value: '123', codeLength: 8 });
        
        expect(getByTestId(`${PACKAGE_SELECTOR_PREFIX}-cells-wrapper`, SmoothPinCodeInput)).toHaveStyle({ flexDirection: 'row-reverse' });
      });
    });

    it('renders text input as invisible with "opacity: 0" so that only the cells are shown to reflect a formatted pin view', () => {
      const { getByTestId } = setup({ codeLength: 4 });
      expect(getByTestId(INPUT_TEST_ID)).toHaveStyle({ opacity: 0 });
    });

    it('renders password fields with a mask for security', () => {
      let api = setup({ value: '1234', codeLength: 4, password: true });
      let cells = api.getAllByTestId(`${PACKAGE_SELECTOR_PREFIX}-cell-`, { exact: false });

      // each cell should have it be masked.
      cells.forEach(cell => {
        expect(cell).toHaveTextContent('*');
      });

      // change the mask to a totally different character as thats an option provided by the component
      api = setup({ value: '1234', mask: '?', codeLength: 4, password: true });
      cells = api.getAllByTestId(`${PACKAGE_SELECTOR_PREFIX}-cell-`, { exact: false });

      cells.forEach(cell => {
        expect(cell).toHaveTextContent('?');
      });
    });
  });

  describe('Interactions', () => {
    it('calls onChangeText() when a user types in the input', () => {
      const onTextChange = jest.fn();
      const { getByTestId } = setup({ codeLength: 4, onTextChange });
      
      fireEvent.changeText(getByTestId(INPUT_TEST_ID), '1234');
      expect(onTextChange).toHaveBeenCalledWith('1234');
    });

    it('strips all non-numeric characters from the input before firing onTextChange() if the "restrictToNumbers" prop is enabled', () => {
      const onTextChange = jest.fn();

      // first try without restricting numbers.
      let api = setup({ codeLength: 4, onTextChange, restrictToNumbers: false });

      fireEvent.changeText(api.getByTestId(INPUT_TEST_ID), 'Hello123World');
      expect(onTextChange).toHaveBeenCalledWith('Hello123World');

      // now try with only numbers
      api = setup({ codeLength: 4, onTextChange, restrictToNumbers: true });

      fireEvent.changeText(api.getByTestId(INPUT_TEST_ID), 'Hello123World');
      expect(onTextChange).toHaveBeenCalledWith('123');
    });

    it('calls onBackspace() only when the user hit backspace on an empty input', () => {
      const props = { value: '123', codeLength: 4, onBackspace: jest.fn() };
      const { getByTestId, rerender } = setup(props);

      fireEvent(getByTestId(INPUT_TEST_ID), 'onKeyPress', {
        nativeEvent: {
          key: 'Backspace',
        }
      });
      expect(props.onBackspace).not.toHaveBeenCalled();

      rerender(<SmoothPinCodeInput {...{...props, value: '12'}} />);
      fireEvent(getByTestId(INPUT_TEST_ID), 'onKeyPress', {
        nativeEvent: {
          key: 'Backspace',
        }
      });
      expect(props.onBackspace).not.toHaveBeenCalled();

      rerender(<SmoothPinCodeInput {...{...props, value: '1'}} />);
      fireEvent(getByTestId(INPUT_TEST_ID), 'onKeyPress', {
        nativeEvent: {
          key: 'Backspace',
        }
      });
      expect(props.onBackspace).not.toHaveBeenCalled();

      rerender(<SmoothPinCodeInput {...{...props, value: ''}} />);
      fireEvent(getByTestId(INPUT_TEST_ID), 'onKeyPress', {
        nativeEvent: {
          key: 'Backspace',
        }
      });
      expect(props.onBackspace).toHaveBeenCalled();
    });

    it('calls onFulfill() when all characters in the input have been entered', () => {
      const props = { value: '12', codeLength: 4, onFulfill: jest.fn() };
      const { getByTestId } = setup(props);

      // try when the input is not full
      fireEvent.changeText(getByTestId(INPUT_TEST_ID), '123');
      expect(props.onFulfill).not.toHaveBeenCalled();

      // try again with the input becoming full. This should trigger the handler
      fireEvent.changeText(getByTestId(INPUT_TEST_ID), '1234');
      expect(props.onFulfill).toHaveBeenCalledWith('1234');
    });

    it('passes the testID to the input component if specified', () => {
      const props = { value: '12', codeLength: 4, onTextChange: jest.fn(), testID: 'hidden-input' };
      const { getByTestId } = setup(props);

      expect(getByTestId(INPUT_TEST_ID)).toBeDefined();
      fireEvent.changeText(getByTestId('hidden-input'), '123');
    });

    it.only('calls onFocus() when a user taps on the input', () => {
      const props = { value: '12', codeLength: 4, onFocus: jest.fn() };
      const { debug, getByTestId } = setup(<TestComponent {...props} />);

      debug();

      fireEvent.press(getByTestId(INPUT_TEST_ID), '123');
      expect(props.onFocus).toHaveBeenCalled();
    });

    it('delays showing the mask for a brief period (specified by "maskDelay" prop) for password fields when user types a character', async () => {
      const props = { value: '123', codeLength: 4, password: true, maskDelay: 100 };
      const { getByTestId, getAllByTestId } = render(<TestComponent {...props} />);

      act(() => {
        // simulate a user typing in one more character
        fireEvent.changeText(getByTestId(INPUT_TEST_ID), '1234');
      });

      // initially, it should show the old characters masked but the newest character should NOT be masked so they know
      // what they entered.
      let cells = getAllByTestId(`${PACKAGE_SELECTOR_PREFIX}-cell-`, { exact: false });

      cells.forEach((cell, idx) => {
        if (idx === cells.length - 1) {
          expect(cell).toHaveTextContent('4');
        } else {
          expect(cell).toHaveTextContent('*');
        }
      });

      await act(async () => {
        // wait the delay we specified for the update to trigger
        await wait(props.maskDelay);

        // now check again. Everything should now be masked
        cells = getAllByTestId(`${PACKAGE_SELECTOR_PREFIX}-cell-`, { exact: false });

        cells.forEach(cell => {
          expect(cell).toHaveTextContent('*');
        });
      });
    });

    it('exposes an imperative API so you can interact with the text input directly especially to focus/blur the input', () => {
      const inputRef = createRef() as MutableRefObject<ControlsViaRefApi>;
      const props = {
        testID: 'hidden-input',
        ref: inputRef,
        onFocus: jest.fn(),
        onBlur: jest.fn(),
        onTextChange: jest.fn(),
      };

      const { getByTestId } = render(<TestComponent {...props} />);

      // sanity check to make sure it rendered before asserting on the refs
      expect(getByTestId(`${PACKAGE_SELECTOR_PREFIX}-cells-wrapper`)).toBeDefined();

      expect(typeof inputRef.current.animate).toEqual('function');
      expect(typeof inputRef.current.shake).toEqual('function');
      expect(typeof inputRef.current.focus).toEqual('function');
      expect(typeof inputRef.current.blur).toEqual('function');

      //inputRef.current.focus();
      //expect(props.onFocus).toHaveBeenCalled();

      //console.log(inputRef.current.blur);
      //inputRef.current.blur();
      //expect(props.onBlur).toHaveBeenCalled();

      //inputRef.current.clear();
      //expect(props.onTextChange).toHaveBeenCalledWith('');
    });
  });

  const setup = (props: React.ComponentProps<typeof SmoothPinCodeInput>, ComponentTypeOverride?: typeof SmoothPinCodeInput) => {
    const Component = ComponentTypeOverride ? ComponentTypeOverride : SmoothPinCodeInput;
    return render(<Component {...props} />);
  };

  const TestComponent = forwardRef(({ value, testID, onTextChange, ...props }: React.ComponentProps<typeof SmoothPinCodeInput>, ref) => {
    const [code, setCode] = useState(value);

    const onCodeChanged = (newCode: string) => {
      setCode(newCode); 
      onTextChange?.(newCode);
    };
    return <SmoothPinCodeInput ref={ref} value={code} testID={testID} onTextChange={onCodeChanged} {...props}  />;
  });
  TestComponent.displayName = 'TestComponent';

  const wait = async (timeMs: number) => new Promise<void>(resolve => setTimeout(() => resolve(), timeMs));
});
