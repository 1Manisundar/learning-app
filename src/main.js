// Main Application Controller
// This is the entry point that orchestrates all screens and logic

import './style.css';

import { storage } from './services/storage.js';
import { gemini } from './services/gemini.js';
import { gamification } from './services/gamification.js';
import { logger, renderErrorConsole } from './services/logger.js';
import { snackbar } from './services/snackbar.js';
import { icons } from './services/icons.js';

import { renderSplashScreen, initSplashScreen } from './screens/splash.js';
import { renderHomeScreen, initHomeScreen } from './screens/home.js';
import { renderTopicsScreen, initTopicsScreen } from './screens/topics.js';
import { renderQuizScreen, renderQuizFeedback, renderQuizResults, initQuizScreen } from './screens/quiz.js';
import { renderLearnScreen, renderLessonDetail, initLearnScreen, LESSONS } from './screens/learn.js';
import { renderProfileScreen, renderSettingsModal, initProfileScreen } from './screens/profile.js';
import { renderBookmarksScreen, initBookmarksScreen } from './screens/bookmarks.js';

// App State
const state = {
  currentScreen: 'splash',
  currentRoute: 'splash',
  quiz: null,
  lesson: null,
  quizSettings: {
    difficulty: 'easy',
    questionCount: 10
  },
  settingsModalOpen: false
};

// Bottom Navigation Component
function renderBottomNav() {
  const screens = [
    { id: 'home', icon: icons.get('home', 24), label: 'Home' },
    { id: 'learn', icon: icons.navigation.learn(), label: 'Learn' },
    { id: 'topics', icon: icons.navigation.quiz(), label: 'Quiz' },
    { id: 'bookmarks', icon: icons.navigation.bookmarks(), label: 'Saved' },
    { id: 'profile', icon: icons.navigation.profile(), label: 'Profile' }
  ];

  return `
    <nav class="bottom-nav">
      ${screens.map(screen => `
        <button class="nav-item ${state.currentScreen === screen.id ? 'active' : ''}" 
                onclick="window.app.navigate('${screen.id}')">
          <span class="icon">${screen.icon}</span>
          <span>${screen.label}</span>
        </button>
      `).join('')}
    </nav>
  `;
}

// Main render function
function render() {
  const app = document.getElementById('app');
  let content = '';
  let showNav = true;

  switch (state.currentScreen) {
    case 'splash':
      content = renderSplashScreen();
      showNav = false;
      break;
    case 'home':
      content = renderHomeScreen();
      break;
    case 'topics':
      content = renderTopicsScreen();
      break;
    case 'quiz':
      content = renderQuizScreen({
        questions: state.quiz.questions,
        currentIndex: state.quiz.currentIndex,
        selectedAnswer: state.quiz.selectedAnswer,
        timeRemaining: state.quiz.timeRemaining,
        topic: state.quiz.topic
      });
      showNav = false;
      break;
    case 'feedback':
      const currentQ = state.quiz.questions[state.quiz.currentIndex];
      const lastAnswer = state.quiz.answers[state.quiz.answers.length - 1];
      content = renderFeedbackScreen({
        question: currentQ,
        selectedAnswer: lastAnswer?.selectedAnswer,
        isCorrect: lastAnswer?.isCorrect,
        xpEarned: lastAnswer?.xpEarned || 0,
        isLastQuestion: state.quiz.currentIndex >= state.quiz.questions.length - 1
      });
      showNav = false;
      break;
    case 'results':
      const correctCount = state.quiz.answers.filter(a => a.isCorrect).length;
      const wrongAnswers = state.quiz.answers
        .filter(a => !a.isCorrect)
        .map(a => ({ question: a.question, selectedAnswer: a.selectedAnswer }));
      content = renderResultsScreen({
        correctCount,
        totalCount: state.quiz.questions.length,
        totalXpEarned: state.quiz.answers.reduce((sum, a) => sum + (a.xpEarned || 0), 0),
        timeTaken: Date.now() - state.quiz.startTime,
        topic: state.quiz.topic,
        wrongAnswers
      });
      showNav = false;
      break;
    case 'learn':
      content = renderLearnScreen();
      break;
    case 'lesson':
      if (state.lesson.content) {
        content = renderLessonScreen(state.lesson.content, state.lesson.topic);
      } else {
        content = renderLoadingLesson();
      }
      showNav = false;
      break;
    case 'profile':
      content = renderProfileScreen();
      break;
    case 'bookmarks':
      content = renderBookmarksScreen(state.allQuestions);
      break;
    default:
      content = renderHomeScreen();
  }

  app.innerHTML = content + (showNav ? renderBottomNav() : '');

  // Initialize screen-specific logic
  initCurrentScreen();

  // Handle settings modal
  if (state.settingsModalOpen) {
    app.innerHTML += renderSettingsModal();
  }
}

