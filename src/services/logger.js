// Error Console / Logger Service
// Captures and displays errors in a nice UI within the app

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
    this.isOpen = false;
    this.listeners = [];
  }

  log(type, message, data = null) {
    const entry = {
      id: Date.now() + Math.random(),
      type, // 'error', 'warning', 'info', 'success'
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    };
    
    this.logs.unshift(entry);
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    
    // Notify listeners
    this.listeners.forEach(fn => fn(entry));
    
    // Also log to browser console
    const consoleMethod = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log';
    console[consoleMethod](`[${type.toUpperCase()}]`, message, data || '');
    
    return entry;
  }

  error(message, data = null) {
    return this.log('error', message, data);
  }

  warning(message, data = null) {
    return this.log('warning', message, data);
  }

  info(message, data = null) {
    return this.log('info', message, data);
  }

  success(message, data = null) {
    return this.log('success', message, data);
  }

  getLogs() {
    return this.logs;
  }

  getErrorCount() {
    return this.logs.filter(l => l.type === 'error').length;
  }

  clear() {
    this.logs = [];
    this.listeners.forEach(fn => fn(null));
  }

  onLog(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== callback);
    };
  }

  toggle() {
    this.isOpen = !this.isOpen;
    return this.isOpen;
  }
}

// Create singleton instance
export const logger = new Logger();

// Render the error console UI
export function renderErrorConsole() {
  const logs = logger.getLogs();
  const isOpen = logger.isOpen;
  
  return `
    <div class="error-console ${isOpen ? 'open' : ''}" id="error-console">
      <div class="console-header">
        <div class="console-title">
          <span>🐛</span>
          <span>Dev Console</span>
          <span class="text-sm text-muted">(${logs.length} logs)</span>
        </div>
        <button class="console-close" onclick="window.app.toggleConsole()">✕</button>
      </div>
      <div class="log-list">
        ${logs.length === 0 ? `
          <div class="text-center text-muted p-lg">
            <p>No logs yet</p>
          </div>
        ` : logs.map(log => `
          <div class="log-item ${log.type}">
            <span class="log-time">${log.timestamp}</span>
            <div>${log.message}</div>
            ${log.data ? `<pre class="text-xs mt-sm">${JSON.stringify(log.data, null, 2)}</pre>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
