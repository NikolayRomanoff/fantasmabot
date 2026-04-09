let API_URL = localStorage.getItem('fantasma_api_url') || 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - v10.5
    const statusIndicator = document.querySelector('.status-indicator');
    const tbody = document.getElementById('tradesBody');
    const btnPanic = document.getElementById('btnPanic');
    const btnTestConn = document.getElementById('btnTestConn');
    
    // Toggles and Strategies
    const btnToggleBasket = document.getElementById('btnToggleBasket');
    const btnTogglePartial = document.getElementById('btnTogglePartial');
    const btnToggleSniper = document.getElementById('btnToggleSniper');
    const inputAlvoCesto = document.getElementById('inputAlvoCesto');
    const basketStatusText = document.getElementById('basketStatusText');

    // Modal UI
    const modal = document.getElementById('apiModal');
    const closeBtn = document.querySelector('.close-modal');
    const saveBtn = document.getElementById('btnSaveApi');
    const systemStatusClick = document.querySelector('.system-status');

    // Chart initialization
    const ctx = document.getElementById('balanceChart').getContext('2d');
    const chartConfig = {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Equity (USD)',
                data: [],
                borderColor: '#00f0ff',
                backgroundColor: 'rgba(0, 240, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#a0a0b0' } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#a0a0b0' } }
            }
        }
    };
    const balanceChart = new Chart(ctx, chartConfig);

    async function updateStatus() {
        try {
            const res = await fetch(`${API_URL}/api/status`);
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            // Update Metrics Grid (v10.5 Fix)
            const cards = document.querySelectorAll('.metric-card');
            
            // Card 1: Lucro Hoje
            const profitH2 = cards[0].querySelector('h2');
            profitH2.innerText = `U$ ${data.lucro_hoje.toFixed(2)}`;
            profitH2.className = data.lucro_hoje >= 0 ? 'profit positive' : 'profit negative';
            
            // Card 2: Win Rate
            cards[1].querySelector('h2').innerText = `${data.win_rate.toFixed(1)}%`;
            
            // Card 3: Operações Hoje
            cards[2].querySelector('h2').innerText = data.total_hoje;
            cards[2].querySelector('.win-loss').innerHTML = `<span class="win">${data.trades_hoje}</span>`;
            
            // Card 4: Saldo Atual
            cards[3].querySelector('h2').innerText = `U$ ${data.balance.toFixed(2)}`;

            // Update Chart
            const now = new Date().toLocaleTimeString();
            if (balanceChart.data.labels.length > 20) {
                balanceChart.data.labels.shift();
                balanceChart.data.datasets[0].data.shift();
            }
            balanceChart.data.labels.push(now);
            balanceChart.data.datasets[0].data.push(data.equity);
            balanceChart.update();

            // Status Indicator
            statusIndicator.classList.add('online');
            
            // Sniper/Basket Status UI Update
            if (data.sniper_ativo) {
                btnToggleSniper.classList.add('active');
                document.getElementById('txtToggleSniper').innerText = 'Ligado';
            } else {
                btnToggleSniper.classList.remove('active');
                document.getElementById('txtToggleSniper').innerText = 'Desligado';
            }

            if (data.usar_saida_cesto) {
                btnToggleBasket.classList.add('active');
                document.getElementById('txtToggleBasket').innerText = 'Ativado';
                basketStatusText.innerText = `LIGADO (Alvo: $${data.alvo_cesto})`;
            } else {
                btnToggleBasket.classList.remove('active');
                document.getElementById('txtToggleBasket').innerText = 'Desativado';
                basketStatusText.innerText = `DESLIGADO`;
            }

            inputAlvoCesto.value = data.alvo_cesto;

        } catch (err) {
            statusIndicator.classList.remove('online');
            console.error("Erro ao carregar status:", err);
        }
    }

    async function updateTrades() {
        try {
            const res = await fetch(`${API_URL}/api/trades`);
            const trades = await res.json();

            tbody.innerHTML = '';
            trades.forEach(t => {
                const tr = document.createElement('tr');
                const isWin = t.profit >= 0;
                tr.innerHTML = `
                    <td><strong>${t.symbol}</strong></td>
                    <td><span class="badge ${t.type.toLowerCase()}">${t.type}</span></td>
                    <td>${t.lot.toFixed(2)}</td>
                    <td style="color: #a0a0b0;">${t.price.toFixed(5)}</td>
                    <td style="color: #a0a0b0;">${t.modo}</td>
                    <td class="${isWin ? 'success' : 'danger'}" style="font-weight: 700;">${isWin ? '+U$' : '-U$'}${Math.abs(t.profit).toFixed(2)}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            console.error("Erro ao carregar trades:", err);
        }
    }

    // Handlers
    btnPanic.addEventListener('click', async () => {
        if (confirm('ALERTA: Deseja ZERAR todas as posições AGORA?')) {
            await fetch(`${API_URL}/api/panic`, { method: 'POST' });
        }
    });

    btnTestConn.addEventListener('click', () => {
        updateStatus();
        updateTrades();
    });

    btnToggleSniper.addEventListener('click', async () => {
        try {
            const res = await fetch(`${API_URL}/api/toggle_sniper`, { method: 'POST' });
            const data = await res.json();
            updateStatus();
        } catch(e) { console.error(e); }
    });

    btnToggleBasket.addEventListener('click', async () => {
        try {
            const res = await fetch(`${API_URL}/api/toggle_basket`, { method: 'POST' });
            const data = await res.json();
            updateStatus();
        } catch(e) { console.error(e); }
    });

    inputAlvoCesto.addEventListener('change', async () => {
        const novoAlvo = inputAlvoCesto.value;
        await fetch(`${API_URL}/api/set_alvo_cesto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alvo: novoAlvo })
        });
        updateStatus();
    });

    // Modal logic for Remote connection
    systemStatusClick.addEventListener('click', () => { modal.style.display = 'flex'; });
    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    saveBtn.addEventListener('click', () => {
        const newUrl = document.getElementById('apiUrl').value;
        localStorage.setItem('fantasma_api_url', newUrl);
        API_URL = newUrl;
        modal.style.display = 'none';
        updateStatus();
    });

    // Loop
    setInterval(updateStatus, 5000);
    setInterval(updateTrades, 10000);

    // Init
    updateStatus();
    updateTrades();
});
