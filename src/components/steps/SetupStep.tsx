import React, { useRef } from 'react';
import { AppData, UploadedFile } from '../../App';
import { Settings, BookOpen, Upload, X, Globe, Lock, Layers } from 'lucide-react';

interface Props {
  data: AppData;
  updateData: (d: Partial<AppData>) => void;
  onNext: () => void;
}

export default function SetupStep({ data, updateData, onNext }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Str = event.target?.result as string;
        // Split data:application/pdf;base64, from the actual base64
        const [, base64Data] = base64Str.split('base64,');
        
        if (base64Data) {
          const newFile: UploadedFile = {
            name: file.name,
            mimeType: file.type || 'text/plain',
            data: base64Data
          };
          updateData({ files: [...data.files, newFile] });
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...data.files];
    newFiles.splice(index, 1);
    updateData({ files: newFiles });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-300 flex flex-col shadow-sm">
      <div className="border-b border-slate-200 p-4 flex items-center justify-between font-bold text-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <span>إعداد الحقيبة التدريبية</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row bg-slate-300 gap-px">
        <div className="flex-1 bg-slate-50 p-4 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-4 h-full">
            <div className="flex justify-between border-b border-slate-100 pb-2 mb-2 font-bold text-[0.9rem]">المادة العلمية والمصادر</div>
            
            <div>
              <label className="text-[0.75rem] text-slate-500 uppercase tracking-wide mb-2 block">عنوان الحقيبة / الموضوع الأساسي</label>
              <input 
                className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-500 outline-none"
                placeholder="مثال: دورة الذكاء الاصطناعي للمبتدئين"
                value={data.topic}
                onChange={e => updateData({ topic: e.target.value })}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[0.75rem] text-slate-500 uppercase tracking-wide mb-2 block">الملفات المرجعية (Uploads)</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[80px] border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 rounded-lg flex flex-col items-center justify-center cursor-pointer mb-2 transition-colors"
              >
                <input 
                  type="file" 
                  multiple 
                  accept=".pdf,.txt,.md,.csv" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <Upload className="w-6 h-6 text-blue-400 mb-2" />
                <span className="text-[13px] text-blue-600 font-medium">انقر هنا لرفع الملفات (PDF, TXT, MD)</span>
                <span className="text-[11px] text-slate-500 mt-1">سيتم استخدام هذه الملفات كمصدر أساسي للحقيبة</span>
              </div>
              
              {data.files.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {data.files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded px-2 py-1 text-[12px]">
                      <span className="truncate max-w-[150px] text-slate-700" title={file.name}>{file.name}</span>
                      <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col mb-4">
              <label className="text-[0.75rem] text-slate-500 uppercase tracking-wide mb-2 block">النصوص المرجعية (Paste Text)</label>
              <textarea 
                className="w-full flex-1 min-h-[100px] px-2 py-1.5 border border-slate-300 rounded focus:border-blue-500 outline-none resize-none"
                placeholder="ضع هنا أي نصوص أو روابط إضافية..."
                value={data.materials}
                onChange={e => updateData({ materials: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-[0.75rem] text-slate-500 uppercase tracking-wide mb-2 block">العدد المستهدف للدروس</label>
              <input 
                type="number"
                min="1"
                max="20"
                className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-500 outline-none"
                value={data.lessonCount}
                onChange={e => updateData({ lessonCount: Number(e.target.value) })}
              />
            </div>

          </div>
        </div>

        <div className="w-full md:w-[350px] shrink-0 bg-slate-50 p-4 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-[0.9rem] text-slate-800">
              <Settings className="w-4 h-4 text-slate-500" />
              ضوابط التأليف
            </div>
            
            <div>
              <label className="text-[0.75rem] text-slate-500 uppercase tracking-wide mb-2 block">لغة الخرج (Language)</label>
              <select 
                className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-500 outline-none text-[13px]"
                value={data.language}
                onChange={e => updateData({ language: e.target.value as any })}
              >
                <option value="AR_EN">عربي / إنجليزي (مزدوج اللغة)</option>
                <option value="AR">عربي فقط</option>
                <option value="EN">إنجليزي فقط</option>
              </select>
            </div>

            <div>
              <label className="text-[0.75rem] text-slate-500 uppercase tracking-wide mb-3 block">نمط البحث والاعتمادية</label>
              <div className="space-y-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="radio" className="mt-1 w-3.5 h-3.5 text-blue-600 shrink-0" checked={data.researchMode === 'HYBRID'} onChange={() => updateData({ researchMode: 'HYBRID' })} />
                  <div>
                    <div className="font-bold text-slate-800 text-[13px] flex items-center gap-1"><Layers className="w-3 h-3"/> المرفقات + بحث الإنترنت</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">البناء من الملفات المرفقة وتعزيزها بالبحث الخارجي (موصى به).</div>
                  </div>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="radio" className="mt-1 w-3.5 h-3.5 text-blue-600 shrink-0" checked={data.researchMode === 'STRICT'} onChange={() => updateData({ researchMode: 'STRICT' })} />
                  <div>
                    <div className="font-bold text-slate-800 text-[13px] flex items-center gap-1"><Lock className="w-3 h-3"/> التزام حرفي بالمرفقات</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">حصر المعلومات بالملفات المرفوعة دون الخروج عنها.</div>
                  </div>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="radio" className="mt-1 w-3.5 h-3.5 text-blue-600 shrink-0" checked={data.researchMode === 'WEB_ONLY'} onChange={() => updateData({ researchMode: 'WEB_ONLY' })} />
                  <div>
                    <div className="font-bold text-slate-800 text-[13px] flex items-center gap-1"><Globe className="w-3 h-3"/> بحث إنترنت عميق فقط</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">الاعتماد بشكل شبه كلي على البحث الحر في الويب.</div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="text-[0.75rem] text-slate-500 uppercase tracking-wide mb-2 block">توجيهات إضافية (Instructions)</label>
              <textarea 
                className="w-full min-h-[80px] px-2 py-1.5 border border-slate-300 rounded focus:border-blue-500 outline-none text-[13px] resize-none"
                placeholder="مثال: اجعل المحتوى للمبتدئين، لا يقل الكتاب عن 50 صفحة..."
                value={data.customInstructions}
                onChange={e => updateData({ customInstructions: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-[0.9rem] text-slate-800">
              <Settings className="w-4 h-4 text-slate-500" />
              إعدادات Nano Banana
            </div>
            <div>
              <label className="text-[0.75rem] text-slate-500 uppercase tracking-wide mb-2 block">العنوان العلوي (الهيدر)</label>
              <input 
                className="w-full px-2 py-1.5 border border-slate-300 rounded outline-none"
                placeholder="أكاديمية الإبداع"
                value={data.options.title}
                onChange={e => updateData({ options: { ...data.options, title: e.target.value } })}
              />
            </div>
            <div>
              <label className="text-[0.75rem] text-slate-500 uppercase tracking-wide mb-2 block">النص السفلي (الفوتر)</label>
              <input 
                className="w-full px-2 py-1.5 border border-slate-300 rounded outline-none"
                value={data.options.footerText}
                onChange={e => updateData({ options: { ...data.options, footerText: e.target.value } })}
              />
            </div>
            <div>
              <label className="text-[0.75rem] text-slate-500 uppercase tracking-wide mb-2 block">اللون الأساسي</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color"
                  className="w-8 h-8 rounded cursor-pointer border border-slate-300 p-0 shadow-sm"
                  value={data.options.primaryColor}
                  onChange={e => updateData({ options: { ...data.options, primaryColor: e.target.value } })}
                />
              </div>
            </div>
            <div>
              <label className="text-[0.75rem] text-slate-500 uppercase tracking-wide mb-2 block">الخط العربي</label>
              <select 
                className="w-full px-2 py-1.5 border border-slate-300 rounded outline-none"
                value={data.options.fontFace}
                onChange={e => updateData({ options: { ...data.options, fontFace: e.target.value } })}
              >
                <option value="Tajawal">Tajawal (تجوال)</option>
                <option value="Noto Sans Arabic">Noto Sans Arabic</option>
                <option value="Arial">Arial</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-slate-200 flex justify-end bg-white">
        <button 
          onClick={onNext}
          disabled={!data.topic.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md text-[13px] transition-colors disabled:opacity-50"
        >
          متابعة وتوليد الهيكل المقترح
        </button>
      </div>
    </div>
  );
}
