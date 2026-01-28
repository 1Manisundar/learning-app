// Gemini API Service
// Handles all interactions with Google's Gemini API for generating questions

import { logger } from './logger.js';
import { storage } from './storage.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

class GeminiService {
    get apiKey() {
        const key = storage.getApiKey();
        if (!key) {
            throw new Error('API Key not configured. Please add your Gemini API key in Settings.');
        }
        return key;
    }

    async fetchWithRetry(url, options, retries = 3, backoff = 2000) {
        try {
            const response = await fetch(url, options);

            if (response.status === 429) {
                if (retries > 0) {
                    logger.warning(`Rate limit hit. Retrying in ${backoff / 1000}s...`);
                    this.showSnackbar(`⏳ Rate limit - retrying in ${backoff / 1000}s...`, 'warning');
                    await new Promise(resolve => setTimeout(resolve, backoff));
                    return this.fetchWithRetry(url, options, retries - 1, backoff * 2);
                } else {
                    this.showSnackbar('❌ Rate limit exceeded. Please wait a minute.', 'error');
                    throw new Error('Rate limit exceeded. Please wait a minute before trying again.');
                }
            }

            if (response.status === 400) {
                this.showSnackbar('❌ Invalid API Key. Check Settings.', 'error');
                throw new Error('Invalid API Key. Please verify your key in Settings.');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.error?.message || 'Unknown error';
                this.showSnackbar(`❌ API Error: ${errorMsg}`, 'error');
                throw new Error(`API Error: ${response.status} - ${errorMsg}`);
            }

            return response;
        } catch (error) {
            if (!error.message.includes('API Error') && !error.message.includes('Rate limit')) {
                this.showSnackbar('❌ Network error. Check connection.', 'error');
            }
            throw error;
        }
    }

    showSnackbar(message, type = 'info') {
        // Create snackbar if doesn't exist
        let snackbar = document.getElementById('api-snackbar');
        if (!snackbar) {
            snackbar = document.createElement('div');
            snackbar.id = 'api-snackbar';
            snackbar.className = 'toast';
            document.body.appendChild(snackbar);
        }

        snackbar.textContent = message;
        snackbar.className = `toast ${type}`;
        snackbar.classList.add('show');

        setTimeout(() => {
            snackbar.classList.remove('show');
        }, 3000);
    }

