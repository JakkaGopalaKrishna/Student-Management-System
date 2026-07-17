/**
 * SPA Router for Campus Connect
 * Intercepts sidebar clicks to fetch HTML without full page reload.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Listen for all clicks
    document.body.addEventListener('click', e => {
        // Find if the clicked element or its parent has a data-link attribute
        const link = e.target.closest('[data-link]');
        if (link) {
            e.preventDefault();
            navigateTo(link.getAttribute('href'));
        }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        navigateTo(location.pathname.split('/').pop() || 'dashboard.html', false);
    });
});

async function navigateTo(url, pushState = true) {
    if (!url || url === '#') return;

    try {
        // Show loading state if necessary (optional)
        const mainContent = document.querySelector('.main-content') || document.querySelector('.page-content');
        if (mainContent) {
            mainContent.style.opacity = '0.5';
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const text = await response.text();
        
        // Parse the downloaded HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        
        // Extract the main content. We look for .main-content or .page-content
        const newMain = doc.querySelector('.main-content') || doc.querySelector('.page-content');
        const currentMain = document.querySelector('.main-content') || document.querySelector('.page-content');
        
        if (newMain && currentMain) {
            // Replace the HTML
            currentMain.innerHTML = newMain.innerHTML;
            
            // Re-execute any scripts inside the new content
            executeScripts(currentMain);
            
            // Update the URL bar
            if (pushState) {
                history.pushState(null, null, url);
            }
            
            // Update sidebar active state
            updateSidebarActiveState(url);
            
            // Reset opacity
            currentMain.style.opacity = '1';
        } else {
            // Fallback to normal navigation if layout is completely different
            window.location.href = url;
        }
    } catch (error) {
        console.error("Routing error:", error);
        // Fallback
        window.location.href = url;
    }
}

function updateSidebarActiveState(url) {
    const page = url.split('/').pop();
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        const link = item.getAttribute('href');
        if (link === page) {
            item.classList.add('active');
        }
    });
}

function executeScripts(container) {
    // Extract script tags and execute them so page logic still works
    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        if (oldScript.src) {
            // Ensure external scripts are fetched
            newScript.src = oldScript.src;
        } else {
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        }
        oldScript.parentNode.replaceChild(newScript, oldScript);
    });
}
