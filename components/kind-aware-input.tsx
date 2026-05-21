'use client';

import { useEffect, useState } from 'react';

type Props = {
  name: string;
  individual: string;
  company: string;
  required?: boolean;
  className?: string;
};

// Input whose placeholder swaps based on the "kind" radio (individual / company).
export function KindAwareInput({
  name,
  individual,
  company,
  required,
  className = 'input'
}: Props) {
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

  return (
    <input
      name={name}
      required={required}
      placeholder={isCompany ? company : individual}
      className={className}
    />
  );
}

type TextareaProps = {
  name: string;
  individual: string;
  company: string;
  rows?: number;
  className?: string;
};

export function KindAwareTextarea({
  name,
  individual,
  company,
  rows = 4,
  className = 'input resize-none'
}: TextareaProps) {
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

  return (
    <textarea
      name={name}
      rows={rows}
      placeholder={isCompany ? company : individual}
      className={className}
    />
  );
}
