'use client';
import { useEffect } from 'react';
import { FieldDescription, FieldError, FieldLabel, useField, useTranslation } from '@payloadcms/ui';
import { getTranslation } from '@payloadcms/translations';
import type { TextareaFieldClientComponent } from 'payload';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { editorStrings } from '../i18n.ts';
import { normalizeScholarlyArabic } from '../../lib/arabic-assist.ts';

/**
 * WYSIWYG editor for article/news bodies. It edits the same HTML the site renders; the server sanitizes it again
 * on save (see sanitizeBody in field hooks), so nothing unsafe can be stored even if the browser is tampered with.
 * Label, description, error and read-only state come from Payload like any built-in field (a reviewer sees the Arabic
 * body read-only); the toolbar speaks the admin's interface language.
 */

type Cmd = { label: string; title: string; run: () => void; active?: boolean; disabled?: boolean };

export const HtmlField: TextareaFieldClientComponent = ({ path: pathFromProps, field, readOnly }) => {
  const { i18n } = useTranslation();
  const t = editorStrings(i18n.language);
  const { value, setValue, path, showError, disabled } = useField<string>({ potentiallyStalePath: pathFromProps });
  const locked = Boolean(readOnly || disabled);
  const label = getTranslation(field.label || field.name, i18n);

  const editor = useEditor({
    immediatelyRender: false,
    // Tiptap 3 no longer re-renders on every transaction: without this the toolbar's pressed/disabled states went stale.
    shouldRerenderOnTransaction: true,
    editable: !locked,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, autolink: true } }), Image],
    content: value ?? '',
    editorProps: { attributes: { dir: 'auto', 'aria-label': label, 'aria-multiline': 'true', role: 'textbox' } },
    onUpdate: ({ editor: ed }) => setValue(ed.isEmpty ? '' : ed.getHTML()),
  });

  // The value changes from outside when the editor switches locale or a document loads.
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const incoming = value ?? '';
    const current = editor.isEmpty ? '' : editor.getHTML();
    if (incoming !== current) editor.commands.setContent(incoming, { emitUpdate: false });
  }, [value, editor]);

  // Access can change without a remount (locale switch: a reviewer may edit English but not Arabic; the form is also briefly
  // disabled while it initialises). emitUpdate=false: Tiptap's default fires "update", which wrote the editor's normalised
  // HTML back into the form and marked every document as modified the moment it was opened.
  useEffect(() => {
    if (editor && editor.isEditable === locked) editor.setEditable(!locked, false);
  }, [editor, locked]);

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
  const runScholarlyAssist = () => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const normalized = normalizeScholarlyArabic(currentHtml);
    if (normalized !== currentHtml) {
      editor.commands.setContent(normalized, { emitUpdate: true });
    }
  };

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
          { label: t.linkShort, title: t.link, run: addLink, active: editor.isActive('link') },
          { label: t.imageShort, title: t.image, run: addImage },
          { label: '—', title: t.rule, run: () => chain().setHorizontalRule().run() },
        ],
        [
          { label: '↶', title: t.undo, run: () => chain().undo().run(), disabled: !editor.can().undo() },
          { label: '↷', title: t.redo, run: () => chain().redo().run(), disabled: !editor.can().redo() },
        ],
        [
          { label: t.scholarlyAssistShort, title: t.scholarlyAssist, run: runScholarlyAssist },
        ],
      ]
    : [];

  const description = field.admin?.description;
  return (
    <div className={['field-type', 'hc-ed-field', showError ? 'error' : '', locked ? 'read-only' : ''].filter(Boolean).join(' ')}>
      <FieldLabel label={field.label} localized={field.localized} path={path} required={field.required} />
      <div className="field-type__wrap">
        <FieldError path={path} showError={showError} />
        <div className="hc-ed">
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
        </div>
        {description ? <FieldDescription description={description} path={path} /> : null}
      </div>
    </div>
  );
};