function initCurrentScreen() {
  switch (state.currentScreen) {
    case 'splash':
      initSplashScreen(() => navigate('home'));
      break;
    case 'home':
      initHomeScreen();
      break;
    case 'topics':
      initTopicsScreen();
      break;
    case 'quiz':
    case 'feedback':
      initQuizScreen();
      break;
    case 'learn':
    case 'lesson':
      initLearnScreen();
      break;
    case 'profile':
      initProfileScreen();
      break;
    case 'bookmarks':
      initBookmarksScreen();
      break;
  }
}

// Navigation
function navigate(screen) {
  // Clear quiz timer if leaving quiz
  if (state.currentScreen === 'quiz' && state.quiz.timerInterval) {
    clearInterval(state.quiz.timerInterval);
    state.quiz.timerInterval = null;
  }

  state.currentScreen = screen;
  render();
  logger.info(`Navigated to ${screen}`);
}

// Quiz Functions
async function startQuiz(topic) {
  try {
    logger.info(`Starting quiz for topic: ${topic}`);

    // Show loading state
    state.currentScreen = 'quiz';
    state.quiz = {
      topic,
      questions: [],
      currentIndex: 0,
      selectedAnswer: null,
      answers: [],
      startTime: Date.now(),
      timeRemaining: storage.getSettings().timerDuration || 60,
      timerInterval: null
    };

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="loading-screen" style="min-height: 100vh;">
        <div class="spinner"></div>
        <p class="text-secondary mt-md">Generating questions with AI...</p>
        <p class="text-sm text-muted">This may take a few seconds</p>
      </div>
    `;

    // Determine topics to fetch
    const topics = topic === 'random'
      ? ['angular', 'javascript', 'java']
      : [topic];

    // Fetch questions from Gemini
    let allQuestions = [];
    const questionsPerTopic = Math.ceil(state.quizSettings.questionCount / topics.length);

    for (const t of topics) {
      const questions = await gemini.generateQuestions(
        t,
        state.quizSettings.difficulty,
        questionsPerTopic
      );
      allQuestions = allQuestions.concat(questions);
    }

    // Shuffle and limit to requested count
    allQuestions = shuffleArray(allQuestions).slice(0, state.quizSettings.questionCount);

    if (allQuestions.length === 0) {
      throw new Error('No questions generated');
    }

    // Cache questions
    state.allQuestions = [...state.allQuestions, ...allQuestions];
    storage.cacheQuestions(state.allQuestions);

    state.quiz.questions = allQuestions;

    // Start timer if enabled
    const settings = storage.getSettings();
    if (settings.timerEnabled) {
      state.quiz.timerInterval = setInterval(() => {
        state.quiz.timeRemaining--;
        if (state.quiz.timeRemaining <= 0) {
          // Time's up - auto submit
          submitAnswer();
        } else {
          // Update timer display
          const timerEl = document.querySelector('.quiz-timer');
          if (timerEl) {
            timerEl.textContent = `⏱️ ${state.quiz.timeRemaining}s`;
            if (state.quiz.timeRemaining <= 10) {
              timerEl.classList.add('warning');
            }
          }
        }
      }, 1000);
    }

    render();
    logger.success(`Quiz started with ${allQuestions.length} questions`);

  } catch (error) {
    logger.error(`Failed to start quiz: ${error.message}`);

    // Show error and go back
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: var(--space-xl);">
        <div style="font-size: 4rem;">😕</div>
        <h2 class="font-bold mt-md">Oops! Something went wrong</h2>
        <p class="text-secondary mt-sm mb-lg">${error.message}</p>
        <button class="btn btn-primary" onclick="window.app.navigate('topics')">Try Again</button>
      </div>
    `;
  }
}

