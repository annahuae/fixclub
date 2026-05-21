'use client';

import { useEffect, useState } from 'react';

// Wraps form fields that should only be visible (and submitted) when the
// "kind" radio is set to "company". Watches the radio via the DOM so the
// rest of the form can stay server-rendered.
export function CompanyOnlyField({ children }: { children: React.ReactNode }) {
  const [isCompany, setIsCompany] = useState(false);

  useEffect(() => {
    function update() {
      const checked = document.querySelector<HTMLInputElement>(
        'input[name="kind"]:checked'
      );
      setIsCompany(checked?.value === 'company');
    }
    update();
    document.addEventListener('change', update);
    return () => document.removeEventListener('change', update);
  }, []);

  if (!isCompany) return null;
  return <>{children}</>;
}
