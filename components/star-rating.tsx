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
    md: 'text-base',
    lg: 'text-2xl'
  };
  const full = Math.round(rating);
  return (
    <span className={`inline-flex items-center gap-1.5 ${sizes[size]}`}>
      <span className="text-accent tracking-tight">
        {'★'.repeat(full)}
        <span className="text-border">{'★'.repeat(5 - full)}</span>
      </span>
      {showNumber && (
        <span className="text-ink-dim font-mono text-xs">
          {rating.toFixed(1)}
        </span>
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
          className="cursor-pointer text-border has-[input:checked]:text-accent peer-has-[input:checked]:text-accent hover:text-accent transition-colors"
        >
          <input
            type="radio"
            name={name}
            value={n}
            className="sr-only peer"
            required={n === 1}
            defaultChecked={n === 5}
          />
          ★
        </label>
      ))}
    </div>
  );
}