async function startLessonQuiz(lessonId, lessonTitle, topic) {
  try {
    logger.info(`Starting mastery quiz for lesson: ${lessonTitle}`);

    state.currentScreen = 'quiz';
    state.quiz = {
      topic: `${topic} - ${lessonTitle}`,
      questions: [],
      currentIndex: 0,
      selectedAnswer: null,
      answers: [],
      startTime: Date.now(),
      timeRemaining: storage.getSettings().timerDuration || 60,
      timerInterval: null
    };

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="loading-screen" style="min-height: 100vh;">
        <div class="spinner"></div>
        <p class="text-secondary mt-md">Generating mastery quiz for "${lessonTitle}"...</p>
        <p class="text-sm text-muted">This may take up to 20 seconds</p>
      </div>
    `;

    // Generate lesson-specific questions
    const questions = await gemini.generateLessonQuiz(topic, lessonTitle, 10);

    if (questions.length === 0) {
      throw new Error('No questions generated');
    }

    state.quiz.questions = questions;

    // Start timer if enabled
    const settings = storage.getSettings();
    if (settings.timerEnabled) {
      state.quiz.timerInterval = setInterval(() => {
        state.quiz.timeRemaining--;
        if (state.quiz.timeRemaining <= 0) {
          submitAnswer();
        } else {
          const timerEl = document.querySelector('.quiz-timer');
          if (timerEl) {
            timerEl.textContent = `⏱️ ${state.quiz.timeRemaining}s`;
            if (state.quiz.timeRemaining <= 10) {
              timerEl.classList.add('warning');
            }
          }
        }
      }, 1000);
    }

    render();
    logger.success(`Mastery quiz started with ${questions.length} questions`);

  } catch (error) {
    logger.error(`Failed to start quiz: ${error.message}`);

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: var(--space-xl);">
        <div style="font-size: 4rem;">😕</div>
        <h2 class="font-bold mt-md">Oops! Something went wrong</h2>
        <p class="text-secondary mt-sm mb-lg">${error.message}</p>
        <button class="btn btn-primary" onclick="window.app.navigate('learn')">Back to Lessons</button>
      </div>
    `;
  }
}

function selectAnswer(index) {
  state.quiz.selectedAnswer = index;

  // Update UI
  document.querySelectorAll('.option-btn').forEach((btn, i) => {
    btn.classList.toggle('selected', i === index);
  });

  // Enable submit button
  const submitBtn = document.querySelector('.quiz-actions .btn-primary');
  if (submitBtn) submitBtn.disabled = false;
}

function submitAnswer() {
  if (state.quiz.selectedAnswer === null) {
    // Skip if no answer selected
    skipQuestion();
    return;
  }

  const question = state.quiz.questions[state.quiz.currentIndex];
  const isCorrect = state.quiz.selectedAnswer === question.correctAnswer;
  const timeTaken = (storage.getSettings().timerDuration || 60) - state.quiz.timeRemaining;

  // Process answer and get XP
  const result = gamification.processAnswer(
    question,
    state.quiz.selectedAnswer,
    isCorrect,
    timeTaken * 1000
  );

  // Store answer
  state.quiz.answers.push({
    question,
    selectedAnswer: state.quiz.selectedAnswer,
    isCorrect,
    xpEarned: result.xpEarned,
    timeTaken
  });

  // Show feedback
  state.currentScreen = 'feedback';

  // Clear timer
  if (state.quiz.timerInterval) {
    clearInterval(state.quiz.timerInterval);
    state.quiz.timerInterval = null;
  }

  render();

  // Show feedback animation
  setTimeout(() => {
    const feedbackIcon = document.querySelector('.feedback-icon');
    if (feedbackIcon) {
      feedbackIcon.style.animation = isCorrect ? 'correctBounce 0.6s ease' : 'shake 0.6s ease';
    }
  }, 50);
}

function skipQuestion() {
  const question = state.quiz.questions[state.quiz.currentIndex];

  // Record as incorrect
  state.quiz.answers.push({
    question,
    selectedAnswer: null,
    isCorrect: false,
    xpEarned: 0,
    timeTaken: 0
  });

  nextQuestion();
}

function nextQuestion() {
  state.quiz.currentIndex++;
  state.quiz.selectedAnswer = null;

  if (state.quiz.currentIndex >= state.quiz.questions.length) {
    // Quiz complete
    finishQuiz();
  } else {
    // Reset timer
    state.quiz.timeRemaining = storage.getSettings().timerDuration || 60;

    // Restart timer if enabled
    const settings = storage.getSettings();
    if (settings.timerEnabled && !state.quiz.timerInterval) {
      state.quiz.timerInterval = setInterval(() => {
        state.quiz.timeRemaining--;
        if (state.quiz.timeRemaining <= 0) {
          submitAnswer();
        } else {
          const timerEl = document.querySelector('.quiz-timer');
          if (timerEl) {
            timerEl.textContent = `⏱️ ${state.quiz.timeRemaining}s`;
            if (state.quiz.timeRemaining <= 10) {
              timerEl.classList.add('warning');
            }
          }
        }
      }, 1000);
    }

    state.currentScreen = 'quiz';
    render();
  }
}

