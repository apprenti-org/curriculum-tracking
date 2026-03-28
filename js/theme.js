/**
 * Theme toggle — shared across all pages
 * Persists via localStorage, synced between pages
 */
function initTheme() {
    const saved = localStorage.getItem('dashboard-theme');
    const theme = saved || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    updateToggleIcon(theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dashboard-theme', next);
    updateToggleIcon(next);
}

function updateToggleIcon(theme) {
    const el = document.getElementById('theme-toggle');
    if (!el) return;
    el.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
}

document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
initTheme();
