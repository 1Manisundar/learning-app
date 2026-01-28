// Quiz Screen

import { storage } from '../services/storage.js';
import { gamification } from '../services/gamification.js';

export function renderQuizScreen(state) {
    const {
        questions,
        currentIndex,
        selectedAnswer,
        timeRemaining,
        topic
    } = state;

    const question = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const settings = storage.getSettings();

    const topicIcons = {
        angular: '🅰️',
        javascript: '🟨',
        java: '☕',
        random: '🎲'
    };

    return `
    <div class="screen" id="quiz-screen">
      <!-- Quiz Header -->
      <div class="quiz-header">
        <div class="quiz-progress">
          <span>${topicIcons[topic] || '📝'}</span>
          <span>Question ${currentIndex + 1}/${questions.length}</span>
        </div>
        ${settings.timerEnabled ? `
          <div class="quiz-timer ${timeRemaining <= 10 ? 'warning' : ''}">
            ⏱️ ${timeRemaining}s
          </div>
        ` : ''}
        <button class="btn btn-secondary btn-sm" onclick="window.app.quitQuiz()">
          ✕
        </button>
      </div>
      
      <!-- Progress Bar -->
      <div class="progress-bar" style="border-radius: 0; height: 4px;">
        <div class="progress-fill" style="width: ${progress}%; border-radius: 0;"></div>
      </div>
      
      <div class="screen-content" style="padding-top: var(--space-lg);">
        <!-- Question Card -->
        <div class="question-card">
          <!-- Difficulty Badge -->
          <div class="mb-md">
            <span class="chip chip-${question.difficulty}" style="pointer-events: none;">
              ${question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
            </span>
          </div>
          
          <!-- Question Text -->
          <p class="question-text">${escapeHtml(question.question)}</p>
          
          <!-- Code Snippet (if any) -->
          ${question.codeSnippet ? `
            <div class="code-block">
              <pre><code class="language-${getLanguageClass(topic)}">${escapeHtml(question.codeSnippet)}</code></pre>
            </div>
          ` : ''}
        </div>
        
        <!-- Options -->
        <div class="options-list">
          ${question.options.map((option, index) => `
            <button 
              class="option-btn ${selectedAnswer === index ? 'selected' : ''}" 
              onclick="window.app.selectAnswer(${index})"
              data-index="${index}"
            >
              <span class="option-letter">${String.fromCharCode(65 + index)}</span>
              <span class="option-text">${escapeHtml(option)}</span>
            </button>
          `).join('')}
        </div>
        
        <!-- Actions -->
        <div class="quiz-actions mt-lg">
          <button class="btn btn-secondary flex-1" onclick="window.app.skipQuestion()">
            Skip
          </button>
          <button 
            class="btn btn-primary flex-1" 
            onclick="window.app.submitAnswer()"
            ${selectedAnswer === null ? 'disabled' : ''}
          >
            Submit
          </button>
        </div>
        
        <!-- Bookmark Button -->
        <div class="text-center mt-md">
          <button class="btn btn-outline btn-sm" onclick="window.app.toggleBookmark('${question.id}')">
            ${storage.isBookmarked(question.id) ? '🔖 Bookmarked' : '🔖 Bookmark'}
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderFeedbackScreen(state) {
    const { question, selectedAnswer, isCorrect, xpEarned, explanation } = state;

    return `
    <div class="screen feedback-screen" id="feedback-screen">
      <div class="screen-content" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: var(--space-xl);">
        
        <!-- Feedback Icon -->
        <div class="feedback-icon ${isCorrect ? 'correct' : 'incorrect'}">
          ${isCorrect ? '✅' : '❌'}
        </div>
        
        <!-- Result Text -->
        <h2 class="text-2xl font-bold mb-sm">
          ${isCorrect ? 'Correct!' : 'Incorrect'}
        </h2>
        
        <!-- XP Earned -->
        ${isCorrect ? `
          <div class="xp-earned">
            ⭐ +${xpEarned} XP
          </div>
        ` : ''}
        
        <!-- Correct Answer (if wrong) -->
        ${!isCorrect ? `
          <div class="card mb-lg" style="background: rgba(16, 185, 129, 0.1); border-color: var(--success); width: 100%;">
            <p class="text-sm text-muted mb-xs">Correct Answer:</p>
            <p class="font-semibold" style="color: var(--success);">
              ${String.fromCharCode(65 + question.correctAnswer)}. ${escapeHtml(question.options[question.correctAnswer])}
            </p>
          </div>
        ` : ''}
        
        <!-- Explanation -->
        <div class="explanation-box" style="width: 100%;">
          <h4 class="font-semibold mb-sm">💡 Explanation</h4>
          <p class="text-sm text-secondary">${escapeHtml(question.explanation || 'No explanation available.')}</p>
          
          ${question.referenceLink ? `
            <a href="${question.referenceLink}" target="_blank" class="btn btn-outline btn-sm mt-md">
              📖 Learn More
            </a>
          ` : ''}
        </div>
        
        <!-- Next Button -->
        <button class="btn btn-primary btn-lg btn-block mt-lg" onclick="window.app.nextQuestion()">
          ${state.isLastQuestion ? 'See Results' : 'Next Question'} →
        </button>
      </div>
    </div>
  `;
}

export function renderResultsScreen(state) {
    const {
        correctCount,
        totalCount,
        totalXpEarned,
        timeTaken,
        topic,
        wrongAnswers
    } = state;

    const accuracy = Math.round((correctCount / totalCount) * 100);
    const minutes = Math.floor(timeTaken / 60000);
    const seconds = Math.floor((timeTaken % 60000) / 1000);

    let resultEmoji = '😊';
    let resultMessage = 'Good effort!';

    if (accuracy === 100) {
        resultEmoji = '🏆';
        resultMessage = 'Perfect Score!';
    } else if (accuracy >= 80) {
        resultEmoji = '🌟';
        resultMessage = 'Excellent!';
    } else if (accuracy >= 60) {
        resultEmoji = '👍';
        resultMessage = 'Well done!';
    } else if (accuracy < 40) {
        resultEmoji = '💪';
        resultMessage = 'Keep practicing!';
    }

    return `
    <div class="screen" id="results-screen">
      <div class="results-header">
        <div class="score-circle">
          <span class="score-value">${correctCount}/${totalCount}</span>
          <span class="score-label">${resultEmoji} ${resultMessage}</span>
        </div>
      </div>
      
      <div class="screen-content">
        <!-- Stats Grid -->
        <div class="results-stats">
          <div class="stat-card">
            <span class="stat-value" style="color: var(--success);">${accuracy}%</span>
            <span class="stat-label">Accuracy</span>
          </div>
          <div class="stat-card">
            <span class="stat-value" style="color: var(--xp-gold);">+${totalXpEarned}</span>
            <span class="stat-label">XP Earned</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${minutes}:${seconds.toString().padStart(2, '0')}</span>
            <span class="stat-label">Time</span>
          </div>
        </div>
        
        <!-- Wrong Answers Review -->
        ${wrongAnswers.length > 0 ? `
          <div class="card mt-lg">
            <h3 class="font-semibold mb-md">📝 Review Mistakes (${wrongAnswers.length})</h3>
            <div class="flex flex-col gap-sm" style="max-height: 200px; overflow-y: auto;">
              ${wrongAnswers.slice(0, 3).map((item, i) => `
                <div class="p-md" style="background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                  <p class="text-sm mb-xs">${i + 1}. ${escapeHtml(item.question.question.substring(0, 80))}...</p>
                  <p class="text-xs text-success">✓ ${escapeHtml(item.question.options[item.question.correctAnswer])}</p>
                </div>
              `).join('')}
              ${wrongAnswers.length > 3 ? `
                <p class="text-sm text-muted text-center">+${wrongAnswers.length - 3} more mistakes</p>
              ` : ''}
            </div>
          </div>
        ` : `
          <div class="card mt-lg text-center">
            <span style="font-size: 2rem;">🎉</span>
            <p class="font-semibold mt-sm">No mistakes!</p>
          </div>
        `}
        
        <!-- Action Buttons -->
        <div class="flex flex-col gap-md mt-lg">
          <button class="btn btn-primary btn-lg btn-block" onclick="window.app.startQuiz('${topic}')">
            🔄 Try Again
          </button>
          <button class="btn btn-secondary btn-lg btn-block" onclick="window.app.navigate('topics')">
            📚 New Topic
          </button>
          <button class="btn btn-outline btn-block" onclick="window.app.navigate('home')">
            🏠 Home
          </button>
        </div>
        
        <!-- Share Button -->
        <div class="text-center mt-md">
          <button class="btn btn-sm" style="background: var(--badge-purple); color: white;" onclick="window.app.shareScore(${accuracy}, '${topic}')">
            📤 Share Score
          </button>
        </div>
      </div>
    </div>
  `;
}

// Helper functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getLanguageClass(topic) {
    const mapping = {
        angular: 'typescript',
        javascript: 'javascript',
        java: 'java'
    };
    return mapping[topic] || 'javascript';
}

export function initQuizScreen() {
    // Re-highlight code blocks
    if (window.Prism) {
        setTimeout(() => {
            window.Prism.highlightAll();
        }, 100);
    }
}
