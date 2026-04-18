import { GoogleGenAI, Type, Schema } from "@google/genai";

export let globalImageQuotaExhausted = false;

async function safeGenerateContent(
  generateConfig: any, 
  isImage: boolean = false
): Promise<any> {
    let retries = 3;
    let delayMs = 3000;
    let localFallbackToEnvKey = false;
    const customApiKey = "AIzaSyD7imbPV9SGtlSidVZM-P5qQXFGhajYaa8";

    while (retries > 0) {
        try {
            // Radical Fallback: Key Rotation
            let keyToUse = customApiKey;
            if (localFallbackToEnvKey && process.env.GEMINI_API_KEY) {
                keyToUse = process.env.GEMINI_API_KEY;
            } else {
                keyToUse = customApiKey || process.env.GEMINI_API_KEY || "";
            }

            const ai = new GoogleGenAI({ apiKey: keyToUse });
            
            // We use the model strictly provided without downgrading
            const response = await ai.models.generateContent(generateConfig);
            return response;
        } catch (err: any) {
             const errMsg = (err.message ? err.message.toLowerCase() : "") + " " + String(err).toLowerCase();
             
             if (errMsg.includes("429") || errMsg.includes("resource_exhausted") || errMsg.includes("quota") || errMsg.includes("exceeded")) {
                 
                 // If custom key is tired, fall back to the environment key
                 if (!localFallbackToEnvKey && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== customApiKey) {
                     console.warn("Custom key rate limited. Falling back to Environment key.");
                     localFallbackToEnvKey = true;
                     continue;
                 }

                 retries--;
                 if (retries === 0) {
                     if (isImage) {
                         console.warn("Image quota exhausted permanently.");
                         globalImageQuotaExhausted = true;
                         return null;
                     }
                     
                     // We format a very clear Arabic message so the user understands exactly what happened without truncation.
                     throw new Error("🚨 نفد رصيد الاستخدام تماماً (Quota Limit) لمفتاحك لنموذج Pro (أو تحتاج لربط بطاقة لزيادة حصتك اليومية). لا يمكننا استخدام نماذج أقل بناءً على طلبك. الرجاء ترقية مفتاحك أو الانتظار لليوم التالي.");
                 }
                 
                 console.warn(`[Quota Hit] Waiting ${delayMs/1000}s before retry... (${retries} retries left)`);
                 await new Promise(r => setTimeout(r, delayMs));
                 delayMs += 3000; // Step up slightly, no huge waits

             } else if (errMsg.includes("permission_denied") || errMsg.includes("403")) {
                 // Try env key if custom key fails with 403 (maybe it's invalid)
                 if (!localFallbackToEnvKey && process.env.GEMINI_API_KEY) {
                     localFallbackToEnvKey = true;
                     continue;
                 }
                 throw new Error("عذراً، مفتاح الـ API يبدو غير صالح أو لا يملك صلاحية (403 Permission Denied).");
             } else {
                 throw new Error(`خطأ غير متوقع: ${err.message || String(err)}`);
             }
        }
    }
    return null;
}

export interface OutlineSection {
  title: string;
  intent: string;
}

export interface OutlineLesson {
  title: string;
  description: string;
  sections: OutlineSection[];
}

export interface Outline {
    title: string;
    targetAudience: string;
    lessons: OutlineLesson[];
}

