document.addEventListener('DOMContentLoaded', () => {
    const htmlElement = document.documentElement;
    const announcer = document.getElementById('a11y-announcer');

    function announce(message) {
        if (!announcer) return;
        announcer.textContent = '';
        setTimeout(() => {
            announcer.textContent = message;
        }, 50);
    }

    // --- 1. Theme Logic ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const iconMoon = document.getElementById('icon-moon');
    const iconSun = document.getElementById('icon-sun');

    let savedTheme = 'dark';
    try {
        savedTheme = localStorage.getItem('tzi-theme') || 'dark';
    } catch (e) {}

    htmlElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            htmlElement.setAttribute('data-theme', newTheme);
            try {
                localStorage.setItem('tzi-theme', newTheme);
            } catch (e) {}
            updateThemeIcon(newTheme);
            announce(`Theme changed to ${newTheme}`);
        });
    }

    function updateThemeIcon(theme) {
        if (!iconMoon || !iconSun) return;
        if (theme === 'dark') {
            iconMoon.style.display = 'block';
            iconSun.style.display = 'none';
            if (themeToggleBtn) themeToggleBtn.setAttribute('aria-pressed', 'true');
        } else {
            iconMoon.style.display = 'none';
            iconSun.style.display = 'block';
            if (themeToggleBtn) themeToggleBtn.setAttribute('aria-pressed', 'false');
        }
    }

    // --- 2. Language Logic ---
    const langSelect = document.getElementById('lang-select');
    const supportedLangs = ['en', 'es', 'fr', 'pt', 'zh', 'he'];

    let savedLang = null;
    try {
        savedLang = localStorage.getItem('tzi-lang');
    } catch (e) {}

    if (!savedLang || !supportedLangs.includes(savedLang)) {
        const browserLang = (navigator.language || 'en').split('-')[0];
        savedLang = supportedLangs.includes(browserLang) ? browserLang : 'en';
    }

    if (langSelect) {
        langSelect.value = savedLang;
        langSelect.addEventListener('change', (e) => {
            const newLang = e.target.value;
            applyLanguage(newLang);
            try {
                localStorage.setItem('tzi-lang', newLang);
            } catch (err) {}
            announce(`Language changed to ${newLang}`);
        });
    }

    applyLanguage(savedLang);

    function applyLanguage(lang) {
        const dict = translations[lang] || translations.en;
        htmlElement.setAttribute('lang', lang);
        htmlElement.setAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');

        // Text content translation
        document.querySelectorAll('[data-i18n]').forEach((element) => {
            const key = element.getAttribute('data-i18n');
            if (dict[key]) {
                element.textContent = dict[key];
            }
        });

        // ARIA label translation
        document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
            const key = element.getAttribute('data-i18n-aria');
            if (dict[key]) {
                element.setAttribute('aria-label', dict[key]);
            }
        });

        // Dynamic SEO for all 6 languages
        if (dict.meta_title) {
            document.title = dict.meta_title;
            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle) ogTitle.setAttribute('content', dict.meta_title);
        }
        if (dict.meta_desc) {
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', dict.meta_desc);
            const ogDesc = document.querySelector('meta[property="og:description"]');
            if (ogDesc) ogDesc.setAttribute('content', dict.meta_desc);
        }
    }

    // --- 3. Footer Year ---
    const yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // --- 4. Mobile Menu ---
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');

    function setMobileMenuState(isOpen) {
        if (!navLinks || !mobileMenuBtn) return;
        navLinks.classList.toggle('active', isOpen);
        mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
        mobileMenuBtn.textContent = isOpen ? '✕' : '☰';
    }

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = !navLinks.classList.contains('active');
            setMobileMenuState(isOpen);
        });

        document.querySelectorAll('.nav-links a').forEach((link) => {
            link.addEventListener('click', () => {
                setMobileMenuState(false);
            });
        });
    }

    // --- 5. Accessibility Panel & Preferences ---
    const A11Y_STORAGE_KEY = 'tzi-a11y-prefs';
    const defaultA11y = {
        fontScale: '100',
        highContrast: false,
        readableFont: false,
        underlineLinks: false,
        reduceMotion: false
    };

    function loadA11yPrefs() {
        try {
            const raw = localStorage.getItem(A11Y_STORAGE_KEY);
            if (raw) {
                return { ...defaultA11y, ...JSON.parse(raw) };
            }
        } catch (e) {}
        return { ...defaultA11y };
    }

    let a11yPrefs = loadA11yPrefs();

    const a11yToggleBtn = document.getElementById('a11y-toggle');
    const a11yPanel = document.getElementById('a11y-panel');
    const fontBtns = document.querySelectorAll('[data-font-size]');
    const chkContrast = document.getElementById('a11y-high-contrast');
    const chkReadable = document.getElementById('a11y-readable-font');
    const chkUnderline = document.getElementById('a11y-underline-links');
    const chkMotion = document.getElementById('a11y-reduce-motion');
    const resetA11yBtn = document.getElementById('a11y-reset-btn');

    function applyA11yPrefs(prefs) {
        htmlElement.setAttribute('data-font-scale', prefs.fontScale || '100');
        htmlElement.toggleAttribute('data-high-contrast', Boolean(prefs.highContrast));
        htmlElement.toggleAttribute('data-readable-font', Boolean(prefs.readableFont));
        htmlElement.toggleAttribute('data-underline-links', Boolean(prefs.underlineLinks));
        htmlElement.toggleAttribute('data-reduce-motion', Boolean(prefs.reduceMotion));

        fontBtns.forEach((btn) => {
            const isMatch = btn.getAttribute('data-font-size') === String(prefs.fontScale);
            btn.classList.toggle('active', isMatch);
            btn.setAttribute('aria-pressed', String(isMatch));
        });

        if (chkContrast) chkContrast.checked = Boolean(prefs.highContrast);
        if (chkReadable) chkReadable.checked = Boolean(prefs.readableFont);
        if (chkUnderline) chkUnderline.checked = Boolean(prefs.underlineLinks);
        if (chkMotion) chkMotion.checked = Boolean(prefs.reduceMotion);

        try {
            localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs));
        } catch (e) {}
    }

    applyA11yPrefs(a11yPrefs);

    if (a11yToggleBtn && a11yPanel) {
        a11yToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = a11yPanel.hidden;
            a11yPanel.hidden = !isOpen;
            a11yToggleBtn.setAttribute('aria-expanded', String(isOpen));
        });

        a11yPanel.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    fontBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            a11yPrefs.fontScale = btn.getAttribute('data-font-size');
            applyA11yPrefs(a11yPrefs);
            announce(`Text size ${a11yPrefs.fontScale}%`);
        });
    });

    if (chkContrast) {
        chkContrast.addEventListener('change', (e) => {
            a11yPrefs.highContrast = e.target.checked;
            applyA11yPrefs(a11yPrefs);
            announce(`High contrast ${a11yPrefs.highContrast ? 'enabled' : 'disabled'}`);
        });
    }

    if (chkReadable) {
        chkReadable.addEventListener('change', (e) => {
            a11yPrefs.readableFont = e.target.checked;
            applyA11yPrefs(a11yPrefs);
            announce(`Readable font ${a11yPrefs.readableFont ? 'enabled' : 'disabled'}`);
        });
    }

    if (chkUnderline) {
        chkUnderline.addEventListener('change', (e) => {
            a11yPrefs.underlineLinks = e.target.checked;
            applyA11yPrefs(a11yPrefs);
            announce(`Underline links ${a11yPrefs.underlineLinks ? 'enabled' : 'disabled'}`);
        });
    }

    if (chkMotion) {
        chkMotion.addEventListener('change', (e) => {
            a11yPrefs.reduceMotion = e.target.checked;
            applyA11yPrefs(a11yPrefs);
            announce(`Reduced motion ${a11yPrefs.reduceMotion ? 'enabled' : 'disabled'}`);
        });
    }

    if (resetA11yBtn) {
        resetA11yBtn.addEventListener('click', () => {
            a11yPrefs = { ...defaultA11y };
            applyA11yPrefs(a11yPrefs);
            announce('Accessibility settings reset');
        });
    }

    // Global close on click outside or Escape key
    document.addEventListener('click', () => {
        setMobileMenuState(false);
        if (a11yPanel && !a11yPanel.hidden) {
            a11yPanel.hidden = true;
            if (a11yToggleBtn) a11yToggleBtn.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            setMobileMenuState(false);
            if (a11yPanel && !a11yPanel.hidden) {
                a11yPanel.hidden = true;
                if (a11yToggleBtn) {
                    a11yToggleBtn.setAttribute('aria-expanded', 'false');
                    a11yToggleBtn.focus();
                }
            }
        }
    });
});
