// LazySignal Frontend JavaScript

const API_BASE_URL = 'https://us-central1-lazysignal-prod.cloudfunctions.net';
const SNAPSHOT_ENDPOINT = `${API_BASE_URL}/snapshot`;
const SUBSCRIBE_ENDPOINT = `${API_BASE_URL}/subscribe`;

// DOM Elements
const userIdInput = document.getElementById('userId');
const loadSignalBtn = document.getElementById('loadSignalBtn');
const loadingDiv = document.getElementById('loading');
const signalContainer = document.getElementById('signalContainer');
const errorContainer = document.getElementById('errorContainer');
const retryBtn = document.getElementById('retryBtn');

// Subscription elements
const emailInput = document.getElementById('email');
const strategySelect = document.getElementById('strategySelect');
const customStrategySection = document.getElementById('customStrategySection');
const maPeriodInput = document.getElementById('maPeriod');
const sellThresholdInput = document.getElementById('sellThreshold');
const buyThresholdInput = document.getElementById('buyThreshold');
const subscribeBtn = document.getElementById('subscribeBtn');
const subscriptionStatus = document.getElementById('subscriptionStatus');

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

    // Subscription event listeners
    strategySelect.addEventListener('change', handleStrategyChange);
    subscribeBtn.addEventListener('click', handleSubscribe);
    emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSubscribe();
        }
    });
});

// Handle strategy selection change
function handleStrategyChange() {
    const selectedStrategy = strategySelect.value;
    
    if (selectedStrategy === 'custom') {
        customStrategySection.classList.remove('hidden');
        // Load current strategy parameters for customization
        loadCurrentStrategyParams();
    } else {
        customStrategySection.classList.add('hidden');
    }
}

// Load current strategy parameters for customization
function loadCurrentStrategyParams() {
    // Get current signal data to populate custom fields
    const currentData = getCurrentSignalData();
    if (currentData && currentData.strategy_params) {
        maPeriodInput.value = currentData.strategy_params.ma_period || 200;
        sellThresholdInput.value = ((1 - currentData.strategy_params.sell_threshold) * 100).toFixed(1);
        buyThresholdInput.value = ((currentData.strategy_params.buy_threshold - 1) * 100).toFixed(1);
    }
}

// Get current signal data (stored after last load)
let currentSignalData = null;

function getCurrentSignalData() {
    return currentSignalData;
}

// Handle subscription
async function handleSubscribe() {
    const email = emailInput.value.trim();
    const selectedStrategy = strategySelect.value;
    
    if (!email) {
        showSubscriptionStatus('Please enter your email address.', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showSubscriptionStatus('Please enter a valid email address.', 'error');
        return;
    }
    
    // Show loading state
    subscribeBtn.disabled = true;
    subscribeBtn.textContent = 'Subscribing...';
    
    try {
        // Prepare subscription data
        const subscriptionData = {
            email: email,
            strategy: selectedStrategy,
            strategy_params: {}
        };
        
        // Add custom strategy parameters if selected
        if (selectedStrategy === 'custom') {
            subscriptionData.strategy_params = {
                ma_period: parseInt(maPeriodInput.value),
                sell_threshold: 1 - (parseFloat(sellThresholdInput.value) / 100),
                buy_threshold: 1 + (parseFloat(buyThresholdInput.value) / 100),
                data_field: 'GSPC'
            };
        }
        
        // Send subscription request
        const response = await fetch(SUBSCRIBE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscriptionData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Generate user ID from email for future use
        const userId = generateUserId(email);
        
        showSubscriptionStatus(`Successfully subscribed! Your user ID is: ${userId}`, 'success');
        
        // Update user ID field
        userIdInput.value = userId;
        
        // Load personalized signal
        loadSignal();
        
    } catch (error) {
        console.error('Subscription error:', error);
        showSubscriptionStatus('Failed to subscribe. Please try again.', 'error');
    } finally {
        subscribeBtn.disabled = false;
        subscribeBtn.textContent = 'Subscribe to Alerts';
    }
}

// Show subscription status message
function showSubscriptionStatus(message, type) {
    subscriptionStatus.textContent = message;
    subscriptionStatus.className = `status-message ${type}`;
    subscriptionStatus.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        subscriptionStatus.classList.add('hidden');
    }, 5000);
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Generate user ID from email
function generateUserId(email) {
    // Create a simple hash-like ID from email
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        const char = email.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return 'user_' + Math.abs(hash).toString(36);
}

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
        // Store current signal data for strategy customization
        currentSignalData = data;
        
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