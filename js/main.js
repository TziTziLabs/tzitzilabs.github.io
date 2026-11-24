document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Theme Logic ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const iconMoon = document.getElementById('icon-moon');
    const iconSun = document.getElementById('icon-sun');
    const htmlElement = document.documentElement;

    const savedTheme = localStorage.getItem('tzi-theme') || 'dark';
    htmlElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('tzi-theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            iconMoon.style.display = 'block';
            iconSun.style.display = 'none';
        } else {
            iconMoon.style.display = 'none';
            iconSun.style.display = 'block';
        }
    }

    // --- 2. Language Logic ---
    const langSelect = document.getElementById('lang-select');
    
    let savedLang = localStorage.getItem('tzi-lang');
    if (!savedLang) {
        const browserLang = navigator.language.split('-')[0];
        savedLang = ['en', 'es', 'fr', 'pt', 'zh', 'he'].includes(browserLang) ? browserLang : 'en';
    }
    
    langSelect.value = savedLang;
    applyLanguage(savedLang);

    langSelect.addEventListener('change', (e) => {
        const newLang = e.target.value;
        applyLanguage(newLang);
        localStorage.setItem('tzi-lang', newLang);
    });

    function applyLanguage(lang) {
        htmlElement.setAttribute('lang', lang);
        if (lang === 'he') {
            htmlElement.setAttribute('dir', 'rtl');
        } else {
            htmlElement.setAttribute('dir', 'ltr');
        }

        const elementsToTranslate = document.querySelectorAll('[data-i18n]');
        elementsToTranslate.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                element.textContent = translations[lang][key];
            }
        });

        // SEO Dinámico
        const metaDesc = document.querySelector('meta[name="description"]');
        if (lang === 'es') {
            document.title = "Tzi Tzi Labs | Estudio de Videojuegos Indie";
            metaDesc.setAttribute('content', "Tzi Tzi Labs es un estudio indie enfocado en la experimentación, creatividad y experiencias interactivas.");
        } else if (lang === 'he') {
            document.title = "Tzi Tzi Labs | אולפן משחקי אינדי";
            metaDesc.setAttribute('content', "Tzi Tzi Labs הוא אולפן משחקי אינדי המתמקד בניסוי, יצירתיות וחוויות אינטראקטיביות.");
        } else {
            document.title = "Tzi Tzi Labs | Indie Game Studio";
            metaDesc.setAttribute('content', "Tzi Tzi Labs is an indie game studio focused on experimentation, creativity, and interactive experiences.");
        }
    }

    // --- 3. Footer Year ---
    document.getElementById('year').textContent = new Date().getFullYear();

    // --- 4. Mobile Menu ---
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
});
