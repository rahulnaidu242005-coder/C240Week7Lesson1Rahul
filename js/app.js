// ============================================
// ShoreSquad - Main Application Script
// Features: Maps, Weather, Events, Notifications
// Error Handling: Comprehensive try-catch blocks
// Loading States: Visual feedback for async operations
// ============================================

// ============================================
// STATE MANAGEMENT
// ============================================

const AppState = {
    events: [],
    userLocation: null,
    map: null,
    markers: [],
    selectedFilter: 'all',
    isDarkMode: false,
    isLoadingWeather: false,
    isLoadingEvents: false,
};

// Sample events data (will be replaced with API calls)
const MOCK_EVENTS = [
    {
        id: 1,
        name: 'Santa Monica Cleanup',
        location: 'Santa Monica Beach',
        date: '2024-12-10',
        time: '09:00',
        icon: '🌊',
        participants: 24,
        description: 'Join us for a morning cleanup at Santa Monica Beach!',
        lat: 34.0195,
        lng: -118.4912,
        category: 'beach',
    },
    {
        id: 2,
        name: 'Venice Beach Eco-Drive',
        location: 'Venice Beach',
        date: '2024-12-12',
        time: '10:00',
        icon: '🏖️',
        participants: 31,
        description: 'Weekend cleanup and ocean awareness event',
        lat: 33.9850,
        lng: -118.4695,
        category: 'beach',
    },
    {
        id: 3,
        name: 'Malibu Beach Revival',
        location: 'Malibu Beach',
        date: '2024-12-15',
        time: '08:00',
        icon: '🌅',
        participants: 18,
        description: 'Early morning cleanup before the crowds',
        lat: 34.0314,
        lng: -118.6819,
        category: 'beach',
    },
];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeApp();
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        showErrorMessage('Failed to initialize the application. Please refresh the page.');
    }
});

function initializeApp() {
    console.log('🚀 Initializing ShoreSquad...');

    try {
        // Initialize features
        setupNavigation();
        setupEventListeners();
        initializeMap();
        fetchWeatherData();
        loadEvents();
        checkDarkModePreference();

        console.log('✅ ShoreSquad initialized successfully');

        // Register service worker for PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('✅ Service Worker registered'))
                .catch(err => console.warn('⚠️ Service Worker registration failed:', err));
        }
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showErrorMessage('An error occurred during initialization. Some features may not work.');
    }
}

// ============================================
// NAVIGATION
// ============================================

function setupNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.setAttribute('aria-expanded', navMenu.classList.contains('active'));
        });

        // Close menu when a link is clicked
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Close menu on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navMenu.classList.remove('active');
        }
    });
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Buttons
    document.getElementById('createEventBtn')?.addEventListener('click', openEventModal);
    document.getElementById('exploreBtn')?.addEventListener('click', () => {
        document.getElementById('events-section').scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('locateBtn')?.addEventListener('click', getUserLocation);
    document.getElementById('filterBtn')?.addEventListener('click', toggleFilterPanel);
    document.getElementById('joinBtn')?.addEventListener('click', handleJoinMovement);
    document.getElementById('refreshWeatherBtn')?.addEventListener('click', fetchWeatherData);

    // Event filters
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            AppState.selectedFilter = e.target.dataset.filter;
            renderEvents();
        });
    });

    // Modal
    const eventModal = document.getElementById('eventModal');
    const modalClose = eventModal?.querySelector('.modal-close');
    const eventForm = document.getElementById('eventForm');

    modalClose?.addEventListener('click', closeEventModal);
    eventModal?.addEventListener('click', (e) => {
        if (e.target === eventModal) closeEventModal();
    });
    eventForm?.addEventListener('submit', handleEventFormSubmit);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeEventModal();
    });
}

// ============================================
// MAP FUNCTIONALITY
// ============================================

function initializeMap() {
    // Google Maps iframe is embedded directly in HTML
    // Pasir Ris cleanup location: 1.381497°N, 103.955574°E
    console.log('🗺️ Google Maps embedded for Pasir Ris Beach cleanup');
    
    // Get user location for reference
    getUserLocation();
}

function getUserLocation() {
    try {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        AppState.userLocation = { latitude, longitude };
                        console.log('✅ User location obtained:', { latitude, longitude });

                        showToast('📍 Location found!');
                    } catch (error) {
                        console.error('Error processing location:', error);
                        showErrorMessage('Failed to process your location.');
                    }
                },
                (error) => {
                    console.warn('⚠️ Geolocation error:', error.message);
                    const errorMap = {
                        1: 'Permission denied. Please enable location access.',
                        2: 'Location unavailable. Please try again.',
                        3: 'Location request timed out.'
                    };
                    showToast(errorMap[error.code] || 'Unable to get location.', 'warning');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        } else {
            showToast('Geolocation not supported in your browser', 'error');
        }
    } catch (error) {
        console.error('❌ Unexpected error in getUserLocation:', error);
        showErrorMessage('Failed to retrieve location.');
    }
}

