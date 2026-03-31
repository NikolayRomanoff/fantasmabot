document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Modal de Configuração de API
    const modal = document.getElementById('apiModal');
    const closeBtn = document.querySelector('.close-modal');
    const saveBtn = document.getElementById('btnSaveApi');
    const systemStatus = document.querySelector('.system-status');
    const statusIndicator = document.querySelector('.status-indicator');

    // Inicialização do Gráfico com Chart.js
    const ctx = document.getElementById('balanceChart').getContext('2d');
    
    // Dados simulados para o gráfico
    const labels = Array.from({length: 20}, (_, i) => `${8+Math.floor(i/2)}:${i%2==0?'00':'30'}`);
    const dataPoints = [];
    let currentBalance = 10000;
    
    for(let i=0; i<20; i++) {
        dataPoints.push(currentBalance);
        currentBalance += (Math.random() * 150) - 50; // Tendência levemente positiva
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 350);
    gradient.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

    const chartConfig = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Capital Total (USD)',
                data: dataPoints,
                borderColor: '#00f0ff',
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: '#07070a',
                pointBorderColor: '#00f0ff',
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(20, 20, 25, 0.9)',
                    titleColor: '#00f0ff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(0, 240, 255, 0.3)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'U$ ' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)', tickLength: 4 },
                    ticks: { color: '#a0a0b0', maxTicksLimit: 8 }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)', tickLength: 4 },
                    ticks: {
                        color: '#a0a0b0',
                        callback: function(value) { return '$' + value; }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    };

    const balanceChart = new Chart(ctx, chartConfig);

    // Gerar Trades Simulados O Fantasma
    const tbody = document.getElementById('tradesBody');
    const assets = ['EURUSD', 'GBPUSD', 'XAUUSD', 'USDCAD'];
    const types = ['Buy', 'Sell'];
    
    function addRandomTrade() {
        const tr = document.createElement('tr');
        const isWin = Math.random() > 0.3; // 70% win rate simulado
        const type = types[Math.floor(Math.random() * types.length)];
        const cls = type === 'Buy' ? 'buy' : 'sell';
        const pnl = isWin ? (Math.random() * 40 + 10).toFixed(2) : -(Math.random() * 20 + 5).toFixed(2);
        
        tr.innerHTML = `
            <td><strong>${assets[Math.floor(Math.random() * assets.length)]}</strong></td>
            <td><span class="badge ${cls}">${type.toUpperCase()}</span></td>
            <td>0.${Math.floor(Math.random() * 9) + 1}0</td>
            <td style="color: #a0a0b0;">1.08${Math.floor(Math.random() * 900) + 100}</td>
            <td style="color: #a0a0b0;">1.08${Math.floor(Math.random() * 900) + 100}</td>
            <td class="${isWin ? 'success' : 'danger'}" style="font-weight: 700;">${isWin ? '+U$' : '-U$'}${Math.abs(pnl)}</td>
        `;
        
        tbody.insertBefore(tr, tbody.firstChild);
        if(tbody.children.length > 5) {
            tbody.removeChild(tbody.lastChild);
        }
        
        // Adicionar log ao terminal
        addLog(type, isWin, Math.abs(pnl));
    }

    // Inicializar com 5 operações
    for(let i=0; i<5; i++) {
        addRandomTrade();
    }

    // Adicionar novo trade a cada 10-25 segundos simulando atividade
    setInterval(addRandomTrade, Math.random() * 15000 + 10000);

    // Função de Terminal Simulado
    const terminal = document.getElementById('terminalOutput');
    
    function addLog(type, isWin, amt) {
        const now = new Date();
        const timeStr = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
        const div = document.createElement('div');
        
        div.className = `log-line ${isWin ? 'success' : 'error'}`;
        div.innerHTML = `<span class="time">${timeStr}</span> [TRADE] Posição ${type.toUpperCase()} fechada. ${isWin ? 'Lucro' : 'Prejuízo'}: $${amt}`;
        
        terminal.appendChild(div);
        terminal.scrollTop = terminal.scrollHeight;
    }

    // Modal Events
    systemStatus.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    saveBtn.addEventListener('click', () => {
        const newUrl = document.getElementById('apiUrl').value;
        const btnTest = document.getElementById('btnTestConn');
        
        modal.style.display = 'none';
        
        // Simular salvamento e conexão
        statusIndicator.classList.remove('online');
        statusIndicator.style.backgroundColor = '#ffb800'; // warning/connecting state
        statusIndicator.style.animation = 'none';
        
        terminal.innerHTML += `<div class="log-line info"><span class="time">[SYS]</span> Conectando a ${newUrl}...</div>`;
        terminal.scrollTop = terminal.scrollHeight;
        
        // Ícone de loading no botão
        const oldHtml = btnTest.innerHTML;
        btnTest.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Conectando...';

        setTimeout(() => {
            statusIndicator.classList.add('online');
            statusIndicator.style.backgroundColor = '';
            statusIndicator.style.animation = '';
            
            terminal.innerHTML += `<div class="log-line success"><span class="time">[SYS]</span> Conexão estabelecida com sucesso via WebSocket!</div>`;
            terminal.scrollTop = terminal.scrollHeight;
            
            btnTest.innerHTML = oldHtml;
        }, 2000);
    });

    // Pânico Event
    document.getElementById('btnPanic').addEventListener('click', () => {
        if(confirm('ALERTA DE SEGURANÇA: Tem certeza que deseja zerar TODAS as posições do robô?')) {
            terminal.innerHTML += `<div class="log-line error blink"><span class="time">[SYS]</span> SINAL DE PÂNICO ENVIADO! Fechando todas as ordens a mercado...</div>`;
            terminal.scrollTop = terminal.scrollHeight;
        }
    });
});
