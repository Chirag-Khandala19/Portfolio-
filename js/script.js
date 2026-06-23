document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector("#siteHeader");
    const menuButton = document.querySelector(".menu-toggle");
    const navigation = document.querySelector(".main-nav");
    const navLinks = document.querySelectorAll(".main-nav a[href^='#']");
    const backToTop = document.querySelector(".back-to-top");
    const themeToggle = document.querySelector(".theme-toggle");
    const themeIcon = themeToggle?.querySelector("i");
    const themeMeta = document.querySelector("meta[name='theme-color']");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const darkScheme = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (theme) => {
        const isDark = theme === "dark";
        document.documentElement.dataset.theme = theme;
        themeMeta?.setAttribute("content", isDark ? "#111713" : "#f6f5f0");

        if (!themeToggle || !themeIcon) return;
        themeToggle.setAttribute("aria-pressed", String(isDark));
        themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
        themeIcon.className = isDark ? "bi bi-sun" : "bi bi-moon-stars";
    };

    const getSavedTheme = () => {
        try {
            return localStorage.getItem("portfolio-theme");
        } catch (error) {
            return null;
        }
    };

    const saveTheme = (theme) => {
        try {
            localStorage.setItem("portfolio-theme", theme);
        } catch (error) {}
    };

    applyTheme(getSavedTheme() || (darkScheme.matches ? "dark" : "light"));

    themeToggle?.addEventListener("click", () => {
        const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        saveTheme(nextTheme);
        applyTheme(nextTheme);
    });

    darkScheme.addEventListener("change", (event) => {
        if (getSavedTheme()) return;
        applyTheme(event.matches ? "dark" : "light");
    });

    const closeMenu = () => {
        menuButton.classList.remove("active");
        navigation.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation");
        document.body.classList.remove("menu-open");
    };

    menuButton.addEventListener("click", () => {
        const isOpen = navigation.classList.toggle("open");
        menuButton.classList.toggle("active", isOpen);
        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
        document.body.classList.toggle("menu-open", isOpen);
    });

    navLinks.forEach((link) => link.addEventListener("click", closeMenu));

    const updateScrollUI = () => {
        header.classList.toggle("scrolled", window.scrollY > 20);
        backToTop.classList.toggle("visible", window.scrollY > 550);
    };

    window.addEventListener("scroll", updateScrollUI, { passive: true });
    updateScrollUI();

    backToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            navLinks.forEach((link) => {
                link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
            });
        });
    }, { rootMargin: "-35% 0px -55%", threshold: 0 });

    document.querySelectorAll("main section[id]").forEach((section) => sectionObserver.observe(section));

    const animateCounter = (counter) => {
        const target = Number(counter.dataset.target);
        const suffix = counter.dataset.suffix || "";
        const duration = 1200;
        const start = performance.now();

        const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            counter.textContent = `${Math.floor(target * eased)}${suffix}`;
            if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    };

    const fetchLeetCodeSolvedCount = async (username) => {
        const endpoints = [
            {
                url: `https://alfa-leetcode-api.onrender.com/userProfile/${username}`,
                select: (data) => data.totalSolved,
            },
            {
                url: `https://leetcode-api-faisalshohag.vercel.app/${username}`,
                select: (data) => data.totalSolved,
            },
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint.url, { cache: "no-store" });
                if (!response.ok) continue;

                const data = await response.json();
                const solvedCount = Number(endpoint.select(data));
                if (Number.isFinite(solvedCount) && solvedCount > 0) return solvedCount;
            } catch (error) {
                // Public profile APIs can be slow or temporarily unavailable.
            }
        }

        return null;
    };

    const updateLeetCodeCounters = async () => {
        const leetcodeCounters = document.querySelectorAll(".leetcode-counter[data-leetcode-username]");
        await Promise.all(Array.from(leetcodeCounters, async (counter) => {
            const solvedCount = await fetchLeetCodeSolvedCount(counter.dataset.leetcodeUsername);
            if (solvedCount === null) return;

            counter.dataset.target = String(solvedCount);
            counter.textContent = `${solvedCount}${counter.dataset.suffix || ""}`;
        }));
    };

    const updateGitHubProjectCounters = async () => {
        const githubCounters = document.querySelectorAll(".github-project-counter[data-github-username]");
        await Promise.all(Array.from(githubCounters, async (counter) => {
            try {
                const response = await fetch(`https://api.github.com/users/${counter.dataset.githubUsername}`, { cache: "no-store" });
                if (!response.ok) return;

                const data = await response.json();
                const repoCount = Number(data.public_repos);
                if (!Number.isFinite(repoCount)) return;

                counter.dataset.target = String(repoCount);
                counter.textContent = `${repoCount}${counter.dataset.suffix || ""}`;
            } catch (error) {
                // Keep the local fallback if GitHub is unavailable.
            }
        }));
    };

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.dataset.animated = "true";
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.7 });

    document.querySelectorAll(".counter").forEach((counter) => counterObserver.observe(counter));
    updateLeetCodeCounters();
    updateGitHubProjectCounters();
});
