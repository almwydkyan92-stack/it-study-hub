import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function ProgressDashboard() {
  const { data: courses } = await supabase.from('courses').select('id, code, title_ar');
  const { data: lectures } = await supabase.from('lectures').select('id, course_id').eq('status', 'published');
  const { data: progress } = await supabase.from('study_progress').select('*');

  const total = lectures?.length || 0;
  const completedIds = new Set(progress?.filter((p) => p.is_completed).map((p) => p.lecture_id));
  const done = completedIds.size;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-cyan-400">📊 لوحة متابعة الإنجاز الدراسي</h1>
          <Link href="/" className="text-sm text-slate-400 hover:text-white">← الرئيسية</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800"><span className="text-xs text-slate-400">الإنجاز الكلي</span><p className="text-2xl font-bold text-cyan-400">{pct}%</p></div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800"><span className="text-xs text-slate-400">المحاضرات</span><p className="text-2xl font-bold">{total}</p></div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800"><span className="text-xs text-slate-400">المكتملة</span><p className="text-2xl font-bold text-emerald-400">{done}</p></div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800"><span className="text-xs text-slate-400">المتبقية</span><p className="text-2xl font-bold text-amber-400">{total - done}</p></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {courses?.map((c) => {
            const cLecs = lectures?.filter((l) => l.course_id === c.id) || [];
            const cDone = cLecs.filter((l) => completedIds.has(l.id)).length;
            const cPct = cLecs.length > 0 ? Math.round((cDone / cLecs.length) * 100) : 0;
            return (
              <div key={c.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>{c.title_ar}</span>
                  <span className="text-cyan-400">{cPct}% ({cDone}/{cLecs.length})</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: `${cPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
