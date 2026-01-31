/**
 * Job Tracker Frontend Application
 * Connects to the Job Tracker API and provides a beautiful UI for tracking jobs
 */

// Configuration - Auto-detect environment
const API_BASE_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
    ? 'http://127.0.0.1:8000'  // Local development
    : 'https://job-tracker-itsu.onrender.com';  // Production

console.log('🎰 Resume Roulette - Environment:', window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' ? 'LOCAL' : 'PRODUCTION');
console.log('📡 API URL:', API_BASE_URL);

// State
let allJobs = [];
let currentFilter = 'all';
let currentLocationFilter = 'all';
let currentSearchKeyword = '';
let currentSort = 'newest';
let lastCheckTime = null;

// DOM Elements
const checkJobsBtn = document.getElementById('checkJobsBtn');
const loadingState = document.getElementById('loadingState');
const statusMessage = document.getElementById('statusMessage');
const jobsGrid = document.getElementById('jobsGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const companyFilter = document.getElementById('companyFilter');
const locationFilter = document.getElementById('locationFilter');
const sortBy = document.getElementById('sortBy');
const jobCount = document.getElementById('jobCount');
const jobsTitle = document.getElementById('jobsTitle');

// Stats elements
const totalSeen = document.getElementById('totalSeen');
const lastCheck = document.getElementById('lastCheck');
const totalFetched = document.getElementById('totalFetched');
const newJobsFound = document.getElementById('newJobsFound');
const companiesChecked = document.getElementById('companiesChecked');
const apiStatus = document.getElementById('apiStatus');
const apiStatusText = document.getElementById('apiStatusText');

/**
 * Initialize the application
 */
async function init() {
    console.log('Initializing Job Tracker...');

    // Check API status
    await checkAPIStatus();

    // Load statistics
    await loadStats();

    // Set up event listeners
    checkJobsBtn.addEventListener('click', handleCheckJobs);
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCheckJobs();
        }
    });
    companyFilter.addEventListener('change', handleFilterChange);
    locationFilter.addEventListener('change', handleLocationFilterChange);
    sortBy.addEventListener('change', handleSortChange);

    console.log('Job Tracker initialized');
}

/**
 * Check if API is online
 */
