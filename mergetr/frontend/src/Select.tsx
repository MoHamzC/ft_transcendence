
import React, { useState, useEffect } from 'react';

type Props = 
{
  value?: string;
  onChange?: (value: string) => void;
};

export default function Select({ value: initialValue, onChange }: Props) {
  const [value, setValue] = useState<string>(initialValue || 'en');

  useEffect(() => {
    if (initialValue && initialValue !== value) {
      setValue(initialValue);
    }

  }, [initialValue]);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setValue(e.target.value);
    if (onChange) onChange(e.target.value);
    console.log('Language changed to', e.target.value);
  }

  return (
    <div className="select">
      <select value={value} onChange={handleChange} className="px-3 py-2 rounded bg-zinc-800 text-white">
        <option value="en">English</option>
        <option value="fr">Français</option>
      </select>
    </div>
  );
}
