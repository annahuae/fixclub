'use client';

import { useState } from 'react';
import { updateName } from './actions';

export function EditableName({ name }: { name: string }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="flex items-baseline gap-3">
        <span className="text-lg font-semibold text-ink">{name}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-accent hover:underline"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form action={updateName} className="flex flex-wrap items-center gap-2">
      <input
        name="name"
        defaultValue={name}
        required
        maxLength={15}
        autoFocus
        className="input h-9 max-w-[16rem] text-sm"
      />
      <button type="submit" className="btn-primary h-9 text-xs">
        Save
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-xs text-ink-mid hover:text-ink"
      >
        Cancel
      </button>
    </form>
  );
}
