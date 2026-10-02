import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Cloud, Server } from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { SchoolSettings } from '../../types/lms';
import { SUPABASE_INTEGRATION_BLUEPRINT } from '../../repositories/supabaseAdapter';

export const SettingsManagementView: React.FC = () => {
  const { settings, updateSchoolSettings, resetDemoDatabase, addToast } = useLms();
  const [form, setForm] = useState<SchoolSettings>({ ...settings });

  const handleSave = () => {
    updateSchoolSettings(form);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pengaturan Aplikasi LMS</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi identitas sekolah, header dokumen PDF resmi, kebijakan default timer membaca, serta status kesiapan integrasi backend.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Konfigurasi</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Form Pengaturan Sekolah */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Identitas Sekolah & Header Laporan PDF
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nama Satuan Pendidikan <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={form.schoolName}
              onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">NPSN</label>
              <input
                type="text"
                value={form.npsn}
                onChange={(e) => setForm({ ...form, npsn: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tahun Ajaran & Semester
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.academicYear}
                  onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                  className="w-2/3 px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                />
                <select
                  value={form.semester}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      semester: e.target.value as SchoolSettings['semester'],
                    })
                  }
                  className="w-1/3 px-2 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Alamat Lengkap Sekolah
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nama Kepala Sekolah
              </label>
              <input
                type="text"
                value={form.principalName}
                onChange={(e) => setForm({ ...form, principalName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">NIP Kepala Sekolah</label>
              <input
                type="text"
                value={form.principalNip}
                onChange={(e) => setForm({ ...form, principalNip: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Subketerangan Header Kop PDF
            </label>
            <input
              type="text"
              value={form.pdfHeaderSubtitle}
              onChange={(e) => setForm({ ...form, pdfHeaderSubtitle: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 mb-3">
              Kebijakan Default Timer Membaca Materi (Bagian H)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Default Waktu Baca (Menit)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.defaultMinReadMinutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      defaultMinReadMinutes: Math.max(1, Number(e.target.value)),
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="inline-flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enforcePauseOnBlurDefault}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        enforcePauseOnBlurDefault: e.target.checked,
                      })
                    }
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>Jeda saat jendela blur secara default</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Kesiapan Integrasi Backend & Vercel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Kesiapan Arsitektur Supabase & Vercel
              </h2>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1.5 text-blue-900">
              <div className="font-semibold">{SUPABASE_INTEGRATION_BLUEPRINT.stage}</div>
              <p className="text-[11px] leading-relaxed">
                Aplikasi telah memisahkan layer data repository, validasi izin (RBAC), dan kontrak
                realtime heartbeat sehingga siap disambungkan ke Supabase tanpa perombakan UI.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-800">Checklist Keamanan & Deployment:</div>
              {SUPABASE_INTEGRATION_BLUEPRINT.securityChecklist.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={resetDemoDatabase}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Reset Seluruh Data Demo ke Kondisi Awal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
