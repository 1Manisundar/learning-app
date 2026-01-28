// Home/Dashboard Screen

import { storage } from '../services/storage.js';
import { gamification } from '../services/gamification.js';

export function renderHomeScreen() {
    const stats = gamification.getStats();
    const settings = storage.getSettings();
    const selectedTopics = settings.selectedTopics || ['angular', 'javascript', 'java'];

    const topicInfo = {
        angular: { icon: '🅰️', color: 'angular', name: 'Angular' },
        javascript: { icon: '🟨', color: 'javascript', name: 'JavaScript' },
        java: { icon: '☕', color: 'java', name: 'Java' }
    };

    return `
    <div class="screen" id="home-screen">
      <!-- Header -->
      <header class="screen-header">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold">CodeQuest</h1>
            <p class="text-sm text-muted">Ready to learn?</p>
          </div>
          <div class="streak-badge">
            <span class="fire">🔥</span>
            <span>${stats.currentStreak}</span>
          </div>
        </div>
      </header>
      
      <div class="screen-content">
        <!-- XP Progress -->
        <div class="card mb-md">
          <div class="xp-bar">
            <div class="level">${stats.currentLevel}</div>
            <div class="flex-1">
              <div class="flex justify-between text-sm mb-xs">
                <span class="font-medium">Level ${stats.currentLevel}</span>
                <span class="text-muted">${stats.levelProgress.current}/${stats.levelProgress.required} XP</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill xp" style="width: ${stats.levelProgress.percentage}%"></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Quick Stats -->
        <div class="flex gap-sm mb-lg">
          <div class="stat-card flex-1">
            <span class="stat-value">${stats.questionsAnswered}</span>
            <span class="stat-label">Answered</span>
          </div>
          <div class="stat-card flex-1">
            <span class="stat-value">${stats.accuracy}%</span>
            <span class="stat-label">Accuracy</span>
          </div>
          <div class="stat-card flex-1">
            <span class="stat-value">${stats.totalXp}</span>
            <span class="stat-label">Total XP</span>
          </div>
        </div>
        
        <!-- Daily Challenge -->
        <div class="card mb-lg" style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); color: white;">
          <div class="flex items-center gap-md">
            <div style="font-size: 2.5rem;">🎯</div>
            <div class="flex-1">
              <h3 class="font-bold">Daily Challenge</h3>
              <p class="text-sm" style="opacity: 0.9;">Complete 5 questions to earn bonus XP!</p>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="window.app.startDailyChallenge()">
              Start
            </button>
          </div>
        </div>
        
        <!-- Main Actions -->
        <div class="flex gap-md mb-lg">
          <button class="btn btn-primary btn-lg flex-1" onclick="window.app.navigate('learn')">
            📚 Learn
          </button>
          <button class="btn btn-success btn-lg flex-1" onclick="window.app.navigate('topics')">
            🎮 Quiz
          </button>
        </div>
        
        <!-- Topic Cards -->
        <h3 class="font-semibold mb-md">Your Topics</h3>
        <div class="flex flex-col gap-md">
          ${selectedTopics.map(topic => {
        const info = topicInfo[topic];
        const progress = stats.topicProgress[topic] || { answered: 0, correct: 0 };
        const topicAccuracy = progress.answered > 0
            ? Math.round((progress.correct / progress.answered) * 100)
            : 0;

        return `
              <div class="topic-card ${info.color}" onclick="window.app.startQuiz('${topic}')">
                <div class="topic-icon ${info.color}">${info.icon}</div>
                <div class="flex-1">
                  <h4 class="font-semibold">${info.name}</h4>
                  <p class="text-sm text-muted">${progress.answered} questions • ${topicAccuracy}% accuracy</p>
                </div>
                <span class="text-2xl">→</span>
              </div>
            `;
    }).join('')}
        </div>
        
        <!-- Recent Badges -->
        ${stats.badges.filter(b => b.unlocked).length > 0 ? `
          <h3 class="font-semibold mt-lg mb-md">Recent Badges</h3>
          <div class="flex gap-md" style="overflow-x: auto; padding-bottom: var(--space-sm);">
            ${stats.badges.filter(b => b.unlocked).slice(0, 5).map(badge => `
              <div class="badge-item unlocked" style="min-width: 70px;">
                <div class="badge-icon">${badge.icon}</div>
                <span class="badge-name">${badge.name}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

export function initHomeScreen() {
    // Update streak on home screen load
    gamification.updateStreak();
}
