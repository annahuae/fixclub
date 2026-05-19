import Image from 'next/image';

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

const SIZES = {
  sm: { cls: 'w-8 h-8 text-xs', px: 32 },
  md: { cls: 'w-12 h-12 text-base', px: 48 },
  lg: { cls: 'w-20 h-20 text-2xl', px: 80 }
} as const;

export function Avatar({
  name,
  size = 'md',
  seed,
  photoUrl,
  fallback = 'initial'
}: {
  name: string;
  size?: keyof typeof SIZES;
  seed?: string;
  photoUrl?: string | null;
  fallback?: 'initial' | 'master' | 'shop';
}) {
  const { cls, px } = SIZES[size];

  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={name}
        width={px}
        height={px}
        className={`rounded-full object-cover shrink-0 ${cls}`}
      />
    );
  }

  if (fallback === 'master' || fallback === 'shop') {
    const src = fallback === 'shop' ? '/shop-default.png' : '/master-default.png';
    return (
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        className={`rounded-full object-cover bg-surface-2 shrink-0 ${cls}`}
      />
    );
  }

  const letter = (name || '?').trim().charAt(0).toUpperCase() || '?';
  const [bg, fg] = PALETTE[hashIndex(seed || name || '?', PALETTE.length)];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold shrink-0 ${cls}`}
      style={{ background: bg, color: fg }}
      aria-hidden
    >
      {letter}
    </span>
  );
}
