'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  name: string;
  defaultValue?: string[];
  // Names of sibling form inputs (checkboxes) whose checked values drive
  // category-specific suggestions. We watch these via the DOM so this
  // component does not need to own the specialty state.
  watchInputName?: string;
  // Map from category value -> suggestion list.
  suggestionsByCategory?: Record<string, string[]>;
  // Generic suggestions used when no category is matched.
  fallbackSuggestions?: string[];
  placeholder?: string;
  maxTags?: number;
};

export function TagInput({
  name,
  defaultValue = [],
  watchInputName = 'specialties',
  suggestionsByCategory = {},
  fallbackSuggestions = [],
  placeholder = 'Type and press Enter — e.g. Duct cleaning, Kitchens',
  maxTags = 20
}: Props) {
  const [tags, setTags] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState('');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Track checked categories via DOM (the form is server-rendered with native
  // checkboxes, so we just listen on the document).
  useEffect(() => {
    function recompute() {
      const nodes = document.querySelectorAll<HTMLInputElement>(
        `input[name="${watchInputName}"]:checked`
      );
      const vals = Array.from(nodes).map((n) => n.value);
      setActiveCategories(vals);
    }
    recompute();
    document.addEventListener('change', recompute);
    return () => document.removeEventListener('change', recompute);
  }, [watchInputName]);

  const suggestions = useMemo(() => {
    const set = new Set<string>();
    for (const c of activeCategories) {
      for (const t of suggestionsByCategory[c] || []) set.add(t);
    }
    if (set.size === 0) {
      for (const t of fallbackSuggestions) set.add(t);
    }
    // Hide already-picked ones; filter by draft if present.
    const picked = new Set(tags.map((t) => t.toLowerCase()));
    const d = draft.trim().toLowerCase();
    return Array.from(set)
      .filter((s) => !picked.has(s.toLowerCase()))
      .filter((s) => (d ? s.toLowerCase().includes(d) : true))
      .slice(0, 10);
  }, [activeCategories, suggestionsByCategory, fallbackSuggestions, tags, draft]);

  function addTag(raw: string) {
    const t = raw.trim();
    if (!t) return;
    if (t.length > 60) return;
    if (tags.length >= maxTags) return;
    if (tags.some((x) => x.toLowerCase() === t.toLowerCase())) return;
    setTags([...tags, t]);
    setDraft('');
  }

  function removeTag(i: number) {
    setTags(tags.filter((_, idx) => idx !== i));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (draft.trim()) addTag(draft);
    } else if (e.key === 'Backspace' && !draft && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  const showSuggestions = focused && suggestions.length > 0;

  return (
    <div ref={wrapRef} className="relative">
      <div className="input flex flex-wrap items-center gap-1.5 min-h-[44px]">
        {tags.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-accent-strong"
          >
            {t}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="text-accent-strong/60 hover:text-accent-strong"
              aria-label={`Remove ${t}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[140px] bg-transparent text-sm outline-none"
        />
        {/* Hidden serialized value posted with the form */}
        {tags.map((t, i) => (
          <input key={`hidden-${i}`} type="hidden" name={name} value={t} />
        ))}
      </div>

      {showSuggestions && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(s);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-2"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="mt-1 text-xs text-ink-dim">
        Press Enter or comma to add. Pick from suggestions or type your own.
      </div>
    </div>
  );
}
