/**
 * SPA Router for Campus Connect
 * Intercepts sidebar clicks to fetch HTML without full page reload.
 */

(() => {
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
        let path = location.pathname;
        if (path === '/' || path === '/admin' || path === '/admin/') {
            path = '/dashboard.html';
        }
        navigateTo(path, false);
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
        
        // Extract the main content. We look for .page-content first so we don't destroy the header
        const newMain = doc.querySelector('.page-content') || doc.querySelector('.main-content');
        const currentMain = document.querySelector('.page-content') || document.querySelector('.main-content');
        
        if (newMain && currentMain) {
            // Replace the HTML
            currentMain.innerHTML = newMain.innerHTML;
            
            // Swap all modals
            document.querySelectorAll('.modal').forEach(m => m.remove());
            doc.querySelectorAll('.modal').forEach(m => {
                document.body.appendChild(m.cloneNode(true));
            });
            
            // Clean up old SPA injected styles
            document.head.querySelectorAll('style[data-spa-style="true"]').forEach(s => s.remove());
            
            // Inject new styles from the fetched document
            doc.head.querySelectorAll('style').forEach(s => {
                const newStyle = document.createElement('style');
                newStyle.textContent = s.textContent;
                newStyle.setAttribute('data-spa-style', 'true');
                document.head.appendChild(newStyle);
            });
            
            // Update the top-nav title if it exists
            const newTitle = doc.querySelector('.top-nav h2');
            const currentTitle = document.querySelector('.top-nav h2');
            if (newTitle && currentTitle) {
                currentTitle.textContent = newTitle.textContent;
            }
            
            // Re-execute scripts from the fetched document body
            // We avoid re-executing router.js, sidebar.js, theme.js, api.js to prevent duplicates/errors
            const newScripts = doc.querySelectorAll('script');
            newScripts.forEach(oldScript => {
                const src = oldScript.getAttribute('src');
                if (src && !src.includes('router.js') && !src.includes('sidebar.js') && !src.includes('theme.js') && !src.includes('api.js') && !src.includes('app.js')) {
                    const newScript = document.createElement('script');
                    newScript.src = src;
                    document.body.appendChild(newScript);
                } else if (!src) {
                    const newScript = document.createElement('script');
                    newScript.textContent = oldScript.textContent;
                    document.body.appendChild(newScript);
                }
            });
            
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
    // Normalize url for comparison
    const normalizedUrl = url.replace(/\/index\.html$/, '').replace(/\/$/, '');
    const page = url.split('/').pop();
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        const link = item.getAttribute('href');
        
        // Match exact or fallback to page
        if (link === normalizedUrl || link === page) {
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
    })();
}
