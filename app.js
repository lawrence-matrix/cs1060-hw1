const AppState = {
    data: null,
    isLoading: false,
    error: null,

    setState(newState) {
        Object.assign(this, newState);
        this.render();
    },

    async fetchStockData(ticker) {
        if (!ticker) {
            this.setState({ error: "Please enter a valid stock ticker symbol.", isLoading: false });
            return;
        }

        this.setState({ isLoading: true, error: null, data: null });
        
        const cleanTicker = ticker.trim().toUpperCase();
        // FIXED: Correctly added the https protocol, the official api domain, and the target /quote endpoint
        const endpointUrl = `twelvedata.com{cleanTicker}&apikey=demo`;

        try {
            const response = await fetch(endpointUrl);

            // If the server returns an HTML error (like 404), this catches it before response.json() crashes
            if (!response.ok) {
                throw new Error(`HTTP Server Error: ${response.status} - ${response.statusText}`);
            }

            const jsonPayload = await response.json();

            if (jsonPayload.status === "error") {
                throw new Error(jsonPayload.message);
            }

            this.setState({ data: jsonPayload, isLoading: false });
            
        } catch (err) {
            console.error("Stock API Failure:", err);
            this.setState({ 
                error: `Failed to load stock data: ${err.message}. (Note: 'demo' key supports popular tickers like AAPL, MSFT, and GOOGL)`, 
                isLoading: false 
            });
        }
    },

    render() {
        const container = document.getElementById('app-container');
        if (!container) return;

        if (this.isLoading) {
            container.innerHTML = '<div class="spinner">🔄 Querying real-time market data...</div>';
            return;
        }

        if (this.error) {
            container.innerHTML = `<div class="error-banner">⚠️ ${this.error}</div>`;
            return;
        }

        if (this.data) {
            container.innerHTML = this.buildStockTemplate(this.data);
            return;
        }

        container.innerHTML = '<div class="placeholder">Enter a stock ticker and click query to fetch live market parameters.</div>';
    },

    buildStockTemplate(stock) {
        const price = parseFloat(stock.close || stock.price || 0).toFixed(2);
        const change = parseFloat(stock.change || 0).toFixed(2);
        const changePercent = parseFloat(stock.percent_change || 0).toFixed(2);
        const isPositive = parseFloat(change) >= 0;
        const colorStyle = isPositive ? 'style="color: #22c55e;"' : 'style="color: #ef4444;"';

        return `
            <div class="stock-card">
                <h2>
                    <span>${stock.name || stock.symbol} (${stock.symbol})</span>
                    <span class="price-tag">$${price}</span>
                </h2>
                <div class="metrics-grid">
                    <div class="metric-item">
                        <span>Net Change</span>
                        <strong ${colorStyle}>${isPositive ? '+' : ''}${change}</strong>
                    </div>
                    <div class="metric-item">
                        <span>Percentage Change</span>
                        <strong ${colorStyle}>${isPositive ? '+' : ''}${changePercent}%</strong>
                    </div>
                    <div class="metric-item">
                        <span>Market Volume</span>
                        <strong>${parseInt(stock.volume || 0).toLocaleString()}</strong>
                    </div>
                    <div class="metric-item">
                        <span>Exchange Currency</span>
                        <strong>${stock.currency || 'USD'}</strong>
                    </div>
                </div>
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const fetchBtn = document.getElementById('fetch-trigger-btn');
    const tickerInput = document.getElementById('ticker-input');

    if (fetchBtn && tickerInput) {
        fetchBtn.addEventListener('click', () => {
            AppState.fetchStockData(tickerInput.value);
        });

        tickerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                AppState.fetchStockData(tickerInput.value);
            }
        });
    }
});
