const PALETTE = [
  ['#fce8e6', '#b3261e'],
  ['#e8f0fe', '#1967d2'],
  ['#e6f4ea', '#188038'],
  ['#fef7e0', '#a26b00'],
  ['#f3e8fd', '#7627bb'],
  ['#fde7f3', '#aa1670'],
  ['#e0f7fa', '#00838f']
];

function hashIndex(seed: string, mod: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

export function Avatar({
  name,
  size = 'md',
  seed
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  seed?: string;
}) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-base',
    lg: 'w-20 h-20 text-2xl'
  };
  const letter = (name || '?').trim().charAt(0).toUpperCase() || '?';
  const [bg, fg] = PALETTE[hashIndex(seed || name || '?', PALETTE.length)];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold shrink-0 ${sizes[size]}`}
      style={{ background: bg, color: fg }}
      aria-hidden
    >
      {letter}
    </span>
  );
}
