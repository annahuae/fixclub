import { whatsappLink } from '@/lib/utils';

export function PhoneLink({
  phone,
  isWhatsapp
}: {
  phone: string;
  isWhatsapp?: boolean | null;
}) {
  if (isWhatsapp) {
    return (
      <a
        href={whatsappLink(phone)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#25D366] hover:underline"
        title="Open WhatsApp chat"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M20.52 3.48A11.84 11.84 0 0 0 12 .04C5.39.04.02 5.41.02 12.02c0 2.12.55 4.18 1.6 6L.04 24l6.13-1.61a11.97 11.97 0 0 0 5.83 1.49h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.24-6.21-3.46-8.43zM12.01 21.86h-.01a9.85 9.85 0 0 1-5.02-1.37l-.36-.21-3.64.96.97-3.55-.23-.36a9.83 9.83 0 0 1-1.51-5.26c0-5.45 4.43-9.88 9.88-9.88 2.64 0 5.12 1.03 6.99 2.9a9.79 9.79 0 0 1 2.88 6.99c0 5.45-4.43 9.78-9.95 9.78zm5.42-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48a9 9 0 0 1-1.66-2.07c-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
        </svg>
        {phone}
      </a>
    );
  }

  return (
    <a
      href={`tel:${phone}`}
      className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.35 1.84.59 2.8.72A2 2 0 0 1 22 16.92z" />
      </svg>
      {phone}
    </a>
  );
}
