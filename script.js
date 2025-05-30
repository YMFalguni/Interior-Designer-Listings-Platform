// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
// const API_BASE_URL = '/api';
const USE_LOCAL_DATA = false; // Changed to false to use backend API

// Fallback data for offline mode
const fallbackDesignersData = [
    {
        id: 1,
        name: "Sarah Johnson",
        title: "Senior Interior Designer",
        location: "Mumbai, India",
        description: "Specializing in modern residential spaces with a focus on sustainable materials and smart home integration.",
        tags: ["Modern", "Sustainable", "Smart Homes"],
        rating: 4.8,
        projects: 127,
        clients: 89,
        price: "₹2,500",
        priceUnit: "per sq ft",
        avatar: "SJ"
    },
    {
        id: 2,
        name: "Rajesh Patel",
        title: "Luxury Space Designer",
        location: "Delhi, India",
        description: "Expert in creating luxurious commercial and residential spaces with attention to detail and premium finishes.",
        tags: ["Luxury", "Commercial", "Premium"],
        rating: 4.9,
        projects: 203,
        clients: 156,
        price: "₹3,800",
        priceUnit: "per sq ft",
        avatar: "RP"
    },
    {
        id: 3,
        name: "Priya Sharma",
        title: "Minimalist Design Expert",
        location: "Bangalore, India",
        description: "Creating clean, functional spaces that maximize natural light and promote wellness through thoughtful design.",
        tags: ["Minimalist", "Wellness", "Natural Light"],
        rating: 4.7,
        projects: 98,
        clients: 67,
        price: "₹2,200",
        priceUnit: "per sq ft",
        avatar: "PS"
    },
    {
        id: 4,
        name: "Arjun Menon",
        title: "Traditional Architect",
        location: "Kochi, India",
        description: "Blending traditional Indian architecture with contemporary functionality for timeless living spaces.",
        tags: ["Traditional", "Architecture", "Cultural"],
        rating: 4.6,
        projects: 156,
        clients: 112,
        price: "₹2,800",
        priceUnit: "per sq ft",
        avatar: "AM"
    },
    {
        id: 5,
        name: "Kavya Reddy",
        title: "Sustainable Designer",
        location: "Hyderabad, India",
        description: "Passionate about eco-friendly designs using recycled materials and energy-efficient solutions.",
        tags: ["Sustainable", "Eco-friendly", "Energy Efficient"],
        rating: 4.8,
        projects: 134,
        clients: 98,
        price: "₹2,600",
        priceUnit: "per sq ft",
        avatar: "KR"
    }
];

// State management
let shortlistedItems = new Set();
let currentFilter = 'all';
let currentTagFilter = '';
let allDesigners = [];
let currentUserId = 'default_user'; // In production, get from authentication

// DOM elements
const listingsContainer = document.getElementById('listings');
const loadingElement = document.getElementById('loading');
const shortlistedFilter = document.getElementById('shortlistedFilter');
const allFilter = document.getElementById('allFilter');
const searchInput = document.querySelector('.search-input');

// Initialize the app
async function init() {
    showLoading();
    await loadDesigners();
    await loadShortlistedItems();
    setupEventListeners();
    hideLoading();
}

// Show loading state
function showLoading() {
    loadingElement.style.display = 'block';
    loadingElement.innerHTML = 'Loading designers...';
}

// Hide loading state
function hideLoading() {
    loadingElement.style.display = 'none';
}

// Load designers data from backend
async function loadDesigners() {
    try {
        const response = await fetch(`${API_BASE_URL}/designers`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            allDesigners = data.data;
            console.log('Loaded designers from API:', allDesigners.length);
        } else {
            throw new Error(data.error || 'Failed to fetch designers');
        }
        
        renderDesigners(allDesigners);
        
    } catch (error) {
        console.error('Error loading designers from API:', error);
        
        // Fallback to local data if API fails
        console.log('Falling back to local data...');
        allDesigners = fallbackDesignersData;
        renderDesigners(allDesigners);
        
        // Show error message but continue with fallback data
        showError('Using offline data. Some features may be limited.');
    }
}

// Load shortlisted items from backend
async function loadShortlistedItems() {
    try {
        const response = await fetch(`${API_BASE_URL}/shortlist/${currentUserId}`);
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Convert array of designer objects to Set of IDs
                shortlistedItems = new Set(data.data.map(designer => designer.id));
                console.log('Loaded shortlisted items:', shortlistedItems.size);
            }
        } else {
            console.log('No existing shortlist found, starting fresh');
        }
        
    } catch (error) {
        console.error('Error loading shortlisted items:', error);
        // Try to load from session storage as fallback
        loadShortlistedItemsFromStorage();
    }
}

