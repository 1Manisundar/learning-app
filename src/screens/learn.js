// Learning Screen

import { storage } from '../services/storage.js';
import { gemini } from '../services/gemini.js';
import { logger } from '../services/logger.js';

// Pre-defined lessons structure
const LESSONS = {
  angular: [
    // Introduction
    { id: 'ang-001', section: 'Introduction', title: 'What is Angular?', level: 1, duration: '5 min' },
    { id: 'ang-002', section: 'Introduction', title: 'Angular Versions & History', level: 1, duration: '5 min' },
    { id: 'ang-003', section: 'Introduction', title: 'Prerequisites & Setup', level: 1, duration: '10 min' },
    { id: 'ang-004', section: 'Introduction', title: 'Getting Started / Hello World', level: 1, duration: '15 min' },

    // Components
    { id: 'ang-101', section: 'Components', title: 'Introduction to Components', level: 1, duration: '10 min' },
    { id: 'ang-102', section: 'Components', title: 'Data Binding: Interpolation', level: 1, duration: '10 min' },
    { id: 'ang-103', section: 'Components', title: 'Property Binding', level: 1, duration: '10 min' },
    { id: 'ang-104', section: 'Components', title: 'Event Binding', level: 1, duration: '10 min' },
    { id: 'ang-105', section: 'Components', title: 'Two-way Binding & ngModel', level: 1, duration: '12 min' },
    { id: 'ang-106', section: 'Components', title: 'Input & Output Decorators', level: 2, duration: '15 min' },
    { id: 'ang-107', section: 'Components', title: 'ViewChild & ContentChild', level: 2, duration: '15 min' },

    // Directives
    { id: 'ang-201', section: 'Directives', title: 'ngIf & ngFor', level: 1, duration: '10 min' },
    { id: 'ang-202', section: 'Directives', title: 'ngSwitch & ngClass', level: 2, duration: '10 min' },
    { id: 'ang-203', section: 'Directives', title: 'Custom Directives', level: 3, duration: '15 min' },

    // Pipes
    { id: 'ang-301', section: 'Pipes', title: 'Built-in Pipes', level: 1, duration: '8 min' },
    { id: 'ang-302', section: 'Pipes', title: 'Custom Pipes', level: 2, duration: '12 min' },

    // Communication & Lifecycle
    { id: 'ang-401', section: 'Communication', title: 'Component Communication', level: 2, duration: '15 min' },
    { id: 'ang-402', section: 'Lifecycle', title: 'Lifecycle Hooks (ngOnInit, etc)', level: 3, duration: '15 min' },

    // Angular Forms
    { id: 'ang-501', section: 'Angular Forms', title: 'Template Driven Forms', level: 2, duration: '15 min' },
    { id: 'ang-502', section: 'Angular Forms', title: 'Reactive Forms Basics', level: 2, duration: '15 min' },
    { id: 'ang-503', section: 'Angular Forms', title: 'FormBuilder & Groups', level: 2, duration: '12 min' },
    { id: 'ang-504', section: 'Angular Forms', title: 'Form Validation', level: 2, duration: '15 min' },

    // Services & HTTP
    { id: 'ang-601', section: 'Services & DI', title: 'Services & Dependency Injection', level: 2, duration: '15 min' },
    { id: 'ang-602', section: 'HTTP', title: 'HTTP Client & Observables', level: 3, duration: '20 min' },
    { id: 'ang-603', section: 'HTTP', title: 'Interceptors', level: 3, duration: '10 min' },

    // Routing
    { id: 'ang-701', section: 'Routing', title: 'Angular Router Basics', level: 2, duration: '15 min' },
    { id: 'ang-702', section: 'Routing', title: 'Route Guards (CanActivate)', level: 3, duration: '12 min' },
    { id: 'ang-703', section: 'Routing', title: 'Lazy Loading Modules', level: 3, duration: '15 min' },

    // Advanced & Modules
    { id: 'ang-801', section: 'Modules', title: 'Angular Modules (NgModule)', level: 2, duration: '10 min' },
    { id: 'ang-802', section: 'Advanced', title: 'Observables & RxJS', level: 3, duration: '20 min' },
    { id: 'ang-803', section: 'Advanced', title: 'Building & Hosting', level: 2, duration: '10 min' }
  ],
  javascript: [
    // Prerequisites & Intro
    { id: 'js-001', section: 'Introduction', title: 'Before you begin & Audience', level: 1, duration: '5 min' },
    { id: 'js-002', section: 'Introduction', title: 'Prerequisites', level: 1, duration: '5 min' },
    { id: 'js-003', section: 'Introduction', title: 'Introduction to JavaScript', level: 1, duration: '10 min' },
    { id: 'js-004', section: 'Introduction', title: 'Getting Started', level: 1, duration: '15 min' },

    // Data Types
    { id: 'js-101', section: 'Data Types', title: 'Data Types Overview', level: 1, duration: '10 min' },
    { id: 'js-102', section: 'Data Types', title: 'String Data Type', level: 1, duration: '12 min' },
    { id: 'js-103', section: 'Data Types', title: 'Number Data Type', level: 1, duration: '10 min' },
    { id: 'js-104', section: 'Data Types', title: 'BigInt Data Type', level: 2, duration: '8 min' },
    { id: 'js-105', section: 'Data Types', title: 'Boolean Data Type', level: 1, duration: '5 min' },
    { id: 'js-106', section: 'Data Types', title: 'Special Data Types (null, undefined)', level: 1, duration: '8 min' },

    // Core Concepts
    { id: 'js-201', section: 'Core Concepts', title: 'JavaScript Operators', level: 1, duration: '15 min' },
    { id: 'js-202', section: 'Core Concepts', title: 'Flow Control Statements', level: 1, duration: '15 min' },

    // Structures
    { id: 'js-301', section: 'Structures', title: 'Arrays', level: 2, duration: '20 min' },
    { id: 'js-302', section: 'Structures', title: 'Functions', level: 2, duration: '20 min' },
    { id: 'js-303', section: 'Structures', title: 'Objects', level: 2, duration: '20 min' },

    // Advanced & OOP
    { id: 'js-401', section: 'Advanced', title: 'Scope, Scope Chain & Closure', level: 3, duration: '25 min' },
    { id: 'js-402', section: 'Advanced', title: 'Prototypes & Inheritance', level: 3, duration: '20 min' },

    // References & Misc
    { id: 'js-501', section: 'References', title: 'Operators Structure Reference', level: 2, duration: '10 min' },
    { id: 'js-502', section: 'References', title: 'References & Memory', level: 3, duration: '15 min' }
  ],
  java: [
    { id: 'java-1', title: 'Java Basics', level: 1, duration: '5 min' },
    { id: 'java-2', title: 'OOP Concepts', level: 1, duration: '12 min' },
    { id: 'java-3', title: 'Classes & Objects', level: 1, duration: '10 min' },
    { id: 'java-4', title: 'Inheritance', level: 2, duration: '12 min' },
    { id: 'java-5', title: 'Interfaces & Abstract Classes', level: 2, duration: '10 min' },
    { id: 'java-6', title: 'Collections Framework', level: 2, duration: '15 min' },
    { id: 'java-7', title: 'Exception Handling', level: 2, duration: '10 min' },
    { id: 'java-8', title: 'Generics', level: 3, duration: '12 min' },
    { id: 'java-9', title: 'Streams API', level: 3, duration: '15 min' },
    { id: 'java-10', title: 'Multithreading Basics', level: 3, duration: '15 min' }
  ]
};

