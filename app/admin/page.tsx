'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FullAdminDashboard() {
  const [lectures, setLectures] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [fileMeta, setFileMeta] = useState<any>(null);
  const [courseCode, setCourseCode] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [lectureNumber, setLectureNumber] = useState(1);
  const [summaryAr, setSummaryAr] = useState('');

  const fetchLectures = async () => {
    const res = await fetch('/api/lectures/manage');
    const data = await res.json();
    if (data.lectures) setLectures(data.lectures);
  };

  useEffect(() => { fetchLectures(); }, []);

  const handleAnalyze = async (forceAction?: 'update' | 'new_version') => {
    if (!file) return;
    setLoading(true);
    setDuplicateAlert(null);
    const formData = new FormData();
    formData.append('file', file);
    if (forceAction) formData.append('forceAction', forceAction);

    const res = await fetch('/api/lectures/analyze', { method: 'POST', body: formData });
    const data = await res.json();
    setLoading(false);

    if (data.error) return alert(data.error);
    if (data.duplicateDetected) { setDuplicateAlert(data); return; }

    setPreview(data.preview);
    setFileMeta(data.fileMeta);
    setCourseCode(data.preview.detected_course_code || '');
    setTitleAr(data.preview.title_ar || '');
    setLectureNumber(data.preview.lecture_number || 1);
    setSummaryAr(data.preview.summary_ar || '');
  };

  const handleSaveLecture = async (status: 'published' | 'draft') => {
    if (!courseCode || !titleAr) return alert('يرجى تحديد المادة الدراسية وعنوان المحاضرة قبل الحفظ.');
    setLoading(true);
    const updatedPreview = { ...preview, title_ar: titleAr, lecture_number: lectureNumber, summary_ar: summaryAr };
    const res = await fetch('/api/lectures/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preview: updatedPreview, fileMeta, courseCode, status }),
    });
    const result = await res.json();
    setLoading(false);

    if (result.slug) {
      setShowAddModal(false);
      setPreview(null);
      setFile(null);
      fetchLectures();
      alert(status === 'published' ? 'تم نشر المحاضرة في الموقع بنجاح!' : 'تم حفظ المحاضرة كمسودة.');
    } else {
      alert(result.error || 'حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المحاضرة نهائياً؟')) return;
    await fetch(`/api/lectures/manage?id=${id}`, { method: 'DELETE' });
    fetchLectures();
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'published' ? 'draft' : 'published';
    await fetch('/api/lectures/manage', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: nextStatus }),
    });
    fetchLectures();
  };

  const filteredLectures = lectures.filter(
    (l) => l.title_ar.includes(searchQuery) || l.courses?.title_ar.includes(searchQuery) || l.courses?.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-cyan-400">لوحة إدارة المحاضرات (CMS)</h1>
            <p className="text-xs text-slate-400 mt-1">إدارة المحتوى الأكاديمي والنشر التلقائي على الرابط الثابت</p>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold">عرض الموقع ↗</Link>
            <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-bold">[ + إضافة محاضرة جديدة ]</button>
          </div>
        </div>

        <input
          type="text"
          placeholder="ابحث باسم المحاضرة، اسم المادة، أو رمزها..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none"
        />

        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-950/60 text-slate-400 text-xs">
              <tr>
                <th className="p-4">#</th>
                <th className="p-4">المادة</th>
                <th className="p-4">عنوان المحاضرة</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLectures.map((lec) => (
                <tr key={lec.id}>
                  <td className="p-4 font-mono text-cyan-400">{lec.lecture_number}</td>
                  <td className="p-4 text-xs font-bold">{lec.courses?.title_ar}</td>
                  <td className="p-4 font-bold">{lec.title_ar}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${lec.status === 'published' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-amber-900/50 text-amber-400'}`}>
                      {lec.status === 'published' ? 'منشور' : 'مسودة'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => toggleStatus(lec.id, lec.status)} className="px-3 py-1 rounded bg-slate-800 text-xs">{lec.status === 'published' ? 'تحويل لمسودة' : 'نشر'}</button>
                    <button onClick={() => handleDelete(lec.id)} className="px-3 py-1 rounded bg-rose-900/50 text-rose-300 text-xs">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-cyan-400">رفع وتحليل محاضرة جديدة</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400">✕</button>
            </div>

            {!preview && (
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center space-y-4">
                <p className="text-sm text-slate-300">يدعم: PDF, DOCX, PPTX, TXT, وصور المحاضرات</p>
                <input type="file" accept=".pdf,.docx,.pptx,.txt,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block mx-auto text-sm" />
                <button onClick={() => handleAnalyze()} disabled={loading || !file} className="bg-cyan-600 px-6 py-2.5 rounded-xl font-bold text-sm">
                  {loading ? 'جاري التحليل بالذكاء الاصطناعي...' : 'بدء التحليل الذكي'}
                </button>
              </div>
            )}

            {duplicateAlert && (
              <div className="p-5 rounded-xl bg-amber-950/60 border border-amber-500/50 space-y-3">
                <h3 className="font-bold text-amber-400">⚠️ ملف مكرر!</h3>
                <p className="text-sm">{duplicateAlert.message}</p>
                <div className="flex gap-3">
                  <button onClick={() => handleAnalyze('update')} className="px-4 py-2 rounded-lg bg-amber-600 text-xs font-bold">تحديث الحالية</button>
                  <button onClick={() => handleAnalyze('new_version')} className="px-4 py-2 rounded-lg bg-slate-700 text-xs font-bold">نسخة جديدة</button>
                </div>
              </div>
            )}

            {preview && (
              <div className="space-y-4 max-h-[65vh] overflow-y-auto">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">المادة الدراسية:</label>
                    <select value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className="w-full bg-slate-800 p-2.5 rounded-lg border border-slate-700 text-sm">
                      <option value="">-- اختر المادة --</option>
                      <option value="AI201">الذكاء الاصطناعي (نظري)</option>
                      <option value="AI201L">الذكاء الاصطناعي (عملي - Python)</option>
                      <option value="DB202">قواعد البيانات (نظري)</option>
                      <option value="DB202L">قواعد البيانات (عملي - Oracle)</option>
                      <option value="OS203">نظم التشغيل (نظري)</option>
                      <option value="OS203L">نظم التشغيل (عملي - Linux)</option>
                      <option value="WEB204">تطوير الويب (نظري)</option>
                      <option value="WEB204L">تطوير الويب (عملي - PHP)</option>
                      <option value="NET205">التوجيه والتبديل (نظري)</option>
                      <option value="NET205L">التوجيه والتبديل (عملي - Packet Tracer)</option>
                      <option value="DS206">هياكل البيانات (نظري)</option>
                      <option value="DS206L">هياكل البيانات (عملي - C++)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">رقم المحاضرة:</label>
                    <input type="number" value={lectureNumber} onChange={(e) => setLectureNumber(Number(e.target.value))} className="w-full bg-slate-800 p-2.5 rounded-lg border border-slate-700 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">عنوان المحاضرة:</label>
                  <input type="text" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} className="w-full bg-slate-800 p-2.5 rounded-lg border border-slate-700 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">الوصف الموجز:</label>
                  <textarea rows={2} value={summaryAr} onChange={(e) => setSummaryAr(e.target.value)} className="w-full bg-slate-800 p-2.5 rounded-lg border border-slate-700 text-sm" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => handleSaveLecture('published')} disabled={loading} className="flex-1 bg-emerald-600 py-3 rounded-xl font-bold text-sm">[ نشر المحاضرة في الموقع ]</button>
                  <button onClick={() => handleSaveLecture('draft')} disabled={loading} className="px-5 bg-slate-700 py-3 rounded-xl font-bold text-sm">حفظ كمسودة</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
