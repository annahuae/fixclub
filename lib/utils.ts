export const SPECIALTY_GROUPS = [
  {
    title: 'Ремонт квартиры',
    items: [
      { value: 'plumber', label: 'Сантехник' },
      { value: 'electrician', label: 'Электрик' },
      { value: 'ac', label: 'Кондиционеры' },
      { value: 'handyman', label: 'Хэндимен' },
      { value: 'painter', label: 'Малярка' },
      { value: 'carpenter', label: 'Плотник' },
      { value: 'tiler', label: 'Плиточник' },
      { value: 'locksmith', label: 'Замки / двери' },
      { value: 'windows', label: 'Окна / стекло' }
    ]
  },
  {
    title: 'Дом и быт',
    items: [
      { value: 'appliance', label: 'Бытовая техника' },
      { value: 'furniture_assembly', label: 'Сборка мебели' },
      { value: 'furniture_repair', label: 'Ремонт мебели' },
      { value: 'cleaner', label: 'Клининг' },
      { value: 'gardener', label: 'Сад / растения' },
      { value: 'pest', label: 'Дезинсекция' }
    ]
  },
  {
    title: 'Перевозки и хранение',
    items: [
      { value: 'mover', label: 'Муверы' },
      { value: 'storage', label: 'Стораджи' }
    ]
  },
  {
    title: 'Прочее',
    items: [{ value: 'other', label: 'Другое' }]
  }
] as const;

type Specialty = { value: string; label: string };
export const SPECIALTIES: Specialty[] = SPECIALTY_GROUPS.flatMap(
  (g) => g.items as readonly Specialty[]
);

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
  { value: 'furniture', label: 'Мебель' },
  { value: 'appliance_store', label: 'Бытовая техника' },
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

export function buildMapsEmbedUrl(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  if (/^https?:\/\/(www\.)?google\.com\/maps\/embed/i.test(v)) return v;
  if (/^https?:\/\//i.test(v)) {
    return `https://www.google.com/maps?q=${encodeURIComponent(v)}&output=embed`;
  }
  return `https://www.google.com/maps?q=${encodeURIComponent(v)}&output=embed`;
}
