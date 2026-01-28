// Gamification Service
// Handles XP, levels, streaks, and badges

import { storage } from './storage.js';
import { logger } from './logger.js';

// XP rewards by difficulty
const XP_REWARDS = {
    easy: 5,
    medium: 10,
    hard: 15
};

// XP required per level (level * 100)
const XP_PER_LEVEL = 100;

// Badge definitions
const BADGES = [
    {
        id: 'first_win',
        name: 'First Win',
        description: 'Answer your first question correctly',
        icon: '🏆',
        condition: (progress) => progress.questionsCorrect >= 1
    },
    {
        id: 'streak_3',
        name: 'On Fire',
        description: 'Maintain a 3-day streak',
        icon: '🔥',
        condition: (progress) => progress.currentStreak >= 3
    },
    {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '⚡',
        condition: (progress) => progress.currentStreak >= 7
    },
    {
        id: 'streak_30',
        name: 'Dedicated Learner',
        description: 'Maintain a 30-day streak',
        icon: '🌟',
        condition: (progress) => progress.currentStreak >= 30
    },
    {
        id: 'questions_10',
        name: 'Getting Started',
        description: 'Answer 10 questions',
        icon: '📝',
        condition: (progress) => progress.questionsAnswered >= 10
    },
    {
        id: 'questions_50',
        name: 'Quiz Master',
        description: 'Answer 50 questions',
        icon: '🎯',
        condition: (progress) => progress.questionsAnswered >= 50
    },
    {
        id: 'questions_100',
        name: 'Century Club',
        description: 'Answer 100 questions',
        icon: '💯',
        condition: (progress) => progress.questionsAnswered >= 100
    },
    {
        id: 'perfect_quiz',
        name: 'Perfect Score',
        description: 'Get 100% on a quiz with 10+ questions',
        icon: '⭐',
        condition: null // Checked separately during quiz completion
    },
    {
        id: 'level_5',
        name: 'Rising Star',
        description: 'Reach level 5',
        icon: '🌙',
        condition: (progress) => progress.currentLevel >= 5
    },
    {
        id: 'level_10',
        name: 'Pro Coder',
        description: 'Reach level 10',
        icon: '💎',
        condition: (progress) => progress.currentLevel >= 10
    },
    {
        id: 'angular_master',
        name: 'Angular Expert',
        description: 'Answer 30 Angular questions correctly',
        icon: '🅰️',
        condition: (progress) => progress.topicProgress?.angular?.correct >= 30
    },
    {
        id: 'javascript_master',
        name: 'JS Wizard',
        description: 'Answer 30 JavaScript questions correctly',
        icon: '🟨',
        condition: (progress) => progress.topicProgress?.javascript?.correct >= 30
    },
    {
        id: 'java_master',
        name: 'Java Champion',
        description: 'Answer 30 Java questions correctly',
        icon: '☕',
        condition: (progress) => progress.topicProgress?.java?.correct >= 30
    }
];

class GamificationService {
    constructor() {
        this.badges = BADGES;
    }

    // Calculate XP for a correct answer
    getXpReward(difficulty) {
        return XP_REWARDS[difficulty.toLowerCase()] || XP_REWARDS.medium;
    }

    // Calculate level from total XP
    calculateLevel(totalXp) {
        return Math.floor(totalXp / XP_PER_LEVEL) + 1;
    }

    // Calculate XP progress within current level
    getLevelProgress(totalXp) {
        const xpInCurrentLevel = totalXp % XP_PER_LEVEL;
        return {
            current: xpInCurrentLevel,
            required: XP_PER_LEVEL,
            percentage: (xpInCurrentLevel / XP_PER_LEVEL) * 100
        };
    }

