import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import SetupStep from './components/steps/SetupStep';
import OutlineStep from './components/steps/OutlineStep';
import GenerateStep from './components/steps/GenerateStep';
import ReviewStep from './components/steps/ReviewStep';
import { Outline, GeneratedSection } from './lib/gemini';
import { PptxOptions } from './lib/pptx';

export type AppState = 'SETUP' | 'OUTLINE' | 'GENERATE' | 'REVIEW';

export interface UploadedFile {
  name: string;
  mimeType: string;
  data: string; // base64 string without data uris
}

export interface AppData {
  topic: string;
  materials: string;
  files: UploadedFile[];
  researchMode: 'STRICT' | 'WEB_ONLY' | 'HYBRID';
  language: 'AR_EN' | 'AR' | 'EN';
  customInstructions: string;
  lessonCount: number;
  options: PptxOptions;
  outline: Outline | null;
  generatedLessons: { title: string; content: GeneratedSection[] }[];
}

export default function App() {
  const [step, setStep] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('nanoBananaStep');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return 'SETUP';
  });

  const [data, setData] = useState<AppData>(() => {
    try {
      const saved = localStorage.getItem('nanoBananaData');
      if (saved) {
        const parsed = JSON.parse(saved) as AppData;
        // Don't restore massive files data to memory automatically to save localStorage space, 
        // they will just re-upload if needed.
        return { ...parsed, files: [] };
      }
    } catch(e) {}
    
    return {
      topic: '',
      materials: '',
      files: [],
      researchMode: 'HYBRID',
      language: 'AR_EN',
      customInstructions: '',
      lessonCount: 5,
      options: {
        title: '',
        footerText: 'جميع الحقوق محفوظة',
        author: 'المحاضر',
        primaryColor: '#2563eb', // blue-600
        fontFace: 'Tajawal' // Set default
      },
      outline: null,
      generatedLessons: [],
    };
  });

  useEffect(() => {
    localStorage.setItem('nanoBananaStep', JSON.stringify(step));
  }, [step]);

  useEffect(() => {
    // We intentionally omit `files` array when saving because base64 data exceeds typical 5MB localStorage limits
    const dataToSave = { ...data, files: [] };
    try {
      localStorage.setItem('nanoBananaData', JSON.stringify(dataToSave));
    } catch (e) {
      console.warn("Could not save full data to localStorage (might be too large)");
    }
  }, [data]);

  const updateData = (newData: Partial<AppData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const handleReset = () => {
    if (confirm('هل أنت متأكد من مسح جميع البيانات والبدء من جديد؟')) {
      localStorage.removeItem('nanoBananaStep');
      localStorage.removeItem('nanoBananaData');
      setStep('SETUP');
      setData({
        topic: '', materials: '', files: [], researchMode: 'HYBRID', language: 'AR_EN', customInstructions: '', lessonCount: 5,
        options: { title: '', footerText: 'جميع الحقوق محفوظة', author: 'المحاضر', primaryColor: '#2563eb', fontFace: 'Tajawal' },
        outline: null, generatedLessons: []
      });
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f1f5f9] text-slate-900 flex flex-col text-[14px]">
      <header className="h-[60px] bg-white border-b border-slate-300 px-6 flex items-center justify-between shrink-0 z-10 w-full">
        <div className="flex items-center gap-3 text-[1.2rem] font-extrabold text-blue-600 cursor-pointer" onClick={handleReset} title="مسح وبدء مشروع جديد">
          <span>🍌 Nano Banana Pro</span>
          <span className="text-[0.8rem] font-normal text-slate-500 opacity-80 mt-1">v2.0</span>
        </div>
        <div className="flex gap-2 lg:hidden">
          {['SETUP', 'OUTLINE', 'GENERATE', 'REVIEW'].map((s, idx) => (
            <div 
              key={s} 
              className={`w-2.5 h-2.5 rounded-full ${step === s ? 'bg-blue-600' : 'bg-slate-300'}`} 
              title={s}
            />
          ))}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden lg:max-w-[1400px] w-full mx-auto" style={{ fontFamily: data.options.fontFace === 'Tajawal' ? 'Tajawal, sans-serif' : data.options.fontFace === 'Noto Sans Arabic' ? '"Noto Sans Arabic", sans-serif' : 'Arial, sans-serif' }}>
        
        <aside className="hidden lg:flex w-[260px] shrink-0 bg-slate-50 border-l border-slate-300 flex-col p-4 z-10 relative">
          <div className="font-bold text-[0.85rem] text-slate-800 mb-4 pb-2 border-b border-slate-200">الترتيب الزمني للمشروع</div>
          
          <div className="space-y-1 text-[13px]">
            <div className={`p-2 rounded flex items-center gap-2 ${step === 'SETUP' ? 'bg-blue-100 text-blue-700 font-bold' : data.topic ? 'text-slate-600' : 'text-slate-400'}`}>
               <span className="w-5 flex justify-center text-xs">1</span> إعداد المواد
            </div>
            <div className={`p-2 rounded flex items-center gap-2 ${step === 'OUTLINE' ? 'bg-blue-100 text-blue-700 font-bold' : step === 'GENERATE' || step === 'REVIEW' ? 'text-slate-600' : 'text-slate-400'}`}>
               <span className="w-5 flex justify-center text-xs">2</span> الهيكل التنظيمي
            </div>
            <div className={`p-2 rounded flex items-center gap-2 ${step === 'GENERATE' ? 'bg-blue-100 text-blue-700 font-bold' : step === 'REVIEW' ? 'text-slate-600' : 'text-slate-400'}`}>
               <span className="w-5 flex justify-center text-xs">3</span> بناء المحتوى
            </div>
            <div className={`p-2 rounded flex items-center gap-2 ${step === 'REVIEW' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-400'}`}>
               <span className="w-5 flex justify-center text-xs">4</span> الاستعراض والتحميل
            </div>
          </div>
          
          <div className="mt-auto border-t border-slate-200 pt-4 text-xs text-slate-500">
            <div><strong>موضوع الحقيبة:</strong></div>
            <div className="truncate mt-1 text-slate-700" title={data.topic}>{data.topic || "لم يحدد بعد"}</div>
            
            <div className="mt-4"><strong>إعدادات العرض:</strong></div>
            <div className="mt-1 flex items-center gap-2">
              <span className="block w-3 h-3 rounded-[2px]" style={{ backgroundColor: data.options.primaryColor }}></span>
              <span className="truncate">{data.options.fontFace}</span>
            </div>
          </div>
        </aside>

        <main className="flex-1 w-full p-2 py-4 md:p-6 overflow-y-auto relative bg-[#f1f5f9]">
          <AnimatePresence mode="wait">
            {step === 'SETUP' && (
              <motion.div key="SETUP" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="h-full">
                <SetupStep data={data} updateData={updateData} onNext={() => setStep('OUTLINE')} />
              </motion.div>
            )}
            {step === 'OUTLINE' && (
              <motion.div key="OUTLINE" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="h-full">
                <OutlineStep data={data} updateData={updateData} onNext={() => setStep('GENERATE')} onBack={() => setStep('SETUP')} />
              </motion.div>
            )}
            {step === 'GENERATE' && (
              <motion.div key="GENERATE" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="h-full">
                <GenerateStep data={data} updateData={updateData} onNext={() => setStep('REVIEW')} onBack={() => setStep('OUTLINE')} />
              </motion.div>
            )}
            {step === 'REVIEW' && (
              <motion.div key="REVIEW" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="h-full">
                <ReviewStep data={data} onBack={() => setStep('GENERATE')} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
