import { buildMapsEmbedUrl } from '@/lib/utils';

export function MapEmbed({
  value,
  className = ''
}: {
  value: string | null;
  className?: string;
}) {
  if (!value) return null;
  const src = buildMapsEmbedUrl(value);
  if (!src) return null;
  return (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-surface-2 ${className}`}
    >
      <iframe
        src={src}
        width="100%"
        height="280"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        style={{ border: 0, display: 'block' }}
        allowFullScreen
      />
    </div>
  );
}
