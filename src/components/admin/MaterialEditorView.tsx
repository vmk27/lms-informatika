import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Clock,
  BookOpen,
  FileText,
  Plus,
  Trash2,
  Paperclip,
  ChevronRight,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import {
  Material,
  MaterialStatus,
  MaterialAttachment,
} from '../../types/lms';
import { RichTextEditor } from '../common/RichTextEditor';

export const MaterialEditorView: React.FC = () => {
  const {
    materials,
    classes,
    currentUser,
    selectedMaterialId,
    saveMaterial,
    navigateAdmin,
    addToast,
  } = useLms();

  const isEditing = Boolean(selectedMaterialId);
  const existingMaterial = materials.find((m) => m.id === selectedMaterialId);

  // Form State
  const [form, setForm] = useState<Material>(() => {
    if (existingMaterial) {
      return JSON.parse(JSON.stringify(existingMaterial));
    }
    return {
      id: `mat-${Date.now()}`,
      title: '',
      subject: 'Fisika',
      topic: '',
      classIds: classes.length > 0 ? [classes[0].id] : [],
      order: materials.length + 1,
      status: 'draft',
      publishStartAt: new Date().toISOString().slice(0, 16),
      publishEndAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
      minReadMinutes: 10,
      pauseOnWindowBlur: true,
      requireAllCheckpoints: true,
      requireComprehensionPass: false,
      isPrerequisiteForAssignments: true,
      isPrerequisiteForQuizzes: true,
      summary: '',
      sections: [
        {
          id: `sec-${Date.now()}-1`,
          heading: '1. Pengantar & Konsep Dasar',
          subheading: 'Pahami definisi fundamental sebelum melangkah ke simulasi.',
          bodyHtml: '<p>Tuliskan materi pengantar pembelajaran di sini...</p>',
          checkpointId: `cp-${Date.now()}-1`,
        },
      ],
      attachments: [],
      checkpoints: [
        {
          id: `cp-${Date.now()}-1`,
          order: 1,
          title: 'Checkpoint 1: Konsep Dasar',
          sectionAnchor: `sec-${Date.now()}-1`,
          description: 'Siswa telah menuntaskan bacaan bagian pengantar.',
          required: true,
        },
      ],
      comprehensionQuestions: [],
      createdById: currentUser?.id || 'usr-teacher-1',
      createdByName: currentUser?.name || 'Guru Pengampu',
      updatedAt: new Date().toISOString(),
    };
  });

  const [activeTab, setActiveTab] = useState<'info' | 'editor' | 'rules' | 'attachments' | 'preview'>('editor');
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // New Attachment Inputs
  const [newAttTitle, setNewAttTitle] = useState('');
  const [newAttType, setNewAttType] = useState<MaterialAttachment['type']>('pdf');
  const [newAttUrl, setNewAttUrl] = useState('');

  // Update existing when selectedMaterialId changes
  useEffect(() => {
    if (selectedMaterialId && existingMaterial) {
      setForm(JSON.parse(JSON.stringify(existingMaterial)));
    }
  }, [selectedMaterialId, existingMaterial]);

  const updateForm = (updater: (prev: Material) => Material) => {
    setForm((prev) => updater(prev));
  };

  const handleSave = (targetStatus?: MaterialStatus) => {
    if (!form.title.trim()) {
      addToast({
        type: 'error',
        title: 'Judul Wajib Diisi',
        description: 'Silakan isi judul materi pembelajaran.',
      });
      setActiveTab('info');
      return;
    }
    if (form.classIds.length === 0) {
      addToast({
        type: 'error',
        title: 'Pilih Kelas Tujuan',
        description: 'Pilih minimal satu kelas yang ditugaskan untuk materi ini.',
      });
      setActiveTab('info');
      return;
    }
    if (form.minReadMinutes < 1) {
      addToast({
        type: 'error',
        title: 'Waktu Baca Tidak Valid',
        description: 'Durasi minimum membaca harus minimal 1 menit.',
      });
      setActiveTab('rules');
      return;
    }

    setIsSaving(true);
    const finalStatus = targetStatus || form.status;
    const payload: Material = {
      ...form,
      status: finalStatus,
      updatedAt: new Date().toISOString(),
    };

    setTimeout(() => {
      saveMaterial(payload, !isEditing);
      setIsSaving(false);
      navigateAdmin('materials');
    }, 300);
  };

  // Section Management
  const addSection = () => {
    const newSecId = `sec-${Date.now()}`;
    const newCpId = `cp-${Date.now()}`;
    const newSecNumber = form.sections.length + 1;

    updateForm((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: newSecId,
          heading: `${newSecNumber}. Bagian Baru`,
          subheading: 'Deskripsi singkat sub-bab materi',
          bodyHtml: '<p>Tuliskan uraian materi pembelajaran di sini...</p>',
          checkpointId: newCpId,
        },
      ],
      checkpoints: [
        ...prev.checkpoints,
        {
          id: newCpId,
          order: newSecNumber,
          title: `Checkpoint ${newSecNumber}: Bagian Baru`,
          sectionAnchor: newSecId,
          description: `Siswa telah membaca bagian ${newSecNumber}.`,
          required: true,
        },
      ],
    }));
    setActiveSectionIndex(form.sections.length);
  };

  const removeSection = (secIndex: number) => {
    if (form.sections.length <= 1) {
      addToast({
        type: 'warning',
        title: 'Tidak Dapat Dihapus',
        description: 'Materi harus memiliki minimal satu bagian pembelajaran.',
      });
      return;
    }
    const secToRemove = form.sections[secIndex];
    updateForm((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== secIndex),
      checkpoints: prev.checkpoints.filter((cp) => cp.sectionAnchor !== secToRemove.id),
    }));
    setActiveSectionIndex(Math.max(0, secIndex - 1));
  };

  // Attachment Management
  const addAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttTitle.trim() || !newAttUrl.trim()) return;
    const newAtt: MaterialAttachment = {
      id: `att-${Date.now()}`,
      title: newAttTitle.trim(),
      type: newAttType,
      url: newAttUrl.trim(),
      fileSize: newAttType === 'pdf' ? '2.4 MB' : undefined,
    };
    updateForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, newAtt],
    }));
    setNewAttTitle('');
    setNewAttUrl('');
    addToast({
      type: 'success',
      title: 'Lampiran Ditambahkan',
      description: `"${newAtt.title}" berhasil disematkan.`,
    });
  };

  const removeAttachment = (attId: string) => {
    updateForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((a) => a.id !== attId),
    }));
  };

  const currentSection = form.sections[activeSectionIndex] || form.sections[0];

  return (
    <div className="space-y-5 pb-16">
      {/* 1. Breadcrumb & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E5E9E3] rounded-xl px-5 py-3.5 shadow-2xs">
        <div>
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1.5 text-xs text-[#68736B] font-medium">
            <button
              type="button"
              onClick={() => navigateAdmin('dashboard')}
              className="hover:text-[#276749] transition-colors"
            >
              Dashboard
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#858D86]" />
            <button
              type="button"
              onClick={() => navigateAdmin('materials')}
              className="hover:text-[#276749] transition-colors"
            >
              Manajemen Materi
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#858D86]" />
            <span className="text-[#202923] font-bold">
              {isEditing ? 'Edit Materi' : 'Tambah Materi Baru'}
            </span>
          </nav>

          <h1 className="text-xl font-bold text-[#202923] mt-1 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#276749]" />
            <span>{isEditing ? `Edit: ${form.title || 'Materi'}` : 'Tambah Materi Pembelajaran Baru'}</span>
          </h1>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigateAdmin('materials')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#202923] bg-white border border-[#E5E9E3] rounded-lg hover:bg-[#F7F7F2] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              activeTab === 'preview'
                ? 'bg-[#E5F3E8] text-[#276749] border-[#48A878]/30'
                : 'bg-white text-[#202923] border-[#E5E9E3] hover:bg-[#F7F7F2]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Pratinjau</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave('draft')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#202923] bg-[#E5E9E3] hover:bg-[#d8ded5] border border-[#E5E9E3] rounded-lg transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Draft</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave('published')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#276749] hover:bg-[#1F513A] active:bg-[#192A23] rounded-lg shadow-2xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Perbarui & Publikasikan' : 'Publikasikan Materi'}</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-white border border-[#E5E9E3] rounded-xl p-1.5 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'editor'
              ? 'bg-[#276749] text-white shadow-2xs'
              : 'text-[#68736B] hover:text-[#202923] hover:bg-[#F7F7F2]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Rich Text Editor Materi ({form.sections.length} Bagian)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'info'
              ? 'bg-[#276749] text-white shadow-2xs'
              : 'text-[#68736B] hover:text-[#202923] hover:bg-[#F7F7F2]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Informasi & Kelas Tujuan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'rules'
              ? 'bg-[#276749] text-white shadow-2xs'
              : 'text-[#68736B] hover:text-[#202923] hover:bg-[#F7F7F2]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Aturan Waktu Baca & Timer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attachments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'attachments'
              ? 'bg-[#276749] text-white shadow-2xs'
              : 'text-[#68736B] hover:text-[#202923] hover:bg-[#F7F7F2]'
          }`}
        >
          <Paperclip className="w-4 h-4" />
          <span>Lampiran ({form.attachments.length})</span>
        </button>
      </div>

      {/* 3. TAB CONTENT: RICH TEXT EDITOR */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Section Selector Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-[#E5E9E3] rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5E9E3] pb-3">
                <div>
                  <h3 className="text-xs font-bold text-[#202923] uppercase tracking-wider">
                    Daftar Bab / Bagian
                  </h3>
                  <p className="text-[11px] text-[#68736B]">Susun struktur materi bertahap</p>
                </div>
                <button
                  type="button"
                  onClick={addSection}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#276749] bg-[#E5F3E8] border border-[#48A878]/30 rounded-lg hover:bg-[#cbe6d2] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Bab</span>
                </button>
              </div>

              {/* Sections List */}
              <div className="space-y-2">
                {form.sections.map((sec, idx) => {
                  const isActive = idx === activeSectionIndex;
                  return (
                    <div
                      key={sec.id}
                      onClick={() => setActiveSectionIndex(idx)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-[#E5F3E8]/80 border-[#48A878] ring-1 ring-[#48A878]'
                          : 'bg-[#F7F7F2] border-[#E5E9E3] hover:bg-[#eef1eb]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-[#276749] text-white font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-[#202923] truncate">
                            {sec.heading || `Bagian ${idx + 1}`}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#68736B] truncate mt-0.5 pl-6.5">
                          {sec.subheading || 'Tanpa sub-judul'}
                        </div>
                      </div>

                      {form.sections.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSection(idx);
                          }}
                          className="p-1 text-[#858D86] hover:text-[#D9534F] rounded"
                          title="Hapus Bagian Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="bg-white border border-[#E5E9E3] rounded-xl p-4 shadow-2xs space-y-2 text-xs">
              <div className="font-bold text-[#202923]">Info Ringkas Materi:</div>
              <div className="text-[#68736B] space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span>Mata Pelajaran:</span>
                  <span className="font-semibold text-[#202923]">{form.subject}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Waktu Baca Min:</span>
                  <span className="font-semibold text-[#276749] font-mono">{form.minReadMinutes} Menit</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Kelas Sasaran:</span>
                  <span className="font-semibold text-[#202923]">{form.classIds.length} Kelas</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status Tayang:</span>
                  <span className="font-semibold uppercase text-[#2F855A]">{form.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Rich Text Editor Canvas */}
          <div className="lg:col-span-8 bg-white border border-[#E5E9E3] rounded-xl p-5 shadow-2xs space-y-4">
            {/* Active Section Header Editing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-[#E5E9E3]">
              <div>
                <label className="block text-xs font-bold text-[#202923] mb-1">
                  Judul Bab / Bagian #{activeSectionIndex + 1} <span className="text-[#D9534F]">*</span>
                </label>
                <input
                  type="text"
                  value={currentSection.heading}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateForm((prev) => {
                      const updated = [...prev.sections];
                      updated[activeSectionIndex] = { ...updated[activeSectionIndex], heading: val };
                      return { ...prev, sections: updated };
                    });
                  }}
                  placeholder="Contoh: 1. Hukum Termodinamika I"
                  className="w-full px-3 py-2 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#276749]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#202923] mb-1">
                  Sub-Judul / Panduan Baca
                </label>
                <input
                  type="text"
                  value={currentSection.subheading || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateForm((prev) => {
                      const updated = [...prev.sections];
                      updated[activeSectionIndex] = { ...updated[activeSectionIndex], subheading: val };
                      return { ...prev, sections: updated };
                    });
                  }}
                  placeholder="Contoh: Penjelasan energi dalam dan usaha sistem"
                  className="w-full px-3 py-2 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#276749]"
                />
              </div>
            </div>

            {/* Rich Text Editor Component */}
            <div>
              <label className="block text-xs font-bold text-[#202923] mb-1.5 flex items-center justify-between">
                <span>Isi Konten Materi Pembelajaran:</span>
                <span className="text-[11px] font-normal text-[#68736B]">
                  Mendukung format visual, tabel, gambar, rumus & kode
                </span>
              </label>

              <RichTextEditor
                key={`editor-${currentSection.id}`}
                initialHtml={currentSection.bodyHtml}
                onChange={(html) => {
                  updateForm((prev) => {
                    const updated = [...prev.sections];
                    if (updated[activeSectionIndex]) {
                      updated[activeSectionIndex] = { ...updated[activeSectionIndex], bodyHtml: html };
                    }
                    return { ...prev, sections: updated };
                  });
                }}
                minHeight="360px"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: INFORMASI DASAR & KELAS */}
      {activeTab === 'info' && (
        <div className="bg-white border border-[#E5E9E3] rounded-xl p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="border-b border-[#E5E9E3] pb-4">
            <h2 className="text-sm font-bold text-[#202923]">Informasi & Metadata Pembelajaran</h2>
            <p className="text-xs text-[#68736B] mt-0.5">
              Atur judul materi, mata pelajaran, ringkasan, dan kelas sasaran.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#202923] mb-1">
                Judul Materi Pembelajaran <span className="text-[#D9534F]">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Contoh: Hukum Termodinamika & Penerapannya"
                className="w-full px-3 py-2.5 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#276749]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#202923] mb-1">
                Mata Pelajaran <span className="text-[#D9534F]">*</span>
              </label>
              <select
                value={form.subject}
                onChange={(e) => updateForm((prev) => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2.5 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] font-medium"
              >
                <option value="Fisika">Fisika</option>
                <option value="Matematika">Matematika</option>
                <option value="Biologi">Biologi</option>
                <option value="Kimia">Kimia</option>
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                <option value="Bahasa Inggris">Bahasa Inggris</option>
                <option value="Informatika">Informatika</option>
                <option value="Sejarah">Sejarah</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#202923] mb-1">
                Topik / Pokok Bahasan
              </label>
              <input
                type="text"
                value={form.topic}
                onChange={(e) => updateForm((prev) => ({ ...prev, topic: e.target.value }))}
                placeholder="Contoh: Termodinamika & Kalor"
                className="w-full px-3 py-2.5 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#276749]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#202923] mb-1">
                Urutan Materi dalam Silabus
              </label>
              <input
                type="number"
                min={1}
                value={form.order}
                onChange={(e) => updateForm((prev) => ({ ...prev, order: Number(e.target.value) || 1 }))}
                className="w-full px-3 py-2.5 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#202923] mb-1">
                Ringkasan / Sinopsis Singkat Materi
              </label>
              <textarea
                rows={3}
                value={form.summary}
                onChange={(e) => updateForm((prev) => ({ ...prev, summary: e.target.value }))}
                placeholder="Tuliskan tujuan pembelajaran dan poin penting yang akan dikuasai siswa..."
                className="w-full px-3 py-2.5 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#276749]"
              />
            </div>

            {/* Target Classes Checkboxes */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-[#202923]">
                Kelas Sasaran Pembelajaran <span className="text-[#D9534F]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {classes.map((cls) => {
                  const isChecked = form.classIds.includes(cls.id);
                  return (
                    <label
                      key={cls.id}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#E5F3E8] border-[#48A878] text-[#276749] font-semibold'
                          : 'bg-[#F7F7F2] border-[#E5E9E3] text-[#202923] hover:bg-[#eef1eb]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateForm((prev) => ({ ...prev, classIds: [...prev.classIds, cls.id] }));
                          } else {
                            updateForm((prev) => ({
                              ...prev,
                              classIds: prev.classIds.filter((id) => id !== cls.id),
                            }));
                          }
                        }}
                        className="rounded text-[#276749] focus:ring-[#276749]"
                      />
                      <span className="text-xs">{cls.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: ATURAN WAKTU BACA & TIMER */}
      {activeTab === 'rules' && (
        <div className="bg-white border border-[#E5E9E3] rounded-xl p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="border-b border-[#E5E9E3] pb-4">
            <h2 className="text-sm font-bold text-[#202923] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#276749]" />
              <span>Pengaturan Timer & Validasi Belajar Siswa</span>
            </h2>
            <p className="text-xs text-[#68736B] mt-0.5">
              Menentukan batas durasi aktif minimum, integrasi Page Visibility API, dan syarat kelulusan materi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#202923] mb-1">
                Waktu Baca Minimum (Menit) <span className="text-[#D9534F]">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={180}
                value={form.minReadMinutes}
                onChange={(e) =>
                  updateForm((prev) => ({ ...prev, minReadMinutes: Number(e.target.value) || 5 }))
                }
                className="w-full px-3 py-2.5 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] font-mono font-bold"
              />
              <p className="text-[11px] text-[#68736B] mt-1">
                Siswa tidak dapat menandai materi tuntas sebelum akumulasi membaca mencapai {form.minReadMinutes} menit.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#202923] mb-1">
                Status Publikasi Materi
              </label>
              <select
                value={form.status}
                onChange={(e) => updateForm((prev) => ({ ...prev, status: e.target.value as MaterialStatus }))}
                className="w-full px-3 py-2.5 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] font-semibold"
              >
                <option value="draft">Draft (Hanya Guru & Admin)</option>
                <option value="scheduled">Terjadwal (Otomatis Tayang Sesuai Waktu)</option>
                <option value="published">Terpublikasi (Aktif Diakses Siswa)</option>
                <option value="closed">Ditutup (Arsip Pembelajaran)</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-3 pt-2">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E5E9E3] bg-[#F7F7F2] cursor-pointer hover:bg-[#eef1eb]">
                <input
                  type="checkbox"
                  checked={form.pauseOnWindowBlur}
                  onChange={(e) => updateForm((prev) => ({ ...prev, pauseOnWindowBlur: e.target.checked }))}
                  className="rounded text-[#276749] mt-0.5 focus:ring-[#276749]"
                />
                <div>
                  <div className="text-xs font-bold text-[#202923]">
                    Jeda Otomatis Saat Tab Tidak Terlihat (Page Visibility API)
                  </div>
                  <div className="text-[11px] text-[#68736B] mt-0.5">
                    Timer akan berhenti otomatis jika siswa berganti tab browser atau meminimalkan jendela aplikasi.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E5E9E3] bg-[#F7F7F2] cursor-pointer hover:bg-[#eef1eb]">
                <input
                  type="checkbox"
                  checked={form.requireAllCheckpoints}
                  onChange={(e) => updateForm((prev) => ({ ...prev, requireAllCheckpoints: e.target.checked }))}
                  className="rounded text-[#276749] mt-0.5 focus:ring-[#276749]"
                />
                <div>
                  <div className="text-xs font-bold text-[#202923]">
                    Wajib Melewati Seluruh Checkpoint Pembelajaran
                  </div>
                  <div className="text-[11px] text-[#68736B] mt-0.5">
                    Siswa wajib menuntaskan pembacaan tiap bab secara berurutan ({form.checkpoints.length} Checkpoint terdaftar).
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E5E9E3] bg-[#F7F7F2] cursor-pointer hover:bg-[#eef1eb]">
                <input
                  type="checkbox"
                  checked={form.isPrerequisiteForAssignments}
                  onChange={(e) =>
                    updateForm((prev) => ({ ...prev, isPrerequisiteForAssignments: e.target.checked }))
                  }
                  className="rounded text-[#276749] mt-0.5 focus:ring-[#276749]"
                />
                <div>
                  <div className="text-xs font-bold text-[#202923]">
                    Syarat Wajib untuk Membuka Tugas Terkait
                  </div>
                  <div className="text-[11px] text-[#68736B] mt-0.5">
                    Tugas materi ini akan terkunci bagi siswa sampai materi ini tuntas dipelajari.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT: LAMPIRAN BERKAS & MEDIA */}
      {activeTab === 'attachments' && (
        <div className="bg-white border border-[#E5E9E3] rounded-xl p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="border-b border-[#E5E9E3] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#202923]">Lampiran Materi & Sumber Belajar</h2>
              <p className="text-xs text-[#68736B] mt-0.5">
                Sematkan modul PDF, dokumen penunjang, atau tautan video referensi.
              </p>
            </div>
          </div>

          <form onSubmit={addAttachment} className="p-4 rounded-xl border border-[#48A878]/30 bg-[#E5F3E8]/50 space-y-3">
            <div className="text-xs font-bold text-[#276749] flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#276749]" />
              <span>Tambah Berkas / Tautan Baru</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#202923] mb-1">Judul Lampiran</label>
                <input
                  type="text"
                  value={newAttTitle}
                  onChange={(e) => setNewAttTitle(e.target.value)}
                  placeholder="Contoh: Modul Rumus Lengkap PDF"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E9E3] rounded-lg text-[#202923]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#202923] mb-1">Tipe Media</label>
                <select
                  value={newAttType}
                  onChange={(e) => setNewAttType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E9E3] rounded-lg text-[#202923]"
                >
                  <option value="pdf">Dokumen PDF</option>
                  <option value="document">Dokumen Word / PPT</option>
                  <option value="video_url">Video Pembelajaran (URL)</option>
                  <option value="image">Gambar / Infografis</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#202923] mb-1">URL Berkas / Media</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newAttUrl}
                    onChange={(e) => setNewAttUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E9E3] rounded-lg text-[#202923]"
                    required
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#276749] text-white rounded-lg text-xs font-bold hover:bg-[#1F513A] shrink-0 transition-colors"
                  >
                    Tambah
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="space-y-2">
            {form.attachments.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#858D86] border border-dashed border-[#E5E9E3] rounded-xl">
                Belum ada lampiran berkas yang disematkan pada materi ini.
              </div>
            ) : (
              form.attachments.map((att) => (
                <div
                  key={att.id}
                  className="p-3 bg-[#F7F7F2] border border-[#E5E9E3] rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Paperclip className="w-4 h-4 text-[#276749] shrink-0" />
                    <div className="truncate font-semibold text-[#202923]">{att.title}</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E5E9E3] text-[#202923] font-mono uppercase">
                      {att.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#276749] hover:underline flex items-center gap-1 text-[11px] font-medium"
                    >
                      <span>Buka</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="p-1 text-[#858D86] hover:text-[#D9534F] rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 7. TAB CONTENT: LIVE PREVIEW */}
      {activeTab === 'preview' && (
        <div className="bg-white border border-[#E5E9E3] rounded-xl p-6 shadow-2xs space-y-6 max-w-4xl mx-auto">
          <div className="bg-[#E5F3E8] border border-[#48A878]/30 rounded-xl p-3 flex items-center justify-between text-xs text-[#276749]">
            <span className="font-semibold">Pratinjau Tampilan Siswa:</span>
            <span className="text-[11px] text-[#276749]">Materi akan ditampilkan dengan timer membaca dan checkpoint</span>
          </div>

          <div className="space-y-3 border-b border-[#E5E9E3] pb-5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-[#E5F3E8] text-[#276749] text-xs font-bold">
                {form.subject}
              </span>
              <span className="text-xs text-[#68736B] font-mono">
                {form.minReadMinutes} Menit Waktu Baca Minimum
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#202923]">{form.title || 'Judul Materi Pembelajaran'}</h1>
            {form.summary && <p className="text-xs text-[#68736B] italic">{form.summary}</p>}
          </div>

          <div className="space-y-6">
            {form.sections.map((sec) => (
              <div key={sec.id} className="space-y-3 pb-6 border-b border-[#E5E9E3]">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-[#202923]">{sec.heading}</h2>
                  {sec.subheading && <p className="text-xs text-[#68736B]">{sec.subheading}</p>}
                </div>

                <div
                  className="prose prose-slate max-w-none text-xs text-[#202923] leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{ __html: sec.bodyHtml }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
