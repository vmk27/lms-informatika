import React, { useState } from 'react';
import { Calendar, Clock, Edit3, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { Material } from '../../types/lms';
import { ModalShell } from '../common/ModalShell';

export const ScheduleManagementView: React.FC = () => {
  const {
    materials,
    assignments,
    quizzes,
    classes,
    simulatedNow,
    setSimulatedNow,
    updateMaterialSchedule,
    saveAssignment,
    saveQuiz,
  } = useLms();

  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [schedStatus, setSchedStatus] = useState<Material['status']>('published');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  const openScheduleModal = (mat: Material) => {
    setEditingMaterial(mat);
    setSchedStatus(mat.status);
    setStartAt(mat.publishStartAt);
    setEndAt(mat.publishEndAt);
  };

  const handleSaveSchedule = () => {
    if (!editingMaterial) return;
    updateMaterialSchedule(editingMaterial.id, schedStatus, startAt, endAt);
    setEditingMaterial(null);
  };

  const isCurrentlyActiveByTime = (start: string, end: string, status: string) => {
    if (status === 'draft' || status === 'closed' || status === 'archived') return false;
    const now = new Date(simulatedNow).getTime();
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return now >= s && now <= e;
  };

  return (
    <div className="space-y-6">
      {/* Header & Simulasi Waktu Tayang */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Manajemen Jadwal Tayang Pembelajaran
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur jadwal buka/tutup materi, tugas, dan kuis. Perubahan jadwal langsung memengaruhi
            visibilitas di Student Learning Portal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
          <Clock className="w-4 h-4 text-blue-600" />
          <div className="text-xs">
            <div className="font-semibold text-slate-800">Waktu Simulasi Sistem (Demo):</div>
            <div className="text-[11px] text-slate-500">
              Ubah tanggal untuk menguji efek jadwal tayang otomatis
            </div>
          </div>
          <input
            type="datetime-local"
            value={simulatedNow}
            onChange={(e) => setSimulatedNow(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      {/* Tabel Jadwal Materi */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            1. Jadwal Tayang Materi Pembelajaran
          </h2>
          <span className="text-xs text-slate-500">{materials.length} Materi</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-3 px-4 font-semibold">Judul Materi & Mapel</th>
                <th className="py-3 px-4 font-semibold">Kelas Tujuan</th>
                <th className="py-3 px-4 font-semibold">Waktu Mulai</th>
                <th className="py-3 px-4 font-semibold">Waktu Berakhir</th>
                <th className="py-3 px-4 font-semibold">Status & Visibilitas Siswa</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materials.map((mat) => {
                const visible = isCurrentlyActiveByTime(
                  mat.publishStartAt,
                  mat.publishEndAt,
                  mat.status
                );
                const clsNames = classes
                  .filter((c) => mat.classIds.includes(c.id))
                  .map((c) => c.code)
                  .join(', ');
                return (
                  <tr key={mat.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{mat.title}</div>
                      <div className="text-slate-500">
                        {mat.subject} · Min. baca {mat.minReadMinutes} menit
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{clsNames}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {mat.publishStartAt.replace('T', ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {mat.publishEndAt.replace('T', ' ')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold uppercase text-slate-800">{mat.status}</div>
                      {visible ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Dapat Diakses Siswa Saat Ini
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700">
                          <AlertCircle className="w-3.5 h-3.5" /> Tersembunyi / Belum Tayang
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openScheduleModal(mat)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Atur Jadwal</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabel Jadwal Tugas & Kuis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">
            2. Jadwal & Tenggat Pengumpulan Tugas
          </h3>
          <div className="divide-y divide-slate-100">
            {assignments.map((asg) => (
              <div key={asg.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{asg.title}</div>
                  <div className="text-slate-500 font-mono">
                    Mulai: {asg.publishStartAt.replace('T', ' ')} · Tenggat:{' '}
                    {asg.dueDate.replace('T', ' ')}
                  </div>
                </div>
                <select
                  value={asg.status}
                  onChange={(e) =>
                    saveAssignment(
                      { ...asg, status: e.target.value as typeof asg.status },
                      false
                    )
                  }
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md font-medium"
                >
                  <option value="published">Tayang</option>
                  <option value="draft">Draft</option>
                  <option value="closed">Ditutup</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">
            3. Jadwal Pelaksanaan Kuis
          </h3>
          <div className="divide-y divide-slate-100">
            {quizzes.map((qz) => (
              <div key={qz.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{qz.title}</div>
                  <div className="text-slate-500 font-mono">
                    {qz.publishStartAt.replace('T', ' ')} s/d {qz.publishEndAt.replace('T', ' ')}
                  </div>
                </div>
                <select
                  value={qz.status}
                  onChange={(e) =>
                    saveQuiz({ ...qz, status: e.target.value as typeof qz.status }, false)
                  }
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md font-medium"
                >
                  <option value="published">Tayang</option>
                  <option value="scheduled">Terjadwal</option>
                  <option value="closed">Ditutup</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Ubah Jadwal Tayang Materi */}
      <ModalShell
        isOpen={Boolean(editingMaterial)}
        onClose={() => setEditingMaterial(null)}
        title={`Atur Jadwal Tayang — ${editingMaterial?.title || ''}`}
        description="Perubahan jadwal akan tercatat di Audit Log dan langsung memengaruhi akses siswa."
        maxWidthClass="max-w-lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditingMaterial(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveSchedule}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Simpan Jadwal
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Status Tayang Materi <span className="text-red-600">*</span>
            </label>
            <select
              value={schedStatus}
              onChange={(e) => setSchedStatus(e.target.value as Material['status'])}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            >
              <option value="published">Tayang (Published)</option>
              <option value="scheduled">Terjadwal (Scheduled)</option>
              <option value="draft">Draft</option>
              <option value="closed">Ditutup (Closed)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Waktu Mulai Tayang <span className="text-red-600">*</span>
            </label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Waktu Berakhir / Ditutup <span className="text-red-600">*</span>
            </label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      </ModalShell>
    </div>
  );
};
