'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const OPTIONS = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
] as const;

export function PeriodTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const active = searchParams.get('period') ?? 'monthly';

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'monthly') params.delete('period');
    else params.set('period', value);
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  return (
    <Tabs value={active} onValueChange={onChange}>
      <TabsList>
        {OPTIONS.map((o) => (
          <TabsTrigger key={o.value} value={o.value}>
            {o.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
