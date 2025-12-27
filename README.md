# LazySignal Frontend

A clean, modern web interface for the LazySignal trading signal system.

## 🚀 Features

- **Real-time Signals**: Display current BUY/SELL/HOLD signals from LazySignal API
- **Personalized Experience**: Enter user ID for custom strategy parameters
- **Moving Averages**: View multiple moving average calculations
- **Strategy Details**: See your personalized strategy parameters
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Graceful error handling with retry functionality

## 📱 Usage

1. **Default View**: Load the page to see general market signals
2. **Personalized Signals**: Enter your user ID to see signals based on your custom strategy
3. **Auto-refresh**: Click "Load Signal" to refresh data
4. **Error Recovery**: Use "Retry" button if data loading fails

## 🛠️ Technical Details

### API Integration
- Connects to LazySignal Cloud Functions API
- Supports both general and user-specific endpoints
- Handles CORS and error responses

### Technologies
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript (ES6+)**: Vanilla JS, no frameworks
- **Google Fonts**: Inter font family

### Files
- `index.html` - Main HTML structure
- `styles.css` - Responsive styling
- `script.js` - API integration and UI logic

## 🔧 Development

### Local Development
1. Open `index.html` in a web browser
2. The app will attempt to load data from the production API
3. For local API testing, modify `API_BASE_URL` in `script.js`

### Customization
- Update `API_BASE_URL` to point to your API endpoint
- Modify color scheme in CSS custom properties
- Add additional features as needed

## 📊 Data Display

The app displays:
- **Current Price**: Latest S&P 500 closing price
- **Signal**: BUY/SELL/HOLD recommendation with reasoning
- **Moving Averages**: MA5, MA10, MA25, MA50, MA100, and primary MA
- **Strategy Info**: Your personalized parameters (if user ID provided)
- **Timestamp**: When the data was last updated

## 🌐 Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## 📝 Notes

- This is a frontend-only application
- All data comes from the LazySignal API
- No user data is stored locally
- API calls are made client-side for simplicity

## 🤝 Contributing

This is a simple frontend for demonstration. For production use, consider:
- Adding authentication
- Implementing caching
- Adding more interactive features
- Using a modern framework (React, Vue, etc.)

---

**LazySignal** - Smart Trading Signals Powered by Machine Learning