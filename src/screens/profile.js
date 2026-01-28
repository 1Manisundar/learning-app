// Profile Screen

import { storage } from '../services/storage.js';
import { gamification } from '../services/gamification.js';

export function renderProfileScreen() {
  const stats = gamification.getStats();
  const settings = storage.getSettings();
  const weeklyData = gamification.getWeeklyAccuracy();

  // Calculate max for chart scaling
  const maxTotal = Math.max(...weeklyData.map(d => d.total), 1);

  return `
    <div class="screen" id="profile-screen">
      <header class="screen-header">
        <div class="flex justify-between items-center">
          <h1 class="screen-title">👤 Profile</h1>
          <button class="btn btn-secondary btn-sm" onclick="window.app.openSettings()">
            ⚙️
          </button>
        </div>
      </header>
      
      <div class="screen-content">
        <!-- User Level Card -->
        <div class="card mb-lg text-center" style="background: linear-gradient(135deg, var(--primary) 0%, var(--badge-purple) 100%); color: white;">
          <div style="font-size: 3rem; margin-bottom: var(--space-sm);">🎮</div>
          <h2 class="text-3xl font-extrabold">Level ${stats.currentLevel}</h2>
          <p style="opacity: 0.9;">${stats.totalXp} Total XP</p>
          
          <div class="mt-md" style="background: rgba(255,255,255,0.2); border-radius: var(--radius-full); padding: 4px;">
            <div style="background: white; height: 8px; border-radius: var(--radius-full); width: ${stats.levelProgress.percentage}%;"></div>
          </div>
          <p class="text-sm mt-xs" style="opacity: 0.8;">${stats.levelProgress.current}/${stats.levelProgress.required} XP to next level</p>
        </div>
        
        <!-- Stats Grid -->
        <div class="flex gap-sm mb-lg">
          <div class="stat-card flex-1">
            <span class="stat-value">${stats.currentStreak}</span>
            <span class="stat-label">🔥 Streak</span>
          </div>
          <div class="stat-card flex-1">
            <span class="stat-value">${stats.questionsAnswered}</span>
            <span class="stat-label">📝 Answered</span>
          </div>
          <div class="stat-card flex-1">
            <span class="stat-value">${stats.accuracy}%</span>
            <span class="stat-label">🎯 Accuracy</span>
          </div>
        </div>
        
        <!-- Weekly Chart -->
        <div class="card mb-lg">
          <h3 class="font-semibold mb-md">📊 Last 7 Days</h3>
          <div class="flex items-end justify-between gap-xs" style="height: 120px;">
            ${weeklyData.map(day => {
    const barHeight = day.total > 0 ? (day.total / maxTotal) * 100 : 5;
    const correctHeight = day.total > 0 ? (day.correct / day.total) * barHeight : 0;

    return `
                <div class="flex flex-col items-center gap-xs flex-1">
                  <div style="width: 100%; height: 100px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center;">
                    <div style="width: 80%; border-radius: var(--radius-sm) var(--radius-sm) 0 0; background: var(--bg-tertiary); height: ${barHeight}%; position: relative;">
                      <div style="position: absolute; bottom: 0; left: 0; right: 0; height: ${(correctHeight / barHeight) * 100}%; background: var(--success); border-radius: var(--radius-sm) var(--radius-sm) 0 0;"></div>
                    </div>
                  </div>
                  <span class="text-xs text-muted">${day.label}</span>
                  <span class="text-xs font-medium">${day.total > 0 ? day.accuracy + '%' : '-'}</span>
                </div>
              `;
  }).join('')}
          </div>
          <div class="flex items-center justify-center gap-lg mt-md text-sm text-muted">
            <span><span style="display: inline-block; width: 12px; height: 12px; background: var(--success); border-radius: 2px;"></span> Correct</span>
            <span><span style="display: inline-block; width: 12px; height: 12px; background: var(--bg-tertiary); border-radius: 2px;"></span> Total</span>
          </div>
        </div>
        
        <!-- Topic Breakdown -->
        <div class="card mb-lg">
          <h3 class="font-semibold mb-md">📚 Topic Progress</h3>
          ${Object.entries(stats.topicProgress).map(([topic, data]) => {
    const topicInfo = {
      angular: { icon: '🅰️', name: 'Angular' },
      javascript: { icon: '🟨', name: 'JavaScript' },
      java: { icon: '☕', name: 'Java' }
    };
    const info = topicInfo[topic] || { icon: '📚', name: topic };
    const accuracy = data.answered > 0 ? Math.round((data.correct / data.answered) * 100) : 0;

    return `
              <div class="flex items-center gap-md mb-md">
                <span style="font-size: 1.5rem;">${info.icon}</span>
                <div class="flex-1">
                  <div class="flex justify-between text-sm mb-xs">
                    <span class="font-medium">${info.name}</span>
                    <span class="text-muted">${data.correct}/${data.answered} correct</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill success" style="width: ${accuracy}%"></div>
                  </div>
                </div>
                <span class="font-semibold">${accuracy}%</span>
              </div>
            `;
  }).join('')}
        </div>
        
        <!-- Badges -->
        <div class="card mb-lg">
          <h3 class="font-semibold mb-md">🏆 Badges (${stats.badges.filter(b => b.unlocked).length}/${stats.badges.length})</h3>
          <div class="badge-grid">
            ${stats.badges.map(badge => `
              <div class="badge-item ${badge.unlocked ? 'unlocked' : 'locked'}" title="${badge.description}">
                <div class="badge-icon">${badge.icon}</div>
                <span class="badge-name">${badge.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderSettingsModal() {
  const settings = storage.getSettings();

  return `
    <div class="modal-overlay" onclick="window.app.closeSettings(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <h2 class="text-xl font-bold mb-lg">⚙️ Settings</h2>
        
        <div class="card mb-md">
          <h3 class="font-semibold mb-md">Preferences</h3>
          <div class="flex flex-col gap-md">
            <button class="btn btn-outline btn-block" onclick="window.app.toggleTheme()">
              🌓 Toggle Theme
            </button>
            <button class="btn btn-outline btn-block" onclick="window.app.toggleTimer()">
              ⏱️ Toggle Timer
            </button>
          </div>
        </div>

        <div class="card mb-md">
          <h3 class="font-semibold mb-sm">🔑 Custom API Key</h3>
          <p class="text-xs text-muted mb-sm">Get your free key at <a href="https://makersuite.google.com/app/apikey" target="_blank" style="color: var(--primary); text-decoration: underline;">Google AI Studio</a></p>
          <div class="flex gap-sm mb-xs">
            <input type="password" id="api-key-input" 
                   style="flex: 1; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-light); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px;"
                   placeholder="AIza..." 
                   value="${storage.getApiKey() || ''}">
            <button class="btn btn-primary" style="padding: 8px 16px;" onclick="window.app.saveApiKeyFromInput()">Save</button>
          </div>
          <p class="text-xs text-muted">💡 Prevents 429 errors completely</p>
        </div>

        <div class="card mb-md">
          <h3 class="font-semibold mb-md">Data Management</h3>
          <div class="flex gap-sm">
            <button class="btn btn-secondary flex-1" onclick="window.app.exportData()">
              📤 Export
            </button>
            <button class="btn btn-secondary flex-1" onclick="document.getElementById('import-file').click()">
              📥 Import
            </button>
            <input type="file" id="import-file" style="display: none" onchange="window.app.importData(this)">
          </div>
        </div>

        <div class="card mb-lg">
          <h3 class="font-semibold mb-md">🔥 Danger Zone</h3>
          <button class="btn btn-danger btn-block" onclick="window.app.resetProgress()">
            🗑️ Reset All Progress
          </button>
        </div>
        
        <button class="btn btn-primary btn-block" onclick="window.app.closeSettings()">
          Done
        </button>
      </div>
    </div>
  `;
}

export function initProfileScreen() {
  // Nothing special needed
}