// Fallback: Load shortlisted items from session storage
function loadShortlistedItemsFromStorage() {
    try {
        const saved = sessionStorage.getItem('shortlistedDesigners');
        if (saved) {
            shortlistedItems = new Set(JSON.parse(saved));
            console.log('Loaded shortlisted items from storage:', shortlistedItems.size);
        }
    } catch (error) {
        console.error('Error loading shortlisted items from storage:', error);
        shortlistedItems = new Set();
    }
}

// Save shortlisted items to session storage (backup)
function saveShortlistedItemsToStorage() {
    try {
        sessionStorage.setItem('shortlistedDesigners', JSON.stringify([...shortlistedItems]));
    } catch (error) {
        console.error('Error saving shortlisted items to storage:', error);
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 12px; margin: 10px 20px; border-radius: 8px; font-size: 14px;">
            ⚠️ ${message}
        </div>
    `;
    
    const container = document.querySelector('.container');
    const header = container.querySelector('.header');
    container.insertBefore(errorDiv, header.nextSibling);
    
    // Remove error message after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Render designers
function renderDesigners(designers) {
    const filteredDesigners = filterDesigners(designers);
    
    if (filteredDesigners.length === 0) {
        listingsContainer.innerHTML = `
            <div class="empty-state">
                <h3>No designers found</h3>
                <p>Try adjusting your filters or search criteria.</p>
            </div>
        `;
        return;
    }

    listingsContainer.innerHTML = filteredDesigners.map(designer => `
        <div class="listing-card" data-id="${designer.id}">
            <div class="listing-header">
                <div class="designer-info">
                    <div class="designer-name">${designer.name}</div>
                    <div class="designer-title">${designer.title}</div>
                    <div class="rating">
                        ${generateStars(designer.rating)}
                        <span class="rating-text">${designer.rating}</span>
                    </div>
                    <div class="designer-location">📍 ${designer.location}</div>
                </div>
                <div class="designer-avatar">${designer.avatar}</div>
            </div>
            
            <div class="listing-content">
                <div class="designer-description">${designer.description}</div>
                <div class="designer-tags">
                    ${designer.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="designer-stats">
                    <div class="stat">💼 ${designer.projects} Projects</div>
                    <div class="stat">👥 ${designer.clients} Clients</div>
                </div>
            </div>
            
            <div class="listing-actions">
                <div class="action-buttons">
                    <button class="action-btn" title="Details" onclick="showDetails(${designer.id})">ℹ️</button>
                    <button class="action-btn" title="Hide" onclick="hideDesigner(${designer.id})">👁️</button>
                    <button class="action-btn shortlist-btn ${shortlistedItems.has(designer.id) ? 'shortlisted' : ''}" 
                            data-id="${designer.id}" title="Shortlist">
                        ${shortlistedItems.has(designer.id) ? '❤️' : '🤍'}
                    </button>
                    <button class="action-btn" title="Report" onclick="reportDesigner(${designer.id})">🚩</button>
                </div>
                <div class="price">
                    ${designer.price} <span class="price-unit">${designer.priceUnit}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Generate star rating
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<span class="star">⭐</span>';
    }
    
    if (halfStar) {
        stars += '<span class="star">⭐</span>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<span class="star empty">⭐</span>';
    }
    
    return stars;
}

// Filter designers based on current filters
function filterDesigners(designers) {
    let filtered = designers;
    
    // Apply shortlist filter
    if (currentFilter === 'shortlisted') {
        filtered = filtered.filter(designer => shortlistedItems.has(designer.id));
    }
    
    // Apply tag filter
    if (currentTagFilter) {
        filtered = filtered.filter(designer => 
            designer.tags.some(tag => tag.toLowerCase().includes(currentTagFilter.toLowerCase()))
        );
    }
    
    // Apply search filter
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        filtered = filtered.filter(designer => 
            designer.name.toLowerCase().includes(searchTerm) ||
            designer.title.toLowerCase().includes(searchTerm) ||
            designer.description.toLowerCase().includes(searchTerm) ||
            designer.location.toLowerCase().includes(searchTerm) ||
            designer.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }
    
    return filtered;
}

// Setup event listeners
function setupEventListeners() {
    // Shortlist filter toggle
    shortlistedFilter.addEventListener('click', () => {
        if (currentFilter === 'shortlisted') {
            currentFilter = 'all';
            shortlistedFilter.classList.remove('active');
            allFilter.classList.add('active');
        } else {
            currentFilter = 'shortlisted';
            shortlistedFilter.classList.add('active');
            allFilter.classList.remove('active');
            clearTagFilters();
        }
        renderDesigners(allDesigners);
    });

    // All filter
    allFilter.addEventListener('click', () => {
        currentFilter = 'all';
        allFilter.classList.add('active');
        shortlistedFilter.classList.remove('active');
        clearTagFilters();
        renderDesigners(allDesigners);
    });

    // Tag filters
    const tagButtons = document.querySelectorAll('.filter-btn[data-tag]');
    tagButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tag = button.dataset.tag;
            
            if (currentTagFilter === tag) {
                // Remove tag filter
                currentTagFilter = '';
                button.classList.remove('active');
            } else {
                // Apply tag filter
                clearTagFilters();
                currentTagFilter = tag;
                button.classList.add('active');
                
                // Reset to 'all' view when applying tag filter
                currentFilter = 'all';
                allFilter.classList.add('active');
                shortlistedFilter.classList.remove('active');
            }
            
            renderDesigners(allDesigners);
        });
    });

    // Shortlist button clicks (event delegation)
    listingsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('shortlist-btn')) {
            const designerId = parseInt(e.target.dataset.id);
            toggleShortlist(designerId, e.target);
        }
    });

    // Search functionality
    searchInput.addEventListener('input', debounce(() => {
        renderDesigners(allDesigners);
    }, 300));
}

