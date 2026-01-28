// Snackbar Notification Utility

class SnackbarService {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Create snackbar container
        this.container = document.createElement('div');
        this.container.id = 'snackbar-container';
        this.container.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 8px;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 3000) {
        const snackbar = document.createElement('div');
        snackbar.className = `snackbar snackbar-${type}`;
        snackbar.style.cssText = `
            background: var(--surface-elevated);
            color: var(--text-primary);
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-size: 14px;
            font-weight: 500;
            max-width: 400px;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
            pointer-events: auto;
            border-left: 4px solid ${this.getColor(type)};
        `;

        snackbar.textContent = message;
        this.container.appendChild(snackbar);

        // Trigger animation
        requestAnimationFrame(() => {
            snackbar.style.opacity = '1';
            snackbar.style.transform = 'translateY(0)';
        });

        // Auto remove
        setTimeout(() => {
            snackbar.style.opacity = '0';
            snackbar.style.transform = 'translateY(20px)';
            setTimeout(() => snackbar.remove(), 300);
        }, duration);
    }

    getColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }

    success(message, duration) {
        this.show(message, 'success', duration);
    }

    error(message, duration) {
        this.show(message, 'error', duration);
    }

    warning(message, duration) {
        this.show(message, 'warning', duration);
    }

    info(message, duration) {
        this.show(message, 'info', duration);
    }
}

export const snackbar = new SnackbarService();
