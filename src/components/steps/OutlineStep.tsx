import React, { useState, useEffect } from 'react';
import { AppData } from '../../App';
import { generateOutline, reviseOutline, Outline } from '../../lib/gemini';
import { ListTree, Loader2, Sparkles, MessageSquare, Send } from 'lucide-react';

interface Props {
  data: AppData;
  updateData: (d: Partial<AppData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function OutlineStep({ data, updateData, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!data.outline && !loading && !error) {
      handleGenerate();
    }
  }, []);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError('');
      const out = await generateOutline(
        data.topic, 
        data.materials, 
        data.files,
        data.researchMode,
        data.language,
        data.customInstructions,
        data.lessonCount
      );
      updateData({ outline: out });
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء التوليد");
    } finally {
      setLoading(false);
    }
  };

  const handleRevise = async () => {
    if (!feedback.trim() || !data.outline) return;
    try {
      setLoading(true);
      setError('');
      const out = await reviseOutline(
          data.outline,
          feedback,
          data.topic,
          data.language,
          data.customInstructions
      );
      updateData({ outline: out });
      setFeedback(''); // Clear feedback on success
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء التعديل");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSectionTitle = (l_idx: number, s_idx: number, newTitle: string) => {
    if (!data.outline) return;
    const newOutline = { ...data.outline };
    newOutline.lessons[l_idx].sections[s_idx].title = newTitle;
    updateData({ outline: newOutline });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-300 overflow-hidden flex flex-col h-full shadow-sm">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 p-8">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <h3 className="font-bold text-slate-800">جاري تحليل المعطيات وإنشاء أو تعديل هيكل الحقيبة...</h3>
            <p className="text-slate-500 text-sm max-w-sm">يقوم الذكاء الاصطناعي الآن بوضع الخطوط العريضة للدروس بناءً على المدخلات، وهذا قد يستغرق بضع ثوانٍ.</p>
        </div>
        <div className="p-3 border-t border-slate-200 flex justify-between bg-white shrink-0">
            <button onClick={onBack} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-6 rounded-md text-[13px] transition-colors">
            رجوع
            </button>
        </div>
      </div>
    );
  }

  if (error) {
     return (
      <div className="bg-white rounded-lg border border-red-300 overflow-hidden flex flex-col h-full shadow-sm">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 p-8">
            <div className="text-red-500 text-4xl">⚠️</div>
            <h3 className="font-bold text-slate-800">حدث خطأ</h3>
            <p className="text-slate-500 text-sm max-w-sm">{error}</p>
            <button onClick={handleGenerate} className="px-4 py-2 bg-blue-600 text-white font-semibold text-sm rounded mt-2">إعادة محاولة التوليد الأساسي</button>
        </div>
        <div className="p-3 border-t border-slate-200 flex justify-between bg-white shrink-0">
            <button onClick={onBack} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-6 rounded-md text-[13px] transition-colors">
            رجوع
            </button>
            <button onClick={onNext} disabled={!data.outline} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md text-[13px] transition-colors disabled:opacity-50">
            تخطي
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-300 overflow-hidden flex flex-col h-full shadow-sm">
      <div className="border-b border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <ListTree className="w-5 h-5 text-blue-600" />
          <span>مراجعة هيكل البرنامج المقترح</span>
        </div>
        <button 
          onClick={handleGenerate}
          className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded font-semibold text-[13px] transition-colors"
        >
          <Sparkles className="w-4 h-4 text-blue-600" />
          إعادة توليد الهيكل بالكامل
        </button>
      </div>

      <div className="p-4 overflow-y-auto flex-1 bg-slate-50 flex flex-col md:flex-row gap-4">
        {data.outline && (
          <div className="space-y-4 flex-1">
            <div className="bg-white p-4 rounded-lg border border-slate-200 mb-2 shadow-sm">
              <h1 className="text-lg font-bold text-slate-800 mb-1">{data.outline.title}</h1>
              <p className="text-[13px] text-slate-600"><strong>الجمهور المستهدف:</strong> {data.outline.targetAudience}</p>
            </div>

            <div className="space-y-4">
              {data.outline.lessons.map((lesson, l_idx) => (
                <div key={l_idx} className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-slate-100 px-4 py-2.5 font-bold text-[13px] text-slate-800 border-b border-slate-200">
                    الدرس {l_idx + 1}: {lesson.title}
                  </div>
                  <div className="p-3 space-y-2 bg-white">
                     {lesson.sections.map((sec, s_idx) => (
                       <div key={s_idx} className="flex gap-3 items-center">
                         <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></div>
                         <input 
                           className="flex-1 px-2 py-1 border border-slate-200 rounded text-[13px] focus:border-blue-500 outline-none"
                           value={sec.title}
                           onChange={e => handleUpdateSectionTitle(l_idx, s_idx, e.target.value)}
                         />
                       </div>
                     ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="w-full md:w-[350px] shrink-0">
           <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 sticky top-0 flex flex-col gap-3">
              <div className="flex items-center gap-2 font-bold text-slate-800 border-b border-slate-100 pb-2">
                 <MessageSquare className="w-4 h-4 text-slate-500" />
                 تعديل الهيكل بالذكاء الاصطناعي
              </div>
              <p className="text-[12px] text-slate-500">
                يمكنك طلب دمج دروس، إزالة قسم، أو إضافة محاور جديدة، وسيقوم الذكاء الاصطناعي بإعادة ترتيب الهيكل لك.
              </p>
              <textarea 
                className="w-full text-sm border border-slate-300 rounded p-2 min-h-[120px] focus:border-blue-500 outline-none resize-none"
                placeholder="مثال: ادمج الدرس الأول والثاني في درس واحد، وقم بإضافة درس أخير عن 'تطبيقات عملية'..."
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
              />
              <button 
                onClick={handleRevise}
                disabled={!feedback.trim()}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-2 rounded text-[13px] font-semibold transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                طبّق التعديلات
              </button>
           </div>
        </div>
      </div>

      <div className="p-3 border-t border-slate-200 flex justify-between bg-white shrink-0">
        <button 
          onClick={onBack}
          className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-6 rounded-md text-[13px] transition-colors"
        >
          رجوع
        </button>
        <button 
          onClick={onNext}
          disabled={!data.outline}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md text-[13px] transition-colors disabled:opacity-50"
        >
          اعتماد والبدء في التأليف
        </button>
      </div>
    </div>
  );
}
