import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { formatDateSlash, parseDateToISO } from '../../lib/format';

export interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement> | { target: { value: string; name?: string } }) => void;
  placeholder?: string;
  className?: string;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Format a string of digits into DD/MM/YYYY with automatic slashes
 */
function formatDigitsToDateString(digits: string, isDeleting = false): string {
  const cleanDigits = digits.slice(0, 8);
  const len = cleanDigits.length;

  if (len === 0) return '';
  if (len < 2) return cleanDigits;
  if (len === 2) {
    return isDeleting ? cleanDigits : `${cleanDigits}/`;
  }
  if (len < 4) {
    return `${cleanDigits.slice(0, 2)}/${cleanDigits.slice(2)}`;
  }
  if (len === 4) {
    return isDeleting
      ? `${cleanDigits.slice(0, 2)}/${cleanDigits.slice(2)}`
      : `${cleanDigits.slice(0, 2)}/${cleanDigits.slice(2)}/`;
  }
  return `${cleanDigits.slice(0, 2)}/${cleanDigits.slice(2, 4)}/${cleanDigits.slice(4, 8)}`;
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      value = '',
      onChange,
      placeholder = 'DD/MM/YYYY',
      className = '',
      name,
      id,
      required,
      disabled,
      ...restProps
    },
    ref
  ) => {
    // Convert external value (which might be ISO YYYY-MM-DD or DD/MM/YYYY) to display DD/MM/YYYY
    const normalizeInitialValue = (val: string) => {
      if (!val) return '';
      // If ISO format YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
        return formatDateSlash(val.trim());
      }
      return val;
    };

    const [displayValue, setDisplayValue] = useState<string>(() => normalizeInitialValue(value));
    const inputRef = useRef<HTMLInputElement | null>(null);
    const hiddenDateRef = useRef<HTMLInputElement | null>(null);
    const isDeletingRef = useRef<boolean>(false);

    // Synchronize internal display value when external value changes
    useEffect(() => {
      setDisplayValue(normalizeInitialValue(value));
    }, [value]);

    // Dispatch change event to parent
    const triggerChange = (newVal: string) => {
      setDisplayValue(newVal);
      if (onChange) {
        onChange({
          target: {
            value: newVal,
            name: name || id || '',
          },
        } as any);
      }
    };

    // Handle key down for smooth Backspace and manual '/' typing
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = inputRef.current;
      if (!input) return;

      if (e.key === 'Backspace') {
        isDeletingRef.current = true;
        const cursor = input.selectionStart ?? 0;
        const selectionEnd = input.selectionEnd ?? 0;

        // If nothing is selected and cursor is right after a slash (e.g. "29/" or "29/09/")
        if (cursor === selectionEnd && (cursor === 3 || cursor === 6)) {
          e.preventDefault();
          // Remove both the slash and the digit before it
          const before = displayValue.slice(0, cursor - 2);
          const after = displayValue.slice(cursor);
          const nextVal = before + after;
          triggerChange(nextVal);
          requestAnimationFrame(() => {
            if (inputRef.current) {
              const newPos = Math.max(0, cursor - 2);
              inputRef.current.setSelectionRange(newPos, newPos);
            }
          });
          return;
        }
      } else {
        isDeletingRef.current = false;
      }

      // If user manually types '/' or '-'
      if (e.key === '/' || e.key === '-') {
        e.preventDefault();
        const cursor = input.selectionStart ?? 0;
        const currentVal = displayValue;

        // If user typed 1 digit day (e.g. "5"), pressing '/' makes it "05/"
        if (cursor === 1 && currentVal.length === 1 && /^\d$/.test(currentVal)) {
          const nextVal = `0${currentVal}/`;
          triggerChange(nextVal);
          return;
        }

        // If user typed 2 digits day (e.g. "29"), pressing '/' adds slash if not already there
        if (cursor === 2 && currentVal.length === 2 && /^\d{2}$/.test(currentVal)) {
          const nextVal = `${currentVal}/`;
          triggerChange(nextVal);
          return;
        }

        // If user typed single digit month (e.g. "29/5"), pressing '/' makes it "29/05/"
        const dmyMatch = currentVal.match(/^(\d{2})\/(\d)$/);
        if (dmyMatch && cursor === 4) {
          const nextVal = `${dmyMatch[1]}/0${dmyMatch[2]}/`;
          triggerChange(nextVal);
          return;
        }

        // If slash is already at position, just move forward
        if (currentVal[cursor] === '/') {
          input.setSelectionRange(cursor + 1, cursor + 1);
        }
      }
    };

    // Handle input change (typing or pasting)
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const nativeEvent = e.nativeEvent as InputEvent | undefined;
      const isDeleting = isDeletingRef.current || nativeEvent?.inputType === 'deleteContentBackward';

      // Extract all digits
      const digits = raw.replace(/\D/g, '').slice(0, 8);
      const formatted = formatDigitsToDateString(digits, isDeleting);
      triggerChange(formatted);
    };

    // Handle paste event (e.g. pasting 2005-09-29 or 29092005 or 29/09/2005)
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text').trim();

      // Check for ISO format: YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(pastedText)) {
        triggerChange(formatDateSlash(pastedText));
        return;
      }

      // Otherwise extract digits and format
      const digits = pastedText.replace(/\D/g, '').slice(0, 8);
      const formatted = formatDigitsToDateString(digits, false);
      triggerChange(formatted);
    };

    // Open native date picker when clicking calendar icon
    const handleOpenPicker = () => {
      if (disabled) return;
      if (hiddenDateRef.current) {
        if ('showPicker' in HTMLInputElement.prototype) {
          try {
            hiddenDateRef.current.showPicker();
          } catch {
            hiddenDateRef.current.focus();
            hiddenDateRef.current.click();
          }
        } else {
          hiddenDateRef.current.focus();
          hiddenDateRef.current.click();
        }
      }
    };

    // When a date is picked from native calendar
    const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isoVal = e.target.value; // YYYY-MM-DD
      if (isoVal) {
        const formatted = formatDateSlash(isoVal);
        triggerChange(formatted);
      }
    };

    // Calculate current ISO value for the hidden native date picker
    const currentIsoVal = parseDateToISO(displayValue);
    const isValidIso = /^\d{4}-\d{2}-\d{2}$/.test(currentIsoVal) ? currentIsoVal : '';

    return (
      <div className="relative flex items-center w-full">
        <input
          {...restProps}
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          type="text"
          id={id}
          name={name}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          maxLength={10}
          autoComplete="off"
          className={`w-full rounded-xl border border-input bg-background pl-3 pr-10 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono tracking-wide ${className}`}
        />

        {/* Calendar Picker Trigger Button */}
        <button
          type="button"
          tabIndex={-1}
          onClick={handleOpenPicker}
          disabled={disabled}
          title="Pick date from calendar"
          aria-label="Pick date from calendar"
          className="absolute right-2.5 p-1 text-muted-foreground hover:text-primary transition-colors focus:outline-none disabled:opacity-40"
        >
          <CalendarIcon className="size-4" />
        </button>

        {/* Hidden native date input for visual picker integration */}
        <input
          ref={hiddenDateRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          value={isValidIso}
          onChange={handleNativeDateChange}
          className="sr-only pointer-events-none absolute inset-0 opacity-0 -z-10"
        />
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';
export default DateInput;
