let API_URL = localStorage.getItem('fantasma_api_url') || 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - v10.5
    const statusIndicator = document.querySelector('.status-indicator');
    const terminal = document.getElementById('terminalOutput');
    const tbody = document.getElementById('tradesBody');
    const btnPanic = document.getElementById('btnPanic');
    const btnTestConn = document.getElementById('btnTestConn');
    
    // Toggles and Strategirs
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

    function addLog(msg, type = 'info') {
        const now = new Date();
        const timeStr = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
        const div = document.createElement('div');
        div.className = `log-line ${type}`;
        div.innerHTML = `<span class="time">${timeStr}</span> ${msg}`;
        terminal.appendChild(div);
        terminal.scrollTop = terminal.scrollHeight;
    }

    async function updateStatus() {
        try {
            const res = await fetch(`${API_URL}/api/status`);
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            // Update Metrics
            document.querySelector('.metric-card:nth-child(1) h2').innerText = `U$ ${data.profit.toFixed(2)}`;
            document.querySelector('.metric-card:nth-child(2) h2').innerText = `${data.win_rate.toFixed(1)}%`;
            document.querySelector('.metric-card:nth-child(3) h2').innerText = data.total_trades;
            document.querySelector('.metric-card:nth-child(4) h2').innerText = `U$ ${data.balance.toFixed(2)}`;

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
            
            // Strategy UI Update
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
            addLog("!!! SINAL DE PÂNICO ENVIADO !!!", "error");
            await fetch(`${API_URL}/api/panic`, { method: 'POST' });
        }
    });

    btnTestConn.addEventListener('click', () => {
        addLog("Testando conexão...");
        updateStatus();
        updateTrades();
    });

    btnToggleSniper.addEventListener('click', async () => {
        const res = await fetch(`${API_URL}/api/toggle_sniper`, { method: 'POST' });
        const data = await res.json();
        addLog(`Modo Sniper: ${data.sniper_ativo ? 'LIGADO' : 'DESLIGADO'}`, data.sniper_ativo ? 'success' : 'info');
        updateStatus();
    });

    btnToggleBasket.addEventListener('click', async () => {
        const res = await fetch(`${API_URL}/api/toggle_basket`, { method: 'POST' });
        const data = await res.json();
        addLog(`Saída de Cesto: ${data.usar_saida_cesto ? 'ATIVADA' : 'DESATIVADA'}`, data.usar_saida_cesto ? 'success' : 'info');
        updateStatus();
    });

    inputAlvoCesto.addEventListener('change', async () => {
        const novoAlvo = inputAlvoCesto.value;
        await fetch(`${API_URL}/api/set_alvo_cesto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alvo: novoAlvo })
        });
        addLog(`Alvo do Cesto atualizado para: $${novoAlvo}`, 'info');
    });

    // Modal logic for Remote connection
    systemStatusClick.addEventListener('click', () => { modal.style.display = 'flex'; });
    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    saveBtn.addEventListener('click', () => {
        const newUrl = document.getElementById('apiUrl').value;
        localStorage.setItem('fantasma_api_url', newUrl);
        API_URL = newUrl;
        modal.style.display = 'none';
        addLog(`Conexão configurada para: ${newUrl}`, 'success');
        updateStatus();
    });

    // Loop
    setInterval(updateStatus, 5000);
    setInterval(updateTrades, 10000);

    // Init
    updateStatus();
    updateTrades();
    addLog("Fantasma v10.5 (Build 2026) Online.");
});
