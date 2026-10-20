'use client';
import { useEffect } from 'react';
import { needsAttribution, withAttribution } from '../../lib/copy-attribution.ts';

/**
 * Copy with attribution: when a reader copies a passage from the article body, the clipboard receives the passage plus a
 * short source line and the page address (plain text and HTML). Short selections and selections outside the body are untouched.
 */
export function CopyAttribution({ targetId, line }: { targetId: string; line: string }) {
  useEffect(() => {
    const onCopy = (e: ClipboardEvent) => {
      const target = document.getElementById(targetId);
      const sel = window.getSelection();
      if (!target || !sel || sel.isCollapsed || sel.rangeCount === 0 || !e.clipboardData) return;
      const text = sel.toString();
      if (!needsAttribution(text)) return;
      if (!target.contains(sel.anchorNode) || !target.contains(sel.focusNode)) return;

      const box = document.createElement('div');
      box.appendChild(sel.getRangeAt(0).cloneContents());
      const source = document.createElement('p');
      source.textContent = line;
      box.appendChild(source);

      e.clipboardData.setData('text/plain', withAttribution(text, line));
      e.clipboardData.setData('text/html', box.innerHTML);
      e.preventDefault();
    };
    document.addEventListener('copy', onCopy);
    return () => document.removeEventListener('copy', onCopy);
  }, [targetId, line]);
  return null;
}
