'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  initialValue?: string;
}

/**
 * Молекула: поисковая строка (Input + кнопка).
 */
export function SearchBar({ placeholder = 'Поиск...', onSearch, initialValue = '' }: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  return (
    <form onSubmit={submit} className="flex w-full gap-2" role="search" data-testid="search-bar">
      <div className="flex-1">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label="Поиск"
        />
      </div>
      <Button type="submit" variant="primary">
        Найти
      </Button>
    </form>
  );
}