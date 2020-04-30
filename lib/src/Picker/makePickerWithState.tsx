import * as React from 'react';
import { useUtils } from '../_shared/hooks/useUtils';
import { ParsableDate } from '../constants/prop-types';
import { MaterialUiPickersDate } from '../typings/date';
import { KeyboardDateInput } from '../_shared/KeyboardDateInput';
import { usePickerState } from '../_shared/hooks/usePickerState';
import { ResponsiveWrapper } from '../wrappers/ResponsiveWrapper';
import { withDateAdapterProp } from '../_shared/withDateAdapterProp';
import { makeWrapperComponent } from '../wrappers/makeWrapperComponent';
import { PureDateInput, DateInputProps } from '../_shared/PureDateInput';
import { AnyPickerView, AllSharedPickerProps } from './SharedPickerProps';
import { SomeWrapper, ExtendWrapper, WrapperProps } from '../wrappers/Wrapper';
import { parsePickerInputValue, DateValidationError } from '../_helpers/date-utils';
import { Picker, ToolbarComponentProps, ExportedPickerProps, PickerProps } from './Picker';

type AllAvailableForOverrideProps = ExportedPickerProps<AnyPickerView>;

export interface MakePickerOptions<T extends unknown> {
  useValidation: (value: any, props: T) => boolean;
  useDefaultProps: (props: T & AllSharedPickerProps) => Partial<T> & { inputFormat: string };
  DefaultToolbarComponent: React.ComponentType<ToolbarComponentProps>;
}

export function makePickerWithStateAndWrapper<
  T extends AllAvailableForOverrideProps,
  TWrapper extends SomeWrapper = typeof ResponsiveWrapper
>(
  Wrapper: TWrapper,
  { useDefaultProps, useValidation, DefaultToolbarComponent }: MakePickerOptions<T>
) {
  const PickerWrapper = makeWrapperComponent<DateInputProps, ParsableDate, MaterialUiPickersDate>(
    Wrapper,
    {
      KeyboardDateInputComponent: KeyboardDateInput,
      PureDateInputComponent: PureDateInput,
    }
  );

  function PickerWithState(__props: T & AllSharedPickerProps & ExtendWrapper<TWrapper>) {
    const utils = useUtils();
    const defaultProps = useDefaultProps(__props);
    const allProps = { ...defaultProps, ...__props };

    const validationError = useValidation(allProps.value, allProps);
    const { pickerProps, inputProps, wrapperProps } = usePickerState<
      ParsableDate,
      MaterialUiPickersDate,
      DateValidationError
    >(allProps, {
      emptyValue: null,
      parseInput: parsePickerInputValue,
      areValuesEqual: (a, b) => utils.isEqual(a, b),
    });

    // Note that we are passing down all the value without spread.
    // It saves us >1kb gzip and make any prop available automatically on any level down.
    const { value, onChange, ...other } = allProps;
    const DateInputProps = { ...inputProps, ...other, validationError };

    return (
      <PickerWrapper
        DateInputProps={DateInputProps}
        wrapperProps={wrapperProps}
        {...((other as unknown) as WrapperProps)}
      >
        <Picker
          {...pickerProps}
          toolbarTitle={allProps.label || allProps.toolbarTitle}
          DateInputProps={DateInputProps}
          ToolbarComponent={other.ToolbarComponent || DefaultToolbarComponent}
          {...((other as unknown) as PickerProps<any>)}
        />
      </PickerWrapper>
    );
  }

  const FinalPickerComponent = withDateAdapterProp(PickerWithState);
  return React.forwardRef<HTMLInputElement, React.ComponentProps<typeof FinalPickerComponent>>(
    (props, ref) => <FinalPickerComponent {...(props as any)} forwardedRef={ref} />
  );
}