export function renderLearnScreen() {
  const settings = storage.getSettings();
  const selectedTopics = settings.selectedTopics || ['angular', 'javascript', 'java'];
  const completedLessons = storage.get('codequest_completed_lessons') || [];

  const topicInfo = {
    angular: { icon: '🅰️', color: 'angular', name: 'Angular' },
    javascript: { icon: '🟨', color: 'javascript', name: 'JavaScript' },
    java: { icon: '☕', color: 'java', name: 'Java' }
  };

  return `
    <div class="screen" id="learn-screen">
      <header class="screen-header">
        <div class="flex items-center gap-md">
          <button class="btn btn-secondary btn-sm" onclick="window.app.navigate('home')">
            ← Back
          </button>
          <h1 class="screen-title">📚 Learn</h1>
        </div>
      </header>
      
      <div class="screen-content">
        <p class="text-secondary mb-lg">Choose a topic to start learning. Lessons are generated by AI!</p>
        
        ${selectedTopics.map(topic => {
    const info = topicInfo[topic];
    const lessons = LESSONS[topic] || [];
    const completedCount = lessons.filter(l => completedLessons.includes(l.id)).length;

    return `
            <div class="card mb-lg">
              <div class="flex items-center gap-md mb-md">
                <div class="topic-icon ${info.color}">${info.icon}</div>
                <div class="flex-1">
                  <h3 class="font-semibold">${info.name}</h3>
                  <p class="text-sm text-muted">${completedCount}/${lessons.length} lessons completed</p>
                </div>
              </div>
              
              <div class="progress-bar mb-md">
                <div class="progress-fill success" style="width: ${(completedCount / lessons.length) * 100}%"></div>
              </div>
              
              <div class="flex flex-col gap-sm">
                ${(() => {
        let lastSection = null;
        return lessons.map((lesson, index) => {
          const isCompleted = completedLessons.includes(lesson.id);
          // Unlocked if previous is completed OR it's the first lesson
          // But for structured curriculum, maybe we unlock by section? 
          // Let's keep sequential locking for "Mastery" path.
          // const isLocked = index > 0 && !completedLessons.includes(lessons[index - 1].id);
          // Actually, for better UX on dev, let's unlock all for now? No, strict mastery.
          const isLocked = index > 0 && !completedLessons.includes(lessons[index - 1].id);

          let sectionHeader = '';
          if (lesson.section && lesson.section !== lastSection) {
            lastSection = lesson.section;
            sectionHeader = `
                        <div class="section-header mt-sm mb-xs">
                          <h4 class="text-sm font-bold text-primary uppercase tracking-wider">${lesson.section}</h4>
                        </div>
                      `;
          }

          return `
                      ${sectionHeader}
                      <div class="lesson-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}" 
                           onclick="${!isLocked ? `window.app.openLesson('${topic}', '${lesson.id}', '${lesson.title}')` : ''}">
                        <div class="lesson-number">
                          ${isCompleted ? '✓' : isLocked ? '🔒' : index + 1}
                        </div>
                        <div class="lesson-content">
                          <h4 class="lesson-title">${lesson.title}</h4>
                          <p class="lesson-meta">
                            <span>Level ${lesson.level}</span> • 
                            <span>${lesson.duration}</span>
                          </p>
                        </div>
                      </div>
                    `;
        }).join('');
      })()}
              </div>
            </div>
          `;
  }).join('')}
      </div>
    </div>
  `;
}