async function checkAPIStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/status`);
        const data = await response.json();

        if (data.status === 'online') {
            apiStatus.classList.add('online');
            apiStatusText.textContent = 'API Online';
            console.log('API is online:', data);
        }
    } catch (error) {
        console.error('API check failed:', error);
        apiStatus.classList.add('offline');
        apiStatusText.textContent = 'API Offline';
        showStatus('Unable to connect to API. Please check your connection.', 'error');
    }
}

/**
 * Load statistics from API
 */
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        const data = await response.json();

        if (data.status === 'success') {
            totalSeen.textContent = data.stats.total_jobs_seen.toLocaleString();
            console.log('Stats loaded:', data.stats);
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
        totalSeen.textContent = 'Error';
    }
}

/**
 * Handle check jobs button click
 */
async function handleCheckJobs() {
    console.log('Checking for new jobs...');

    // Disable button and show loading
    checkJobsBtn.disabled = true;
    loadingState.classList.add('active');
    statusMessage.className = 'status-message';

    try {
        const response = await fetch(`${API_BASE_URL}/check`);
        const data = await response.json();

        if (data.status === 'success') {
            console.log('Jobs fetched:', data);

            // Update stats
            totalFetched.textContent = data.summary.total_jobs_fetched.toLocaleString();
            newJobsFound.textContent = data.summary.new_jobs_found.toLocaleString();
            companiesChecked.textContent = data.summary.companies_checked.toLocaleString();

            // Update last check time
            lastCheckTime = new Date(data.timestamp);
            lastCheck.textContent = formatTimeAgo(lastCheckTime);

            // Store all active jobs
            if (data.all_jobs) {
                // Backend sent all active jobs (new behavior)
                allJobs = data.all_jobs;
            } else if (data.new_jobs && data.new_jobs.length > 0) {
                // Fallback for older backend (append logic)
                allJobs = [...data.new_jobs, ...allJobs];
            }

            // Update filters
            updateCompanyFilter();
            updateLocationFilter();

            // Display jobs
            displayJobs();

            // Reload overall stats
            await loadStats();

            // Show success message
            const message = data.summary.new_jobs_found > 0
                ? `Found ${data.summary.new_jobs_found} new job${data.summary.new_jobs_found === 1 ? '' : 's'}!`
                : 'No new jobs found. All jobs have been seen before.';
            showStatus(message, data.summary.new_jobs_found > 0 ? 'success' : 'info');

        } else {
            throw new Error(data.message || 'Failed to fetch jobs');
        }

    } catch (error) {
        console.error('Error checking jobs:', error);
        showStatus('Failed to check for jobs. Please try again.', 'error');
    } finally {
        loadingState.classList.remove('active');
        checkJobsBtn.disabled = false;
    }
}

/**
 * Update company filter dropdown with available companies
 */
function updateCompanyFilter() {
    const companies = [...new Set(allJobs.map(job => job.company))].sort();

    // Clear existing options except "All Companies"
    companyFilter.innerHTML = '<option value="all">All Companies</option>';

    // Add company options
    companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        companyFilter.appendChild(option);
    });
}

/**
 * Categorize location into a region/city
 */
function categorizeLocation(location) {
    const loc = location.toLowerCase();

    // Remote
    if (loc.includes('remote')) return 'Remote';

    // San Francisco Bay Area
    if (loc.includes('san francisco') || loc.includes('sf') ||
        loc.includes('bay area') || loc.includes('palo alto') ||
        loc.includes('mountain view') || loc.includes('menlo park') ||
        loc.includes('sunnyvale') || loc.includes('cupertino') ||
        loc.includes('san jose') || loc.includes('oakland') ||
        loc.includes('berkeley') || loc.includes('redwood city')) {
        return 'San Francisco Bay Area';
    }

    // New York
    if (loc.includes('new york') || loc.includes('nyc') ||
        loc.includes('manhattan') || loc.includes('brooklyn') ||
        loc.includes('queens')) {
        return 'New York';
    }

    // Los Angeles
    if (loc.includes('los angeles') || loc.includes('la') ||
        loc.includes('santa monica') || loc.includes('venice')) {
        return 'Los Angeles';
    }

    // Seattle
    if (loc.includes('seattle') || loc.includes('bellevue') ||
        loc.includes('redmond')) {
        return 'Seattle';
    }

    // Austin
    if (loc.includes('austin')) return 'Austin';

    // Denver
    if (loc.includes('denver') || loc.includes('boulder')) return 'Denver';

    // Boston
    if (loc.includes('boston') || loc.includes('cambridge')) return 'Boston';

    // Chicago
    if (loc.includes('chicago')) return 'Chicago';

    // Portland
    if (loc.includes('portland')) return 'Portland';

    // Atlanta
    if (loc.includes('atlanta')) return 'Atlanta';

    // Miami
    if (loc.includes('miami')) return 'Miami';

    // San Diego
    if (loc.includes('san diego')) return 'San Diego';

    // Phoenix
    if (loc.includes('phoenix')) return 'Phoenix';

    // Dallas
    if (loc.includes('dallas')) return 'Dallas';

    // Houston
    if (loc.includes('houston')) return 'Houston';

    // Nashville
    if (loc.includes('nashville')) return 'Nashville';

    // Philadelphia
    if (loc.includes('philadelphia')) return 'Philadelphia';

    // Default: return the original location
    return location;
}

/**
 * Update location filter dropdown with available locations
 */
function updateLocationFilter() {
    const locations = [...new Set(allJobs.map(job => categorizeLocation(job.location)))].sort();

    // Clear existing options except "All Locations"
    locationFilter.innerHTML = '<option value="all">All Locations</option>';

    // Add location options
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationFilter.appendChild(option);
    });
}

/**
 * Display jobs in the grid
 */
function displayJobs() {
    // Filter jobs by keyword search
    let filteredJobs = allJobs;
    if (currentSearchKeyword) {
        const keyword = currentSearchKeyword.toLowerCase();
        filteredJobs = filteredJobs.filter(job =>
            job.title.toLowerCase().includes(keyword)
        );
    }

    // Filter jobs by company
    if (currentFilter !== 'all') {
        filteredJobs = filteredJobs.filter(job => job.company === currentFilter);
    }

    // Filter jobs by location
    if (currentLocationFilter !== 'all') {
        filteredJobs = filteredJobs.filter(job =>
            categorizeLocation(job.location) === currentLocationFilter
        );
    }

    // Sort jobs
    filteredJobs = sortJobs(filteredJobs);

    // Update job count
    jobCount.textContent = `${filteredJobs.length} job${filteredJobs.length === 1 ? '' : 's'}`;

    // Update title
    if (filteredJobs.length > 0) {
        let title = 'New Jobs';
        if (currentSearchKeyword) {
            title = `"${currentSearchKeyword}" Jobs`;
            if (currentFilter !== 'all') title += ` at ${currentFilter}`;
            if (currentLocationFilter !== 'all') title += ` in ${currentLocationFilter}`;
        } else if (currentFilter !== 'all' && currentLocationFilter !== 'all') {
            title = `${currentFilter} Jobs in ${currentLocationFilter}`;
        } else if (currentFilter !== 'all') {
            title = `${currentFilter} Jobs`;
        } else if (currentLocationFilter !== 'all') {
            title = `Jobs in ${currentLocationFilter}`;
        }
        jobsTitle.textContent = title;
    }

    // Clear grid
    jobsGrid.innerHTML = '';

    // Show/hide empty state
    if (filteredJobs.length === 0) {
        emptyState.classList.add('active');
        jobsGrid.style.display = 'none';

        // Update empty state message based on context
        const emptyIcon = emptyState.querySelector('.empty-icon');
        const emptyTitle = emptyState.querySelector('h3');
        const emptyText = emptyState.querySelector('p');

        if (allJobs.length === 0) {
            // No jobs loaded at all
            emptyIcon.textContent = '🎲';
            emptyTitle.textContent = 'The Wheel Awaits...';
            emptyText.textContent = 'Click "Spin the Wheel" to discover which companies will ghost you today!';
        } else if (currentSearchKeyword) {
            // Jobs loaded but search returned nothing
            emptyIcon.textContent = '🔍';
            emptyTitle.textContent = 'No Matching Jobs';
            emptyText.textContent = `No jobs found matching "${currentSearchKeyword}". Try a different keyword or clear the search.`;
        } else {
            // Jobs loaded but filters returned nothing
            emptyIcon.textContent = '🎯';
            emptyTitle.textContent = 'No Jobs Match Filters';
            emptyText.textContent = 'Try adjusting your company or location filters.';
        }
    } else {
        emptyState.classList.remove('active');
        jobsGrid.style.display = 'grid';

        // Create job cards
        filteredJobs.forEach(job => {
            const card = createJobCard(job);
            jobsGrid.appendChild(card);
        });
    }
}

/**
 * Create a job card element
 */
function createJobCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card new-job';

    card.innerHTML = `
        <div class="job-header">
            <div>
                <h3 class="job-title">${escapeHtml(job.title)}</h3>
                <div class="job-company">${escapeHtml(job.company)}</div>
                <div class="job-location">📍 ${escapeHtml(job.location)}</div>
            </div>
            <span class="job-badge">New</span>
        </div>
        <div class="job-footer">
            <span class="job-source">${escapeHtml(job.source)}</span>
            <a href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" class="job-link">
                View Job →
            </a>
        </div>
    `;

    // Add click handler to open job
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('job-link')) {
            window.open(job.url, '_blank', 'noopener,noreferrer');
        }
    });

    return card;
}

/**
 * Sort jobs based on current sort option
 */
function sortJobs(jobs) {
    const sorted = [...jobs];

    switch (currentSort) {
        case 'newest':
            // Jobs are already in newest first order from API
            return sorted;
        case 'company':
            return sorted.sort((a, b) => a.company.localeCompare(b.company));
        case 'location':
            return sorted.sort((a, b) => {
                const locA = categorizeLocation(a.location);
                const locB = categorizeLocation(b.location);
                return locA.localeCompare(locB);
            });
        default:
            return sorted;
    }
}

/**
 * Handle search input
 */
function handleSearchInput(e) {
    currentSearchKeyword = e.target.value.trim();
    console.log('Search keyword:', currentSearchKeyword);
    displayJobs();
}

/**
 * Handle company filter change
 */
function handleFilterChange(e) {
    currentFilter = e.target.value;
    console.log('Company filter changed to:', currentFilter);
    displayJobs();
}

/**
 * Handle location filter change
 */
function handleLocationFilterChange(e) {
    currentLocationFilter = e.target.value;
    console.log('Location filter changed to:', currentLocationFilter);
    displayJobs();
}

/**
 * Handle sort change
 */
function handleSortChange(e) {
    currentSort = e.target.value;
    console.log('Sort changed to:', currentSort);
    displayJobs();
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;

    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusMessage.className = 'status-message';
    }, 5000);
}

/**
 * Format time ago
 */
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Update "time ago" display every minute
 */
setInterval(() => {
    if (lastCheckTime) {
        lastCheck.textContent = formatTimeAgo(lastCheckTime);
    }
}, 60000);

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