    async generateQuestions(topic, difficulty, count = 10) {
        const prompt = this.buildQuestionPrompt(topic, difficulty, count);

        try {
            logger.info(`Generating ${count} ${difficulty} ${topic} questions...`);

            const response = await this.fetchWithRetry(`${GEMINI_API_URL}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 8192,
                    }
                })
            });

            const data = await response.json();
            const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!textContent) {
                throw new Error('No content in API response');
            }

            const questions = this.parseQuestionsResponse(textContent, topic, difficulty);
            logger.success(`Generated ${questions.length} questions successfully`);

            return questions;
        } catch (error) {
            logger.error(`Failed to generate questions: ${error.message}`, { topic, difficulty, count });
            throw error;
        }
    }

    async generateLessonQuiz(topic, lessonTitle, count = 10) {
        const prompt = `Generate ${count} multiple choice quiz questions specifically about "${lessonTitle}" in ${topic}.

        Difficulty: Mixed (Easy to Hard) to test full mastery.
        
        IMPORTANT: Return ONLY a valid JSON array with no markdown formatting, no code blocks, just pure JSON.
        
        Each question object must process this exact structure:
        {
          "question": "The question text",
          "codeSnippet": "Optional code snippet if relevant, or null",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Detailed explanation of why this answer is correct",
          "referenceLink": "URL to documentation or tutorial"
        }
        
        Rules:
        1. Questions must be SPECIFIC to ${lessonTitle}
        2. correctAnswer is the INDEX (0-3)
        3. Include code snippets where applicable
        
        Return ONLY the JSON array.`;

        try {
            logger.info(`Generating ${count} questions for lesson: ${lessonTitle}...`);

            const response = await this.fetchWithRetry(`${GEMINI_API_URL}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 8192,
                    }
                })
            });

            const data = await response.json();
            const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!textContent) throw new Error('No content in API response');

            const questions = this.parseQuestionsResponse(textContent, topic, 'mixed');
            logger.success(`Generated ${questions.length} lesson quiz questions`);

            return questions;
        } catch (error) {
            logger.error(`Failed to generate lesson quiz: ${error.message}`, { topic, lessonTitle });
            throw error;
        }
    }

    async generateLesson(topic, lessonTitle) {
        const prompt = this.buildLessonPrompt(topic, lessonTitle);

        try {
            logger.info(`Generating lesson: ${lessonTitle} for ${topic}...`);

            const response = await this.fetchWithRetry(`${GEMINI_API_URL}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 4096,
                    }
                })
            });

            const data = await response.json();
            const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!textContent) {
                throw new Error('No content in API response');
            }

            logger.success(`Generated lesson successfully`);
            return this.parseLessonResponse(textContent);
        } catch (error) {
            logger.error(`Failed to generate lesson: ${error.message}`, { topic, lessonTitle });
            throw error;
        }
    }

    buildQuestionPrompt(topic, difficulty, count) {
        const topicDescriptions = {
            angular: 'Angular framework including components, services, directives, pipes, routing, RxJS, dependency injection, and Angular CLI',
            javascript: 'JavaScript including ES6+, closures, promises, async/await, DOM manipulation, event handling, prototypes, and modern JS patterns',
            java: 'Java programming including OOP concepts, collections, streams, multithreading, exception handling, JDBC, and Spring basics'
        };

        const difficultyGuidelines = {
            easy: 'Basic concepts, syntax, and simple use cases. Suitable for beginners.',
            medium: 'Intermediate concepts, practical scenarios, and common patterns. Suitable for developers with 1-2 years experience.',
            hard: 'Advanced concepts, edge cases, performance considerations, and tricky scenarios. Suitable for senior developers.'
        };

        return `Generate ${count} ${difficulty} level multiple choice quiz questions about ${topicDescriptions[topic.toLowerCase()]}.

Difficulty level: ${difficulty} - ${difficultyGuidelines[difficulty.toLowerCase()]}

IMPORTANT: Return ONLY a valid JSON array with no markdown formatting, no code blocks, just pure JSON.

Each question object must have this exact structure:
{
  "question": "The question text",
  "codeSnippet": "Optional code snippet if relevant, or null",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Detailed explanation of why this answer is correct",
  "referenceLink": "URL to documentation or tutorial"
}

Rules:
1. correctAnswer is the INDEX (0-3) of the correct option in the options array
2. Make questions practical and interview-relevant
3. Include code snippets for at least 50% of questions
4. Explanations should be educational and helpful
5. Reference links should be to official docs or reputable sources
6. All 4 options should be plausible
7. Avoid trick questions, focus on real understanding

Return ONLY the JSON array, nothing else.`;
    }

    buildLessonPrompt(topic, lessonTitle) {
        return `Create a comprehensive, interactive lesson about "${lessonTitle}" for ${topic} developers.

IMPORTANT: Return ONLY valid JSON with no markdown formatting, no code blocks, just pure JSON.

Return a JSON object with this exact structure:
{
  "title": "${lessonTitle}",
  "introduction": "Detailed introduction (2-3 sentences) explaining the concept, why it matters, and real-world usage.",
  "sections": [
    {
      "heading": "Section 1 Title",
      "content": "Detailed explanation (3-4 sentences). Use simple language.",
      "codeExample": "Code snippet demonstrating the concept"
    },
    {
      "heading": "Section 2 Title",
      "content": "Detailed explanation of next concept.",
      "codeExample": "Code snippet"
    },
    {
      "heading": "Section 3 Title (Advanced/Tips)",
      "content": "Best practices, common pitfalls, or advanced usage.",
      "codeExample": "Code snippet"
    }
  ],
  "keyPoints": ["Key takeaway 1", "Key takeaway 2", "Key takeaway 3", "Key takeaway 4"],
  "practiceQuestions": [
    {
      "question": "Question 1 to test detailed understanding",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this is correct"
    },
    {
      "question": "Question 2 (Scenario based)",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this is correct"
    },
    {
      "question": "Question 3 (Code analysis)",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this is correct"
    }
  ]
}

Rules:
1. Make it educational but concise enough for mobile
2. Include AT LEAST 3 distinct sections with code examples
3. Generate EXACTLY 3 practice questions
4. Ensure code examples are correct and syntax-highlighted (in UI)
5. Focus on interview-relevant depth

Return ONLY the JSON object, nothing else.`;
    }

    parseQuestionsResponse(text, topic, difficulty) {
        try {
            // Try to extract JSON from the response
            let jsonStr = text.trim();

            // Remove markdown code blocks if present
            if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '');
            }

            const questions = JSON.parse(jsonStr);

            if (!Array.isArray(questions)) {
                throw new Error('Response is not an array');
            }

            // Add metadata and generate IDs
            return questions.map((q, index) => ({
                id: `${topic.toLowerCase()}_${difficulty.toLowerCase()}_${Date.now()}_${index}`,
                topic: topic.toLowerCase(),
                difficulty: difficulty.toLowerCase(),
                question: q.question,
                codeSnippet: q.codeSnippet || null,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                referenceLink: q.referenceLink || null,
                tags: [topic.toLowerCase(), difficulty.toLowerCase()]
            }));
        } catch (error) {
            logger.error('Failed to parse questions response', { error: error.message, text: text.substring(0, 500) });
            throw new Error(`Failed to parse questions: ${error.message}`);
        }
    }

    parseLessonResponse(text) {
        try {
            let jsonStr = text.trim();

            if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '');
            }

            return JSON.parse(jsonStr);
        } catch (error) {
            logger.error('Failed to parse lesson response', { error: error.message });
            throw new Error(`Failed to parse lesson: ${error.message}`);
        }
    }
}

export const gemini = new GeminiService();
