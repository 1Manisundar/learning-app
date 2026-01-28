// Topic Selection Screen

import { storage } from '../services/storage.js';
import { gamification } from '../services/gamification.js';

export function renderTopicsScreen() {
    const stats = gamification.getStats();
    const settings = storage.getSettings();

    const topics = [
        { id: 'angular', name: 'Angular', icon: '🅰️', color: 'angular' },
        { id: 'javascript', name: 'JavaScript', icon: '🟨', color: 'javascript' },
        { id: 'java', name: 'Java', icon: '☕', color: 'java' }
    ];

    return `
    <div class="screen" id="topics-screen">
      <header class="screen-header">
        <div class="flex items-center gap-md">
          <button class="btn btn-secondary btn-sm" onclick="window.app.navigate('home')">
            ← Back
          </button>
          <h1 class="screen-title">Start Quiz</h1>
        </div>
      </header>
      
      <div class="screen-content">
        <!-- Difficulty Selection -->
        <div class="card mb-lg">
          <h3 class="font-semibold mb-md">Difficulty</h3>
          <div class="difficulty-chips">
            <button class="chip chip-easy active" data-difficulty="easy" onclick="window.app.setDifficulty('easy')">
              Easy (+5 XP)
            </button>
            <button class="chip chip-medium" data-difficulty="medium" onclick="window.app.setDifficulty('medium')">
              Medium (+10 XP)
            </button>
            <button class="chip chip-hard" data-difficulty="hard" onclick="window.app.setDifficulty('hard')">
              Hard (+15 XP)
            </button>
          </div>
        </div>
        
        <!-- Question Count -->
        <div class="card mb-lg">
          <h3 class="font-semibold mb-md">Questions</h3>
          <div class="flex gap-sm">
            <button class="btn btn-secondary btn-sm" data-count="5" onclick="window.app.setQuestionCount(5)">5</button>
            <button class="btn btn-primary btn-sm" data-count="10" onclick="window.app.setQuestionCount(10)">10</button>
            <button class="btn btn-secondary btn-sm" data-count="15" onclick="window.app.setQuestionCount(15)">15</button>
            <button class="btn btn-secondary btn-sm" data-count="20" onclick="window.app.setQuestionCount(20)">20</button>
          </div>
        </div>
        
        <!-- Topic Selection -->
        <h3 class="font-semibold mb-md">Select Topic</h3>
        <div class="flex flex-col gap-md mb-lg">
          ${topics.map(topic => {
        const progress = stats.topicProgress[topic.id] || { answered: 0, correct: 0 };
        return `
              <div class="topic-card ${topic.color}" onclick="window.app.startQuiz('${topic.id}')">
                <div class="topic-icon ${topic.color}">${topic.icon}</div>
                <div class="flex-1">
                  <h4 class="font-semibold">${topic.name}</h4>
                  <p class="text-sm text-muted">${progress.correct} correct answers</p>
                </div>
                <span class="text-2xl">→</span>
              </div>
            `;
    }).join('')}
        </div>
        
        <!-- Random Mix Option -->
        <div class="topic-card" onclick="window.app.startQuiz('random')" style="border-left: 4px solid var(--badge-purple);">
          <div class="topic-icon" style="background: rgba(139, 92, 246, 0.1); color: var(--badge-purple);">🎲</div>
          <div class="flex-1">
            <h4 class="font-semibold">Random Mix</h4>
            <p class="text-sm text-muted">Questions from all topics</p>
          </div>
          <span class="text-2xl">→</span>
        </div>
      </div>
    </div>
  `;
}

export function initTopicsScreen() {
    // Initialize default values
    window.app.quizSettings = {
        difficulty: 'easy',
        questionCount: 10
    };
}
