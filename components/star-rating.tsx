export type RatingGlyph = 'star' | 'dollar';

export function StarRating({
  rating,
  size = 'md',
  showNumber = false,
  glyph = 'star'
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  glyph?: RatingGlyph;
}) {
  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-2xl'
  };
  const full = Math.round(rating);
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
          {filled.repeat(5 - full)}
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
  defaultValue = 5
}: {
  name?: string;
  glyph?: RatingGlyph;
  required?: boolean;
  defaultValue?: number;
}) {
  const filled = glyph === 'dollar' ? '$' : '★';
  const activeCls =
    glyph === 'dollar'
      ? 'peer-checked:!text-[#2f9e44] hover:!text-[#2f9e44]'
      : 'peer-checked:!text-[color:var(--star)] hover:!text-[color:var(--star)]';
  return (
    <div
      className={`flex items-center gap-1 ${glyph === 'dollar' ? 'text-2xl font-bold' : 'text-3xl'}`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
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
            defaultChecked={n === defaultValue}
          />
          <span className={activeCls}>{filled}</span>
        </label>
      ))}
    </div>
  );
}
