'use client';

import { useState } from 'react';

function generate(): string {
  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 12; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}

export function PasswordField({
  name = 'password',
  label = 'Password',
  hint
}: {
  name?: string;
  label?: string;
  hint?: string;
}) {
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="label">{label}</label>
        <button
          type="button"
          onClick={() => {
            const p = generate();
            setValue(p);
            setVisible(true);
          }}
          className="text-xs text-accent hover:underline mb-1.5"
        >
          Generate
        </button>
      </div>
      <div className="relative">
        <input
          name={name}
          type={visible ? 'text' : 'password'}
          required
          minLength={6}
          autoComplete="new-password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input pr-16 font-mono"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-mid hover:text-accent px-2 py-1"
        >
          {visible ? 'hide' : 'show'}
        </button>
      </div>
      {hint && <p className="text-xs text-ink-dim mt-1">{hint}</p>}
    </div>
  );
}
