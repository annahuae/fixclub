import type { Locale } from './i18n';

export const SPECIALTY_GROUPS = [
  {
    title: 'Apartment repair',
    title_ru: 'Ремонт квартиры',
    items: [
      { value: 'plumber', label: 'Plumber' },
      { value: 'electrician', label: 'Electrician' },
      { value: 'ac', label: 'AC technician' },
      { value: 'handyman', label: 'Handyman' },
      { value: 'painter', label: 'Painting' },
      { value: 'carpenter', label: 'Furniture maker' },
      { value: 'tiler', label: 'Marble & tile works' },
      { value: 'locksmith', label: 'Locks / access cards' },
      { value: 'doors', label: 'Doors' },
      { value: 'windows', label: 'Windows' },
      { value: 'glass', label: 'Glass / mirrors' },
      { value: 'renovation', label: 'Full renovation' },
      { value: 'interior_designer', label: 'Interior designer' },
      { value: 'smart_home', label: 'Smart home' }
    ]
  },
  {
    title: 'Home and household',
    title_ru: 'Дом и быт',
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
    title_ru: 'Перевозки и хранение',
    items: [
      { value: 'mover', label: 'Movers' },
      { value: 'storage', label: 'Storage' },
      { value: 'tool_rental', label: 'Tool rental' }
    ]
  },
  {
    title: 'Other',
    title_ru: 'Прочее',
    items: [{ value: 'other', label: 'Other' }]
  }
] as const;

type Specialty = { value: string; label: string };
export const SPECIALTIES: Specialty[] = SPECIALTY_GROUPS.flatMap(
  (g) => g.items as readonly Specialty[]
);

const SPECIALTY_LABELS_RU: Record<string, string> = {
  plumber: 'Сантехник',
  electrician: 'Электрик',
  ac: 'Кондиционеры',
  handyman: 'Разнорабочий',
  painter: 'Малярка',
  carpenter: 'Мебельщик',
  tiler: 'Плиточник / камень / мрамор',
  locksmith: 'Замки / карты доступа',
  doors: 'Двери',
  windows: 'Окна',
  glass: 'Стекло / зеркала',
  renovation: 'Ремонт под ключ',
  interior_designer: 'Дизайнер интерьеров',
  appliance: 'Ремонт техники',
  furniture_assembly: 'Сборка мебели',
  furniture_repair: 'Ремонт мебели',
  cleaner: 'Клининг',
  gardener: 'Сад / растения',
  pest: 'Дезинсекция',
  mover: 'Муверы',
  storage: 'Хранение',
  tool_rental: 'Аренда оборудования',
  smart_home: 'Умный дом',
  other: 'Другое'
};

// Suggested tags (sub-specialties) shown as autocomplete in the tag input.
// Users can add any tags they want — these are just hints.
export const TAG_SUGGESTIONS: Record<string, string[]> = {
  ac: ['Repair', 'Installation', 'Duct cleaning', 'Smart thermostats', 'Maintenance'],
  cleaner: [
    'Apartment / villa cleaning',
    'Deep clean (sofa / mattress / carpet)',
    'Curtain cleaning',
    'Move-in / move-out',
    'Post-construction'
  ],
  smart_home: [
    'Lighting automation',
    'Motorised curtains',
    'Door access systems',
    'CCTV',
    'Intercom'
  ],
  carpenter: ['Kitchens', 'Wardrobes', 'Joinery', 'Furniture repair', 'Doors'],
  painter: ['Interior', 'Exterior', 'Lady design']
};

// Flat list of all suggestion strings — used when no category is selected yet
// or when a category has no specific suggestions.
export const ALL_TAG_SUGGESTIONS: string[] = Array.from(
  new Set(Object.values(TAG_SUGGESTIONS).flat())
);

export function suggestedTagsFor(categories: string[]): string[] {
  const set = new Set<string>();
  for (const c of categories) {
    for (const t of TAG_SUGGESTIONS[c] || []) set.add(t);
  }
  return Array.from(set);
}

export function normalizeTags(raw: unknown): string[] {
  const arr = Array.isArray(raw)
    ? raw.map(String)
    : String(raw || '')
        .split(/[\n,]+/)
        .map((s) => s.trim());
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of arr) {
    const t = r.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (t.length <= 60) out.push(t);
    if (out.length >= 20) break;
  }
  return out;
}

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
  { value: 'ru', label: 'Russian' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ur', label: 'Urdu' },
  { value: 'tl', label: 'Tagalog' }
] as const;

