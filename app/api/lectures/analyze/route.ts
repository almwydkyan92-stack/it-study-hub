import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const forceAction = formData.get('forceAction') as string | null;

    if (!file) return NextResponse.json({ error: 'لم يتم إرفاق أي ملف' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    if (!forceAction) {
      const { data: existingLecture } = await supabase
        .from('lectures')
        .select('id, title_ar, version, course_id')
        .eq('file_hash', fileHash)
        .single();

      if (existingLecture) {
        return NextResponse.json({
          duplicateDetected: true,
          existingLecture,
          message: 'تم رفع هذا الملف مسبقًا. هل تريد تحديث المحاضرة الحالية أم إضافتها كنسخة جديدة؟',
        });
      }
    }

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { error: uploadError } = await supabase.storage
      .from('lectures-files')
      .upload(fileName, buffer, { contentType: file.type });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('lectures-files')
      .getPublicUrl(fileName);

    const base64Data = buffer.toString('base64');
    const systemPrompt = `
    أنت خبير أكاديمي ومصمم تعليمي لطلاب تقنية المعلومات (المستوى الثاني).
    حلل ملف المحاضرة بدقة والتزم بالتالي:
    1. إذا لم يكن اسم المادة أو عنوان المحاضرة واضحين تمامًا في الملف، اترك الحقل فارغًا ("") ولا تخمّن.
    2. افصل بصرامة بين:
       - original_content: النصوص والتعاريف والأمثلة الواردة في الملف فقط دون تغيير المعنى.
       - ai_simplified_content: شرحك المبسط لكل فقرة مع أمثلة توضيحية إضافية.
       - external_additions: معلومات إضافية مفيدة مع ذكر المصدر.
    3. حدد simulation_config: اختر "3d" للشبكات وهياكل البيانات، "2d" للمخططات، أو "none" للمواضيع النظرية.
    4. إذا كانت المحاضرة عملية (Python, Oracle SQL, Linux, PHP, Cisco Packet Tracer, C++)، املأ practical_lab بالتفصيل مع تحديد مكان تنفيذ كل أمر بدقة.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [
        { inlineData: { mimeType: file.type, data: base64Data } },
        systemPrompt,
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detected_course_code: { type: Type.STRING },
            lecture_number: { type: Type.INTEGER },
            title_ar: { type: Type.STRING },
            title_en: { type: Type.STRING },
            summary_ar: { type: Type.STRING },
            objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
            prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
            original_content: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  exact_text: { type: Type.STRING },
                  code_or_formula: { type: Type.STRING },
                },
              },
            },
            ai_simplified_content: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  simple_explanation: { type: Type.STRING },
                  extra_example: { type: Type.STRING },
                },
              },
            },
            external_additions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  note: { type: Type.STRING },
                  source: { type: Type.STRING },
                },
              },
            },
            terminology: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term_en: { type: Type.STRING },
                  term_ar: { type: Type.STRING },
                  definition_ar: { type: Type.STRING },
                },
              },
            },
            simulation_config: {
              type: Type.OBJECT,
              properties: {
                mode: { type: Type.STRING, enum: ['3d', '2d', 'none'] },
                domain: { type: Type.STRING },
                scene_type: { type: Type.STRING },
                steps_explanation: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
            practical_lab: {
              type: Type.OBJECT,
              properties: {
                is_practical: { type: Type.BOOLEAN },
                environment: { type: Type.STRING },
                tools_required: { type: Type.ARRAY, items: { type: Type.STRING } },
                steps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      step_title: { type: Type.STRING },
                      where_to_run: { type: Type.STRING },
                      command_or_code: { type: Type.STRING },
                      expected_output: { type: Type.STRING },
                      output_explanation: { type: Type.STRING },
                    },
                  },
                },
              },
            },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correct_index: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
              },
            },
          },
          required: ['title_ar', 'original_content', 'ai_simplified_content', 'simulation_config', 'quiz'],
        },
      },
    });

    const parsedData = JSON.parse(response.text!);
    return NextResponse.json({
      preview: parsedData,
      fileMeta: {
        original_file_url: publicUrlData.publicUrl,
        original_file_name: file.name,
        file_hash: fileHash,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ أثناء التحليل' }, { status: 500 });
  }
}
