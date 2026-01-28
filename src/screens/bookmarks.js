// Bookmarks Screen

import { storage } from '../services/storage.js';

export function renderBookmarksScreen(questions = []) {
    const bookmarks = storage.getBookmarks();
    const settings = storage.getSettings();

    // Filter questions that are bookmarked
    const bookmarkedQuestions = questions.filter(q =>
        bookmarks.some(b => b.questionId === q.id)
    );

    const topicInfo = {
        angular: { icon: '🅰️', name: 'Angular' },
        javascript: { icon: '🟨', name: 'JavaScript' },
        java: { icon: '☕', name: 'Java' }
    };

    return `
    <div class="screen" id="bookmarks-screen">
      <header class="screen-header">
        <h1 class="screen-title">🔖 Bookmarks</h1>
      </header>
      
      <div class="screen-content">
        ${bookmarks.length === 0 ? `
          <div class="text-center p-lg">
            <div style="font-size: 4rem; margin-bottom: var(--space-md);">📚</div>
            <h3 class="font-semibold mb-sm">No bookmarks yet</h3>
            <p class="text-secondary mb-lg">Bookmark questions during quizzes to review them later</p>
            <button class="btn btn-primary" onclick="window.app.navigate('topics')">
              Start a Quiz
            </button>
          </div>
        ` : `
          <!-- Filter Chips -->
          <div class="flex gap-sm mb-lg" style="overflow-x: auto;">
            <button class="chip chip-easy active" data-filter="all" onclick="window.app.filterBookmarks('all')">
              All (${bookmarks.length})
            </button>
            <button class="chip" data-filter="angular" onclick="window.app.filterBookmarks('angular')">
              🅰️ Angular
            </button>
            <button class="chip" data-filter="javascript" onclick="window.app.filterBookmarks('javascript')">
              🟨 JavaScript
            </button>
            <button class="chip" data-filter="java" onclick="window.app.filterBookmarks('java')">
              ☕ Java
            </button>
          </div>
          
          <!-- Practice from bookmarks -->
          ${bookmarks.length >= 5 ? `
            <div class="card mb-lg" style="background: linear-gradient(135deg, var(--badge-purple) 0%, var(--primary) 100%); color: white;">
              <div class="flex items-center gap-md">
                <span style="font-size: 2rem;">🎯</span>
                <div class="flex-1">
                  <h3 class="font-semibold">Practice Bookmarks</h3>
                  <p class="text-sm" style="opacity: 0.9;">Quiz yourself on saved questions</p>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="window.app.practiceBookmarks()">
                  Start
                </button>
              </div>
            </div>
          ` : ''}
          
          <!-- Bookmarked Questions List -->
          <div class="flex flex-col gap-md" id="bookmarks-list">
            ${bookmarkedQuestions.length > 0 ? bookmarkedQuestions.map(q => {
        const info = topicInfo[q.topic] || { icon: '📚', name: q.topic };
        return `
                <div class="card" style="padding: var(--space-md);">
                  <div class="flex justify-between items-start mb-sm">
                    <span class="text-sm text-muted">${info.icon} ${info.name}</span>
                    <button class="text-sm" style="background: none; border: none; color: var(--error); cursor: pointer;" 
                            onclick="window.app.removeBookmark('${q.id}')">
                      Remove
                    </button>
                  </div>
                  <p class="text-sm mb-sm">${q.question.substring(0, 120)}${q.question.length > 120 ? '...' : ''}</p>
                  <div class="flex gap-sm">
                    <span class="chip chip-${q.difficulty}" style="font-size: 0.7rem; padding: 2px 8px;">
                      ${q.difficulty}
                    </span>
                  </div>
                </div>
              `;
    }).join('') : `
              <div class="text-center p-lg text-muted">
                <p>Questions will appear here once they're loaded from AI</p>
                <button class="btn btn-primary btn-sm mt-md" onclick="window.app.navigate('topics')">
                  Start Quiz to Get Questions
                </button>
              </div>
            `}
          </div>
        `}
      </div>
    </div>
  `;
}

export function initBookmarksScreen() {
    // Nothing special needed
}
