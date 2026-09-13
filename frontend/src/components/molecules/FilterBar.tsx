'use client';

import { Select, SelectOption } from '@/components/ui/Select';

export interface FilterBarProps {
  filters: { key: string; label: string; options: SelectOption[] }[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

/**
 * Молекула: панель фильтров из группы Select-компонентов.
 */
export function FilterBar({ filters, values, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3" data-testid="filter-bar">
      {filters.map((f) => (
        <div key={f.key} className="min-w-[180px]">
          <Select
            label={f.label}
            name={f.key}
            value={values[f.key] ?? ''}
            onChange={(e) => onChange(f.key, e.target.value)}
            options={[{ value: '', label: 'Все' }, ...f.options]}
          />
        </div>
      ))}
    </div>
  );
}