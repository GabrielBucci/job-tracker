/**
 * Job Tracker Frontend Application
 * Connects to the Job Tracker API and provides a beautiful UI for tracking jobs
 */

// Configuration
const API_BASE_URL = 'https://job-tracker-itsu.onrender.com';

// State
let allJobs = [];
let currentFilter = 'all';
let currentSort = 'newest';
let lastCheckTime = null;

// DOM Elements
const checkJobsBtn = document.getElementById('checkJobsBtn');
const loadingState = document.getElementById('loadingState');
const statusMessage = document.getElementById('statusMessage');
const jobsGrid = document.getElementById('jobsGrid');
const emptyState = document.getElementById('emptyState');
const companyFilter = document.getElementById('companyFilter');
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
    companyFilter.addEventListener('change', handleFilterChange);
    sortBy.addEventListener('change', handleSortChange);

    console.log('Job Tracker initialized');
}

/**
 * Check if API is online
 */
async function checkAPIStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/`);
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

            // Store jobs
            allJobs = data.new_jobs || [];

            // Update company filter
            updateCompanyFilter();

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
 * Display jobs in the grid
 */
function displayJobs() {
    // Filter jobs
    let filteredJobs = allJobs;
    if (currentFilter !== 'all') {
        filteredJobs = allJobs.filter(job => job.company === currentFilter);
    }

    // Sort jobs
    filteredJobs = sortJobs(filteredJobs);

    // Update job count
    jobCount.textContent = `${filteredJobs.length} job${filteredJobs.length === 1 ? '' : 's'}`;

    // Update title
    if (filteredJobs.length > 0) {
        jobsTitle.textContent = currentFilter === 'all' ? 'New Jobs' : `${currentFilter} Jobs`;
    }

    // Clear grid
    jobsGrid.innerHTML = '';

    // Show/hide empty state
    if (filteredJobs.length === 0) {
        emptyState.classList.add('active');
        jobsGrid.style.display = 'none';
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
        default:
            return sorted;
    }
}

/**
 * Handle filter change
 */
function handleFilterChange(e) {
    currentFilter = e.target.value;
    console.log('Filter changed to:', currentFilter);
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
