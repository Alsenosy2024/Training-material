import React, { useState } from 'react';
import { AppData } from '../../App';
import ReactMarkdown from 'react-markdown';
import { createPresentation } from '../../lib/pptx';
import { Download, Presentation, ChevronRight, ChevronLeft } from 'lucide-react';

interface Props {
  data: AppData;
  onBack: () => void;
}

export default function ReviewStep({ data, onBack }: Props) {
  const [viewMode, setViewMode] = useState<'TEXTBOOK' | 'SLIDES'>('SLIDES');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Flatten all slides into a single array for the carousel view
  const allSlides = React.useMemo(() => {
    const flattened = [];
    data.generatedLessons.forEach((lesson, l_idx) => {
        // Add master title slide for the lesson
        flattened.push({
            isMaster: true,
            lessonTitle: lesson.title,
            lessonIndex: l_idx + 1
        });
        // Add individual slides
        lesson.content.forEach((sec) => {
            sec.slides.forEach((slide) => {
                flattened.push({
                    isMaster: false,
                    ...slide,
                    lessonTitle: lesson.title
                });
            });
        });
    });
    return flattened;
  }, [data.generatedLessons]);

  const handleDownloadPPTX = async () => {
    try {
      if (!data.options.title && data.outline) {
        data.options.title = data.outline.title;
      }
      await createPresentation(data.generatedLessons, data.options);
    } catch (err) {
      alert("حدث خطأ أثناء تحميل ملف البوربوينت");
      console.error(err);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const nextSlide = () => {
      setCurrentSlideIndex(prev => Math.min(allSlides.length - 1, prev + 1));
  };

  const prevSlide = () => {
      setCurrentSlideIndex(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="bg-white rounded-lg border border-slate-300 overflow-hidden flex flex-col h-full shadow-sm">
      <div className="bg-slate-200 border-b border-slate-300 flex flex-wrap items-center justify-between no-print gap-2 shrink-0">
        <div className="flex bg-slate-300 gap-[1px]">
          <button 
            onClick={() => setViewMode('SLIDES')}
            className={`px-4 py-2.5 font-semibold text-[13px] transition-colors ${viewMode === 'SLIDES' ? 'bg-slate-50 text-blue-600 border-t-2 border-t-blue-600' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            العرض التقديمي (Slides)
          </button>
          <button 
            onClick={() => setViewMode('TEXTBOOK')}
            className={`px-4 py-2.5 font-semibold text-[13px] transition-colors ${viewMode === 'TEXTBOOK' ? 'bg-slate-50 text-blue-600 border-t-2 border-t-blue-600' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            الكتاب الدراسي (Textbook)
          </button>
        </div>
        
        <div className="flex gap-2 p-2">
          {viewMode === 'TEXTBOOK' && (
            <button 
              onClick={handlePrintPdf}
              className="flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded font-semibold text-[13px] transition-colors"
            >
              <Download className="w-4 h-4" />
              طباعة / PDF
            </button>
          )}
          <button 
            onClick={handleDownloadPPTX}
            className="flex items-center gap-2 bg-[#d24726] hover:bg-[#b03a1f] text-white px-3 py-1.5 rounded font-semibold text-[13px] transition-colors"
          >
            <Presentation className="w-4 h-4" />
            تحميل PowerPoint
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 print:bg-white print:p-0 flex flex-col">
        <div className="max-w-4xl mx-auto space-y-6 pb-6 print:max-w-none print:pb-0 w-full flex-1 flex flex-col">
          
          {viewMode === 'TEXTBOOK' ? (
            <div className="print-book">
              <div className="text-center mb-10 pt-10 print:pt-32 print:page-break-after">
                <h1 className="text-3xl font-bold text-slate-800 mb-4">{data.outline?.title || data.topic}</h1>
                <p className="text-slate-600">الفئة المستهدفة: {data.outline?.targetAudience}</p>
              </div>

              {data.generatedLessons.map((lesson, l_idx) => (
                <div key={l_idx} className="mb-10 print:page-break-before bg-white p-8 border border-slate-200 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-800 mb-6 pb-2 border-b border-slate-200">
                    الدرس {l_idx + 1}: {lesson.title}
                  </h2>
                  
                  <div className="space-y-8">
                     {lesson.content.map((sec, s_idx) => (
                       <div key={s_idx}>
                          <div className="prose prose-slate prose-sm max-w-none prose-headings:text-slate-800 prose-a:text-blue-600 prose-strong:text-blue-900 leading-loose" dir="rtl">
                            <ReactMarkdown>{sec.textbookMarkdown}</ReactMarkdown>
                          </div>
                          
                          {sec.quiz && sec.quiz.length > 0 && (
                            <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded text-sm print:break-inside-avoid">
                              <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                                💡 مراجعة سريعة
                              </h4>
                              {sec.quiz.map((q, idx) => (
                                <div key={idx} className="mb-4 last:mb-0">
                                  <p className="font-bold text-slate-800 mb-2">{q.question}</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {q.options.map((opt, o_idx) => (
                                      <div key={o_idx} className={`bg-white border ${o_idx === q.correctIndex ? 'border-green-300' : 'border-slate-200'} px-3 py-1.5 rounded text-slate-700`}>
                                        {opt}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                       </div>
                     ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 w-full space-y-4 no-print relative">
               {allSlides.length > 0 ? (
                   <>
                       <div className="text-slate-500 text-sm font-semibold mb-2">
                           شريحة {currentSlideIndex + 1} من {allSlides.length}
                       </div>

                       <div className="relative w-full max-w-3xl group flex items-center justify-center">
                           
                           {/* Navigation Overlay Areas (Left/Right) for easy clicking */}
                           <button onClick={prevSlide} disabled={currentSlideIndex === 0} className="absolute right-0 top-0 h-full w-[10%] z-20 cursor-pointer disabled:cursor-not-allowed group-hover:bg-black/5 transition-colors flex items-center justify-center"></button>
                           <button onClick={nextSlide} disabled={currentSlideIndex === allSlides.length - 1} className="absolute left-0 top-0 h-full w-[10%] z-20 cursor-pointer disabled:cursor-not-allowed group-hover:bg-black/5 transition-colors flex items-center justify-center"></button>

                           {(() => {
                               const slide = allSlides[currentSlideIndex] as any;
                               
                               if (slide.isMaster) {
                                  return (
                                     <div className="aspect-[16/9] w-full bg-white border border-slate-300 shadow-md relative flex flex-col overflow-hidden transition-all">
                                        <div className="w-full h-[10%] opacity-80 shrink-0" style={{ backgroundColor: data.options.primaryColor }}></div>
                                        <div className="absolute top-2 right-4 text-white text-[10px] font-bold z-10">{data.options.title || data.outline?.title}</div>
                                        
                                        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50">
                                           <span className="text-sm tracking-wide text-slate-400 uppercase mb-4" dir="rtl">الدرس {slide.lessonIndex}</span>
                                           <h1 className="text-3xl font-bold text-center leading-relaxed" style={{ color: data.options.primaryColor }}>{slide.lessonTitle}</h1>
                                        </div>

                                        <div className="w-full h-[8%] border-t border-slate-200 flex items-center px-4 justify-center bg-slate-50 shrink-0">
                                          <span className="text-[10px] text-slate-400">{data.options.footerText}</span>
                                        </div>
                                     </div>
                                  );
                               }

                               return (
                                 <div className="aspect-[16/9] w-full bg-white border border-slate-300 shadow-md relative overflow-hidden flex flex-col transition-all">
                                     <div className="w-full h-[10%] opacity-80 shrink-0" style={{ backgroundColor: data.options.primaryColor }}></div>
                                     <div className="absolute top-2 right-4 text-white text-[10px] font-bold z-10">{data.options.title || data.outline?.title}</div>
                                     
                                     <div className="p-8 flex-1 flex flex-col relative z-10 bg-white">
                                       <h2 className="text-xl font-bold text-slate-800 mb-4 text-right border-b border-slate-100 pb-2 flex flex-col">
                                         <span>{slide.title}</span>
                                         {slide.titleEn && <span className="text-sm text-slate-500 font-normal mt-1" dir="ltr">{slide.titleEn}</span>}
                                       </h2>
                                       <div className="flex gap-4 min-h-[150px] flex-1">
                                           <ul className="list-disc list-inside space-y-2 text-sm text-slate-700 text-right w-full flex-1">
                                             {slide.points.map((p: string, p_idx: number) => (
                                               <li key={p_idx}>{p}</li>
                                             ))}
                                           </ul>
                                           {slide.pointsEn && slide.pointsEn.length > 0 && (
                                             <ul className="list-disc list-inside space-y-2 text-sm text-slate-700 text-left w-full flex-1 border-r border-slate-200 pr-4" dir="ltr">
                                               {slide.pointsEn.map((p: string, p_idx: number) => (
                                                 <li key={p_idx}>{p}</li>
                                               ))}
                                             </ul>
                                           )}
                                       </div>
                                       {slide.imageUrl && (
                                         <img 
                                           src={slide.imageUrl} 
                                           className="absolute left-6 top-[20%] w-[25%] aspect-square object-cover rounded shadow-sm opacity-90 border border-slate-200 z-10 bg-white" 
                                           alt="Slide illustration" 
                                           referrerPolicy="no-referrer"
                                         />
                                       )}
                                     </div>

                                     <div className="w-full h-[8%] border-t border-slate-200 flex items-center px-4 justify-between bg-slate-50 shrink-0">
                                        <span className="text-[10px] text-slate-400">Nano Banana Pro 2</span>
                                        <span className="text-[10px] text-slate-400">{data.options.footerText}</span>
                                     </div>

                                     {slide.speakerNotes && (
                                       <div className="absolute -right-80 top-0 w-72 h-full bg-slate-800/95 text-white p-6 shadow-xl opacity-0 group-hover:opacity-100 group-hover:right-0 transition-all duration-300 text-[13px] overflow-y-auto backdrop-blur-sm z-30 border-l border-slate-700">
                                         <strong className="text-blue-300 block mb-3 text-sm">التوجيهات وملاحظات المحاضر:</strong>
                                         <p className="leading-relaxed whitespace-pre-wrap">{slide.speakerNotes}</p>
                                         {slide.imagePrompt && !slide.imageUrl && (
                                          <div className="mt-5 pt-4 border-t border-slate-700">
                                            <strong className="text-blue-300 block mb-2 text-xs">اقتراح صور مرافقة (لم يتم توليدها):</strong>
                                            <span className="font-mono bg-slate-900 p-2 rounded text-[11px] block leading-tight text-slate-300">{slide.imagePrompt}</span>
                                          </div>
                                         )}
                                       </div>
                                     )}
                                 </div>
                               );
                           })()}
                       </div>

                       {/* Navigation Controls */}
                       <div className="flex items-center gap-6 mt-6">
                           <button 
                               onClick={prevSlide}
                               disabled={currentSlideIndex === 0}
                               className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-300 rounded shadow-sm text-slate-700 font-bold hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                           >
                               <ChevronRight className="w-5 h-5" /> السابق
                           </button>
                           <button 
                               onClick={nextSlide}
                               disabled={currentSlideIndex === allSlides.length - 1}
                               className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 border border-blue-600 rounded shadow-sm text-white font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                           >
                               التالي <ChevronLeft className="w-5 h-5" />
                           </button>
                       </div>
                   </>
               ) : (
                   <div className="text-slate-500 font-semibold p-8 text-center bg-white rounded border border-slate-200">
                       لا توجد شرائح للعرض، تأكد من إتمام التوليد بشكل صحيح.
                   </div>
               )}
            </div>
          )}

        </div>
      </div>
      
      <div className="p-3 border-t border-slate-200 flex justify-start bg-white no-print shrink-0">
        <button 
          onClick={onBack}
          className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-6 rounded-md text-[13px] transition-colors"
        >
          العودة للتوليد والمراجعة
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-book, .print-book * {
            visibility: visible;
          }
          .print-book {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 2cm;
            direction: rtl;
          }
          .no-print {
            display: none !important;
          }
          .page-break-before { page-break-before: always; }
          .page-break-after { page-break-after: always; }
        }
      `}} />
    </div>
  );
}