// Clear tag filters
function clearTagFilters() {
    currentTagFilter = '';
    const tagButtons = document.querySelectorAll('.filter-btn[data-tag]');
    tagButtons.forEach(button => button.classList.remove('active'));
}

// Toggle shortlist status with backend integration
async function toggleShortlist(designerId, button) {
    const wasShortlisted = shortlistedItems.has(designerId);
    
    // Optimistic UI update
    const originalState = {
        wasShortlisted,
        buttonClass: button.className,
        buttonContent: button.innerHTML
    };
    
    // Update UI immediately
    if (wasShortlisted) {
        shortlistedItems.delete(designerId);
        button.classList.remove('shortlisted');
        button.innerHTML = '🤍';
    } else {
        shortlistedItems.add(designerId);
        button.classList.add('shortlisted');
        button.innerHTML = '❤️';
    }
    
    try {
        // Call backend API
        const response = await fetch(`${API_BASE_URL}/shortlist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                designer_id: designerId,
                action: wasShortlisted ? 'remove' : 'add',
                user_id: currentUserId
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to update shortlist');
        }
        
        console.log('Shortlist updated successfully:', data.message);
        
        // Save to session storage as backup
        saveShortlistedItemsToStorage();

        // If currently showing shortlisted items, re-render
        if (currentFilter === 'shortlisted') {
            renderDesigners(allDesigners);
        }
        
    } catch (error) {
        console.error('Error updating shortlist:', error);
        
        // Revert optimistic update on error
        if (originalState.wasShortlisted) {
            shortlistedItems.add(designerId);
        } else {
            shortlistedItems.delete(designerId);
        }
        button.className = originalState.buttonClass;
        button.innerHTML = originalState.buttonContent;
        
        // Show error to user
        showError('Failed to update shortlist. Please try again.');
    }
}

// Utility functions for other action buttons (placeholder implementations)
function showDetails(designerId) {
    const designer = allDesigners.find(d => d.id === designerId);
    if (designer) {
        alert(`Details for ${designer.name}\n${designer.description}\n\nProjects: ${designer.projects}\nClients: ${designer.clients}\nRating: ${designer.rating}/5`);
    }
}

function hideDesigner(designerId) {
    if (confirm('Are you sure you want to hide this designer?')) {
        const card = document.querySelector(`[data-id="${designerId}"]`);
        if (card) {
            card.style.display = 'none';
        }
    }
}

function reportDesigner(designerId) {
    const designer = allDesigners.find(d => d.id === designerId);
    if (designer && confirm(`Report ${designer.name} for inappropriate content?`)) {
        alert('Thank you for your report. We will review it shortly.');
    }
}

// Debounce utility function
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

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    init();
});