function finishQuiz() {
  // Clear timer
  if (state.quiz.timerInterval) {
    clearInterval(state.quiz.timerInterval);
    state.quiz.timerInterval = null;
  }

  const correctCount = state.quiz.answers.filter(a => a.isCorrect).length;
  const totalCount = state.quiz.questions.length;

  // Check for perfect score badge
  gamification.checkPerfectQuiz(correctCount, totalCount);

  state.currentScreen = 'results';
  render();

  logger.success(`Quiz completed: ${correctCount}/${totalCount} correct`);
}

function quitQuiz() {
  if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
    if (state.quiz.timerInterval) {
      clearInterval(state.quiz.timerInterval);
    }
    navigate('home');
  }
}

// Daily Challenge
function startDailyChallenge() {
  state.quizSettings = {
    difficulty: 'medium',
    questionCount: 5
  };
  startQuiz('random');
}

// Difficulty and question count setters
function setDifficulty(difficulty) {
  state.quizSettings.difficulty = difficulty;

  // Update UI
  document.querySelectorAll('[data-difficulty]').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.difficulty === difficulty) {
      btn.classList.add('active');
    }
  });
}

function setQuestionCount(count) {
  state.quizSettings.questionCount = count;

  // Update UI
  document.querySelectorAll('[data-count]').forEach(btn => {
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
    if (parseInt(btn.dataset.count) === count) {
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');
    }
  });
}

// Bookmarks
function toggleBookmark(questionId) {
  if (storage.isBookmarked(questionId)) {
    storage.removeBookmark(questionId);
    logger.info('Bookmark removed');
  } else {
    storage.addBookmark(questionId);
    logger.info('Question bookmarked');
  }
  render();
}

function removeBookmark(questionId) {
  storage.removeBookmark(questionId);
  render();
}

function practiceBookmarks() {
  const bookmarks = storage.getBookmarks();
  const questions = state.allQuestions.filter(q =>
    bookmarks.some(b => b.questionId === q.id)
  );

  if (questions.length === 0) {
    snackbar.warning('No bookmarked questions available. Start a quiz first!');
    return;
  }

  state.quiz = {
    topic: 'bookmarks',
    questions: shuffleArray(questions).slice(0, 10),
    currentIndex: 0,
    selectedAnswer: null,
    answers: [],
    startTime: Date.now(),
    timeRemaining: storage.getSettings().timerDuration || 60,
    timerInterval: null
  };

  state.currentScreen = 'quiz';
  render();
}

// Learning
async function openLesson(topic, lessonId, lessonTitle) {
  state.lesson = { topic, lessonId, content: null };
  state.currentScreen = 'lesson';
  render();

  try {
    const content = await gemini.generateLesson(topic, lessonTitle);
    state.lesson.content = content;
    render();
  } catch (error) {
    logger.error(`Failed to load lesson: ${error.message}`);
    navigate('learn');
  }
}

function completeOnboarding() {
  const apiKeyInput = document.getElementById('onboarding-api-key');
  const apiKey = apiKeyInput?.value?.trim();

  if (!apiKey) {
    snackbar.error('API Key Required - Please enter your Gemini API key to continue', 4000);
    return;
  }

  if (!apiKey.startsWith('AIza')) {
    snackbar.error('Invalid API Key - Keys start with "AIza"', 4000);
    return;
  }

  storage.saveApiKey(apiKey);
  storage.completeOnboarding();
  navigate('topics');
}
function completeLesson() {
  const completedLessons = storage.get('codequest_completed_lessons') || [];
  if (!completedLessons.includes(state.lesson.lessonId)) {
    completedLessons.push(state.lesson.lessonId);
    storage.set('codequest_completed_lessons', completedLessons);

    // Award XP for completing lesson
    const progress = storage.getUserProgress();
    progress.totalXp += 15;
    progress.currentLevel = gamification.calculateLevel(progress.totalXp);
    storage.saveUserProgress(progress);

    logger.success('Lesson completed! +15 XP');
  }
  navigate('learn');
}

function checkLessonAnswer(qIndex, selected, correct) {
  const container = document.getElementById(`practice-q-${qIndex}`);
  const options = container.querySelectorAll('.option-btn');
  const explanation = document.getElementById(`explanation-${qIndex}`);

  options.forEach((btn, i) => {
    btn.disabled = true;
    if (i === correct) {
      btn.classList.add('correct');
    } else if (i === selected && i !== correct) {
      btn.classList.add('incorrect');
    }
  });

  if (explanation) {
    explanation.classList.remove('hidden');
    explanation.style.animation = 'fadeInUp 0.3s ease';
  }
}

