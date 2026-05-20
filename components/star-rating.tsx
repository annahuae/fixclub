'use client';

import { useState } from 'react';

export type RatingGlyph = 'star' | 'dollar';

export function StarRating({
  rating,
  size = 'md',
  showNumber = false,
  glyph = 'star',
  levels = 5
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  glyph?: RatingGlyph;
  levels?: number;
}) {
  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-2xl'
  };
  const full = Math.max(0, Math.min(levels, Math.round(rating)));
  const filled = glyph === 'dollar' ? '$' : '★';
  const active = glyph === 'dollar' ? '#2f9e44' : 'var(--star)';
  return (
    <span className={`inline-flex items-center gap-1.5 ${sizes[size]}`}>
      <span
        className={glyph === 'dollar' ? 'font-bold' : 'tracking-tight'}
        style={{ color: active }}
      >
        {filled.repeat(full)}
        <span style={{ color: 'var(--border-strong)' }}>
          {filled.repeat(levels - full)}
        </span>
      </span>
      {showNumber && (
        <span className="text-ink font-semibold">{rating.toFixed(1)}</span>
      )}
    </span>
  );
}

export function StarInput({
  name = 'rating',
  glyph = 'star',
  required = true,
  defaultValue,
  levels = 5
}: {
  name?: string;
  glyph?: RatingGlyph;
  required?: boolean;
  defaultValue?: number;
  levels?: number;
}) {
  const initial = defaultValue ?? Math.ceil(levels / 2);
  const [value, setValue] = useState(initial);
  const [hovered, setHovered] = useState<number | null>(null);
  const filled = glyph === 'dollar' ? '$' : '★';
  const activeColor = glyph === 'dollar' ? '#2f9e44' : 'var(--star)';
  const dimColor = 'var(--border-strong)';
  const shown = hovered ?? value;

  return (
    <div
      className={`flex items-center gap-1 ${glyph === 'dollar' ? 'text-2xl font-bold' : 'text-3xl'}`}
      onMouseLeave={() => setHovered(null)}
    >
      <input
        type="hidden"
        name={name}
        value={value}
        required={required && value < 1}
      />
      {Array.from({ length: levels }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} ${glyph === 'dollar' ? 'dollar signs' : 'stars'}`}
          onClick={() => setValue(n)}
          onMouseEnter={() => setHovered(n)}
          className="cursor-pointer transition-colors leading-none"
          style={{ color: n <= shown ? activeColor : dimColor }}
        >
          {filled}
        </button>
      ))}
    </div>
  );
}
