// Local Storage Service
// Handles all data persistence for the app

const STORAGE_KEYS = {
    USER_PROGRESS: 'codequest_user_progress',
    QUESTIONS_CACHE: 'codequest_questions_cache',
    BOOKMARKS: 'codequest_bookmarks',
    USER_ANSWERS: 'codequest_user_answers',
    SETTINGS: 'codequest_settings',
    ONBOARDING_COMPLETE: 'codequest_onboarding_complete',
    API_KEY: 'codequest_api_key'
};

// Default user progress
const DEFAULT_USER_PROGRESS = {
    totalXp: 0,
    currentLevel: 1,
    currentStreak: 0,
    lastActiveDate: null,
    questionsAnswered: 0,
    questionsCorrect: 0,
    badges: [],
    topicProgress: {
        angular: { answered: 0, correct: 0 },
        javascript: { answered: 0, correct: 0 },
        java: { answered: 0, correct: 0 }
    }
};

// Default settings
const DEFAULT_SETTINGS = {
    theme: 'dark',
    soundEnabled: true,
    timerEnabled: true,
    timerDuration: 60
};

class StorageService {
    // Generic get/set methods
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error reading ${key} from storage:`, error);
            return null;
        }
    }

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error writing ${key} to storage:`, error);
            return false;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing ${key} from storage:`, error);
            return false;
        }
    }

    // User Progress
    getUserProgress() {
        const progress = this.get(STORAGE_KEYS.USER_PROGRESS);
        return progress || { ...DEFAULT_USER_PROGRESS };
    }

    saveUserProgress(progress) {
        return this.set(STORAGE_KEYS.USER_PROGRESS, progress);
    }

    updateUserProgress(updates) {
        const current = this.getUserProgress();
        const updated = { ...current, ...updates };
        return this.saveUserProgress(updated);
    }

    // Questions Cache
    getCachedQuestions() {
        const cache = this.get(STORAGE_KEYS.QUESTIONS_CACHE);
        if (!cache) return null;

        // Check if cache is expired (24 hours)
        const now = Date.now();
        const cacheAge = now - (cache.timestamp || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (cacheAge > maxAge) {
            return null; // Cache expired
        }

        return cache.questions;
    }

    cacheQuestions(questions) {
        return this.set(STORAGE_KEYS.QUESTIONS_CACHE, {
            questions,
            timestamp: Date.now()
        });
    }

    // Bookmarks
    getBookmarks() {
        return this.get(STORAGE_KEYS.BOOKMARKS) || [];
    }

    addBookmark(questionId) {
        const bookmarks = this.getBookmarks();
        if (!bookmarks.find(b => b.questionId === questionId)) {
            bookmarks.push({
                questionId,
                bookmarkedAt: Date.now()
            });
            this.set(STORAGE_KEYS.BOOKMARKS, bookmarks);
        }
        return bookmarks;
    }

    removeBookmark(questionId) {
        const bookmarks = this.getBookmarks();
        const filtered = bookmarks.filter(b => b.questionId !== questionId);
        this.set(STORAGE_KEYS.BOOKMARKS, filtered);
        return filtered;
    }

    saveBookmarks(bookmarks) {
        return this.set(STORAGE_KEYS.BOOKMARKS, bookmarks);
    }

    isBookmarked(questionId) {
        return this.getBookmarks().some(b => b.questionId === questionId);
    }

    // API Key
    getApiKey() {
        return this.get(STORAGE_KEYS.API_KEY);
    }

    saveApiKey(key) {
        return this.set(STORAGE_KEYS.API_KEY, key);
    }

    // User Answers History
    getUserAnswers() {
        return this.get(STORAGE_KEYS.USER_ANSWERS) || [];
    }

    saveUserAnswer(answer) {
        const answers = this.getUserAnswers();
        answers.push({
            ...answer,
            attemptedAt: Date.now()
        });
        // Keep last 500 answers
        if (answers.length > 500) {
            answers.shift();
        }
        return this.set(STORAGE_KEYS.USER_ANSWERS, answers);
    }

    getAnswersForQuestion(questionId) {
        return this.getUserAnswers().filter(a => a.questionId === questionId);
    }

    // Settings
    getSettings() {
        return this.get(STORAGE_KEYS.SETTINGS) || { ...DEFAULT_SETTINGS };
    }

    saveSettings(settings) {
        return this.set(STORAGE_KEYS.SETTINGS, settings);
    }

    updateSettings(updates) {
        const current = this.getSettings();
        return this.saveSettings({ ...current, ...updates });
    }

    // Onboarding
    isOnboardingComplete() {
        return this.get(STORAGE_KEYS.ONBOARDING_COMPLETE) === true;
    }

    completeOnboarding() {
        return this.set(STORAGE_KEYS.ONBOARDING_COMPLETE, true);
    }

    // Clear all data
    clearAll() {
        Object.values(STORAGE_KEYS).forEach(key => this.remove(key));
    }
}

export const storage = new StorageService();
export { STORAGE_KEYS, DEFAULT_USER_PROGRESS, DEFAULT_SETTINGS };
