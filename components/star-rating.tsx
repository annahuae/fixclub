export function StarRating({
  rating,
  size = 'md',
  showNumber = false
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}) {
  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-2xl'
  };
  const full = Math.round(rating);
  return (
    <span className={`inline-flex items-center gap-1.5 ${sizes[size]}`}>
      <span className="tracking-tight" style={{ color: 'var(--star)' }}>
        {'★'.repeat(full)}
        <span style={{ color: 'var(--border-strong)' }}>
          {'★'.repeat(5 - full)}
        </span>
      </span>
      {showNumber && (
        <span className="text-ink font-semibold">{rating.toFixed(1)}</span>
      )}
    </span>
  );
}

export function StarInput({ name = 'rating' }: { name?: string }) {
  return (
    <div className="flex items-center gap-1 text-3xl">
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
            required={n === 1}
            defaultChecked={n === 5}
          />
          <span className="peer-checked:!text-[color:var(--star)] hover:!text-[color:var(--star)]">
            ★
          </span>
        </label>
      ))}
    </div>
  );
}
