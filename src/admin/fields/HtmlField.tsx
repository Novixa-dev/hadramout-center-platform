'use client';
import { useEffect, useState, useMemo } from 'react';
import { FieldDescription, FieldError, FieldLabel, useField, useTranslation } from '@payloadcms/ui';
import { getTranslation } from '@payloadcms/translations';
import type { TextareaFieldClientComponent } from 'payload';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { editorStrings } from '../i18n.ts';
import { normalizeScholarlyArabic } from '../../lib/arabic-assist.ts';

/**
 * Modern WYSIWYG editor for article/news/page bodies. It edits the same HTML the site renders;
 * the server sanitizes it again on save (see sanitizeBody in field hooks).
 * Includes scholarly Arabic helpers, quotation brackets (« »), footnotes ([1]), word/char counts,
 * reading time estimation, and fullscreen focus mode.
 */

type Cmd = { label: string; title: string; run: () => void; active?: boolean; disabled?: boolean };

export const HtmlField: TextareaFieldClientComponent = ({ path: pathFromProps, field, readOnly }) => {
  const { i18n } = useTranslation();
  const t = editorStrings(i18n.language);
  const { value, setValue, path, showError, disabled } = useField<string>({ potentiallyStalePath: pathFromProps });
  const locked = Boolean(readOnly || disabled);
  const label = getTranslation(field.label || field.name, i18n);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editable: !locked,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, autolink: true } }), Image],
    content: value ?? '',
    editorProps: { attributes: { dir: 'auto', 'aria-label': label, 'aria-multiline': 'true', role: 'textbox' } },
    onUpdate: ({ editor: ed }) => setValue(ed.isEmpty ? '' : ed.getHTML()),
  });

  // Keep editor content in sync with external value changes (e.g. locale switch)
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const incoming = value ?? '';
    const current = editor.isEmpty ? '' : editor.getHTML();
    if (incoming !== current) editor.commands.setContent(incoming, { emitUpdate: false });
  }, [value, editor]);

  // Handle read-only / disabled state changes dynamically
  useEffect(() => {
    if (editor && editor.isEditable === locked) editor.setEditable(!locked, false);
  }, [editor, locked]);

  // Flash feedback message and clear after delay
  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const chain = () => editor!.chain().focus();

  const addLink = () => {
    const prev = editor!.getAttributes('link').href as string | undefined;
    const url = window.prompt(t.linkPrompt, prev ?? 'https://');
    if (url === null) return;
    if (url === '') chain().extendMarkRange('link').unsetLink().run();
    else chain().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const src = window.prompt(t.imagePrompt, 'https://');
    if (src) chain().setImage({ src, alt: window.prompt(t.altPrompt, '') ?? '' }).run();
  };

  // Scholarly Arabic typography normalization
  const runScholarlyAssist = () => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const normalized = normalizeScholarlyArabic(currentHtml);
    if (normalized !== currentHtml) {
      editor.commands.setContent(normalized, { emitUpdate: true });
      showFeedback(t.normalizerSuccess);
    } else {
      showFeedback(t.normalizerSuccess);
    }
  };

  // Insert or wrap with traditional scholarly brackets « »
  const insertScholarlyQuotes = () => {
    if (!editor) return;
    const { state } = editor;
    const { from, to } = state.selection;
    if (from !== to) {
      const selectedText = state.doc.textBetween(from, to);
      editor.commands.insertContentAt({ from, to }, `«${selectedText}»`);
    } else {
      editor.commands.insertContent('«»');
      editor.commands.setTextSelection(from + 1);
    }
    chain().run();
  };

  // Insert sequentially-numbered scholarly footnote [1]
  const insertFootnote = () => {
    if (!editor) return;
    const text = editor.getText();
    const matches = text.match(/\[(\d+)\]/g);
    const nextNum = matches ? matches.length + 1 : 1;
    editor.commands.insertContent(` [${nextNum}] `);
    chain().run();
  };

  // Real-time statistics
  const stats = useMemo(() => {
    if (!editor) return { words: 0, chars: 0, readingTimeMinutes: 1 };
    const text = editor.getText().trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readingTimeMinutes };
  }, [editor, value]);

  const groups: Cmd[][] = editor
    ? [
        [
          { label: t.boldShort, title: t.bold, run: () => chain().toggleBold().run(), active: editor.isActive('bold') },
          { label: t.italicShort, title: t.italic, run: () => chain().toggleItalic().run(), active: editor.isActive('italic') },
          { label: t.underlineShort, title: t.underline, run: () => chain().toggleUnderline().run(), active: editor.isActive('underline') },
        ],
        [
          { label: t.h2Short, title: t.h2, run: () => chain().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
          { label: t.h3Short, title: t.h3, run: () => chain().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
        ],
        [
          { label: t.bulletsShort, title: t.bullets, run: () => chain().toggleBulletList().run(), active: editor.isActive('bulletList') },
          { label: t.numbersShort, title: t.numbers, run: () => chain().toggleOrderedList().run(), active: editor.isActive('orderedList') },
          { label: '❝', title: t.quote, run: () => chain().toggleBlockquote().run(), active: editor.isActive('blockquote') },
        ],
        [
          { label: t.scholarlyQuotesShort, title: t.scholarlyQuotes, run: insertScholarlyQuotes },
          { label: t.footnoteShort, title: t.footnote, run: insertFootnote },
          { label: t.scholarlyAssistShort, title: t.scholarlyAssist, run: runScholarlyAssist },
        ],
        [
          { label: t.linkShort, title: t.link, run: addLink, active: editor.isActive('link') },
          { label: t.imageShort, title: t.image, run: addImage },
          { label: '—', title: t.rule, run: () => chain().setHorizontalRule().run() },
        ],
        [
          { label: '↶', title: t.undo, run: () => chain().undo().run(), disabled: !editor.can().undo() },
          { label: '↷', title: t.redo, run: () => chain().redo().run(), disabled: !editor.can().redo() },
        ],
        [
          {
            label: isFullscreen ? '🗗' : '⛶',
            title: isFullscreen ? t.fullscreenExit : t.fullscreen,
            run: () => setIsFullscreen(!isFullscreen),
            active: isFullscreen,
          },
        ],
      ]
    : [];

  const description = field.admin?.description;

  return (
    <div className={['field-type', 'hc-ed-field', showError ? 'error' : '', locked ? 'read-only' : '', isFullscreen ? 'hc-ed-field--fullscreen' : ''].filter(Boolean).join(' ')}>
      <FieldLabel label={field.label} localized={field.localized} path={path} required={field.required} />
      <div className="field-type__wrap">
        <FieldError path={path} showError={showError} />
        <div className={`hc-ed ${isFullscreen ? 'hc-ed--fullscreen' : ''}`}>
          {locked ? null : (
            <div className="hc-ed__bar" role="toolbar" aria-label={t.toolbar}>
              {groups.map((g, i) => (
                <span key={i} className="hc-ed__group">
                  {g.map((c) => (
                    <button key={c.title} type="button" title={c.title} aria-label={c.title} aria-pressed={c.active ?? undefined} disabled={c.disabled} onClick={c.run}>
                      {c.label}
                    </button>
                  ))}
                </span>
              ))}
            </div>
          )}
          {editor ? <EditorContent editor={editor} /> : <div className="hc-ed__loading" aria-busy="true">{t.loading}</div>}

          {/* Real-time editorial statistics and feedback footer */}
          <div className="hc-ed__footer">
            <div className="hc-ed__stats">
              <span className="hc-ed__stat-item">
                📊 {t.wordCount.replace('{words}', String(stats.words))}
              </span>
              <span className="hc-ed__stat-sep">•</span>
              <span className="hc-ed__stat-item">
                {t.charCount.replace('{chars}', String(stats.chars))}
              </span>
              <span className="hc-ed__stat-sep">•</span>
              <span className="hc-ed__stat-item">
                ⏱️ {t.readingTime.replace('{minutes}', String(stats.readingTimeMinutes))}
              </span>
            </div>
            {feedback && (
              <div className="hc-ed__feedback" role="status">
                ✨ {feedback}
              </div>
            )}
          </div>
        </div>
        {description ? <FieldDescription description={description} path={path} /> : null}
      </div>
    </div>
  );
};
