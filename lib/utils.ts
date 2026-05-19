export const SPECIALTIES = [
  { value: 'plumber', label: 'Сантехник' },
  { value: 'electrician', label: 'Электрик' },
  { value: 'ac', label: 'Кондиционеры' },
  { value: 'handyman', label: 'Хэндимен' },
  { value: 'appliance', label: 'Бытовая техника' },
  { value: 'carpenter', label: 'Плотник / мебель' },
  { value: 'painter', label: 'Малярка' },
  { value: 'cleaner', label: 'Клининг' },
  { value: 'mover', label: 'Муверы' },
  { value: 'other', label: 'Другое' }
] as const;

export const EMIRATES = [
  { value: 'dubai', label: 'Dubai' },
  { value: 'sharjah', label: 'Sharjah' },
  { value: 'abu_dhabi', label: 'Abu Dhabi' },
  { value: 'ajman', label: 'Ajman' },
  { value: 'rak', label: 'Ras Al Khaimah' },
  { value: 'fujairah', label: 'Fujairah' },
  { value: 'uaq', label: 'Umm Al Quwain' }
] as const;

export const SHOP_CATEGORIES = [
  { value: 'hardware', label: 'Хозтовары / hardware' },
  { value: 'tiles', label: 'Плитка / отделка' },
  { value: 'plumbing_parts', label: 'Сантехника / запчасти' },
  { value: 'electrical_parts', label: 'Электрика / запчасти' },
  { value: 'tools', label: 'Инструменты' },
  { value: 'paint', label: 'Краски' },
  { value: 'lumber', label: 'Дерево / пиломатериалы' },
  { value: 'glass', label: 'Стекло / зеркала' },
  { value: 'garden', label: 'Сад / уличное' },
  { value: 'other', label: 'Прочее' }
] as const;

export function specialtyLabel(value: string): string {
  return SPECIALTIES.find((s) => s.value === value)?.label ?? value;
}

export function emirateLabel(value: string | null): string {
  if (!value) return '';
  return EMIRATES.find((e) => e.value === value)?.label ?? value;
}

export function shopCategoryLabel(value: string): string {
  return SHOP_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = (n: number) => {
    let s = '';
    for (let i = 0; i < n; i++) {
      s += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return s;
  };
  return `${part(4)}-${part(4)}-${part(4)}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Build an embeddable Google Maps URL.
// Accepts a Google Maps share/URL or a free-form address/place.
export function buildMapsEmbedUrl(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  // Already an embed link
  if (/^https?:\/\/(www\.)?google\.com\/maps\/embed/i.test(v)) return v;
  // Any other google maps URL — pass through ?q=
  if (/^https?:\/\//i.test(v)) {
    return `https://www.google.com/maps?q=${encodeURIComponent(v)}&output=embed`;
  }
  // Plain address
  return `https://www.google.com/maps?q=${encodeURIComponent(v)}&output=embed`;
}
