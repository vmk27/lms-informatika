import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCcw,
  RotateCw,
  Eraser,
  Code2,
  Eye,
} from 'lucide-react';

interface RichTextEditorProps {
  initialHtml?: string;
  valueHtml?: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialHtml = '',
  valueHtml,
  onChange,
  placeholder = 'Tuliskan materi pembelajaran secara terstruktur di sini...',
  minHeight = '320px',
  className = '',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [viewSource, setViewSource] = useState(false);
  const [rawHtml, setRawHtml] = useState(valueHtml ?? initialHtml);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageInputOpen, setImageInputOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  // Sync valueHtml to editor if changed externally
  useEffect(() => {
    if (editorRef.current && valueHtml !== undefined) {
      if (editorRef.current.innerHTML !== valueHtml && !viewSource) {
        editorRef.current.innerHTML = valueHtml;
      }
      setRawHtml(valueHtml);
    }
  }, [valueHtml, viewSource]);

  // Initial content mount
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && initialHtml) {
      editorRef.current.innerHTML = initialHtml;
    }
  }, [initialHtml]);

  const updateActiveFormats = useCallback(() => {
    if (!editorRef.current || viewSource) return;
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
      });
    } catch {
      // Ignore queryCommandState errors
    }
  }, [viewSource]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setRawHtml(html);
      onChange(html);
      updateActiveFormats();
    }
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (viewSource) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    handleInput();
  };

  const handleHeading = (tag: 'h1' | 'h2' | 'h3' | 'p') => {
    if (tag === 'p') {
      execCmd('formatBlock', '<p>');
    } else {
      execCmd('formatBlock', `<${tag}>`);
    }
  };

  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    execCmd('createLink', linkUrl.trim());
    setLinkUrl('');
    setLinkInputOpen(false);
  };

  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    const imgHtml = `<figure class="my-4 text-center"><img src="${imageUrl.trim()}" alt="${
      imageAlt.trim() || 'Ilustrasi Materi'
    }" class="max-w-full h-auto rounded-xl mx-auto shadow-xs border border-[#E5E9E3]" /><figcaption class="text-xs text-[#68736B] mt-1.5 font-medium">${
      imageAlt.trim() || 'Gambar Ilustrasi'
    }</figcaption></figure><p><br></p>`;
    execCmd('insertHTML', imgHtml);
    setImageUrl('');
    setImageAlt('');
    setImageInputOpen(false);
  };

  const handleInsertTable = () => {
    const tableHtml = `
      <div class="overflow-x-auto my-4">
        <table class="w-full border-collapse border border-[#E5E9E3] text-xs text-left">
          <thead>
            <tr class="bg-[#F7F7F2] font-bold text-[#202923]">
              <th class="border border-[#E5E9E3] p-2.5">No / Parameter</th>
              <th class="border border-[#E5E9E3] p-2.5">Deskripsi / Penjelasan</th>
              <th class="border border-[#E5E9E3] p-2.5">Keterangan / Rumus</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-[#E5E9E3] p-2.5 font-medium">1. Contoh</td>
              <td class="border border-[#E5E9E3] p-2.5">Tuliskan deskripsi data di sini</td>
              <td class="border border-[#E5E9E3] p-2.5 font-mono">Nilai / Parameter</td>
            </tr>
            <tr>
              <td class="border border-[#E5E9E3] p-2.5 font-medium">2. Data Lanjutan</td>
              <td class="border border-[#E5E9E3] p-2.5">Tuliskan penjelasan lanjutan</td>
              <td class="border border-[#E5E9E3] p-2.5 font-mono">Keterangan</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p><br></p>
    `;
    execCmd('insertHTML', tableHtml);
  };

  const handleInsertBlockquote = () => {
    const quoteHtml = `
      <blockquote class="border-l-4 border-[#276749] pl-4 py-2 my-4 bg-[#E5F3E8]/60 rounded-r-lg italic text-[#202923]">
        "Kutipan atau poin inti pembelajaran yang penting untuk diingat siswa."
      </blockquote>
      <p><br></p>
    `;
    execCmd('insertHTML', quoteHtml);
  };

  const handleInsertCodeBlock = () => {
    const codeHtml = `
      <pre class="bg-[#192A23] text-white p-3.5 rounded-xl font-mono text-xs my-4 overflow-x-auto border border-[#23382E]"><code>// Contoh Kode Program / Notasi Ilmiah\nfunction hitungEnergi(massa, c) {\n  return massa * Math.pow(c, 2);\n}</code></pre>
      <p><br></p>
    `;
    execCmd('insertHTML', codeHtml);
  };

  const handleInsertDivider = () => {
    execCmd('insertHorizontalRule');
  };

  const handleRawHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newHtml = e.target.value;
    setRawHtml(newHtml);
    onChange(newHtml);
  };

  return (
    <div className={`border border-[#E5E9E3] rounded-xl bg-white shadow-2xs overflow-hidden ${className}`}>
      {/* 1. Formatting Toolbar */}
      <div className="bg-[#F7F7F2] border-b border-[#E5E9E3] p-2 flex flex-wrap items-center gap-1 text-[#202923] select-none">
        
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-[#E5E9E3]">
          <button
            type="button"
            onClick={() => execCmd('undo')}
            disabled={viewSource}
            title="Urungkan (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-[#E5F3E8] text-[#68736B] disabled:opacity-30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('redo')}
            disabled={viewSource}
            title="Ulangi (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-[#E5F3E8] text-[#68736B] disabled:opacity-30"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-[#E5E9E3]">
          <button
            type="button"
            onClick={() => handleHeading('h1')}
            disabled={viewSource}
            title="Heading 1"
            className="p-1.5 rounded hover:bg-[#E5F3E8] text-[#202923] font-bold text-xs flex items-center gap-0.5 disabled:opacity-30"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleHeading('h2')}
            disabled={viewSource}
            title="Heading 2"
            className="p-1.5 rounded hover:bg-[#E5F3E8] text-[#202923] font-bold text-xs flex items-center gap-0.5 disabled:opacity-30"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleHeading('h3')}
            disabled={viewSource}
            title="Heading 3"
            className="p-1.5 rounded hover:bg-[#E5F3E8] text-[#202923] font-bold text-xs flex items-center gap-0.5 disabled:opacity-30"
          >
            <Heading3 className="w-4 h-4" />
          </button>
        </div>

        {/* Basic Text Formatting */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-[#E5E9E3]">
          <button
            type="button"
            onClick={() => execCmd('bold')}
            disabled={viewSource}
            title="Tebal (Ctrl+B)"
            className={`p-1.5 rounded transition-colors disabled:opacity-30 ${
              activeFormats.bold ? 'bg-[#276749] text-white' : 'hover:bg-[#E5F3E8] text-[#202923]'
            }`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('italic')}
            disabled={viewSource}
            title="Miring (Ctrl+I)"
            className={`p-1.5 rounded transition-colors disabled:opacity-30 ${
              activeFormats.italic ? 'bg-[#276749] text-white' : 'hover:bg-[#E5F3E8] text-[#202923]'
            }`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('underline')}
            disabled={viewSource}
            title="Garis Bawah (Ctrl+U)"
            className={`p-1.5 rounded transition-colors disabled:opacity-30 ${
              activeFormats.underline ? 'bg-[#276749] text-white' : 'hover:bg-[#E5F3E8] text-[#202923]'
            }`}
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('strikeThrough')}
            disabled={viewSource}
            title="Coret"
            className={`p-1.5 rounded transition-colors disabled:opacity-30 ${
              activeFormats.strikeThrough ? 'bg-[#276749] text-white' : 'hover:bg-[#E5F3E8] text-[#202923]'
            }`}
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-[#E5E9E3]">
          <button
            type="button"
            onClick={() => execCmd('insertUnorderedList')}
            disabled={viewSource}
            title="Daftar Poin"
            className={`p-1.5 rounded transition-colors disabled:opacity-30 ${
              activeFormats.insertUnorderedList ? 'bg-[#276749] text-white' : 'hover:bg-[#E5F3E8] text-[#202923]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('insertOrderedList')}
            disabled={viewSource}
            title="Daftar Bernomor"
            className={`p-1.5 rounded transition-colors disabled:opacity-30 ${
              activeFormats.insertOrderedList ? 'bg-[#276749] text-white' : 'hover:bg-[#E5F3E8] text-[#202923]'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alignments */}
        <div className="hidden sm:flex items-center gap-0.5 pr-1 border-r border-[#E5E9E3]">
          <button
            type="button"
            onClick={() => execCmd('justifyLeft')}
            disabled={viewSource}
            title="Rata Kiri"
            className="p-1.5 rounded hover:bg-[#E5F3E8] text-[#202923] disabled:opacity-30"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyCenter')}
            disabled={viewSource}
            title="Rata Tengah"
            className="p-1.5 rounded hover:bg-[#E5F3E8] text-[#202923] disabled:opacity-30"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyRight')}
            disabled={viewSource}
            title="Rata Kanan"
            className="p-1.5 rounded hover:bg-[#E5F3E8] text-[#202923] disabled:opacity-30"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Elements Insertion */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-[#E5E9E3]">
          <button
            type="button"
            onClick={() => setLinkInputOpen(!linkInputOpen)}
            disabled={viewSource}
            title="Sisipkan Tautan"
            className="p-1.5 rounded hover:bg-[#E5F3E8] text-[#202923] disabled:opacity-30"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setImageInputOpen(!imageInputOpen)}
            disabled={viewSource}
            title="Sisipkan Gambar"
            className="p-1.5 rounded hover:bg-[#E5F3E8] text-[#202923] disabled:opacity-30"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertTable}
            disabled={viewSource}
            title="Sisipkan Tabel"
            className="p-1.5 rounded hover:bg-[#E5F3E8] text-[#202923] disabled:opacity-30"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertBlockquote}
            disabled={viewSource}
            title="Sisipkan Kutipan"
            className="p-1.5 rounded hover:bg-[#E5F3E8] text-[#202923] disabled:opacity-30"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertCodeBlock}
            disabled={viewSource}
            title="Sisipkan Kode"
            className="p-1.5 rounded hover:bg-[#E5F3E8] text-[#202923] disabled:opacity-30"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertDivider}
            disabled={viewSource}
            title="Garis Pembatas"
            className="p-1.5 rounded hover:bg-[#E5F3E8] text-[#202923] disabled:opacity-30"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Clear Format & Source Toggle */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => execCmd('removeFormat')}
            disabled={viewSource}
            title="Hapus Format"
            className="p-1.5 rounded hover:bg-[#E5F3E8] text-[#68736B] hover:text-[#202923] disabled:opacity-30"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (viewSource && editorRef.current) {
                editorRef.current.innerHTML = rawHtml;
              }
              setViewSource(!viewSource);
            }}
            className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
              viewSource
                ? 'bg-[#276749] text-white'
                : 'bg-[#E5E9E3] hover:bg-[#d8ded5] text-[#202923]'
            }`}
          >
            {viewSource ? (
              <>
                <Eye className="w-3 h-3" />
                <span>Visual</span>
              </>
            ) : (
              <>
                <Code2 className="w-3 h-3" />
                <span>HTML</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Popover Insert Link */}
      {linkInputOpen && (
        <form onSubmit={handleInsertLink} className="p-2.5 bg-[#E5F3E8] border-b border-[#48A878]/30 flex items-center gap-2 text-xs">
          <span className="font-semibold text-[#276749] shrink-0">Tautan URL:</span>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com/referensi"
            className="flex-1 px-2.5 py-1.5 bg-white border border-[#E5E9E3] rounded text-[#202923] focus:outline-none focus:ring-1 focus:ring-[#276749]"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#276749] text-white rounded font-semibold hover:bg-[#1F513A] shrink-0 transition-colors"
          >
            Terapkan
          </button>
          <button
            type="button"
            onClick={() => setLinkInputOpen(false)}
            className="px-2.5 py-1.5 bg-white border border-[#E5E9E3] text-[#68736B] rounded hover:bg-[#F7F7F2] shrink-0"
          >
            Batal
          </button>
        </form>
      )}

      {/* Popover Insert Image */}
      {imageInputOpen && (
        <form onSubmit={handleInsertImage} className="p-3 bg-[#E5F3E8] border-b border-[#48A878]/30 space-y-2 text-xs">
          <div className="font-semibold text-[#276749] flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-[#276749]" />
            <span>Sisipkan Gambar Ilustrasi Materi</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="URL Gambar (https://images.unsplash.com/...)"
              className="w-full px-2.5 py-1.5 bg-white border border-[#E5E9E3] rounded text-[#202923] focus:outline-none focus:ring-1 focus:ring-[#276749]"
              required
              autoFocus
            />
            <input
              type="text"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              placeholder="Keterangan / Caption Gambar"
              className="w-full px-2.5 py-1.5 bg-white border border-[#E5E9E3] rounded text-[#202923] focus:outline-none focus:ring-1 focus:ring-[#276749]"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setImageInputOpen(false)}
              className="px-3 py-1 bg-white border border-[#E5E9E3] text-[#68736B] rounded hover:bg-[#F7F7F2]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-3.5 py-1 bg-[#276749] text-white rounded font-semibold hover:bg-[#1F513A] transition-colors"
            >
              Sisipkan Gambar
            </button>
          </div>
        </form>
      )}

      {/* 2. Visual WYSIWYG Editable Area */}
      {!viewSource ? (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          style={{ minHeight }}
          className="p-4 sm:p-6 focus:outline-none text-[#202923] leading-relaxed font-sans text-sm prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:my-2 prose-ul:list-disc prose-ol:list-decimal prose-a:text-[#276749] prose-a:underline prose-table:w-full prose-table:border"
          data-placeholder={placeholder}
        />
      ) : (
        /* 3. Raw HTML Editor View */
        <textarea
          value={rawHtml}
          onChange={handleRawHtmlChange}
          style={{ minHeight }}
          className="w-full p-4 font-mono text-xs bg-[#192A23] text-white focus:outline-none resize-y leading-relaxed"
          placeholder="Tuliskan markup HTML secara langsung di sini..."
        />
      )}
    </div>
  );
};