export async function generateOutline(
    topic: string, 
    materials: string, 
    files: { mimeType: string, data: string }[], 
    researchMode: 'STRICT' | 'WEB_ONLY' | 'HYBRID', 
    language: 'AR_EN' | 'AR' | 'EN',
    customInstructions: string,
    lessonCount: number
): Promise<Outline> {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Main title of the course/material" },
      targetAudience: { type: Type.STRING },
      lessons: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  intent: { type: Type.STRING }
                },
                required: ["title", "intent"]
              }
            }
          },
          required: ["title", "description", "sections"]
        }
      }
    },
    required: ["title", "targetAudience", "lessons"]
  };

  let promptText = `أريد إنشاء هيكل دورة تدريبية ومواد علمية بناءً على المعطيات التالية:
الموضوع: ${topic}
العدد التقريبي للدروس: ${lessonCount}

المواد المصدرية والنصوص المرجعية:
${materials}

لغة الخرج المطلوبة: ${language === 'AR_EN' ? 'عربي / إنجليزي (عناوين باللغتين)' : language === 'EN' ? 'إنجليزي فقط' : 'عربي فقط'}

1. قسم الدورة إلى دروس، وكل درس إلى أقسام فرعية منطقية.
2. راعي التسلسل المنطقي والتربوي.`;

  if (customInstructions) {
      promptText += `\n\nتوجيهات إضافية من المستخدم يجب الالتزام بها:\n${customInstructions}`;
  }

  if (researchMode === 'STRICT') {
      promptText += `\n\nتوجيه هام: التزم التزاماً حرفياً بالمواد والمصادر المرفقة للتو، ولا تقم بالاعتماد على أي معلومات أو فرضيات خارجية إضافية.`;
  } else if (researchMode === 'WEB_ONLY') {
      promptText += `\n\nتوجيه هام: قم بإجراء بحث عميق (Deep Research) على الويب للتركيز بشكل شبه كلي على أحدث المعلومات والمصادر من مساحة الإنترنت ولا تتقيد بالمرفقات إن وجدت.`;
  } else {
      promptText += `\n\nتوجيه هام: اعتمد على المادة التدريبية المرفقة، مع إجراء بحث عميق (Deep Research) على الويب لدعم الأفكار وإثراء التجربة التعليمية بأمثلة ومعلومات محدثة (مزيج).`;
  }

  const parts: any[] = [{ text: promptText }];
  files.forEach(f => {
      parts.push({ inlineData: { mimeType: f.mimeType, data: f.data } });
  });

  const response = await safeGenerateContent({
    model: "gemini-3.1-pro-preview",
    contents: parts,
    config: {
      tools: researchMode !== 'STRICT' ? [{ googleSearch: {} }] : undefined,
      toolConfig: researchMode !== 'STRICT' ? { includeServerSideToolInvocations: true } : undefined,
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: researchMode === 'STRICT' ? 0.2 : (researchMode === 'HYBRID' ? 0.5 : 0.7),
    }
  });

  if (!response) throw new Error("فشل توليد الهيكل.");
  return JSON.parse(response.text || "{}") as Outline;
}

export async function reviseOutline(
    currentOutline: Outline,
    feedback: string,
    topic: string,
    language: 'AR_EN' | 'AR' | 'EN',
    customInstructions: string
): Promise<Outline> {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      targetAudience: { type: Type.STRING },
      lessons: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  intent: { type: Type.STRING }
                },
                required: ["title", "intent"]
              }
            }
          },
          required: ["title", "description", "sections"]
        }
      }
    },
    required: ["title", "targetAudience", "lessons"]
  };

  let promptText = `لديك الهيكل الحالي لدورة تدريبية بعنوان "${topic}":
\`\`\`json
${JSON.stringify(currentOutline, null, 2)}
\`\`\`

طلب المستخدم إجراء التعديلات التالية على هذا الهيكل:
"${feedback}"

يرجى إعادة صياغة الهيكل وتعديله بدقة تامة بناءً على طلب المستخدم مع الحفاظ على بنية الـ Schema المطلوبة.
لغة الخرج المطلوبة: ${language === 'AR_EN' ? 'عربي / إنجليزي (عناوين باللغتين)' : language === 'EN' ? 'إنجليزي فقط' : 'عربي فقط'}
`;

  if (customInstructions) {
      promptText += `\n\nتوجيهات عامة سابقة: ${customInstructions}`;
  }

  const response = await safeGenerateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ text: promptText }],
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.3,
    }
  });

  if (!response) throw new Error("فشل تعديل الهيكل.");
  return JSON.parse(response.text || "{}") as Outline;
}

