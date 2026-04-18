import React, { useState, useEffect } from 'react';
import { AppData } from '../../App';
import { generateSectionContent, generateContentImages, GeneratedSection } from '../../lib/gemini';
import { createPresentation } from '../../lib/pptx';
import { FileEdit, CheckCircle2, Loader2, Check, Key, Play, Download, ChevronLeft } from 'lucide-react';

interface Props {
  data: AppData;
  updateData: (d: Partial<AppData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function GenerateStep({ data, updateData, onNext, onBack }: Props) {
  const [currentTask, setCurrentTask] = useState('');
  const [error, setError] = useState('');
  const [activeLessonIndex, setActiveLessonIndex] = useState(data.generatedLessons.length);
  const [isGenerating, setIsGenerating] = useState(false);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [sectionProgress, setSectionProgress] = useState({ current: 0, total: 1 });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
      let interval: any;
      if (isGenerating) {
          interval = setInterval(() => {
              setElapsedSeconds(prev => prev + 1);
          }, 1000);
      } else {
          setElapsedSeconds(0);
      }
      return () => clearInterval(interval);
  }, [isGenerating]);

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const outline = data.outline;

  const checkApiKey = async (): Promise<boolean> => {
      if (typeof window !== 'undefined' && (window as any).aistudio && typeof (window as any).aistudio.hasSelectedApiKey === 'function') {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          if (!hasKey) {
              setNeedsApiKey(true);
              return false;
          }
      }
      return true;
  };

  const handleSelectKey = async () => {
       if (typeof window !== 'undefined' && (window as any).aistudio?.openSelectKey) {
           await (window as any).aistudio.openSelectKey();
           setNeedsApiKey(false);
           if (activeLessonIndex < (outline?.lessons.length || 0)) {
               generateLesson(activeLessonIndex);
           }
       }
  };

