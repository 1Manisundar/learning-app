// Splash/Onboarding Screen

import { storage } from '../services/storage.js';
import { snackbar } from '../services/snackbar.js';

export function renderSplashScreen(onComplete) {
  const slides = [
    {
      icon: '🚀',
      title: 'Learn & Quiz',
      description: 'Master Angular, JavaScript, and Java through interactive lessons and quizzes'
    },
    {
      icon: '🔥',
      title: 'Build Streaks',
      description: 'Practice daily to maintain your streak and earn bonus XP'
    },
    {
      icon: '🏆',
      title: 'Earn Badges',
      description: 'Unlock achievements and track your progress to become a coding pro'
    }
  ];

  return `
    <div class="splash-screen" id="splash-screen">
      <div class="splash-logo">💻</div>
      <h1 class="splash-title">CodeQuest</h1>
      <p class="splash-tagline">Learn. Quiz. Level Up.</p>
      
      <div class="onboarding-cards" id="onboarding-cards">
        ${slides.map((slide, index) => `
          <div class="onboarding-card" data-index="${index}">
            <div class="icon">${slide.icon}</div>
            <h3 class="font-semibold text-lg mb-sm">${slide.title}</h3>
            <p class="text-secondary text-sm">${slide.description}</p>
            ${slide.icon === '🔑' ? `
              <p class="text-xs text-muted mb-sm mt-md">Get it at <a href="https://makersuite.google.com/app/apikey" target="_blank" style="color: var(--primary); text-decoration: underline;">Google AI Studio</a></p>
              <input type="password" id="onboarding-api-key" 
                     style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-light); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; margin-bottom: 12px;"
                     placeholder="Paste your API key here...">
            ` : ''}
          </div>
        `).join('')}
      </div>
      
      <div class="dots-indicator" id="dots-indicator">
        ${slides.map((_, index) => `
          <div class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
        `).join('')}
      </div>
      
      <div class="topic-selection mt-lg" style="width: 100%; max-width: 300px;">
        <h3 class="text-center font-semibold mb-md">Choose your topics</h3>
        <div class="flex flex-col gap-sm">
          <label class="topic-checkbox flex items-center gap-md p-md" style="background: var(--surface-card); border-radius: var(--radius-md); cursor: pointer;">
            <input type="checkbox" id="topic-angular" checked style="width: 20px; height: 20px;">
            <span class="topic-icon angular">🅰️</span>
            <span class="font-medium">Angular</span>
          </label>
          <label class="topic-checkbox flex items-center gap-md p-md" style="background: var(--surface-card); border-radius: var(--radius-md); cursor: pointer;">
            <input type="checkbox" id="topic-javascript" checked style="width: 20px; height: 20px;">
            <span class="topic-icon javascript">🟨</span>
            <span class="font-medium">JavaScript</span>
          </label>
          <label class="topic-checkbox flex items-center gap-md p-md" style="background: var(--surface-card); border-radius: var(--radius-md); cursor: pointer;">
            <input type="checkbox" id="topic-java" checked style="width: 20px; height: 20px;">
            <span class="topic-icon java">☕</span>
            <span class="font-medium">Java</span>
          </label>
        </div>
      </div>
      
      <button class="btn btn-primary btn-lg btn-block mt-xl" id="get-started-btn" style="max-width: 300px;">
        Get Started 🚀
      </button>
    </div>
  `;
}

export function initSplashScreen(onComplete) {
  const cardsContainer = document.getElementById('onboarding-cards');
  const dotsContainer = document.getElementById('dots-indicator');
  const getStartedBtn = document.getElementById('get-started-btn');

  if (cardsContainer) {
    // Track scroll position for dots
    cardsContainer.addEventListener('scroll', () => {
      const scrollLeft = cardsContainer.scrollLeft;
      const cardWidth = cardsContainer.querySelector('.onboarding-card').offsetWidth + 16; // including gap
      const currentIndex = Math.round(scrollLeft / cardWidth);

      // Update dots
      dotsContainer.querySelectorAll('.dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
      });
    });
  }

  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
      // Save selected topics
      const selectedTopics = [];
      if (document.getElementById('topic-angular').checked) selectedTopics.push('angular');
      if (document.getElementById('topic-javascript').checked) selectedTopics.push('javascript');
      if (document.getElementById('topic-java').checked) selectedTopics.push('java');

      if (selectedTopics.length === 0) {
        snackbar.warning('⚠️ Please select at least one topic to continue');
        return;
      }

      // Save to settings
      storage.updateSettings({ selectedTopics });
      storage.completeOnboarding();

      // Animate out
      const splashScreen = document.getElementById('splash-screen');
      splashScreen.style.opacity = '0';
      splashScreen.style.transform = 'scale(0.95)';
      splashScreen.style.transition = 'all 0.3s ease';

      setTimeout(() => {
        if (onComplete) onComplete();
      }, 300);
    });
  }
}
