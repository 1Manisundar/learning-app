// Icon utility using Feather Icons
import feather from 'feather-icons';

class IconService {
    constructor() {
        this.defaultSize = 20;
    }

    /**
     * Get SVG icon HTML string
     * @param {string} name - Feather icon name
     * @param {number} size - Icon size in pixels
     * @param {string} color - Icon color (CSS color value)
     * @param {string} className - Additional CSS classes
     */
    get(name, size = this.defaultSize, color = 'currentColor', className = '') {
        if (!feather.icons[name]) {
            console.warn(`Icon "${name}" not found in Feather Icons`);
            return '';
        }

        return feather.icons[name].toSvg({
            width: size,
            height: size,
            color: color,
            class: className
        });
    }

    // Preset icons for common use cases
    navigation = {
        learn: () => this.get('book-open', 24),
        quiz: () => this.get('award', 24),
        bookmarks: () => this.get('bookmark', 24),
        profile: () => this.get('user', 24)
    };

    topics = {
        angular: () => this.get('triangle', 20, '#dd0031'),
        javascript: () => this.get('code', 20, '#f7df1e'),
        java: () => this.get('coffee', 20, '#007396')
    };

    stats = {
        streak: () => this.get('zap', 18, '#f59e0b'),
        answered: () => this.get('edit-3', 18),
        accuracy: () => this.get('target', 18),
        chart: () => this.get('bar-chart-2', 18),
        trophy: () => this.get('award', 18)
    };

    settings = {
        gear: () => this.get('settings', 20),
        theme: () => this.get('moon', 20),
        timer: () => this.get('clock', 20),
        key: () => this.get('key', 20),
        upload: () => this.get('upload', 20),
        download: () => this.get('download', 20),
        trash: () => this.get('trash-2', 20),
        lightbulb: () => this.get('lightbulb', 16)
    };

    quiz = {
        timer: () => this.get('clock', 18),
        share: () => this.get('share-2', 18),
        check: () => this.get('check-circle', 24, '#10b981'),
        x: () => this.get('x-circle', 24, '#ef4444'),
        info: () => this.get('info', 18)
    };

    actions = {
        close: () => this.get('x', 20),
        check: () => this.get('check', 20),
        plus: () => this.get('plus', 20),
        minus: () => this.get('minus', 20),
        chevronRight: () => this.get('chevron-right', 20),
        chevronLeft: () => this.get('chevron-left', 20)
    };
}

export const icons = new IconService();