  const generateLesson = async (lessonIndex: number) => {
    if (!outline) return;
    
    try {
      const hasKey = await checkApiKey();
      if (!hasKey) return;

      setIsGenerating(true);
      setError('');
      
      const lesson = outline.lessons[lessonIndex];
      let lessonData: GeneratedSection[] = [];
      
      setSectionProgress({ current: 0, total: lesson.sections.length });

      for (let i = 0; i < lesson.sections.length; i++) {
         const section = lesson.sections[i];
         setCurrentTask(`تأليف وكتابة محتوى القسم ${i+1}/${lesson.sections.length}: ${section.title} (يستغرق عادةً 10-30 ثانية)`);
         
         const textResult = await generateSectionContent(
           outline.title,
           lesson.title,
           section,
           data.materials,
           data.files,
           data.researchMode,
           data.language,
           data.customInstructions
         );

         setCurrentTask(`تحضير الرسوم والصور للقسم ${i+1}/${lesson.sections.length}...`);
         
         const result = await generateContentImages(textResult, (msg) => {
            setCurrentTask(msg);
         });
         
         lessonData.push(result);
         setSectionProgress({ current: i + 1, total: lesson.sections.length });
      }

      const newGeneratedLessons = [...data.generatedLessons];
      newGeneratedLessons[lessonIndex] = { title: lesson.title, content: lessonData };
      updateData({ generatedLessons: newGeneratedLessons });
      
      setActiveLessonIndex(lessonIndex + 1);
    } catch (err: any) {
      if (err.message && (err.message.includes("PERMISSION_DENIED") || err.message.includes("403"))) {
          setNeedsApiKey(true);
          setError('');
      } else {
          setError(err.message || 'حدث خطأ غير متوقع أثناء توليد الدرس.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadLessonPPTX = async (lessonIndex: number) => {
      const lesson = data.generatedLessons[lessonIndex];
      if (!lesson) return;
      const options = { ...data.options, title: `${data.outline?.title} - ${lesson.title}` };
      await createPresentation([lesson], options);
  };

  const downloadLessonMD = (lessonIndex: number) => {
      const lesson = data.generatedLessons[lessonIndex];
      if (!lesson) return;
      const content = lesson.content.map(c => c.textbookMarkdown).join('\n\n---\n\n');
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Lesson_${lessonIndex + 1}_${lesson.title}.md`;
      a.click();
      URL.revokeObjectURL(url);
  };

  if (needsApiKey) {
     return (
       <div className="bg-white rounded-lg border border-slate-300 p-8 flex flex-col items-center justify-center text-center space-y-4 h-full shadow-sm">
           <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
             <Key className="w-8 h-8" />
           </div>
           <h3 className="text-xl font-bold text-slate-800">مفتاح API مطلوب للصور الفائقة</h3>
           <p className="text-slate-500 text-sm max-w-sm">
             لبناء النماذج الجرافيكية باستخدام نموذج <code>gemini-3.1-flash-image-preview</code> الفائق، يرجى تقديم مفتاح API الخاص بك من مشروع فوترة مدفوع.
             <br/><a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-blue-600 underline mt-2 block">تفاصيل الفوترة وإعداد المفتاح</a>
           </p>
           <button 
             onClick={handleSelectKey} 
             className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded mt-4"
           >
             إدخال مفتاح API للمتابعة
           </button>
       </div>
     );
  }

  if (!outline) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-300 overflow-hidden flex flex-col h-full shadow-sm">
      <div className="border-b border-slate-200 p-4 flex items-center gap-2 font-bold text-slate-800 shrink-0">
        <FileEdit className="w-5 h-5 text-blue-600" />
        <div className="flex flex-col">
            <span>تأليف المحتوى: توليد ومراجعة الدروس</span>
            <span className="text-[11px] font-normal text-slate-500">طريقة التوليد المتسلسل تتيح لك مراجعة وتحميل كل درس على حدة</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
         <div className="max-w-3xl mx-auto space-y-4">
            {outline.lessons.map((lesson, idx) => {
                const isCompleted = idx < data.generatedLessons.length;
                const isActive = idx === activeLessonIndex;
                const isLocked = idx > activeLessonIndex;

                return (
                    <div key={idx} className={`border rounded-lg p-5 transition-all ${
                        isActive ? 'bg-white border-blue-400 shadow-md ring-1 ring-blue-100' :
                        isCompleted ? 'bg-slate-50 border-slate-200 opacity-90' : 'bg-slate-100/50 border-slate-200 opacity-60'
                    }`}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className={`font-bold text-lg flex items-center gap-2 ${isActive ? 'text-blue-800' : isCompleted ? 'text-slate-800' : 'text-slate-500'}`}>
                                    الدرس {idx + 1}: {lesson.title}
                                    {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                </h3>
                                <p className="text-[13px] text-slate-500 mt-1">{lesson.description}</p>
                                <div className="text-[11px] text-slate-400 mt-2">
                                    يحتوي على {lesson.sections.length} أقسام (حوالي {lesson.sections.length * 5} صفحة/شريحة)
                                </div>
                            </div>

                            <div className="shrink-0 flex flex-col gap-2">
                                {isCompleted ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => downloadLessonPPTX(idx)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-100 text-orange-700 hover:bg-orange-200 rounded transition-colors" title="تحميل عرض PowerPoint">
                                            <Download className="w-3.5 h-3.5" /> شرائح
                                        </button>
                                        <button onClick={() => downloadLessonMD(idx)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 rounded transition-colors" title="تحميل المحتوى كملف نصي">
                                            <Download className="w-3.5 h-3.5" /> ملزمة
                                        </button>
                                    </div>
                                ) : isActive ? (
                                    <button 
                                        onClick={() => generateLesson(idx)} 
                                        disabled={isGenerating}
                                        className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                        {isGenerating ? 'جاري التوليد...' : 'البدء بالتوليد'}
                                    </button>
                                ) : (
                                    <span className="px-4 py-2 text-xs font-semibold bg-slate-200 text-slate-400 rounded cursor-not-allowed">قيد الانتظار</span>
                                )}
                            </div>
                        </div>

                        {isActive && isGenerating && (
                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 mb-2">
                                    <div className="flex items-center gap-2">
                                       <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                       <span>جاري بناء الأقسام ({sectionProgress.current} من {sectionProgress.total})</span>
                                    </div>
                                    <div className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono border border-blue-100 flex items-center gap-1.5" title="الوقت المستغرق حتى الآن للدرس الحالي">
                                        ⏱️ {formatTime(elapsedSeconds)}
                                    </div>
                                </div>
                                <div className="text-[12px] font-medium text-blue-800 mb-3 bg-blue-50/50 p-2 rounded border border-blue-50">
                                    {currentTask}
                                </div>
                                <div className="w-full h-[6px] bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(sectionProgress.current / sectionProgress.total) * 100}%` }}></div>
                                </div>
                            </div>
                        )}

                        {isActive && error && (
                            <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 flex justify-between items-center">
                                <span>⚠️ {error}</span>
                                <button onClick={() => generateLesson(idx)} className="underline font-bold">إعادة المحاولة</button>
                            </div>
                        )}
                    </div>
                );
            })}
         </div>
         {activeLessonIndex === outline.lessons.length && (
             <div className="max-w-3xl mx-auto mt-6 p-6 bg-green-50 border border-green-200 rounded-lg text-center shadow-sm">
                 <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                     <CheckCircle2 className="w-6 h-6" />
                 </div>
                 <h3 className="font-bold text-green-800 text-lg">تم إنجاز جميع الدروس!</h3>
                 <p className="text-green-600 text-sm mt-1 mb-4">يمكنك الآن مراجعة وتحميل العرض النهائي مجمعاً لكامل الحقيبة.</p>
                 <button 
                    onClick={onNext}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded shadow transition-colors"
                 >
                     المعاينة والمراجعة النهائية
                 </button>
             </div>
         )}
      </div>

      <div className="p-3 border-t border-slate-200 flex justify-between bg-white shrink-0">
        <button 
          onClick={onBack}
          disabled={isGenerating}
          className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-6 rounded-md text-[13px] transition-colors disabled:opacity-50"
        >
          رجوع
        </button>
        <button 
          onClick={onNext}
          disabled={activeLessonIndex < outline.lessons.length}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md text-[13px] transition-colors disabled:opacity-50"
        >
          المراجعة الشاملة <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
