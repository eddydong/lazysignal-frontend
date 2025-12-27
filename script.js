// LazySignal Frontend JavaScript

const API_BASE_URL = 'https://us-central1-lazysignal-prod.cloudfunctions.net';
const SNAPSHOT_ENDPOINT = `${API_BASE_URL}/snapshot`;

// DOM Elements
const userIdInput = document.getElementById('userId');
const loadSignalBtn = document.getElementById('loadSignalBtn');
const loadingDiv = document.getElementById('loading');
const signalContainer = document.getElementById('signalContainer');
const errorContainer = document.getElementById('errorContainer');
const retryBtn = document.getElementById('retryBtn');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Load default signal on page load
    loadSignal();

    // Set up event listeners
    loadSignalBtn.addEventListener('click', loadSignal);
    retryBtn.addEventListener('click', loadSignal);

    // Allow Enter key to trigger load
    userIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadSignal();
        }
    });
});

// Load signal from API
async function loadSignal() {
    const userId = userIdInput.value.trim();

    // Show loading state
    showLoading();

    try {
        // Build API URL
        let apiUrl = SNAPSHOT_ENDPOINT;
        if (userId) {
            apiUrl += `?user_id=${encodeURIComponent(userId)}`;
        }

        // Fetch data
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Display the data
        displaySignal(data);

    } catch (error) {
        console.error('Error loading signal:', error);
        showError(error.message);
    }
}

// Display signal data
function displaySignal(data) {
    try {
        // Update timestamp
        document.getElementById('timestamp').textContent = formatTimestamp(data.timestamp);

        // Update price
        document.getElementById('price').textContent = data.price.toFixed(2);

        // Update signal badge
        const signalBadge = document.getElementById('signalBadge');
        const signalText = document.querySelector('.signal-text');
        signalText.textContent = data.signal.action;

        // Remove existing classes
        signalBadge.classList.remove('buy', 'sell', 'hold');

        // Add appropriate class
        switch (data.signal.action.toLowerCase()) {
            case 'buy':
                signalBadge.classList.add('buy');
                break;
            case 'sell':
                signalBadge.classList.add('sell');
                break;
            case 'hold':
                signalBadge.classList.add('hold');
                break;
        }

        // Update signal details
        document.getElementById('position').textContent = data.signal.position;
        document.getElementById('reason').textContent = data.signal.reason;
        document.getElementById('distance').textContent = `${data.signal.distance_from_ma}%`;

        // Update moving averages
        updateMovingAverages(data.moving_averages);

        // Update strategy info if available
        if (data.strategy_params) {
            updateStrategyInfo(data.strategy_params);
        }

        // Show signal container
        hideLoading();
        hideError();
        signalContainer.classList.remove('hidden');

    } catch (error) {
        console.error('Error displaying signal:', error);
        showError('Error displaying data: ' + error.message);
    }
}

// Update moving averages display
function updateMovingAverages(mas) {
    const maGrid = document.getElementById('maGrid');
    maGrid.innerHTML = '';

    // Define the order we want to display
    const maOrder = ['ma5', 'ma10', 'ma25', 'ma50', 'ma100'];

    // Add primary MA (could be ma200, ma50, etc.)
    const primaryMA = Object.keys(mas).find(key => key.startsWith('ma') && key !== 'ma5' && key !== 'ma10' && key !== 'ma25' && key !== 'ma50' && key !== 'ma100');
    if (primaryMA) {
        maOrder.push(primaryMA);
    }

    maOrder.forEach(maKey => {
        if (mas[maKey] !== null && mas[maKey] !== undefined) {
            const maItem = document.createElement('div');
            maItem.className = 'ma-item';

            const period = maKey.replace('ma', '');
            const value = parseFloat(mas[maKey]).toFixed(2);

            maItem.innerHTML = `
                <div class="period">MA${period}</div>
                <div class="value">$${value}</div>
            `;

            maGrid.appendChild(maItem);
        }
    });
}

// Update strategy information
function updateStrategyInfo(params) {
    const strategyInfo = document.getElementById('strategyInfo');

    document.getElementById('strategyName').textContent = params.strategy_name || 'Custom Strategy';
    document.getElementById('maPeriod').textContent = params.ma_period || '--';
    document.getElementById('sellThreshold').textContent = params.sell_threshold ? `${(params.sell_threshold * 100).toFixed(1)}%` : '--';
    document.getElementById('buyThreshold').textContent = params.buy_threshold ? `${((params.buy_threshold - 1) * 100).toFixed(1)}%` : '--';

    strategyInfo.classList.remove('hidden');
}

// Format timestamp
function formatTimestamp(timestamp) {
    try {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
    } catch (error) {
        return timestamp || 'Unknown';
    }
}

// UI State Management
function showLoading() {
    loadingDiv.classList.remove('hidden');
    signalContainer.classList.add('hidden');
    errorContainer.classList.add('hidden');
}

function hideLoading() {
    loadingDiv.classList.add('hidden');
}

function showError(message) {
    document.getElementById('errorText').textContent = message;
    hideLoading();
    signalContainer.classList.add('hidden');
    errorContainer.classList.remove('hidden');
}

function hideError() {
    errorContainer.classList.add('hidden');
}

// Add some visual feedback for button clicks
loadSignalBtn.addEventListener('click', () => {
    loadSignalBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        loadSignalBtn.style.transform = 'scale(1)';
    }, 100);
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('Back online');
    // Could auto-retry if there was an error
});

window.addEventListener('offline', () => {
    console.log('Gone offline');
    showError('You appear to be offline. Please check your internet connection.');
});