function toggleFilterPanel() {
    showToast('Filter panel coming soon! 🔍');
}

function scrollToEvent(eventId) {
    const eventElement = document.querySelector(`[data-event-id="${eventId}"]`);
    eventElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ============================================
// WEATHER FUNCTIONALITY
// ============================================

function fetchWeatherData() {
    try {
        AppState.isLoadingWeather = true;

        // Fetch weather data from NEA API (Singapore)
        const NEA_API_URL = 'https://api.data.gov.sg/v1/environment/4-day-weather-forecast';
        
        // Set timeout for API request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        fetch(NEA_API_URL, { signal: controller.signal })
            .then(res => {
                clearTimeout(timeoutId);
                if (!res.ok) {
                    throw new Error(`API returned status ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                console.log('✅ NEA Weather Data received:', data);
                renderWeatherForecast(data);
                AppState.isLoadingWeather = false;
            })
            .catch(err => {
                clearTimeout(timeoutId);
                console.warn('⚠️ Weather API error:', err.message);
                console.log('📋 Using mock weather data');
                renderMockWeather();
                AppState.isLoadingWeather = false;
                
                if (err.name === 'AbortError') {
                    showToast('Weather data request timed out. Using demo data.', 'warning');
                }
            });
    } catch (error) {
        console.error('❌ Unexpected error in fetchWeatherData:', error);
        renderMockWeather();
        AppState.isLoadingWeather = false;
        showErrorMessage('Failed to load weather data.');
    }
}

function renderWeather(weatherData) {
    const weatherCards = document.getElementById('weatherCards');
    weatherCards.innerHTML = '';

    weatherData.forEach(weather => {
        const card = document.createElement('div');
        card.className = 'weather-card';
        card.innerHTML = `
            <div class="weather-icon">${weather.icon}</div>
            <div class="weather-location">${weather.location}</div>
            <div class="weather-temp">${weather.temp}°C</div>
            <div class="weather-description">${weather.description}</div>
            <div class="weather-condition" aria-label="Weather condition">${weather.condition}</div>
        `;
        weatherCards.appendChild(card);
    });
}

// ============================================
// WEATHER FORECAST RENDERING
// ============================================

function renderWeatherForecast(data) {
    const weatherCards = document.getElementById('weatherCards');
    weatherCards.innerHTML = '';

    if (!data.items || data.items.length === 0) {
        renderMockWeather();
        return;
    }

    // Get first 4 items from forecast
    const forecasts = data.items.slice(0, 4);
    
    forecasts.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'weather-card';
        
        const forecastDate = new Date(item.valid_period.start);
        const dayName = forecastDate.toLocaleDateString('en-SG', { weekday: 'short' });
        const dateStr = forecastDate.toLocaleDateString('en-SG', { month: 'short', day: 'numeric' });
        
        // Map weather condition to emoji
        const weatherIcon = getWeatherIcon(item.forecast);
        
        card.innerHTML = `
            <div class="weather-date">${dateStr}</div>
            <div class="weather-day">${dayName}</div>
            <div class="weather-icon">${weatherIcon}</div>
            <div class="weather-description">${item.forecast}</div>
            <div class="weather-temp-range">
                ${item.temperature.low}°C - ${item.temperature.high}°C
            </div>
            <div class="weather-humidity">
                💧 Humidity: ${item.relative_humidity.low}% - ${item.relative_humidity.high}%
            </div>
        `;
        
        weatherCards.appendChild(card);
    });
}

function getWeatherIcon(forecast) {
    // Map NEA weather conditions to emojis
    const forecastLower = forecast.toLowerCase();
    
    if (forecastLower.includes('rain')) return '🌧️';
    if (forecastLower.includes('thunderstorm')) return '⛈️';
    if (forecastLower.includes('cloudy') || forecastLower.includes('overcast')) return '☁️';
    if (forecastLower.includes('partly') || forecastLower.includes('fair')) return '⛅';
    if (forecastLower.includes('clear') || forecastLower.includes('sunny')) return '☀️';
    if (forecastLower.includes('windy')) return '💨';
    if (forecastLower.includes('haze')) return '😶';
    return '🌤️';
}

function renderMockWeather() {
    // Mock weather data for demonstration
    const mockData = [
        {
            date: new Date(),
            day: 'Today',
            temp: 28,
            range: '24°C - 32°C',
            forecast: 'Partly Cloudy',
            humidity: '60% - 80%',
            icon: '⛅',
        },
        {
            date: new Date(Date.now() + 86400000),
            day: 'Tomorrow',
            temp: 27,
            range: '23°C - 31°C',
            forecast: 'Light Rain',
            humidity: '65% - 85%',
            icon: '🌧️',
        },
        {
            date: new Date(Date.now() + 172800000),
            day: 'Day 3',
            temp: 26,
            range: '22°C - 30°C',
            forecast: 'Cloudy',
            humidity: '70% - 90%',
            icon: '☁️',
        },
        {
            date: new Date(Date.now() + 259200000),
            day: 'Day 4',
            temp: 29,
            range: '25°C - 33°C',
            forecast: 'Sunny',
            humidity: '50% - 70%',
            icon: '☀️',
        },
    ];

    const weatherCards = document.getElementById('weatherCards');
    weatherCards.innerHTML = '';

    mockData.forEach(weather => {
        const card = document.createElement('div');
        card.className = 'weather-card';
        const dateStr = weather.date.toLocaleDateString('en-SG', { month: 'short', day: 'numeric' });
        
        card.innerHTML = `
            <div class="weather-date">${dateStr}</div>
            <div class="weather-day">${weather.day}</div>
            <div class="weather-icon">${weather.icon}</div>
            <div class="weather-description">${weather.forecast}</div>
            <div class="weather-temp-range">${weather.range}</div>
            <div class="weather-humidity">💧 Humidity: ${weather.humidity}</div>
        `;
        weatherCards.appendChild(card);
    });
}

// ============================================
// EVENTS FUNCTIONALITY
// ============================================

function loadEvents() {
    AppState.events = MOCK_EVENTS;
    renderEvents();
}

function renderEvents() {
    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '';

    let filteredEvents = AppState.events;

    // Apply filter
    if (AppState.selectedFilter !== 'all') {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        filteredEvents = AppState.events.filter(event => {
            const eventDate = new Date(event.date);
            switch (AppState.selectedFilter) {
                case 'today':
                    return eventDate.toDateString() === today.toDateString();
                case 'week':
                    return eventDate <= nextWeek && eventDate >= today;
                case 'month':
                    return eventDate <= nextMonth && eventDate >= today;
                default:
                    return true;
            }
        });
    }

    if (filteredEvents.length === 0) {
        eventsList.innerHTML = '<p class="no-events">No events found. Create one to get started! 🌊</p>';
        return;
    }

    filteredEvents.forEach(event => {
        const card = createEventCard(event);
        eventsList.appendChild(card);
    });
}

function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.dataset.eventId = event.id;

    const daysUntil = Math.ceil(
        (new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24)
    );
    const urgencyBadge = daysUntil === 0 ? 'TODAY' : `${daysUntil}d`;

    card.innerHTML = `
        <div class="event-image">${event.icon}</div>
        <div class="event-content">
            <div class="event-header">
                <div class="event-name">${event.name}</div>
                <div class="event-location">📍 ${event.location}</div>
                <div class="event-meta">
                    <span>📅 ${event.date}</span>
                    <span>🕐 ${event.time}</span>
                </div>
            </div>
            <div class="event-footer">
                <div class="event-participants">${event.participants} volunteers interested</div>
                <button class="btn btn-primary" onclick="joinEvent(${event.id})" aria-label="Join ${event.name}">
                    Join Crew
                </button>
            </div>
        </div>
        <div class="event-badge">${urgencyBadge}</div>
    `;

    return card;
}

function joinEvent(eventId) {
    const event = AppState.events.find(e => e.id === eventId);
    if (event) {
        event.participants += 1;
        showToast(`✨ You joined "${event.name}"! Welcome to the crew!`);
        renderEvents();
        loadEventsOnMap();
    }
}

// ============================================
// MODAL FUNCTIONALITY
// ============================================

function openEventModal() {
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.getElementById('eventName')?.focus();
    }
}

function closeEventModal() {
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.getElementById('eventForm')?.reset();
    }
}

function handleEventFormSubmit(e) {
    e.preventDefault();

    try {
        const formData = new FormData(e.target);
        const eventName = formData.get('eventName')?.trim();
        const eventLocation = formData.get('eventLocation')?.trim();
        const eventDate = formData.get('eventDate');

        // Validation
        if (!eventName || eventName.length < 3) {
            showErrorMessage('Event name must be at least 3 characters long.');
            return;
        }

        if (!eventLocation || eventLocation.length < 3) {
            showErrorMessage('Event location must be at least 3 characters long.');
            return;
        }

        if (!eventDate) {
            showErrorMessage('Please select an event date.');
            return;
        }

        // Check if date is in future
        if (new Date(eventDate) < new Date()) {
            showErrorMessage('Event date must be in the future.');
            return;
        }

        const newEvent = {
            id: AppState.events.length + 1,
            name: eventName,
            location: eventLocation,
            date: eventDate,
            time: formData.get('eventTime'),
            icon: '🌊',
            participants: 1,
            description: formData.get('eventDescription')?.trim() || '',
            lat: AppState.userLocation?.latitude || 1.381497,
            lng: AppState.userLocation?.longitude || 103.955574,
            category: 'beach',
        };

        AppState.events.unshift(newEvent);
        renderEvents();
        closeEventModal();

        console.log('✅ Event created:', newEvent);
        showToast(`🎉 Event "${newEvent.name}" created successfully!`);
    } catch (error) {
        console.error('❌ Error creating event:', error);
        showErrorMessage('Failed to create event. Please try again.');
    }
}

// ============================================
// USER INTERACTIONS
// ============================================

function handleJoinMovement() {
    showToast('🌍 Thanks for joining the movement! Check out our events!', 'success');
    setTimeout(() => {
        document.getElementById('events-section').scrollIntoView({ behavior: 'smooth' });
    }, 500);
}

// ============================================
// NOTIFICATIONS
// ============================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast show`;
    toast.style.backgroundColor =
        type === 'error' ? '#E74C3C' :
        type === 'warning' ? '#FFB81C' :
        '#2ECC71';

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// DARK MODE
// ============================================

function checkDarkModePreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        AppState.isDarkMode = true;
        document.documentElement.style.colorScheme = 'dark';
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        AppState.isDarkMode = e.matches;
        document.documentElement.style.colorScheme = e.matches ? 'dark' : 'light';
    });
}

// ============================================
// PERFORMANCE OPTIMIZATION
// ============================================

// Lazy load images when they come into view
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
}

// Debounce function for window resize events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// SERVICE WORKER PLACEHOLDER
// ============================================

// Create basic service worker file
if ('serviceWorker' in navigator) {
    // Service worker will be loaded from sw.js
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Format date to readable string
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// ============================================
// CONSOLE MESSAGES
// ============================================

console.log('%c🌊 Welcome to ShoreSquad!', 'font-size: 20px; color: #0077BE; font-weight: bold;');
console.log('%cRally your crew, track weather, and hit the next beach cleanup!', 'font-size: 14px; color: #00A8E8;');

// ============================================
// ERROR HANDLING & USER FEEDBACK
// ============================================

/**
 * Show error message to user
 * @param {string} message - Error message to display
 * @param {number} duration - Duration to show message (ms)
 */
function showErrorMessage(message, duration = 5000) {
    try {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message show';
        errorDiv.innerHTML = `<strong>⚠️ Error:</strong> ${message}`;
        errorDiv.style.marginBottom = '1rem';

        const mainContent = document.querySelector('main') || document.querySelector('body');
        mainContent.insertBefore(errorDiv, mainContent.firstChild);

        setTimeout(() => {
            errorDiv.remove();
        }, duration);
    } catch (e) {
        console.error('Error displaying error message:', e);
    }
}

/**
 * Show success message to user
 * @param {string} message - Success message to display
 * @param {number} duration - Duration to show message (ms)
 */
function showSuccessMessage(message, duration = 3000) {
    try {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message show';
        successDiv.innerHTML = `<strong>✅ Success:</strong> ${message}`;
        successDiv.style.marginBottom = '1rem';

        const mainContent = document.querySelector('main') || document.querySelector('body');
        mainContent.insertBefore(successDiv, mainContent.firstChild);

        setTimeout(() => {
            successDiv.remove();
        }, duration);
    } catch (e) {
        console.error('Error displaying success message:', e);
    }
}

/**
 * Show loading overlay
 * @param {string} message - Loading message
 */
function showLoading(message = 'Loading...') {
    try {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-content">
                    <div class="spinner"></div>
                    <p>${message}</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        overlay.classList.add('active');
    } catch (e) {
        console.error('Error showing loading overlay:', e);
    }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    try {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    } catch (e) {
        console.error('Error hiding loading overlay:', e);
    }
}

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

window.addEventListener('error', (event) => {
    console.error('🔴 Global error:', event.error);
    if (event.error && event.error.message) {
        showErrorMessage(`An unexpected error occurred: ${event.error.message}`);
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🔴 Unhandled promise rejection:', event.reason);
    showErrorMessage('An unexpected error occurred. Please refresh the page.');
});
