import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { preview, fileMeta, courseCode, status } = await req.json();
    const { data: course } = await supabase.from('courses').select('id').eq('code', courseCode).single();
    if (!course) return NextResponse.json({ error: 'المادة غير موجودة' }, { status: 400 });

    const slug = `${courseCode.toLowerCase()}-lec-${preview.lecture_number || 1}-${Date.now()}`;
    const { error } = await supabase.from('lectures').insert({
      course_id: course.id,
      slug,
      lecture_number: preview.lecture_number || 1,
      title_ar: preview.title_ar,
      title_en: preview.title_en || '',
      status: status || 'published',
      original_file_url: fileMeta.original_file_url,
      original_file_name: fileMeta.original_file_name,
      file_hash: fileMeta.file_hash,
      summary_ar: preview.summary_ar,
      objectives: preview.objectives || [],
      prerequisites: preview.prerequisites || [],
      original_content: preview.original_content || [],
      ai_simplified_content: preview.ai_simplified_content || [],
      external_additions: preview.external_additions || [],
      terminology: preview.terminology || [],
      practical_lab: preview.practical_lab || null,
      simulation_config: preview.simulation_config || null,
      quiz: preview.quiz || [],
    });

    if (error) throw error;
    return NextResponse.json({ slug });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
