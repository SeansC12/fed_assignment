// FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyDxw4nszjHYSWann1cuppWg0EGtaa-sjxs",
  authDomain: "fed-assignment-f1456.firebaseapp.com",
  projectId: "fed-assignment-f1456",
  storageBucket: "fed-assignment-f1456.firebasestorage.app",
  messagingSenderId: "646434763443",
  appId: "1:646434763443:web:40ca6ecd4edd45e2edf6c6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// GLOBAL VARIABLES
let map;
let hawkerCentersData = [];
let markers = [];
let markerLayer;
let currentHighlightedIndex = -1;

// DOM Elements (will be initialized after DOM loads)
let searchInput;
let searchSuggestions;
let clearButton;

// API endpoint for hawker centers data
const HAWKER_API_URL = './HawkerCentresGEOJSON.geojson';

// INITIALIZE MAP
function initializeMap() {
    try {
        // Create map centered on Singapore
        map = L.map('map').setView([1.3521, 103.8198], 12);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);

        // Create a layer group for markers
        markerLayer = L.layerGroup().addTo(map);
        
        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Error initializing map:', error);
        alert('Failed to initialize map. Please refresh the page.');
    }
}

// FETCH HAWKER CENTERS DATA
async function fetchHawkerCenters() {
    try {
        showLoading(true);
        console.log('Starting to fetch hawker centers data...');
        
        // Fetch the GeoJSON data directly from local file
        console.log('Fetching GeoJSON data from:', HAWKER_API_URL);
        
        const response = await fetch(HAWKER_API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const geojsonData = await response.json();
        console.log('GeoJSON data received:', geojsonData);
        
        // Filter for "Existing" and "Interim Centre" status only
        hawkerCentersData = geojsonData.features.filter(feature => {
            const status = feature.properties.STATUS;
            return status === 'Existing' || status === 'Interim Centre';
        });
        
        console.log(`Loaded ${hawkerCentersData.length} hawker centers (Existing and Interim Centre only)`);
        
        // Add markers to map
        addMarkersToMap();
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error fetching hawker centers:', error);
        showLoading(false);
        
        // Show more detailed error message
        const errorMsg = `Failed to load hawker centers data: ${error.message}. Please check your internet connection and refresh the page.`;
        alert(errorMsg);
        
        // Show error in the loading div
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.innerHTML = `
                <div class="error-content">
                    <p style="color: #dc2626; font-weight: 600;">Error Loading Data</p>
                    <p style="font-size: 0.875rem; color: #6b7280;">${error.message}</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
            loadingIndicator.classList.remove('hidden');
        }
    }
}

// ADD MARKERS TO MAP
function addMarkersToMap() {
    try {
        // Clear existing markers
        markerLayer.clearLayers();
        markers = [];
        
        console.log('Adding markers to map...');
        
        hawkerCentersData.forEach((feature, index) => {
            const { coordinates } = feature.geometry;
            const props = feature.properties;
            
            // Create custom icon based on status
            const customIcon = L.divIcon({
                className: 'custom-marker-wrapper',
                html: `<div class="custom-marker ${props.STATUS === 'Interim Centre' ? 'interim' : ''}"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
            
            // Create marker
            const marker = L.marker([coordinates[1], coordinates[0]], {
                icon: customIcon
            });
            
            // Create popup content
            const popupContent = createPopupContent(props);
            marker.bindPopup(popupContent);
            
            // Add marker to layer
            marker.addTo(markerLayer);
            markers.push({ marker, feature });
        });
        
        console.log(`Added ${markers.length} markers to map`);
    } catch (error) {
        console.error('Error adding markers:', error);
    }
}

// CREATE POPUP CONTENT
function createPopupContent(props) {
    const address = [
        props.ADDRESSBLOCKHOUSENUMBER,
        props.ADDRESSSTREETNAME,
        props.ADDRESSPOSTALCODE
    ].filter(Boolean).join(' ');
    
    const statusClass = props.STATUS === 'Interim Centre' ? 'interim' : 'existing';
    
    return `
        <div class="popup-content">
            <div class="popup-title">${props.NAME || 'Hawker Centre'}</div>
            <div class="popup-address">${address || 'Address not available'}</div>
            <div class="popup-status ${statusClass}">${props.STATUS}</div>
        </div>
    `;
}

