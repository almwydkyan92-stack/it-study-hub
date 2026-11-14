import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function HomePage() {
  const { data: courses } = await supabase.from('courses').select('*').order('code');
  const { data: lectures } = await supabase
    .from('lectures')
    .select('*, courses(title_ar, code)')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10" dir="rtl">
      <header className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 pb-6 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-cyan-400">IT Study Hub</h1>
          <p className="text-slate-400 text-sm mt-1">منصة تقنية المعلومات الذكية - المستوى الثاني</p>
        </div>
        <div className="flex gap-3">
          <Link href="/progress" className="bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm transition">
            📊 متابعة الإنجاز
          </Link>
          <Link href="/admin" className="bg-cyan-600 hover:bg-cyan-500 px-5 py-2.5 rounded-xl font-bold text-sm transition">
            + إضافة محاضرة جديدة
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-12">
        <section>
          <h2 className="text-xl font-bold mb-4 text-slate-200">📚 أحدث المحاضرات المضافة</h2>
          {!lectures?.length ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">
              لا توجد محاضرات منشورة بعد. اضغط على زر "+ إضافة محاضرة جديدة" لرفع أول ملف PDF.
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {lectures.map((lec: any) => (
                <Link
                  key={lec.id}
                  href={`/lectures/${lec.slug}`}
                  className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500 transition block"
                >
                  <span className="text-xs font-bold text-cyan-400">{lec.courses?.title_ar}</span>
                  <h3 className="text-lg font-bold mt-2">{lec.title_ar}</h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{lec.summary_ar}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-slate-200">🗂️ الخارطة الدراسية (نظري وعملي)</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {courses?.map((c: any) => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs text-slate-400">{c.code}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded ${c.track === 'practical' ? 'bg-amber-900/50 text-amber-300' : 'bg-blue-900/50 text-blue-300'}`}>
                    {c.track === 'practical' ? `عملي (${c.lab_environment})` : 'نظري'}
                  </span>
                </div>
                <h3 className="font-bold mt-2">{c.title_ar}</h3>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
