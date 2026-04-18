import PptxGenJS from 'pptxgenjs';
import { GeneratedSection, Slide } from './gemini';

export interface PptxOptions {
    title: string;
    footerText: string;
    author: string;
    primaryColor: string;
    fontFace: string;
}

export async function createPresentation(
    lessons: { title: string; content: GeneratedSection[] }[],
    options: PptxOptions
) {
    const pptx = new PptxGenJS();
    pptx.title = options.title;
    pptx.author = options.author;
    pptx.layout = 'LAYOUT_16x9';

    // RTL and Arabic font support
    // We can set default properties, but PptxGenJS alignment handling for RTL text is done via alignment
    const fontObj = { fontFace: options.fontFace || 'Arial', isRtl: true };

    // Create Slide Master
    pptx.defineSlideMaster({
        title: "MASTER_SLIDE",
        background: { color: "FFFFFF" },
        objects: [
            // Header bar
            { rect: { x: 0, y: 0.1, w: "100%", h: 0.8, fill: { color: options.primaryColor } } },
            // Header text placeholder mapped manually for ease, but we'll use actual slide text
            { text: { text: options.title, options: { x: 0.5, y: 0.25, w: "90%", h: 0.5, color: "FFFFFF", fontSize: 18, align: "right", fontFace: fontObj.fontFace, rtlMode: true } as any } },
            // Footer bar
            { rect: { x: 0, y: 5.0, w: "100%", h: 0.6, fill: { color: "F3F4F6" } } },
            // Footer text
            { text: { text: options.footerText, options: { x: 0.5, y: 5.15, w: "90%", h: 0.3, color: "6B7280", fontSize: 12, align: "center", fontFace: fontObj.fontFace, rtlMode: true } as any } },
            // Slide number
            { text: { text: "", options: { x: 0.5, y: 5.15, w: "10%", h: 0.3, color: "6B7280", fontSize: 12, align: "left", fontFace: fontObj.fontFace } } } // Placeholder, usually handled by addSlide auto
        ],
        slideNumber: { x: 0.5, y: 5.15, color: "6B7280", fontFace: fontObj.fontFace, fontSize: 12, align: "left"}
    });

    // Add Title Slide
    const titleSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
    titleSlide.addText(options.title, {
        x: 1, y: 2, w: "80%", h: 1,
        fontSize: 44, bold: true, color: options.primaryColor, align: "center", fontFace: fontObj.fontFace, rtlMode: true
    } as any);
    titleSlide.addText("العروض التقديمية للحقيبة التدريبية", {
        x: 1, y: 3, w: "80%", h: 0.5,
        fontSize: 24, color: "4B5563", align: "center", fontFace: fontObj.fontFace, rtlMode: true
    } as any);


    for (const lesson of lessons) {
        // Section/Lesson header slide
        const lessonSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
        lessonSlide.addText(lesson.title, {
            x: 1, y: 2.2, w: "80%", h: 1,
            fontSize: 36, bold: true, color: options.primaryColor, align: "center", fontFace: fontObj.fontFace, rtlMode: true
        } as any);

        for (const section of lesson.content) {
            for (const slideData of section.slides) {
                const s = pptx.addSlide({ masterName: "MASTER_SLIDE" });
                
                const isBilingual = !!slideData.pointsEn && slideData.pointsEn.length > 0;
                
                // Add title
                if (isBilingual) {
                     s.addText(slideData.title, {
                         x: 5, y: 1.2, w: 4.5, h: 0.6,
                         fontSize: 24, bold: true, color: "1F2937", align: "right", fontFace: fontObj.fontFace, rtlMode: true
                     } as any);
                     s.addText(slideData.titleEn || '', {
                         x: 0.5, y: 1.2, w: 4.5, h: 0.6,
                         fontSize: 24, bold: true, color: "1F2937", align: "left", fontFace: fontObj.fontFace
                     });
                } else {
                     s.addText(slideData.title, {
                         x: 0.5, y: 1.2, w: "90%", h: 0.6,
                         fontSize: 28, bold: true, color: "1F2937", align: "right", fontFace: fontObj.fontFace, rtlMode: true
                     } as any);
                }

                // Image dimensions and positioning
                const hasImage = !!slideData.imageUrl;
                
                if (isBilingual) {
                    if (hasImage) {
                        // Image in middle, EN Left, AR Right
                        s.addText(slideData.pointsEn?.map(p => ({ text: p, options: { bullet: true, breakLine: true } })) || [], {
                            x: 0.5, y: 2.0, w: 2.8, h: 2.8,
                            fontSize: 14, color: "374151", align: "left", fontFace: "Arial", valign: "top", lineSpacing: 24
                        });
                        s.addImage({
                            data: slideData.imageUrl,
                            x: 3.5, y: 1.8, w: 3.0, h: 3,
                            sizing: { type: 'contain', w: 3.0, h: 3 }
                        });
                        s.addText(slideData.points.map(p => ({ text: p, options: { bullet: true, breakLine: true } })), {
                            x: 6.7, y: 2.0, w: 2.8, h: 2.8,
                            fontSize: 14, color: "374151", align: "right", fontFace: fontObj.fontFace, rtlMode: true, valign: "top", lineSpacing: 24
                        } as any);
                    } else {
                        // EN Left, AR Right
                        s.addText(slideData.pointsEn?.map(p => ({ text: p, options: { bullet: true, breakLine: true } })) || [], {
                            x: 0.5, y: 2.0, w: 4.2, h: 2.8,
                            fontSize: 18, color: "374151", align: "left", fontFace: "Arial", valign: "top", lineSpacing: 28
                        });
                        s.addText(slideData.points.map(p => ({ text: p, options: { bullet: true, breakLine: true } })), {
                            x: 5.3, y: 2.0, w: 4.2, h: 2.8,
                            fontSize: 18, color: "374151", align: "right", fontFace: fontObj.fontFace, rtlMode: true, valign: "top", lineSpacing: 28
                        } as any);
                    }
                } else {
                    const textWidth = hasImage ? "50%" : "90%";
                    s.addText(slideData.points.map(p => ({ text: p, options: { bullet: true, breakLine: true } })), {
                        x: hasImage ? 4.5 : 0.5, y: 2.0, w: textWidth, h: 2.8,
                        fontSize: 22, color: "374151", align: "right", fontFace: fontObj.fontFace, rtlMode: true, valign: "top", lineSpacing: 32
                    } as any);
    
                    if (hasImage) {
                        s.addImage({
                            data: slideData.imageUrl,
                            x: 0.5, 
                            y: 1.8, 
                            w: 3.5, 
                            h: 3,
                            sizing: { type: 'contain', w: 3.5, h: 3 }
                        });
                    }
                }

                // Speaker notes
                if (slideData.speakerNotes) {
                    s.addNotes(slideData.speakerNotes);
                }
            }

            // Add Quiz if exists
            if (section.quiz && section.quiz.length > 0) {
                const quizSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
                quizSlide.addText("مراجعة واختبار معلومات خفيف", {
                    x: 0.5, y: 1.2, w: "90%", h: 0.6,
                    fontSize: 28, bold: true, color: options.primaryColor, align: "right", fontFace: fontObj.fontFace, rtlMode: true
                } as any);

                const q = section.quiz[0]; // Take first quiz question
                let quizText = q.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n');
                
                quizSlide.addText(q.question, {
                    x: 0.5, y: 2.0, w: "90%", h: 0.8,
                    fontSize: 22, bold: true, color: "1F2937", align: "right", fontFace: fontObj.fontFace, rtlMode: true, valign: "top"
                } as any);

                quizSlide.addText(q.options.map((opt, i) => ({ text: `${i + 1}. ${opt}`, options: { breakLine: true } })), {
                    x: 1.0, y: 2.8, w: "80%", h: 2.0,
                    fontSize: 20, color: "4B5563", align: "right", fontFace: fontObj.fontFace, rtlMode: true, valign: "top", lineSpacing: 28
                } as any);
                
                quizSlide.addNotes("الإجابة الصحيحة هي: " + q.options[q.correctIndex]);
            }
        }
    }

    pptx.writeFile({ fileName: `Presentation_${options.title}.pptx` });
}
