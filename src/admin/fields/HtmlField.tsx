'use client';
import { useField } from '@payloadcms/ui';
import type { TextareaFieldClientComponent } from 'payload';

export const HtmlField: TextareaFieldClientComponent = ({ path, field }) => {
  const { value, setValue } = useField<string>({ path });
  return (
    <div className="field-type">
      <label className="field-label">{typeof field.label === 'string' ? field.label : ''}</label>
      <textarea dir="auto" style={{ width: '100%', minHeight: 320 }} value={value ?? ''} onChange={(e) => setValue(e.target.value)} />
    </div>
  );
};
