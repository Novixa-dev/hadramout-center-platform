'use client';
import { useRef, useState } from 'react';
import { Icon } from '../Icon.tsx';

interface Props {
  label: string;
  title: string;
  note: string;
  copyLabel: string;
  copiedLabel: string;
  exportLabel: string;
  closeLabel: string;
  /** style → formatted citation text */
  styles: Record<string, string>;
  /** file name → content, for download buttons */
  files: { name: string; mime: string; content: string; label: string }[];
}

const STYLE_NAMES: Record<string, string> = { apa: 'APA 7', mla: 'MLA 9', chicago: 'Chicago 17', harvard: 'Harvard' };

export function CitePanel({ label, title, note, copyLabel, copiedLabel, exportLabel, closeLabel, styles, files }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const keys = Object.keys(styles);
  const [active, setActive] = useState(keys[0] ?? 'apa');
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(styles[active] ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable: the text is selectable */
    }
  };
  const download = (f: Props['files'][number]) => {
    const url = URL.createObjectURL(new Blob([f.content], { type: `${f.mime};charset=utf-8` }));
    const a = document.createElement('a');
    a.href = url;
    a.download = f.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button type="button" className="btn btn--secondary btn--sm" onClick={() => ref.current?.showModal()} aria-haspopup="dialog">
        <Icon name="quote" /> {label}
      </button>
      <dialog ref={ref} className="dlg" aria-labelledby="cite-title" onClick={(e) => e.target === ref.current && ref.current?.close()}>
        <div className="dlg__head">
          <h2 id="cite-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={() => ref.current?.close()} aria-label={closeLabel}><Icon name="close" /></button>
        </div>
        <div className="dlg__body">
          <div className="tabs" role="tablist">
            {keys.map((k) => (
              <button key={k} type="button" role="tab" aria-selected={k === active} onClick={() => setActive(k)}>{STYLE_NAMES[k] ?? k}</button>
            ))}
          </div>
          <pre className="cite" role="tabpanel" tabIndex={0}>{styles[active]}</pre>
          <div className="cluster" style={{ marginBlock: '0.9rem' }}>
            <button type="button" className="btn btn--primary btn--sm" onClick={copy}>
              <Icon name={copied ? 'check' : 'copy'} /> {copied ? copiedLabel : copyLabel}
            </button>
          </div>
          <h3 style={{ fontSize: 'var(--step-0)', marginBlock: '0.5rem' }}>{exportLabel}</h3>
          <div className="cluster">
            {files.map((f) => (
              <button key={f.name} type="button" className="btn btn--secondary btn--sm" onClick={() => download(f)}>
                <Icon name="download" /> {f.label}
              </button>
            ))}
          </div>
          <p className="notice" style={{ marginBlockStart: '1rem' }}>{note}</p>
        </div>
      </dialog>
    </>
  );
}