export interface Slide {
    title: string;
    titleEn?: string;
    points: string[];
    pointsEn?: string[];
    speakerNotes: string;
    imagePrompt?: string;
    imageUrl?: string; // We'll add this later if generated
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
}

export interface GeneratedSection {
    textbookMarkdown: string;
    slides: Slide[];
    quiz?: QuizQuestion[];
}

export async function generateSectionContent(
    courseTitle: string,
    lessonTitle: string,
    sectionArgs: OutlineSection,
    materials: string,
    files: { mimeType: string, data: string }[],
    researchMode: 'STRICT' | 'WEB_ONLY' | 'HYBRID',
    language: 'AR_EN' | 'AR' | 'EN',
    customInstructions: string
): Promise<GeneratedSection> {
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            textbookMarkdown: { 
                type: Type.STRING, 
                description: "محتوى مقروء ومفصل يصلح ككتاب أو ملزمة للطلاب. منسق بصيغة ماركداون." 
            },
            slides: {
                type: Type.ARRAY,
                description: "الشرائح العرضية الخاصة بهذا القسم. مختصرة ومركزة.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "عنوان الشريحة (العربي أو الافتراضي)" },
                        titleEn: { type: Type.STRING, description: "عنوان الشريحة باللغة الإنجليزية (مطلوب إذا كانت اللغة مزدوجة AR_EN)" },
                        points: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING },
                            description: "النقاط الرئيسية (العربية أو الافتراضية)"
                        },
                        pointsEn: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING },
                            description: "ترجمة النقاط أو النقاط البديلة باللغة الإنجليزية (مطلوب إذا كانت اللغة مزدوجة AR_EN)"
                        },
                        speakerNotes: { type: Type.STRING, description: "ملاحظات المحاضر وتفاصيل إضافية" },
                        imagePrompt: { type: Type.STRING, description: "وصف لصورة مناسبة للشريحة إن لزم، باللغة الإنجليزية للبحث عنها أو توليدها (اختياري)" }
                    },
                    required: ["title", "points", "speakerNotes"]
                }
            },
            quiz: {
                type: Type.ARRAY,
                description: "سؤال أو أكثر لاختبار استيعاب هذا القسم",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        options: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING },
                            description: "4 خيارات للإجابة"
                        },
                        correctIndex: { type: Type.INTEGER, description: "فهرس الإجابة الصحيحة (0-3)" }
                    },
                    required: ["question", "options", "correctIndex"]
                }
            }
        },
        required: ["textbookMarkdown", "slides"]
    };

    let promptText = `أنت خبير في إنشاء المواد التدريبية وتصميم الحقائب التعليمية.
قم بكتابة محتوى شامل لـ (كتاب الطالب) ومحتوى (الشرائح التقديمية) للقسم التالي:

عنوان الدورة: ${courseTitle}
الدرس الحالي: ${lessonTitle}
القسم المراد كتابته: ${sectionArgs.title}
الهدف من القسم: ${sectionArgs.intent}

المواد المصدرية والمراجع المرفقة:
${materials}

لغة الخرج المطلوبة: ${language === 'AR_EN' ? 'مزدوجة (عربي وإنجليزي). قدم المحتوى في الكتاب بشكل يدمج بين اللغتين بطريقة احترافية. في الشرائح، املأ حقول الإنجليزية (titleEn, pointsEn) بترجمة أو مكافئ للكلمات، واملأ حقول العربية (title, points).' : language === 'EN' ? 'إنجليزي فقط. ضع المحتوى الإنجليزي في الحقول الرئيسية (title, points) وتجاهل الحقول الأخرى.' : 'عربي فقط. استخدم الحقول الرئيسية (title, points).'}

التوجيهات العامة:
- اعتمد على المواد المصدرية متى أمكن.
- قم بتدعيم المحتوى بأمثلة وحالات دراسية عملية.
- محتوى الكتاب (textbookMarkdown) يجب أن يكون مفصلاً وشاملاً.
- محتوى الشرائح (slides) يجب أن يكون مختصراً في شكل نقاط مركزة.
- اكتب بأسلوب احترافي واضح ومناسب للمستوى المطلوب.`;

    if (customInstructions) {
        promptText += `\n\nتوجيهات إضافية من المستخدم يجب الالتزام بها:\n${customInstructions}`;
    }

    if (researchMode === 'STRICT') {
        promptText += `\n\n- التزم التزاماً حرفياً بالمواد المرفقة فقط. تفادى ادخال أي إضافات أو معلومات من خارج المصادر المتاحة لديك عبر المرفقات.`;
    } else if (researchMode === 'WEB_ONLY') {
        promptText += `\n\n- قم بإجراء بحث عميق (Deep Research) واستفد بشكل شبه كلي من أحدث المعلومات من شبكة الإنترنت ولا تتقيد بالمصادر المرفقة إن وجدت.`;
    } else {
        promptText += `\n\n- اعتمد على המادة التدريبية المرفقة، وقم بإجراء بحث عميق (Deep Research) من شبكة الإنترنت لتوسيع النقاط وتعزيز الأمثلة العملية (مزيج).`;
    }

    promptText += `\n\nتأكد من إرجاع النتيجة بصيغة JSON متوافقة مع الـ Schema المحددة.`;

    const parts: any[] = [{ text: promptText }];
    files.forEach(f => {
        parts.push({ inlineData: { mimeType: f.mimeType, data: f.data } });
    });

    const response = await safeGenerateContent({
        model: "gemini-3.1-pro-preview",
        contents: parts,
        config: {
            tools: researchMode !== 'STRICT' ? [{ googleSearch: {} }] : undefined,
            toolConfig: researchMode !== 'STRICT' ? { includeServerSideToolInvocations: true } : undefined,
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: researchMode === 'STRICT' ? 0.2 : (researchMode === 'HYBRID' ? 0.5 : 0.7),
        }
    });

    if (!response) throw new Error("فشل توليد محتوى القسم.");
    return JSON.parse(response.text || "{}") as GeneratedSection;
}