    // Update streak based on last active date
    updateStreak() {
        const progress = storage.getUserProgress();
        const today = new Date().toDateString();
        const lastActive = progress.lastActiveDate ? new Date(progress.lastActiveDate).toDateString() : null;

        if (lastActive === today) {
            // Already active today, no change
            return progress.currentStreak;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        let newStreak;
        if (lastActive === yesterdayStr) {
            // Consecutive day - increment streak
            newStreak = progress.currentStreak + 1;
            logger.success(`Streak increased to ${newStreak}! 🔥`);
        } else if (lastActive === null) {
            // First time
            newStreak = 1;
        } else {
            // Streak broken
            newStreak = 1;
            if (progress.currentStreak > 1) {
                logger.warning(`Streak reset from ${progress.currentStreak} to 1`);
            }
        }

        storage.updateUserProgress({
            currentStreak: newStreak,
            lastActiveDate: new Date().toISOString()
        });

        return newStreak;
    }

    // Process answer and update progress
    processAnswer(question, selectedAnswer, isCorrect, timeTaken) {
        const progress = storage.getUserProgress();
        const topic = question.topic.toLowerCase();

        // Update basic stats
        progress.questionsAnswered += 1;

        // Update topic progress
        if (!progress.topicProgress[topic]) {
            progress.topicProgress[topic] = { answered: 0, correct: 0 };
        }
        progress.topicProgress[topic].answered += 1;

        let xpEarned = 0;

        if (isCorrect) {
            progress.questionsCorrect += 1;
            progress.topicProgress[topic].correct += 1;

            // Calculate XP
            xpEarned = this.getXpReward(question.difficulty);

            // Bonus XP for fast answers (under 15 seconds)
            if (timeTaken < 15000) {
                xpEarned += 2;
            }

            progress.totalXp += xpEarned;

            // Check for level up
            const newLevel = this.calculateLevel(progress.totalXp);
            const leveledUp = newLevel > progress.currentLevel;
            progress.currentLevel = newLevel;

            if (leveledUp) {
                logger.success(`Level Up! Now level ${newLevel} 🎉`);
            }
        }

        // Save answer history
        storage.saveUserAnswer({
            questionId: question.id,
            selectedAnswer,
            isCorrect,
            timeTaken,
            topic,
            difficulty: question.difficulty
        });

        storage.saveUserProgress(progress);

        // Check for new badges
        const newBadges = this.checkAndAwardBadges(progress);

        return {
            xpEarned,
            totalXp: progress.totalXp,
            currentLevel: progress.currentLevel,
            levelProgress: this.getLevelProgress(progress.totalXp),
            newBadges
        };
    }

    // Check quiz completion for perfect score badge
    checkPerfectQuiz(correctCount, totalCount) {
        if (totalCount >= 10 && correctCount === totalCount) {
            const progress = storage.getUserProgress();
            if (!progress.badges.includes('perfect_quiz')) {
                progress.badges.push('perfect_quiz');
                storage.saveUserProgress(progress);
                logger.success('Badge unlocked: Perfect Score! ⭐');
                return true;
            }
        }
        return false;
    }

    // Check and award badges
    checkAndAwardBadges(progress) {
        const newBadges = [];

        for (const badge of this.badges) {
            if (progress.badges.includes(badge.id)) {
                continue; // Already has this badge
            }

            if (badge.condition && badge.condition(progress)) {
                progress.badges.push(badge.id);
                newBadges.push(badge);
                logger.success(`Badge unlocked: ${badge.name} ${badge.icon}`);
            }
        }

        if (newBadges.length > 0) {
            storage.saveUserProgress(progress);
        }

        return newBadges;
    }

    // Get all badges with unlock status
    getAllBadges() {
        const progress = storage.getUserProgress();
        const unlockedIds = progress.badges || [];

        return this.badges.map(badge => ({
            ...badge,
            unlocked: unlockedIds.includes(badge.id)
        }));
    }

    // Get user stats summary
    getStats() {
        const progress = storage.getUserProgress();
        const accuracy = progress.questionsAnswered > 0
            ? Math.round((progress.questionsCorrect / progress.questionsAnswered) * 100)
            : 0;

        return {
            totalXp: progress.totalXp,
            currentLevel: progress.currentLevel,
            levelProgress: this.getLevelProgress(progress.totalXp),
            currentStreak: progress.currentStreak,
            questionsAnswered: progress.questionsAnswered,
            questionsCorrect: progress.questionsCorrect,
            accuracy,
            badges: this.getAllBadges(),
            topicProgress: progress.topicProgress
        };
    }

    // Get accuracy for last 7 days
    getWeeklyAccuracy() {
        const answers = storage.getUserAnswers();
        const now = Date.now();
        const weekAgo = now - (7 * 24 * 60 * 60 * 1000);

        const days = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(now - (i * 24 * 60 * 60 * 1000));
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);

            const dayAnswers = answers.filter(a =>
                a.attemptedAt >= dayStart.getTime() && a.attemptedAt <= dayEnd.getTime()
            );

            const correct = dayAnswers.filter(a => a.isCorrect).length;
            const total = dayAnswers.length;

            days.push({
                date: dayStart,
                label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayStart.getDay()],
                correct,
                total,
                accuracy: total > 0 ? Math.round((correct / total) * 100) : 0
            });
        }

        return days;
    }
}

export const gamification = new GamificationService();
export { BADGES, XP_REWARDS, XP_PER_LEVEL };
