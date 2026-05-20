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
  const filled = glyph === 'dollar' ? '$' : '★';
  const activeCls =
    glyph === 'dollar'
      ? 'peer-checked:!text-[#2f9e44] hover:!text-[#2f9e44]'
      : 'peer-checked:!text-[color:var(--star)] hover:!text-[color:var(--star)]';
  const initial = defaultValue ?? Math.ceil(levels / 2);
  return (
    <div
      className={`flex items-center gap-1 ${glyph === 'dollar' ? 'text-2xl font-bold' : 'text-3xl'}`}
    >
      {Array.from({ length: levels }, (_, i) => i + 1).map((n) => (
        <label
          key={n}
          className="cursor-pointer transition-colors"
          style={{ color: 'var(--border-strong)' }}
        >
          <input
            type="radio"
            name={name}
            value={n}
            className="sr-only peer"
            required={required && n === 1}
            defaultChecked={n === initial}
          />
          <span className={activeCls}>{filled}</span>
        </label>
      ))}
    </div>
  );
}