// INITIALIZE SEARCH FUNCTIONALITY
function initializeSearch() {
    // Get DOM elements
    searchInput = document.getElementById('hawker-search');
    searchSuggestions = document.getElementById('search-suggestions');
    clearButton = document.getElementById('clear-search');
    
    if (!searchInput || !searchSuggestions || !clearButton) {
        console.error('Search elements not found in DOM');
        return;
    }
    
    console.log('Initializing search functionality...');
    
    // Search input event listener
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        if (query.length > 0) {
            clearButton.style.display = 'flex';
            showSuggestions(query);
        } else {
            clearButton.style.display = 'none';
            hideSuggestions();
        }
    });

    // Keyboard navigation for suggestions
    searchInput.addEventListener('keydown', (e) => {
        const suggestions = document.querySelectorAll('.suggestion-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentHighlightedIndex = Math.min(currentHighlightedIndex + 1, suggestions.length - 1);
            updateHighlight(suggestions);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentHighlightedIndex = Math.max(currentHighlightedIndex - 1, -1);
            updateHighlight(suggestions);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentHighlightedIndex >= 0 && suggestions[currentHighlightedIndex]) {
                suggestions[currentHighlightedIndex].click();
            }
        } else if (e.key === 'Escape') {
            hideSuggestions();
            searchInput.blur();
        }
    });

    // Clear button event listener
    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        clearButton.style.display = 'none';
        hideSuggestions();
        searchInput.focus();
        
        // Reset map view to Singapore
        if (map) {
            map.setView([1.3521, 103.8198], 12);
        }
    });

    // Click outside to close suggestions
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            hideSuggestions();
        }
    });
    
    console.log('Search functionality initialized');
}

// SHOW SUGGESTIONS
function showSuggestions(query) {
    if (!searchSuggestions || hawkerCentersData.length === 0) {
        return;
    }
    
    const lowerQuery = query.toLowerCase();
    
    // Filter hawker centers based on query
    const matches = hawkerCentersData.filter(feature => {
        const name = feature.properties.NAME || '';
        const address = feature.properties.ADDRESSSTREETNAME || '';
        return name.toLowerCase().includes(lowerQuery) || 
               address.toLowerCase().includes(lowerQuery);
    });
    
    // Sort matches: exact name matches first, then partial matches
    matches.sort((a, b) => {
        const nameA = (a.properties.NAME || '').toLowerCase();
        const nameB = (b.properties.NAME || '').toLowerCase();
        
        const aStartsWith = nameA.startsWith(lowerQuery);
        const bStartsWith = nameB.startsWith(lowerQuery);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return nameA.localeCompare(nameB);
    });
    
    // Limit to top 10 results
    const topMatches = matches.slice(0, 10);
    
    if (topMatches.length === 0) {
        searchSuggestions.innerHTML = '<div class="no-results">No hawker centers found</div>';
    } else {
        searchSuggestions.innerHTML = topMatches.map((feature, index) => {
            const props = feature.properties;
            const address = [
                props.ADDRESSBLOCKHOUSENUMBER,
                props.ADDRESSSTREETNAME
            ].filter(Boolean).join(' ');
            
            const statusClass = props.STATUS === 'Interim Centre' ? 'interim' : 'existing';
            
            return `
                <div class="suggestion-item" data-index="${hawkerCentersData.indexOf(feature)}">
                    <span class="suggestion-name">${props.NAME || 'Hawker Centre'}</span>
                    <span class="suggestion-address">${address || 'Address not available'}</span>
                    <span class="suggestion-status ${statusClass}">${props.STATUS}</span>
                </div>
            `;
        }).join('');
        
        // Add click listeners to suggestions
        document.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                selectHawkerCenter(index);
            });
        });
    }
    
    searchSuggestions.classList.add('active');
    currentHighlightedIndex = -1;
}

// HIDE SUGGESTIONS
function hideSuggestions() {
    if (searchSuggestions) {
        searchSuggestions.classList.remove('active');
    }
    currentHighlightedIndex = -1;
}

// UPDATE HIGHLIGHT
function updateHighlight(suggestions) {
    suggestions.forEach((item, index) => {
        if (index === currentHighlightedIndex) {
            item.classList.add('highlighted');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('highlighted');
        }
    });
}

// SELECT HAWKER CENTER
function selectHawkerCenter(index) {
    const feature = hawkerCentersData[index];
    const { coordinates } = feature.geometry;
    const props = feature.properties;
    
    // Update search input
    if (searchInput) {
        searchInput.value = props.NAME || 'Hawker Centre';
    }
    hideSuggestions();
    
    // Zoom to the selected hawker center
    if (map) {
        map.setView([coordinates[1], coordinates[0]], 17, {
            animate: true,
            duration: 1
        });
    }
    
    // Open the popup for the selected marker
    const markerObj = markers[index];
    if (markerObj && markerObj.marker) {
        setTimeout(() => {
            markerObj.marker.openPopup();
        }, 500);
    }
}

// LOADING INDICATOR
function showLoading(show) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        if (show) {
            loadingIndicator.classList.remove('hidden');
        } else {
            loadingIndicator.classList.add('hidden');
        }
    }
}

// OPTIONAL: LOG TO FIREBASE
async function logToFirebase(action, data) {
    try {
        await db.collection('hawker_map_logs').add({
            action: action,
            data: data,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error logging to Firebase:', error);
    }
}

// INITIALIZE ON PAGE LOAD
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing application...');
    
    // Initialize map first
    initializeMap();
    
    // Initialize search functionality
    initializeSearch();
    
    // Fetch hawker centers data
    fetchHawkerCenters();
});
