export type VibeyRecommendation = {
    title: string;
    year?: number;
    mediaType?: 'movie' | 'tv';
    reason: string;
};

type VibeyResponse = {
    source: 'groq' | 'huggingface';
    recommendations: VibeyRecommendation[];
};

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_MODEL = process.env.EXPO_PUBLIC_GROQ_MODEL || 'llama-3.3-70b-versatile';

const HF_API_KEY = process.env.EXPO_PUBLIC_HF_API_KEY;
const HF_MODEL = process.env.EXPO_PUBLIC_HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.3';

const stripCodeFence = (value: string) =>
    value.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();

const parseRecommendations = (raw: string): VibeyRecommendation[] => {
    const cleaned = stripCodeFence(raw);
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    const jsonLike = start >= 0 && end >= 0 ? cleaned.slice(start, end + 1) : cleaned;

    const parsed = JSON.parse(jsonLike);
    const list = Array.isArray(parsed) ? parsed : parsed?.recommendations;
    if (!Array.isArray(list)) {
        throw new Error('Invalid recommendation payload');
    }

    const normalized: VibeyRecommendation[] = list
        .map((entry: any) => {
            const mediaType: 'movie' | 'tv' | undefined =
                entry?.mediaType === 'tv' ? 'tv' : entry?.mediaType === 'movie' ? 'movie' : undefined;

            return {
                title: String(entry?.title || '').trim(),
                year: Number.isFinite(Number(entry?.year)) ? Number(entry.year) : undefined,
                mediaType,
                reason: String(entry?.reason || 'Recommended by Vibey.').trim(),
            };
        })
        .filter((entry) => entry.title.length > 0)
        .slice(0, 6);

    if (!normalized.length) {
        throw new Error('No recommendations returned');
    }

    return normalized;
};

const buildSystemPrompt = () =>
    [
        'You are Vibey, a movie recommendation assistant.',
        'Return strict JSON only with the shape:',
        '{ "recommendations": [{ "title": "Movie Title", "year": 2024, "mediaType": "movie|tv", "reason": "short reason" }] }',
        'Rules:',
        '- Return 4 to 6 items.',
        '- Prefer well-known titles that exist in TMDB.',
        '- Keep reason under 100 characters.',
        '- Do not include markdown.',
    ].join('\n');

const callGroq = async (prompt: string): Promise<VibeyRecommendation[]> => {
    if (!GROQ_API_KEY) {
        throw new Error('Missing GROQ API key');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            temperature: 0.7,
            messages: [
                { role: 'system', content: buildSystemPrompt() },
                { role: 'user', content: prompt },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error(`Groq request failed (${response.status})`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
        throw new Error('Groq empty response');
    }

    return parseRecommendations(content);
};

const callHuggingFace = async (prompt: string): Promise<VibeyRecommendation[]> => {
    if (!HF_API_KEY) {
        throw new Error('Missing Hugging Face API key');
    }

    const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            inputs: `${buildSystemPrompt()}\nUser: ${prompt}\nAssistant:`,
            parameters: {
                max_new_tokens: 360,
                temperature: 0.7,
                return_full_text: false,
            },
        }),
    });

    if (!response.ok) {
        throw new Error(`Hugging Face request failed (${response.status})`);
    }

    const data = await response.json();
    const generated = Array.isArray(data) ? data?.[0]?.generated_text : data?.generated_text;
    if (!generated || typeof generated !== 'string') {
        throw new Error('Hugging Face empty response');
    }

    return parseRecommendations(generated);
};

export const getVibeyRecommendations = async (prompt: string): Promise<VibeyResponse> => {
    try {
        const recommendations = await callGroq(prompt);
        return { source: 'groq', recommendations };
    } catch {
        const recommendations = await callHuggingFace(prompt);
        return { source: 'huggingface', recommendations };
    }
};