export async function generateContentImages(
  section: GeneratedSection,
  onProgress?: (msg: string) => void
): Promise<GeneratedSection> {
  const slidesWithImages = [];
  let slideIndex = 0;

  for (const slide of section.slides) {
    slideIndex++;
    if (!slide.imagePrompt || globalImageQuotaExhausted) {
      if (onProgress) onProgress(`تخطي صورة الشريحة ${slideIndex} (غير مطلوبة أو الحصة منتهية)`);
      slidesWithImages.push(slide);
      continue;
    }

    if (onProgress) onProgress(`جاري توليد صورة الشريحة ${slideIndex} من ${section.slides.length}...`);

    let base64Image = null;

    if (!globalImageQuotaExhausted) {
      try {
        const response = await safeGenerateContent({
           model: 'gemini-3.1-flash-image-preview',
           contents: [{
             parts: [
               { text: `Professional presentation slide illustration, flat design vector style, clear background, high quality. Subject: ${slide.imagePrompt}` }
             ]
           }],
           config: {
             imageConfig: {
               aspectRatio: "16:9",
               imageSize: "1K"
             }
           }
        }, true);
        
        if (response && response.candidates && response.candidates.length > 0 && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    base64Image = part.inlineData.data;
                    break;
                }
            }
        }
      } catch (err: any) {
        console.error("Failed to generate image for slide, skipped:", err);
      }
    }

    if (base64Image && !globalImageQuotaExhausted) {
       slidesWithImages.push({
         ...slide,
         imageUrl: `data:image/jpeg;base64,${base64Image}`
       });
    } else {
       slidesWithImages.push(slide);
    }

    // Add a mandatory delay between image requests to respect quotas if we are still generating
    if (!globalImageQuotaExhausted) {
       await new Promise(r => setTimeout(r, 2000));
    }
  }

  return {
    ...section,
    slides: slidesWithImages
  };
}
