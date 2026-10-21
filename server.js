const express = require('express');
const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.post('/transcribe', async (req, res) => {
    try {
        const { audioData, mimeType } = req.body;
        if (!audioData) {
            return res.status(400).json({ error: 'لم يتم إرسال ملف الصوت' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'مفتاح الـ API غير مُعرف في إعدادات السيرفر' });
        }

        // استخدام أحدث موديل مطلوب ومستقر حالياً
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

        const prompt = "أنت مساعد أكاديمي وكاتب محاضر محترف. استمع إلى تسجيل هذه المحاضرة وقسمها إلى قسمين: 1. الملخص التنفيذي وأهم النقاط. 2. التفريغ النصي الحرفي الكامل. أخرج النتيجة في صيغة HTML منسق.";

        const requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: mimeType || "audio/wav",
                            data: audioData
                        }
                    }
                ]
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0) {
            const rawText = data.candidates[0].content.parts[0].text;
            res.json({ html: rawText });
        } else {
            res.status(500).json({ error: 'خطأ من استجابة جوجل', details: data });
        }
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
