import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Dynamic3DViewer from '@/components/simulations/Dynamic3DViewer';
import InteractiveQuiz from '@/components/InteractiveQuiz';

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function LecturePage({ params }: { params: { slug: string } }) {
  const { data: lecture } = await supabase
    .from('lectures')
    .select('*, courses(title_ar, code)')
    .eq('slug', params.slug)
    .single();

  if (!lecture) notFound();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" dir="rtl">
      <nav className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-3 flex justify-between items-center">
        <div className="flex flex-wrap gap-4 text-xs font-bold">
          <a href="#original" className="text-emerald-400">محتوى المحاضر الأصلي</a>
          <a href="#simplified" className="text-blue-400">الشرح المبسط</a>
          <a href="#simulation" className="text-purple-400">المختبر التفاعلي</a>
          <a href="#quiz" className="text-cyan-400">الاختبار</a>
        </div>
        <Link href="/" className="text-xs text-slate-400 hover:text-white">الرئيسية ←</Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        <header className="border-b border-slate-800 pb-6">
          <span className="text-xs font-bold text-cyan-400">{lecture.courses?.title_ar} ({lecture.courses?.code})</span>
          <h1 className="text-3xl font-extrabold mt-2">{lecture.title_ar}</h1>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">{lecture.summary_ar}</p>
        </header>

        <section id="original" className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-emerald-300">📜 محتوى المحاضر الأصلي</h2>
            <a href={lecture.original_file_url} target="_blank" className="text-xs bg-emerald-600 px-3 py-1.5 rounded-lg font-bold">الملف الأصلي ↗</a>
          </div>
          {lecture.original_content?.map((item: any, i: number) => (
            <div key={i} className="bg-slate-900 p-4 rounded-xl border border-emerald-900/50">
              <h3 className="font-bold text-sm mb-2">{item.heading}</h3>
              <p className="text-xs leading-relaxed whitespace-pre-line text-slate-300">{item.exact_text}</p>
              {item.code_or_formula && (
                <pre className="mt-3 p-3 rounded bg-slate-950 text-emerald-300 text-xs overflow-x-auto" dir="ltr"><code>{item.code_or_formula}</code></pre>
              )}
            </div>
          ))}
        </section>

        <section id="simplified" className="p-6 rounded-2xl bg-blue-950/20 border border-blue-500/40 space-y-4">
          <h2 className="text-lg font-bold text-blue-300">💡 الشرح التعليمي المبسط</h2>
          {lecture.ai_simplified_content?.map((item: any, i: number) => (
            <div key={i} className="bg-slate-900 p-4 rounded-xl border border-blue-900/50">
              <h3 className="font-bold text-sm text-blue-400 mb-1">{item.topic}</h3>
              <p className="text-xs leading-relaxed text-slate-300">{item.simple_explanation}</p>
              {item.extra_example && <p className="mt-2 p-2.5 rounded bg-slate-950 text-xs text-slate-400">مثال: {item.extra_example}</p>}
            </div>
          ))}
        </section>

        <section id="simulation">
          <Dynamic3DViewer config={lecture.simulation_config} />
        </section>

        {lecture.practical_lab?.is_practical && (
          <section className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-4">
            <h2 className="text-lg font-bold text-amber-300">🛠️ التطبيق العملي ({lecture.practical_lab.environment})</h2>
            {lecture.practical_lab.steps?.map((s: any, i: number) => (
              <div key={i} className="bg-slate-900 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>{i + 1}. {s.step_title}</span>
                  <span className="text-amber-400 font-mono">{s.where_to_run}</span>
                </div>
                <pre className="p-3 rounded bg-slate-950 text-amber-300 text-xs overflow-x-auto" dir="ltr"><code>{s.command_or_code}</code></pre>
                <p className="text-xs text-slate-400">النتيجة: {s.expected_output}</p>
              </div>
            ))}
          </section>
        )}

        <InteractiveQuiz lectureId={lecture.id} questions={lecture.quiz} />
      </main>
    </div>
  );
}
