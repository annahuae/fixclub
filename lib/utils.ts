export const SPECIALTIES = [
  { value: 'plumber', label: 'Сантехник' },
  { value: 'electrician', label: 'Электрик' },
  { value: 'ac', label: 'Кондиционеры' },
  { value: 'handyman', label: 'Хэндимен' },
  { value: 'appliance', label: 'Бытовая техника' },
  { value: 'carpenter', label: 'Плотник / мебель' },
  { value: 'painter', label: 'Малярка' },
  { value: 'cleaner', label: 'Клининг' },
  { value: 'mover', label: 'Переезды' },
  { value: 'other', label: 'Другое' }
] as const;

export function specialtyLabel(value: string): string {
  return SPECIALTIES.find((s) => s.value === value)?.label ?? value;
}

export function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I,O,0,1 to avoid confusion
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