const LANGUAGE_LABELS_RU: Record<string, string> = {
  en: 'Английский',
  ar: 'Арабский',
  ru: 'Русский',
  hi: 'Хинди',
  ur: 'Урду',
  tl: 'Тагальский'
};

export function languageLabel(value: string, locale: Locale = 'en'): string {
  if (locale === 'ru') {
    return (
      LANGUAGE_LABELS_RU[value] ||
      LANGUAGES.find((l) => l.value === value)?.label ||
      value
    );
  }
  return LANGUAGES.find((l) => l.value === value)?.label ?? value;
}

export const PACES = [
  { value: 'fast', label: 'Fast', label_ru: 'Быстро', emoji: '🏎️' },
  { value: 'average', label: 'Average', label_ru: 'Средне', emoji: '🚗' },
  { value: 'slow', label: 'Slow', label_ru: 'Медленно', emoji: '🐢' }
] as const;

export function priceTierLabel(avg: number, locale: Locale = 'en'): string {
  const n = Math.round(avg);
  if (locale === 'ru') {
    if (n <= 1) return 'Бюджетно';
    if (n === 2) return 'Средне';
    return 'Премиум';
  }
  if (n <= 1) return 'Budget';
  if (n === 2) return 'Moderate';
  return 'Premium';
}

export function paceLabel(
  value: string | null | undefined,
  locale: Locale = 'en'
): string {
  if (!value) return '';
  const item = PACES.find((p) => p.value === value);
  if (!item) return value;
  return locale === 'ru' ? item.label_ru : item.label;
}

export const EMIRATES = [
  { value: 'dubai', label: 'Dubai', label_ru: 'Дубай' },
  { value: 'sharjah', label: 'Sharjah', label_ru: 'Шарджа' },
  { value: 'abu_dhabi', label: 'Abu Dhabi', label_ru: 'Абу-Даби' },
  { value: 'ajman', label: 'Ajman', label_ru: 'Аджман' },
  { value: 'rak', label: 'Ras Al Khaimah', label_ru: 'Рас-эль-Хайма' },
  { value: 'fujairah', label: 'Fujairah', label_ru: 'Фуджейра' },
  { value: 'uaq', label: 'Umm Al Quwain', label_ru: 'Умм-эль-Кайвайн' }
] as const;

export const SHOP_CATEGORIES = [
  { value: 'hardware', label: 'Hardware', label_ru: 'Хозтовары' },
  { value: 'tiles', label: 'Tiles / finishes', label_ru: 'Плитка / отделка' },
  {
    value: 'plumbing_parts',
    label: 'Plumbing parts',
    label_ru: 'Сантехника'
  },
  { value: 'sanitary', label: 'Sanitary ware', label_ru: 'Сантехфаянс' },
  {
    value: 'electrical_parts',
    label: 'Electrical parts',
    label_ru: 'Электрика'
  },
  { value: 'tools', label: 'Tools', label_ru: 'Инструменты' },
  { value: 'paint', label: 'Paint', label_ru: 'Краски' },
  { value: 'lumber', label: 'Lumber / wood', label_ru: 'Пиломатериалы' },
  { value: 'glass', label: 'Glass / mirrors', label_ru: 'Стекло / зеркала' },
  { value: 'garden', label: 'Garden / outdoor', label_ru: 'Сад / уличное' },
  { value: 'furniture', label: 'Furniture', label_ru: 'Мебель' },
  {
    value: 'appliance_store',
    label: 'Appliances',
    label_ru: 'Бытовая техника'
  },
  { value: 'other', label: 'Other', label_ru: 'Прочее' }
] as const;

export function specialtyLabel(value: string, locale: Locale = 'en'): string {
  if (locale === 'ru' && SPECIALTY_LABELS_RU[value]) {
    return SPECIALTY_LABELS_RU[value];
  }
  return SPECIALTIES.find((s) => s.value === value)?.label ?? value;
}

export function emirateLabel(
  value: string | null,
  locale: Locale = 'en'
): string {
  if (!value) return '';
  const item = EMIRATES.find((e) => e.value === value);
  if (!item) return value;
  return locale === 'ru' ? item.label_ru : item.label;
}

export function shopCategoryLabel(
  value: string,
  locale: Locale = 'en'
): string {
  const item = SHOP_CATEGORIES.find((c) => c.value === value);
  if (!item) return value;
  return locale === 'ru' ? item.label_ru : item.label;
}

export function specialtyGroupTitle(
  group: { title: string; title_ru: string },
  locale: Locale = 'en'
): string {
  return locale === 'ru' ? group.title_ru : group.title;
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

export function formatDate(
  date: string | Date,
  locale: Locale = 'en'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
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
