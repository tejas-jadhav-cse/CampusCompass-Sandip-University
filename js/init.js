(function () {
    try {
        const saved = localStorage.getItem("cc-theme");
        const isDark = saved === "dark";
        if (isDark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    } catch (e) { /* localStorage unavailable, default to light */ }

    try {
        const prefsRaw = localStorage.getItem("cc-preferences");
        const prefs = prefsRaw ? JSON.parse(prefsRaw) : {};
        if (prefs.language && typeof prefs.language === "string" && prefs.language.length >= 2) {
            document.documentElement.setAttribute("lang", prefs.language);
        }
    } catch (e) { /* localStorage unavailable, default to English */ }
})();

// Configure Tailwind CSS for class-based dark mode JIT compiling
window.tailwind = window.tailwind || {};
window.tailwind.config = { darkMode: "class" };
