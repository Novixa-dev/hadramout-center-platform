'use client';
import { useEffect } from 'react';
import { useField } from '@payloadcms/ui';
import type { TextareaFieldClientComponent } from 'payload';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';

/**
 * WYSIWYG editor for article/news bodies. It edits the same HTML the site renders; the server sanitizes it again
 * on save (see sanitizeBody in field hooks), so nothing unsafe can be stored even if the browser is tampered with.
 */

const CSS = `
.hc-ed{border:1px solid var(--theme-elevation-150,#ccc);border-radius:6px;background:var(--theme-input-bg,#fff)}
.hc-ed__bar{display:flex;flex-wrap:wrap;gap:4px;padding:6px;border-bottom:1px solid var(--theme-elevation-150,#ccc);position:sticky;top:0;background:inherit;z-index:2}
.hc-ed__bar button{min-width:34px;min-height:34px;padding:2px 8px;border:1px solid var(--theme-elevation-150,#ccc);border-radius:4px;background:transparent;color:inherit;cursor:pointer;font:inherit}
.hc-ed__bar button[aria-pressed="true"]{background:var(--theme-elevation-100,#e6efe9);font-weight:700}
.hc-ed__bar button:disabled{opacity:.4;cursor:default}
.hc-ed__sep{inline-size:1px;background:var(--theme-elevation-150,#ccc);margin-inline:2px}
.hc-ed .ProseMirror{min-height:320px;padding:12px 14px;outline:none;line-height:1.9;font-size:1.05rem}
.hc-ed .ProseMirror img{max-width:100%;height:auto}
.hc-ed .ProseMirror blockquote{border-inline-start:3px solid var(--theme-elevation-300,#999);margin-inline:0;padding-inline-start:12px;color:var(--theme-elevation-600,#555)}
.hc-ed .ProseMirror a{color:var(--theme-success-600,#1a6b57);text-decoration:underline}
`;

type Cmd = { label: string; title: string; run: () => void; active?: boolean; disabled?: boolean };

export const HtmlField: TextareaFieldClientComponent = ({ path, field }) => {
  const { value, setValue } = useField<string>({ path });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, autolink: true } }), Image],
    content: value ?? '',
    editorProps: { attributes: { dir: 'auto', 'aria-label': typeof field.label === 'string' ? field.label : 'Body' } },
    onUpdate: ({ editor: ed }) => setValue(ed.isEmpty ? '' : ed.getHTML()),
  });

  // The value changes from outside when the editor switches locale or a document loads.
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const incoming = value ?? '';
    const current = editor.isEmpty ? '' : editor.getHTML();
    if (incoming !== current) editor.commands.setContent(incoming, { emitUpdate: false });
  }, [value, editor]);

  if (!editor) return <div className="field-type"><label className="field-label">{typeof field.label === 'string' ? field.label : ''}</label></div>;

  const chain = () => editor.chain().focus();
  const addLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('الرابط (اتركه فارغاً لإزالته):', prev ?? 'https://');
    if (url === null) return;
    if (url === '') chain().extendMarkRange('link').unsetLink().run();
    else chain().extendMarkRange('link').setLink({ href: url }).run();
  };
  const addImage = () => {
    const src = window.prompt('رابط الصورة (ارفعها من «الوسائط» ثم الصق رابطها هنا):', 'https://');
    if (src) chain().setImage({ src, alt: window.prompt('وصف الصورة (للقارئات الصوتية):', '') ?? '' }).run();
  };

  const groups: Cmd[][] = [
    [
      { label: 'ع', title: 'عريض', run: () => chain().toggleBold().run(), active: editor.isActive('bold') },
      { label: 'مائل', title: 'مائل', run: () => chain().toggleItalic().run(), active: editor.isActive('italic') },
      { label: 'U', title: 'تسطير', run: () => chain().toggleUnderline().run(), active: editor.isActive('underline') },
    ],
    [
      { label: 'عنوان', title: 'عنوان رئيسي', run: () => chain().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
      { label: 'فرعي', title: 'عنوان فرعي', run: () => chain().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
    ],
    [
      { label: '• قائمة', title: 'قائمة نقطية', run: () => chain().toggleBulletList().run(), active: editor.isActive('bulletList') },
      { label: '1. قائمة', title: 'قائمة رقمية', run: () => chain().toggleOrderedList().run(), active: editor.isActive('orderedList') },
      { label: '❝', title: 'اقتباس', run: () => chain().toggleBlockquote().run(), active: editor.isActive('blockquote') },
    ],
    [
      { label: 'رابط', title: 'إضافة رابط', run: addLink, active: editor.isActive('link') },
      { label: 'صورة', title: 'إدراج صورة', run: addImage },
      { label: '—', title: 'فاصل أفقي', run: () => chain().setHorizontalRule().run() },
    ],
    [
      { label: '↶', title: 'تراجع', run: () => chain().undo().run(), disabled: !editor.can().undo() },
      { label: '↷', title: 'إعادة', run: () => chain().redo().run(), disabled: !editor.can().redo() },
    ],
  ];

  return (
    <div className="field-type">
      <style>{CSS}</style>
      <label className="field-label">{typeof field.label === 'string' ? field.label : ''}</label>
      <div className="hc-ed">
        <div className="hc-ed__bar" role="toolbar" aria-label="أدوات التنسيق">
          {groups.map((g, i) => (
            <span key={i} style={{ display: 'contents' }}>
              {i > 0 ? <span className="hc-ed__sep" aria-hidden="true" /> : null}
              {g.map((c) => (
                <button key={c.title} type="button" title={c.title} aria-label={c.title} aria-pressed={c.active ?? undefined} disabled={c.disabled} onClick={c.run}>
                  {c.label}
                </button>
              ))}
            </span>
          ))}
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
