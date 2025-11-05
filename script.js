// Navigation configuration
const navConfig = [
    { 
        id: 'home',
        icon: '🏠',
        text: 'Home',
        url: 'index.html'
    },
    { 
        id: 'search',
        icon: '🔍',
        text: 'Search',
        url: 'search.html'
    },
    { 
        id: 'upload',
        icon: '➕',
        text: 'Upload',
        url: 'upload.html'
    },
    { 
        id: 'favourites',
        icon: '🩷',
        text: 'Favourites',
        url: 'favourites.html'
    },
    { 
        id: 'profile',
        icon: '👤',
        text: 'Profile',
        url: 'profile.html'
    }
];

// Initialize navigation
function initNavigation() {
    const bottomNav = document.getElementById('bottomNav');
    if (!bottomNav) return;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    navConfig.forEach(item => {
        const navItem = document.createElement('a');
        navItem.href = item.url;
        navItem.className = 'nav-item';
        navItem.id = `nav-${item.id}`;

        // Add active class if current page matches
        if (currentPage === item.url || 
            (currentPage === 'index.html' && item.id === 'home')) {
            navItem.classList.add('active');
        }

        navItem.innerHTML = `
            <span class="nav-icon">${item.icon}</span>
            <span class="nav-text">${item.text}</span>
        `;

        bottomNav.appendChild(navItem);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initNavigation);