'use client';
import { useState, type InputHTMLAttributes } from 'react';
import { Icon } from '../Icon.tsx';

/**
 * A password field with a show/hide button. The button is a real toggle (aria-pressed, named for what it does now),
 * keeps the caret where it was, and never submits the form. The value always reads left to right.
 */
export function PasswordInput({ show, hide, ...input }: { show: string; hide: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'dir'>) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="pw-field">
      <input {...input} className={input.className ?? 'input'} type={visible ? 'text' : 'password'} dir="ltr" spellCheck={false} autoCapitalize="off" />
      <button
        type="button"
        className="pw-field__toggle"
        aria-label={visible ? hide : show}
        aria-pressed={visible}
        aria-controls={input.id}
        onMouseDown={(e) => e.preventDefault() /* keep focus and caret in the field */}
        onClick={() => setVisible((v) => !v)}
      >
        <Icon name={visible ? 'eyeOff' : 'eye'} />
      </button>
    </span>
  );
}
