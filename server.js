const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/transcribe', async (req, res) => {
    try {
        const { audioData, mimeType } = req.body;
        if (!audioData) {
            return res.status(400).json({ error: 'لم يتم إرسال ملف الصوت' });
        }

        const audioPart = {
            inlineData: {
                data: audioData,
                mimeType: mimeType || "audio/wav"
            },
        };

        const prompt = "أنت مساعد أكاديمي محترف. استمع إلى تسجيل هذه المحاضرة وقسمها إلى قسمين: 1. الملخص التنفيذي وأهم النقاط. 2. التفريغ النصي الحرفي الكامل. أخرج النتيجة في صيغة HTML منسق.";

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [prompt, audioPart],
        });

        res.json({ html: response.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));