/**
 * Tzi Tzi Labs - Telemetry, Web Vitals & Analytics Engine
 * Tracks Core Web Vitals (FCP, LCP, CLS, DOM Load), user engagement,
 * section visibility, and CTA/social link conversions.
 * Automatically forwards events to Google Analytics (gtag) or Plausible if present.
 */
(function () {
    const STORAGE_KEY = 'tzi-metrics-v1';

    function loadStoredMetrics() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                return {
                    pageviews: Number(parsed.pageviews) || 0,
                    activeSeconds: Number(parsed.activeSeconds) || 0,
                    maxScrollDepth: Number(parsed.maxScrollDepth) || 0,
                    sectionsViewed: Array.isArray(parsed.sectionsViewed) ? parsed.sectionsViewed : ['hero'],
                    clicks: {
                        hero_cta: Number(parsed.clicks?.hero_cta) || 0,
                        itch: Number(parsed.clicks?.itch) || 0,
                        x: Number(parsed.clicks?.x) || 0,
                        instagram: Number(parsed.clicks?.instagram) || 0
                    },
                    lastUpdated: parsed.lastUpdated || new Date().toISOString()
                };
            }
        } catch (e) {
            // Fallback if localStorage is restricted
        }
        return {
            pageviews: 0,
            activeSeconds: 0,
            maxScrollDepth: 0,
            sectionsViewed: ['hero'],
            clicks: { hero_cta: 0, itch: 0, x: 0, instagram: 0 },
            lastUpdated: new Date().toISOString()
        };
    }

    const state = loadStoredMetrics();
    const vitals = {
        domLoad: null,
        fcp: null,
        lcp: null,
        cls: 0
    };

    function saveMetrics() {
        state.lastUpdated = new Date().toISOString();
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // Ignore storage errors
        }
    }

    function forwardExternalEvent(eventName, params = {}) {
        try {
            if (typeof window.gtag === 'function') {
                window.gtag('event', eventName, params);
            }
            if (typeof window.plausible === 'function') {
                window.plausible(eventName, { props: params });
            }
            if (window.goatcounter && typeof window.goatcounter.count === 'function') {
                window.goatcounter.count({
                    path: eventName,
                    title: JSON.stringify(params),
                    event: true
                });
            }
        } catch (err) {
            // Safe no-op
        }
    }

    // 1. Increment Pageview
    state.pageviews += 1;
    saveMetrics();
    forwardExternalEvent('page_view', { pageviews: state.pageviews });

    // 2. Measure Core Web Vitals & DOM Navigation Timing
    function measureNavigationTiming() {
        if (!window.performance) return;
        const navEntries = performance.getEntriesByType && performance.getEntriesByType('navigation');
        if (navEntries && navEntries.length > 0) {
            const nav = navEntries[0];
            const domTime = Math.round(nav.domContentLoadedEventEnd || nav.loadEventEnd || performance.now());
            if (domTime > 0) vitals.domLoad = domTime;
        } else if (performance.timing) {
            const t = performance.timing;
            if (t.domContentLoadedEventEnd && t.navigationStart) {
                vitals.domLoad = t.domContentLoadedEventEnd - t.navigationStart;
            }
        }
    }

    if ('PerformanceObserver' in window) {
        // First Contentful Paint (FCP)
        try {
            const paintObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name === 'first-contentful-paint') {
                        vitals.fcp = Math.round(entry.startTime);
                        updateDashboardUI();
                    }
                }
            });
            paintObserver.observe({ type: 'paint', buffered: true });
        } catch (e) {}

        // Largest Contentful Paint (LCP)
        try {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                if (lastEntry) {
                    vitals.lcp = Math.round(lastEntry.startTime);
                    updateDashboardUI();
                }
            });
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {}

        // Cumulative Layout Shift (CLS)
        try {
            const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        vitals.cls = Number((vitals.cls + entry.value).toFixed(4));
                        updateDashboardUI();
                    }
                }
            });
            clsObserver.observe({ type: 'layout-shift', buffered: true });
        } catch (e) {}
    }

    // 3. Track Scroll Depth
    function updateScrollDepth() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
        ) - window.innerHeight;

        const currentPct = docHeight <= 0 ? 100 : Math.min(100, Math.round((scrollTop / docHeight) * 100));
        if (currentPct > state.maxScrollDepth) {
            state.maxScrollDepth = currentPct;
            saveMetrics();
            updateDashboardUI();
        }
    }

    window.addEventListener('scroll', updateScrollDepth, { passive: true });

    // 4. Active Time Counter
    setInterval(() => {
        if (!document.hidden) {
            state.activeSeconds += 1;
            saveMetrics();
            const modal = document.getElementById('metrics-modal');
            if (modal && !modal.hidden) {
                updateDashboardUI();
            }
        }
    }, 1000);

    function formatDuration(totalSeconds) {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }

    // 5. Dashboard UI Rendering
    function updateDashboardUI() {
        const setEl = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setEl('metric-fcp', vitals.fcp !== null ? `${vitals.fcp} ms` : '< 100 ms');
        setEl('metric-lcp', vitals.lcp !== null ? `${vitals.lcp} ms` : (vitals.fcp !== null ? `${vitals.fcp} ms` : '< 150 ms'));
        setEl('metric-cls', vitals.cls.toFixed(3));
        setEl('metric-dom', vitals.domLoad !== null ? `${vitals.domLoad} ms` : `${Math.round(performance.now())} ms`);

        setEl('metric-pageviews', state.pageviews);
        setEl('metric-time', formatDuration(state.activeSeconds));
        setEl('metric-scroll', `${state.maxScrollDepth}%`);
        setEl('metric-sections', `${state.sectionsViewed.length} / 4`);

        setEl('metric-click-hero', state.clicks.hero_cta);
        setEl('metric-click-itch', state.clicks.itch);
        setEl('metric-click-x', state.clicks.x);
        setEl('metric-click-ig', state.clicks.instagram);
    }

    document.addEventListener('DOMContentLoaded', () => {
        measureNavigationTiming();
        updateScrollDepth();

        // Track Section Visibility via IntersectionObserver
        if ('IntersectionObserver' in window) {
            const sectionObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.target.id) {
                        const secId = entry.target.id;
                        if (!state.sectionsViewed.includes(secId)) {
                            state.sectionsViewed.push(secId);
                            saveMetrics();
                            forwardExternalEvent('section_view', { section: secId });
                            updateDashboardUI();
                        }
                    }
                });
            }, { threshold: 0.35 });

            ['hero', 'about', 'games', 'community'].forEach((id) => {
                const el = document.getElementById(id);
                if (el) sectionObserver.observe(el);
            });
        }

        // Track CTA and Social Clicks via [data-track]
        document.querySelectorAll('[data-track]').forEach((el) => {
            el.addEventListener('click', () => {
                const key = el.getAttribute('data-track');
                if (key && Object.prototype.hasOwnProperty.call(state.clicks, key)) {
                    state.clicks[key] += 1;
                    saveMetrics();
                    forwardExternalEvent('cta_click', { target: key, count: state.clicks[key] });
                    updateDashboardUI();
                }
            });
        });

        // Metrics Modal Controls
        const modal = document.getElementById('metrics-modal');
        const openBtns = document.querySelectorAll('[data-open-metrics]');
        const closeBtn = document.getElementById('metrics-close-btn');
        const exportBtn = document.getElementById('metrics-export-btn');
        const resetBtn = document.getElementById('metrics-reset-btn');
        let lastFocusedElement = null;

        function openMetricsModal() {
            if (!modal) return;
            lastFocusedElement = document.activeElement;
            measureNavigationTiming();
            updateDashboardUI();
            modal.hidden = false;
            modal.setAttribute('aria-hidden', 'false');
            if (closeBtn) closeBtn.focus();
        }

        function closeMetricsModal() {
            if (!modal || modal.hidden) return;
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
            if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
                lastFocusedElement.focus();
            }
        }

        openBtns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                openMetricsModal();
            });
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', closeMetricsModal);
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeMetricsModal();
                }
            });
        }

        // Keyboard Shortcut: Alt+M to toggle metrics, Escape to close
        document.addEventListener('keydown', (e) => {
            if (e.altKey && (e.key === 'm' || e.key === 'M')) {
                e.preventDefault();
                if (modal && modal.hidden) {
                    openMetricsModal();
                } else {
                    closeMetricsModal();
                }
            } else if (e.key === 'Escape' && modal && !modal.hidden) {
                closeMetricsModal();
            }
        });

        // Export JSON
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const payload = {
                    studio: 'Tzi Tzi Labs',
                    exportedAt: new Date().toISOString(),
                    language: document.documentElement.getAttribute('lang'),
                    theme: document.documentElement.getAttribute('data-theme'),
                    webVitals: vitals,
                    telemetry: state
                };
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'tzitzilabs-metrics.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }

        // Reset Metrics
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                state.pageviews = 1;
                state.activeSeconds = 0;
                state.maxScrollDepth = 0;
                state.sectionsViewed = ['hero'];
                state.clicks = { hero_cta: 0, itch: 0, x: 0, instagram: 0 };
                saveMetrics();
                updateScrollDepth();
                updateDashboardUI();
            });
        }

        updateDashboardUI();
    });

    // Expose public API for custom events
    window.TziMetrics = {
        getState: () => ({ ...state, vitals: { ...vitals } }),
        trackEvent: forwardExternalEvent
    };
})();
