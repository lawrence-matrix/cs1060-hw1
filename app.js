const API_KEY = 'demo';
const BASE_URL = 'https://api.twelvedata.com';

let priceChart = null;

const AppState = {
    quote: null,
    series: null,
    isLoading: false,
    error: null,

    setState(patch) {
        Object.assign(this, patch);
        this.render();
    },

    async load(ticker) {
        if (!ticker || !ticker.trim()) {
            this.setState({ error: 'Please enter a valid stock ticker symbol.', isLoading: false });
            return;
        }

        const symbol = ticker.trim().toUpperCase();
        this.setState({ isLoading: true, error: null, quote: null, series: null });

        try {
            const [quoteRes, seriesRes] = await Promise.all([
                fetch(`${BASE_URL}/quote?symbol=${symbol}&apikey=${API_KEY}`),
                fetch(`${BASE_URL}/time_series?symbol=${symbol}&interval=1day&outputsize=30&apikey=${API_KEY}`)
            ]);

            if (!quoteRes.ok) throw new Error(`HTTP ${quoteRes.status}`);
            if (!seriesRes.ok) throw new Error(`HTTP ${seriesRes.status}`);

            const quoteData = await quoteRes.json();
            const seriesData = await seriesRes.json();

            if (quoteData.status === 'error') throw new Error(quoteData.message);
            if (seriesData.status === 'error') throw new Error(seriesData.message);

            this.setState({ quote: quoteData, series: seriesData, isLoading: false });

        } catch (err) {
            console.error('API error:', err);
            this.setState({
                error: `Could not load data for "${symbol}": ${err.message}. The demo key supports: AAPL, MSFT, AMZN, GOOGL.`,
                isLoading: false
            });
        }
    },

    render() {
        const container = document.getElementById('app-container');
        if (!container) return;

        if (this.isLoading) {
            container.innerHTML = '<div class="spinner"><div class="spin-icon"></div><span>Loading market data…</span></div>';
            return;
        }

        if (this.error) {
            container.innerHTML = `<div class="error-banner">⚠️ ${this.error}</div>`;
            return;
        }

        if (this.quote) {
            container.innerHTML = this.buildTemplate();
            this.renderChart();
            return;
        }

        container.innerHTML = '<div class="placeholder">Enter a stock ticker above and press Search to fetch live market data.</div>';
    },

    buildTemplate() {
        const q = this.quote;
        const price = parseFloat(q.close || q.price || 0);
        const change = parseFloat(q.change || 0);
        const changePct = parseFloat(q.percent_change || 0);
        const isUp = change >= 0;
        const sign = isUp ? '+' : '';

        const low52 = parseFloat(q.fifty_two_week?.low || 0);
        const high52 = parseFloat(q.fifty_two_week?.high || 0);
        const pct52 = high52 > low52
            ? Math.min(100, Math.max(0, ((price - low52) / (high52 - low52)) * 100)).toFixed(1)
            : 50;

        const marketBadge = q.is_market_open
            ? '<span class="badge open">● Open</span>'
            : '<span class="badge closed">● Closed</span>';

        const vol = parseInt(q.volume || 0).toLocaleString();
        const avgVol = parseInt(q.average_volume || 0).toLocaleString();

        return `
            <div class="stock-card">
                <div class="card-header">
                    <div class="card-identity">
                        <h2 class="stock-name">${q.name || q.symbol}</h2>
                        <div class="stock-meta">
                            <span>${q.symbol}</span>
                            <span class="dot">·</span>
                            <span>${q.exchange || 'Exchange'}</span>
                            <span class="dot">·</span>
                            ${marketBadge}
                        </div>
                    </div>
                    <div class="price-block">
                        <div class="price">$${price.toFixed(2)}</div>
                        <div class="change ${isUp ? 'up' : 'down'}">${sign}${change.toFixed(2)} &nbsp; ${sign}${changePct.toFixed(2)}%</div>
                    </div>
                </div>

                <div class="chart-wrap">
                    <canvas id="price-chart"></canvas>
                </div>

                <div class="metrics-grid">
                    <div class="metric">
                        <span>Open</span>
                        <strong>$${parseFloat(q.open || 0).toFixed(2)}</strong>
                    </div>
                    <div class="metric">
                        <span>Prev. Close</span>
                        <strong>$${parseFloat(q.previous_close || 0).toFixed(2)}</strong>
                    </div>
                    <div class="metric">
                        <span>Day High</span>
                        <strong>$${parseFloat(q.high || 0).toFixed(2)}</strong>
                    </div>
                    <div class="metric">
                        <span>Day Low</span>
                        <strong>$${parseFloat(q.low || 0).toFixed(2)}</strong>
                    </div>
                    <div class="metric">
                        <span>Volume</span>
                        <strong>${vol}</strong>
                    </div>
                    <div class="metric">
                        <span>Avg. Volume</span>
                        <strong>${avgVol}</strong>
                    </div>
                    <div class="metric">
                        <span>Currency</span>
                        <strong>${q.currency || 'USD'}</strong>
                    </div>
                    <div class="metric">
                        <span>As of</span>
                        <strong>${q.datetime || '—'}</strong>
                    </div>
                </div>

                ${low52 && high52 ? `
                <div class="range-section">
                    <div class="range-label">
                        <span>52-Week Range</span>
                        <span>$${low52.toFixed(2)} — $${high52.toFixed(2)}</span>
                    </div>
                    <div class="range-track">
                        <div class="range-fill" style="width: ${pct52}%"></div>
                        <div class="range-cursor" style="left: ${pct52}%">
                            <div class="cursor-tooltip">$${price.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="range-ends">
                        <span>52W Low</span>
                        <span>52W High</span>
                    </div>
                </div>` : ''}
            </div>
        `;
    },

    renderChart() {
        if (!this.series?.values) return;
        const canvas = document.getElementById('price-chart');
        if (!canvas) return;

        if (priceChart) {
            priceChart.destroy();
            priceChart = null;
        }

        const raw = [...this.series.values].reverse();
        const labels = raw.map(d => d.datetime);
        const prices = raw.map(d => parseFloat(d.close));

        const isUp = prices.length > 1 && prices[prices.length - 1] >= prices[0];
        const lineColor = isUp ? '#22c55e' : '#ef4444';
        const fillColor = isUp ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';

        priceChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    data: prices,
                    borderColor: lineColor,
                    backgroundColor: fillColor,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: lineColor,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderWidth: 1,
                        titleColor: '#94a3b8',
                        bodyColor: '#f8fafc',
                        callbacks: {
                            label: ctx => ` $${ctx.parsed.y.toFixed(2)}`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#64748b', maxTicksLimit: 6, maxRotation: 0 },
                        grid: { color: 'rgba(51,65,85,0.5)' }
                    },
                    y: {
                        position: 'right',
                        ticks: { color: '#64748b', callback: v => '$' + v.toFixed(0) },
                        grid: { color: 'rgba(51,65,85,0.5)' }
                    }
                }
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('fetch-btn');
    const input = document.getElementById('ticker-input');

    btn?.addEventListener('click', () => AppState.load(input.value));
    input?.addEventListener('keypress', e => {
        if (e.key === 'Enter') AppState.load(input.value);
    });

    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const ticker = chip.dataset.ticker;
            input.value = ticker;
            AppState.load(ticker);
        });
    });

    AppState.load('AAPL');
});
