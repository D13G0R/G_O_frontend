import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-time-picker',
  templateUrl: './time-picker.html',
  styleUrl: './time-picker.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimePicker),
      multi: true,
    },
  ],
})
export class TimePicker implements ControlValueAccessor {
  readonly hours = Array.from({ length: 12 }, (_, index) => index + 1);
  readonly minuteStep = 5;

  selectedHour: number | null = null;
  selectedMinute: number | null = null;
  period: 'AM' | 'PM' = 'AM';
  disabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  get minuteOptions(): number[] {
    const options = Array.from(
      { length: Math.ceil(60 / this.minuteStep) },
      (_, index) => index * this.minuteStep,
    );

    if (
      this.selectedMinute !== null &&
      !options.includes(this.selectedMinute)
    ) {
      options.push(this.selectedMinute);
      options.sort((left, right) => left - right);
    }

    return options;
  }

  writeValue(value: string | null | undefined): void {
    const match = /^(\d{1,2}):(\d{2})/.exec(value ?? '');

    if (!match) {
      this.selectedHour = null;
      this.selectedMinute = null;
      this.period = 'AM';
      return;
    }

    const hours24 = Number(match[1]);
    const minutes = Number(match[2]);

    if (
      Number.isNaN(hours24) ||
      Number.isNaN(minutes) ||
      hours24 < 0 ||
      hours24 > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      this.selectedHour = null;
      this.selectedMinute = null;
      this.period = 'AM';
      return;
    }

    this.period = hours24 >= 12 ? 'PM' : 'AM';
    this.selectedHour = hours24 % 12 || 12;
    this.selectedMinute = minutes;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onHourChange(value: string): void {
    this.selectedHour = value ? Number(value) : null;
    this.emitValue();
  }

  onMinuteChange(value: string): void {
    this.selectedMinute = value ? Number(value) : null;
    this.emitValue();
  }

  setPeriod(period: 'AM' | 'PM'): void {
    if (this.disabled) {
      return;
    }

    this.period = period;
    this.emitValue();
  }

  onBlur(): void {
    this.onTouched();
  }

  formatNumber(value: number): string {
    return value.toString().padStart(2, '0');
  }

  private emitValue(): void {
    if (this.selectedHour === null || this.selectedMinute === null) {
      this.onChange('');
      return;
    }

    const hours24 =
      this.period === 'AM'
        ? this.selectedHour === 12
          ? 0
          : this.selectedHour
        : this.selectedHour === 12
          ? 12
          : this.selectedHour + 12;

    this.onChange(
      `${this.formatNumber(hours24)}:${this.formatNumber(this.selectedMinute)}:00`,
    );
  }
}