export function renderLessonScreen(lesson, topic) {
  return `
    <div class="screen" id="lesson-screen">
      <header class="screen-header">
        <div class="flex items-center gap-md">
          <button class="btn btn-secondary btn-sm" onclick="window.app.navigate('learn')">
            ← Back
          </button>
          <h1 class="screen-title text-lg">${lesson.title}</h1>
        </div>
      </header>
      
      <div class="screen-content">
        <!-- Introduction -->
        <div class="card mb-md">
          <p class="text-secondary">${lesson.introduction}</p>
        </div>
        
        <!-- Sections -->
        ${lesson.sections.map(section => `
          <div class="card mb-md">
            <h3 class="font-semibold mb-sm">${section.heading}</h3>
            <p class="text-secondary mb-md">${section.content}</p>
            
            ${section.codeExample ? `
              <div class="code-block">
                <pre><code>${escapeHtml(section.codeExample)}</code></pre>
              </div>
            ` : ''}
          </div>
        `).join('')}
        
        <!-- Key Points -->
        <div class="card mb-md" style="background: rgba(37, 99, 235, 0.1); border-color: var(--primary);">
          <h3 class="font-semibold mb-sm">📌 Key Takeaways</h3>
          <ul style="list-style: disc; padding-left: var(--space-lg);">
            ${lesson.keyPoints.map(point => `
              <li class="text-secondary mb-xs">${point}</li>
            `).join('')}
          </ul>
        </div>
        
        <!-- Practice Questions -->
        ${lesson.practiceQuestions ? `
          <div class="card mb-md">
            <h3 class="font-semibold mb-md">🎯 Knowledge Check (${lesson.practiceQuestions.length} Questions)</h3>
            
            ${lesson.practiceQuestions.map((q, qIndex) => `
              <div class="mb-lg" id="practice-q-${qIndex}">
                <p class="mb-md font-medium">${qIndex + 1}. ${q.question}</p>
                <div class="options-list">
                  ${q.options.map((option, oIndex) => `
                    <button class="option-btn q-${qIndex}" onclick="window.app.checkLessonAnswer(${qIndex}, ${oIndex}, ${q.correctAnswer})">
                      <span class="option-letter">${String.fromCharCode(65 + oIndex)}</span>
                      <span>${option}</span>
                    </button>
                  `).join('')}
                </div>
                <!-- Explanation (Hidden initially) -->
                <div class="explanation-box mt-md hidden" id="explanation-${qIndex}">
                  <p class="font-semibold text-sm mb-xs">Explanation:</p>
                  <p class="text-sm text-secondary">${q.explanation}</p>
                </div>
              </div>
            `).join('<hr class="my-md" style="border:0; border-top:1px solid var(--border-light);">')}
          </div>
        ` : ''}
        
        <!-- Take Quiz Button (New Feature) -->
        <div class="card mb-md" style="background: linear-gradient(135deg, var(--badge-purple) 0%, var(--primary) 100%); color: white;">
          <h3 class="font-bold mb-sm">🎓 Mastery Check</h3>
          <p class="text-sm mb-md" style="opacity: 0.9;">Prove your knowledge with 10 questions on this specific topic.</p>
          <button class="btn btn-secondary btn-block" onclick="window.app.startLessonQuiz('${lesson.id || 'lesson'}', '${lesson.title}', '${topic}')">
            Take Quiz
          </button>
        </div>

        <!-- Complete Button -->
        <button class="btn btn-success btn-lg btn-block" onclick="window.app.completeLesson()">
          ✓ Complete Lesson
        </button>
      </div>
    </div>
  `;
}

export function renderLoadingLesson() {
  return `
    <div class="screen" id="lesson-loading">
      <div class="loading-screen">
        <div class="spinner"></div>
        <p class="text-secondary">Generating lesson with AI...</p>
        <p class="text-sm text-muted">This may take a few seconds</p>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function initLearnScreen() {
  // Re-highlight code blocks
  if (window.Prism) {
    setTimeout(() => {
      window.Prism.highlightAll();
    }, 100);
  }
}

export { LESSONS };
