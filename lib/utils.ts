export const SPECIALTY_GROUPS = [
  {
    title: 'Apartment repair',
    items: [
      { value: 'plumber', label: 'Plumber' },
      { value: 'electrician', label: 'Electrician' },
      { value: 'ac', label: 'AC technician' },
      { value: 'handyman', label: 'Handyman' },
      { value: 'painter', label: 'Painting' },
      { value: 'carpenter', label: 'Carpenter' },
      { value: 'tiler', label: 'Marble & tile works' },
      { value: 'locksmith', label: 'Locks / doors' },
      { value: 'windows', label: 'Windows / glass' },
      { value: 'renovation', label: 'Full renovation' },
      { value: 'interior_designer', label: 'Interior designer' }
    ]
  },
  {
    title: 'Home and household',
    items: [
      { value: 'appliance', label: 'Appliance repair' },
      { value: 'furniture_assembly', label: 'Furniture assembly' },
      { value: 'furniture_repair', label: 'Furniture repair' },
      { value: 'cleaner', label: 'Cleaning' },
      { value: 'gardener', label: 'Garden / plants' },
      { value: 'pest', label: 'Pest control' }
    ]
  },
  {
    title: 'Moving and storage',
    items: [
      { value: 'mover', label: 'Movers' },
      { value: 'storage', label: 'Storage' }
    ]
  },
  {
    title: 'Other',
    items: [{ value: 'other', label: 'Other' }]
  }
] as const;

type Specialty = { value: string; label: string };
export const SPECIALTIES: Specialty[] = SPECIALTY_GROUPS.flatMap(
  (g) => g.items as readonly Specialty[]
);

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
  { value: 'ru', label: 'Russian' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ur', label: 'Urdu' },
  { value: 'tl', label: 'Tagalog' }
] as const;

export function languageLabel(value: string): string {
  return LANGUAGES.find((l) => l.value === value)?.label ?? value;
}

export const PACES = [
  { value: 'fast', label: 'Fast', emoji: '🏎️' },
  { value: 'average', label: 'Average', emoji: '🚗' },
  { value: 'slow', label: 'Slow', emoji: '🐢' }
] as const;

export function priceTierLabel(avg: number): string {
  const n = Math.round(avg);
  if (n <= 1) return 'Budget';
  if (n === 2) return 'Moderate';
  return 'Premium';
}

export function paceLabel(value: string | null | undefined): string {
  if (!value) return '';
  return PACES.find((p) => p.value === value)?.label ?? value;
}

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
  { value: 'hardware', label: 'Hardware' },
  { value: 'tiles', label: 'Tiles / finishes' },
  { value: 'plumbing_parts', label: 'Plumbing parts' },
  { value: 'sanitary', label: 'Sanitary ware' },
  { value: 'electrical_parts', label: 'Electrical parts' },
  { value: 'tools', label: 'Tools' },
  { value: 'paint', label: 'Paint' },
  { value: 'lumber', label: 'Lumber / wood' },
  { value: 'glass', label: 'Glass / mirrors' },
  { value: 'garden', label: 'Garden / outdoor' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'appliance_store', label: 'Appliances' },
  { value: 'other', label: 'Other' }
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
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D+/g, '');
  return `https://wa.me/${digits}`;
}

export function buildMapsEmbedUrl(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  if (/^https?:\/\/(www\.)?google\.com\/maps\/embed/i.test(v)) return v;
  if (/^https?:\/\//i.test(v)) {
    return `https://www.google.com/maps?q=${encodeURIComponent(v)}&output=embed`;
  }
  return `https://www.google.com/maps?q=${encodeURIComponent(v)}&output=embed`;
}