function showAllLessons(topic) {
  // For now, show an alert. Could expand to a full lessons list modal
  const lessons = LESSONS[topic] || [];
  snackbar.info(`${topic.charAt(0).toUpperCase() + topic.slice(1)}: ${lessons.length} lessons available`);
}

// Settings
function openSettings() {
  state.settingsModalOpen = true;
  render();
}

function closeSettings(event) {
  if (!event || event.target.classList.contains('modal-overlay')) {
    state.settingsModalOpen = false;
    render();
  }
}

function toggleTheme() {
  const settings = storage.getSettings();
  const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
  storage.updateSettings({ theme: newTheme });
  document.documentElement.setAttribute('data-theme', newTheme);
  render();
}

function toggleTimer() {
  const settings = storage.getSettings();
  storage.updateSettings({ timerEnabled: !settings.timerEnabled });
  render();
}

function resetProgress() {
  if (confirm('This will delete ALL your progress, XP, badges and settings. Are you sure?')) {
    storage.clearAll();
    logger.warning('All progress reset');
    location.reload();
  }
}

// Console
function toggleConsole() {
  logger.toggle();
  const console = document.getElementById('error-console');
  if (console) {
    console.classList.toggle('open');
  }
}

// Share
function shareScore(accuracy, topic) {
  const text = `I scored ${accuracy}% on ${topic === 'random' ? 'a mixed' : topic} coding quiz on CodeQuest! 🎮💻`;

  if (navigator.share) {
    navigator.share({ text }).catch(() => { });
  } else {
    navigator.clipboard.writeText(text).then(() => {
      snackbar.success('Score copied to clipboard!');
    });
  }
}

// Utility
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Initialize App
function init() {
  logger.info('CodeQuest App initializing...');

  // Apply saved theme
  const settings = storage.getSettings();
  document.documentElement.setAttribute('data-theme', settings.theme || 'dark');

  // Check onboarding
  if (storage.isOnboardingComplete()) {
    state.currentScreen = 'home';
    // Update streak on app open
    gamification.updateStreak();
  }

  // Load cached questions
  const cached = storage.getCachedQuestions();
  if (cached) {
    state.allQuestions = cached;
    logger.info(`Loaded ${cached.length} cached questions`);
  }

  render();
  logger.success('App initialized successfully');
}

// Data Persistence
function exportData() {
  const data = {
    settings: storage.getSettings(),
    progress: storage.getUserProgress(),
    bookmarks: storage.getBookmarks(),
    completedLessons: storage.get('codequest_completed_lessons') || [],
    timestamp: Date.now()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `codequest_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  logger.success('Data exported successfully');
}

function importData(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      if (data.settings) storage.updateSettings(data.settings);
      if (data.progress) storage.saveUserProgress(data.progress);
      if (data.bookmarks) storage.saveBookmarks(data.bookmarks);
      if (data.completedLessons) storage.set('codequest_completed_lessons', data.completedLessons);

      logger.success('Data imported successfully! Reloading...');
      setTimeout(() => location.reload(), 1000);
    } catch (error) {
      logger.error('Failed to import data: ' + error.message);
      snackbar.error('Invalid backup file - Please check the file format');
    }
  };
  reader.readAsText(file);
}

function saveApiKeyFromInput() {
  const input = document.getElementById('api-key-input');
  if (input) {
    const key = input.value.trim();
    if (key) {
      storage.saveApiKey(key);
      snackbar.success('API Key saved! Using your custom quota now');
      logger.success('Custom API Key saved');
    } else {
      if (confirm('Clear custom API Key and use default?')) {
        storage.saveApiKey(null);
        snackbar.info('Custom key cleared - Using default if available');
      }
    }
  }
}

// Expose app methods to window for onclick handlers
window.app = {
  navigate,
  startQuiz,
  startLessonQuiz,
  selectAnswer,
  submitAnswer,
  skipQuestion,
  nextQuestion,
  quitQuiz,
  startDailyChallenge,
  setDifficulty,
  setQuestionCount,
  toggleBookmark,
  removeBookmark,
  practiceBookmarks,
  filterBookmarks: () => { },
  openLesson,
  completeLesson,
  checkLessonAnswer,
  showAllLessons,
  openSettings,
  closeSettings,
  toggleTheme,
  toggleTimer,
  resetProgress,
  toggleConsole,
  shareScore,
  exportData,
  importData,
  saveApiKeyFromInput,
  quizSettings: state.quizSettings
};

// Start the app
init();
