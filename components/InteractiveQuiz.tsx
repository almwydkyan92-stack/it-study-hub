'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function InteractiveQuiz({ lectureId, questions }: { lectureId: string; questions: any[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = questions?.length
    ? Math.round((questions.filter((q, idx) => answers[idx] === q.correct_index).length / questions.length) * 100)
    : 0;

  const handleSubmit = async () => {
    setSubmitted(true);
    await supabase.from('study_progress').upsert(
      {
        user_id: '00000000-0000-0000-0000-000000000001',
        lecture_id: lectureId,
        is_completed: true,
        quiz_score: score,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lecture_id' }
    );
  };

  if (!questions?.length) return null;

  return (
    <section id="quiz" className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-cyan-400">✍️ الاختبار التفاعلي</h2>
        {submitted && <span className="text-xs font-bold text-emerald-400">✓ تم حفظ النتيجة ({score}%)</span>}
      </div>
      {questions.map((q, qIdx) => (
        <div key={qIdx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <p className="font-bold text-sm">{qIdx + 1}. {q.question}</p>
          {q.options.map((opt: string, oIdx: number) => (
            <button
              key={oIdx}
              disabled={submitted}
              onClick={() => setAnswers({ ...answers, [qIdx]: oIdx })}
              className={`w-full text-right p-2.5 rounded-lg border text-xs block ${
                submitted
                  ? q.correct_index === oIdx
                    ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300'
                    : answers[qIdx] === oIdx
                    ? 'border-rose-500 bg-rose-950/50 text-rose-300'
                    : 'border-slate-800'
                  : answers[qIdx] === oIdx
                  ? 'border-cyan-500 bg-cyan-950/50'
                  : 'border-slate-800'
              }`}
            >
              {opt}
            </button>
          ))}
          {submitted && <p className="text-xs text-slate-400 pt-1">💡 {q.explanation}</p>}
        </div>
      ))}
      {!submitted && (
        <button onClick={handleSubmit} className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-sm">
          تصحيح الاختبار وتسجيل إتمام المحاضرة
        </button>
      )}
    </section>
  );
}
