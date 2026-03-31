document.addEventListener('DOMContentLoaded', () => {
    // --- 0. INITIALIZATION & LOADER ---
    const loader = document.getElementById('loader');
    setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => loader.style.display = 'none', 500);
        animateCounters();
    }, 1500); // Simulate loading time

    // --- 1. PERSONALIZED HEADER & BACKGROUND ANIMATION ---
    const greetingTitle = document.getElementById('greeting-title');
    const hour = new Date().getHours();
    if (hour < 12) greetingTitle.innerText = 'Good Morning, Error squad';
    else if (hour < 18) greetingTitle.innerText = 'Good Afternoon, Error squad';
    else greetingTitle.innerText = 'Good Evening, Error squad';

    const bgCanvas = document.getElementById('bg-canvas');
    if (bgCanvas) {
        const bgCtx = bgCanvas.getContext('2d');
        let width, height, particles;

        function initBgCanvas() {
            width = bgCanvas.width = window.innerWidth;
            height = bgCanvas.height = window.innerHeight;
            particles = [];
            for (let i = 0; i < 60; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.8,
                    vy: (Math.random() - 0.5) * 0.8,
                    size: Math.random() * 2 + 1
                });
            }
        }

        function drawBg() {
            bgCtx.clearRect(0, 0, width, height);
            // Draw particles with varying opacity based on theme
            const isDark = document.body.classList.contains('dark-theme');
            const ptColorStr = isDark ? '14, 165, 233' : '59, 130, 246';

            bgCtx.fillStyle = `rgba(${ptColorStr}, 0.5)`;

            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                bgCtx.beginPath();
                bgCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                bgCtx.fill();

                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if (dist < 150) {
                        bgCtx.beginPath();
                        bgCtx.strokeStyle = `rgba(${ptColorStr}, ${0.2 - dist / 750})`;
                        bgCtx.lineWidth = 1;
                        bgCtx.moveTo(p.x, p.y);
                        bgCtx.lineTo(p2.x, p2.y);
                        bgCtx.stroke();
                    }
                }
            });
            requestAnimationFrame(drawBg);
        }

        window.addEventListener('resize', initBgCanvas);
        initBgCanvas();
        drawBg();
    }

    // --- 2. THEME MANAGEMENT ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    let chartTextColor = '#f8fafc';
    let chartGridColor = 'rgba(255, 255, 255, 0.1)';

    function updateThemeConfig() {
        if (themeToggle.checked) {
            body.classList.add('dark-theme');
            chartTextColor = '#f8fafc';
            chartGridColor = 'rgba(255, 255, 255, 0.1)';
        } else {
            body.classList.remove('dark-theme');
            chartTextColor = '#1e293b';
            chartGridColor = 'rgba(0, 0, 0, 0.05)';
        }
        if (charts.realTime) updateChartTheme(charts.realTime);
        if (charts.donut) updateChartTheme(charts.donut);
        if (charts.predictive) updateChartTheme(charts.predictive);
        if (charts.impact) updateChartTheme(charts.impact);
    }

    function updateChartTheme(chartInstance) {
        if (chartInstance.options.scales) {
            if (chartInstance.options.scales.x) {
                chartInstance.options.scales.x.ticks = chartInstance.options.scales.x.ticks || {};
                chartInstance.options.scales.x.ticks.color = chartTextColor;
                chartInstance.options.scales.x.grid = chartInstance.options.scales.x.grid || {};
                chartInstance.options.scales.x.grid.color = chartGridColor;
            }
            if (chartInstance.options.scales.y) {
                chartInstance.options.scales.y.ticks = chartInstance.options.scales.y.ticks || {};
                chartInstance.options.scales.y.ticks.color = chartTextColor;
                chartInstance.options.scales.y.grid = chartInstance.options.scales.y.grid || {};
                chartInstance.options.scales.y.grid.color = chartGridColor;
            }
        }
        if (chartInstance.options.plugins && chartInstance.options.plugins.legend) {
            chartInstance.options.plugins.legend.labels = chartInstance.options.plugins.legend.labels || {};
            chartInstance.options.plugins.legend.labels.color = chartTextColor;
        }
        chartInstance.update();
    }
    themeToggle.addEventListener('change', updateThemeConfig);

    // --- 3. NAVIGATION OVERLAY ---
    const navItems = document.querySelectorAll('.nav-links li');
    const pageSections = document.querySelectorAll('.page-section');
    const pageTitle = document.getElementById('current-page-title');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            const targetId = item.getAttribute('data-target');
            pageSections.forEach(section => {
                section.classList.add('hidden');
                section.classList.remove('active');
            });
            document.getElementById(`section-${targetId}`).classList.remove('hidden');
            document.getElementById(`section-${targetId}`).classList.add('active');

            pageTitle.innerText = item.innerText.trim();
            if (targetId === "impact") animateCounters();

            setTimeout(() => {
                Object.values(charts).forEach(c => c && c.resize());
            }, 50);
        });
    });

    // --- 4. CHARTS CONFIGURATION ---
    const charts = { realTime: null, donut: null, predictive: null, impact: null };
    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.color = chartTextColor;

    function createGradient(ctx, colorStart, colorEnd) {
        let gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);
        return gradient;
    }

    // A. Real-Time Chart
    const rtCtx = document.getElementById('realTimeChart').getContext('2d');
    const rtGradient = createGradient(rtCtx, 'rgba(14, 165, 233, 0.6)', 'rgba(14, 165, 233, 0.0)');
    let timeLabels = Array.from({ length: 20 }, (_, i) => `${i} min ago`).reverse();
    let timeData = Array.from({ length: 20 }, () => Math.floor(Math.random() * 20) + 20);

    charts.realTime = new Chart(rtCtx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'Usage (kWh)',
                data: timeData,
                borderColor: '#0ea5e9',
                backgroundColor: rtGradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
            scales: {
                x: { grid: { color: chartGridColor }, ticks: { color: chartTextColor } },
                y: { grid: { color: chartGridColor }, ticks: { color: chartTextColor }, min: 0, max: 80 }
            },
            animation: { duration: 400, easing: 'linear' }
        }
    });

    // B. Donut Chart
    const dnCtx = document.getElementById('donutChart').getContext('2d');
    charts.donut = new Chart(dnCtx, {
        type: 'doughnut',
        data: {
            labels: ['HVAC', 'Lighting', 'Servers', 'Misc'],
            datasets: [{
                data: [45, 25, 20, 10],
                backgroundColor: ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'],
                borderWidth: 0, hoverOffset: 10
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '75%',
            plugins: { legend: { position: 'bottom', labels: { color: chartTextColor, usePointStyle: true, padding: 20 } } }
        }
    });

    // C. Predictive Chart
    const prCtx = document.getElementById('predictiveChart').getContext('2d');
    charts.predictive = new Chart(prCtx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                { label: 'Predicted AI Optimized', data: [120, 115, 110, 105, 120, 80, 75], backgroundColor: createGradient(prCtx, 'rgba(16, 185, 129, 0.8)', 'rgba(16, 185, 129, 0.2)'), borderRadius: 8 },
                { label: 'Unoptimized Baseline', data: [140, 135, 130, 140, 150, 95, 90], backgroundColor: createGradient(prCtx, 'rgba(244, 63, 94, 0.8)', 'rgba(244, 63, 94, 0.2)'), borderRadius: 8 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: chartTextColor } } },
            scales: { x: { grid: { display: false }, ticks: { color: chartTextColor } }, y: { grid: { color: chartGridColor }, ticks: { color: chartTextColor } } }
        }
    });

    // D. Impact Chart
    const imCtx = document.getElementById('impactChart').getContext('2d');
    charts.impact = new Chart(imCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Cumulative Cash Savings ($)',
                data: [120, 310, 520, 890, 1240, 1750],
                borderColor: '#10b981',
                backgroundColor: createGradient(imCtx, 'rgba(16, 185, 129, 0.6)', 'rgba(16, 185, 129, 0)'),
                fill: true, tension: 0.3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { color: chartGridColor }, ticks: { color: chartTextColor } }, y: { grid: { color: chartGridColor }, ticks: { color: chartTextColor } } } }
    });

    // --- 5. SMART AUTOMATION DEVICES ---
    let aiModeActive = true;
    const aiModeToggle = document.getElementById('ai-mode-toggle');
    const deviceContainer = document.getElementById('devices-container');

    const devicesList = [
        { id: 'hvac1', name: 'Main HVAC Unit', type: 'snowflake', status: true, usage: 12.4, schedule: '8am - 6pm', aiControlled: true },
        { id: 'light1', name: 'Floor 1 Lighting', type: 'lightbulb', status: false, usage: 0, motion: true, aiControlled: true },
        { id: 'light2', name: 'Floor 2 Lighting', type: 'lightbulb', status: true, usage: 4.5, schedule: 'Sunset - Sunrise', aiControlled: false },
        { id: 'serv1', name: 'Database Cluster A', type: 'hard-drives', status: true, usage: 15.6, critical: true, aiControlled: false },
        { id: 'disp1', name: 'Conference Displays', type: 'monitor', status: true, usage: 2.1, motion: true, aiControlled: true },
        { id: 'ev1', name: 'EV Charging Station', type: 'car-profile', status: true, usage: 8.5, schedule: 'Off-Peak Only', aiControlled: false },
        { id: 'vent1', name: 'Warehouse Ventilation', type: 'fan', status: false, usage: 0, aiControlled: true }
    ];

    function renderDevices() {
        deviceContainer.innerHTML = '';
        devicesList.forEach((dev) => {
            const isAI = aiModeActive && dev.aiControlled;
            const el = document.createElement('div');
            el.className = `glass-card device-card ${isAI ? 'ai-controlled' : ''}`;
            el.innerHTML = `
                <div class="device-header">
                    <div class="device-info">
                        <i class="ph-fill ph-${dev.type}" style="color:${dev.status ? 'var(--accent-color)' : 'var(--text-secondary)'}"></i>
                        <div>
                            <h3>${dev.name} ${dev.critical ? '<i class="ph-fill ph-warning-circle text-danger" title="Critical System"></i>' : ''}</h3>
                            <p>${dev.status ? 'Online' : 'Offline'} ${isAI ? '• <span class="blue">AI Controlled</span>' : ''}</p>
                        </div>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="chk-${dev.id}" ${dev.status ? 'checked' : ''} ${isAI ? 'disabled' : ''}>
                        <span class="toggle-slider round" ${isAI ? 'style="opacity:0.5;cursor:not-allowed;"' : ''}></span>
                    </label>
                </div>
                ${dev.schedule ? `<div class="sch-badge"><i class="ph ph-clock"></i> Scheduled: ${dev.schedule}</div>` : ''}
                ${dev.motion && dev.status ? `<div class="motion-indicator"><i class="ph-fill ph-person-simple-walk"></i> Motion Detected</div>` : ''}
                <div class="device-stats mt-2">
                    <span class="p-usage">Usage: <span id="usg-${dev.id}">${dev.usage.toFixed(1)}</span> kWh</span>
                    <span class="p-opt" style="color:var(--success-color)"><i class="ph-fill ph-shield-check"></i> ${isAI ? 'AI Managing' : 'Monitored'}</span>
                </div>
            `;
            deviceContainer.appendChild(el);

            if (!isAI) {
                const chk = el.querySelector(`#chk-${dev.id}`);
                chk.addEventListener('change', (e) => {
                    dev.status = e.target.checked;
                    dev.usage = dev.status ? (Math.random() * 5 + 5) : 0;
                    renderDevices();
                    addHistoryEvent(`Manual Toggle: ${dev.name} turned ${dev.status ? 'ON' : 'OFF'}`, false);
                });
            }
        });
    }

    aiModeToggle.addEventListener('change', (e) => {
        aiModeActive = e.target.checked;
        showToast(aiModeActive ? "AI Mode Activated" : "AI Mode Deactivated - Manual Control Enabled");
        addHistoryEvent(`System AI Control Mode ${aiModeActive ? 'Enabled' : 'Disabled'}`, !aiModeActive);
        renderDevices();
    });

    const shutdownBtn = document.getElementById('shutdown-unused-btn');
    if (shutdownBtn) {
        shutdownBtn.addEventListener('click', () => {
            let count = 0;
            let estSave = 0;
            devicesList.forEach(dev => {
                // Determine if device is conceptually "inactive/unused". 
                // Per user request, we grant permission to shut down ALL inactive devices, removing critical restrictions.
                const isInactive = dev.usage < 10 || dev.id.startsWith('light') || dev.id.startsWith('disp') || (dev.schedule && dev.schedule.includes('Off-Peak'));

                if (dev.status && isInactive) {
                    dev.status = false;
                    estSave += dev.usage;
                    dev.usage = 0;
                    count++;
                }
            });

            if (count > 0) {
                renderDevices();
                currentUsage = Math.max(15, currentUsage - estSave);
                document.getElementById('current-usage-val').innerHTML = `${currentUsage.toFixed(1)} <span class="unit">kWh</span>`;
                addHistoryEvent(`Manual Override: Shut down ${count} unused devices. Output reduced by ${estSave.toFixed(1)} kWh.`, false);
                showToast(`Shut down ${count} unused devices for maximum efficiency.`);
            } else {
                showToast(`All non-essential unused devices are already off.`);
            }
        });
    }

    renderDevices();

    // --- 6. AI NOTIFICATIONS & HISTORY ---
    const toastContainer = document.getElementById('toast-container');
    const panel = document.getElementById('notifications-panel');
    const alertBtn = document.getElementById('alert-btn');
    const closeBtn = document.getElementById('close-panel-btn');
    const historyContainer = document.getElementById('notification-history');

    let historyEvents = [];

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="ph-fill ph-warning-circle"></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);
        void toast.offsetWidth;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 5000);
    }

    function addHistoryEvent(message, isCritical = false) {
        historyEvents.unshift({ message, isCritical, time: new Date() });
        if (historyEvents.length > 20) historyEvents.pop(); // keep last 20
        renderHistory();
        if (isCritical) showToast(message);
    }

    function renderHistory() {
        if (historyEvents.length === 0) {
            historyContainer.innerHTML = '<div class="empty-state">No recent alerts. AI is monitoring normally.</div>';
            return;
        }
        historyContainer.innerHTML = '';
        historyEvents.forEach(ev => {
            const timeStr = ev.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const el = document.createElement('div');
            el.className = `hist-item ${ev.isCritical ? 'critical' : ''}`;
            el.innerHTML = `
                ${ev.message}
                <span class="hist-time">${timeStr}</span>
            `;
            historyContainer.appendChild(el);
        });
    }

    alertBtn.addEventListener('click', () => panel.classList.add('open'));
    closeBtn.addEventListener('click', () => panel.classList.remove('open'));

    // --- 7. DYNAMIC AI Recommendations ---
    function updateRecommendations(usage) {
        const container = document.getElementById('ai-recs-container');
        if (!container) return;

        container.innerHTML = '';
        if (usage > 45) {
            container.innerHTML += `
            <div class="glass-card rec-card high-impact">
                <div class="rec-icon"><i class="ph-fill ph-snowflake"></i></div>
                <div class="rec-text">
                    <h4>HVAC Throttling Required <span class="confidence-badge">AI Confidence: 98%</span></h4>
                    <p>Current facility usage is unusually high. Throttling HVAC limits by 2°C can stabilize the load.</p>
                    <span class="est-savings">Est. Savings: $15/hr</span>
                </div>
                <button class="action-btn apply-btn" onclick="this.innerText='Applied';this.style.background='var(--success-color)'">Apply</button>
            </div>`;
        }

        const currentHour = new Date().getHours();
        if (currentHour >= 10 && currentHour <= 16) {
            container.innerHTML += `
            <div class="glass-card rec-card medium-impact">
                <div class="rec-icon"><i class="ph-fill ph-sun"></i></div>
                <div class="rec-text">
                    <h4>Optimize Solar Harvesting <span class="confidence-badge">AI Confidence: 87%</span></h4>
                    <p>Peak sunlight detected. AI recommends shifting grid power consumption to solar array reserves.</p>
                    <span class="est-savings">Est. Savings: $12/hr</span>
                </div>
                <button class="action-btn apply-btn" onclick="this.innerText='Applied';this.style.background='var(--success-color)'">Apply</button>
            </div>`;
        }

        container.innerHTML += `
            <div class="glass-card rec-card medium-impact">
                <div class="rec-icon"><i class="ph-fill ph-lightbulb"></i></div>
                <div class="rec-text">
                    <h4>Lighting Optimization <span class="confidence-badge">AI Confidence: 91%</span></h4>
                    <p>Zero motion detected in Logistics Bay for 45 mins. Safely turn off zoned lighting.</p>
                    <span class="est-savings">Est. Savings: $3/hr</span>
                </div>
                <button class="action-btn apply-btn" onclick="this.innerText='Applied';this.style.background='var(--success-color)'">Apply</button>
            </div>`;

        container.innerHTML += `
            <div class="glass-card rec-card high-impact">
                <div class="rec-icon" style="color: var(--danger-color); background: rgba(239, 68, 68, 0.1);"><i class="ph-fill ph-wrench"></i></div>
                <div class="rec-text">
                    <h4>Predictive Maintenance <span class="confidence-badge" style="color:var(--danger-color); background:rgba(239, 68, 68, 0.1)">AI Confidence: 95%</span></h4>
                    <p>Database Cluster A cooling fan is drawing 15% more power than historical baseline. Possible bearing wear.</p>
                    <span class="est-savings">Action: Schedule Inspection</span>
                </div>
                <button class="action-btn apply-btn" onclick="this.innerText='Scheduled';this.style.background='#64748b'">Schedule</button>
            </div>`;
    }

    // --- 8. ANOMALY DETECTION SIMULATION ---
    let currentUsage = 34.2;
    setInterval(() => {
        // Random walk
        let change = (Math.random() - 0.4) * 5;

        // Occasional huge spike
        if (Math.random() > 0.95) change += 20;

        currentUsage += change;
        if (currentUsage < 15) currentUsage = 15; // floor

        document.getElementById('current-usage-val').innerHTML = `${currentUsage.toFixed(1)} <span class="unit">kWh</span>`;

        // Update Chart
        charts.realTime.data.datasets[0].data.shift();
        charts.realTime.data.datasets[0].data.push(currentUsage);
        charts.realTime.update();

        updateRecommendations(currentUsage);

        // Anomaly logic
        if (currentUsage > 55) {
            addHistoryEvent(`CRITICAL: Massive usage spike detected! Peak: ${currentUsage.toFixed(1)} kWh`, true);
            if (aiModeActive) {
                setTimeout(() => {
                    addHistoryEvent(`AI Mode Active: Automatically throttling lower-priority server groups and HVAC to compensate.`, false);
                    currentUsage -= 15; // AI corrects it
                }, 2000);
            }
        } else if (currentUsage > 45) {
            if (Math.random() > 0.7) {
                addHistoryEvent(`Warning: Usage is creeping above 45 kWh. Monitoring load.`, true);
            }
        }

    }, 3000);

    // --- 9. ANIMATED COUNTERS ---
    function animateCounters() {
        const counters = document.querySelectorAll('.animated-counter');
        counters.forEach(counter => {
            counter.innerText = '0';
            const target = +counter.getAttribute('data-target');
            const duration = 2000; // ms
            const increment = target / (duration / 16);

            let current = 0;
            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.innerText = Math.ceil(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.innerText = target;
                }
            };
            updateCounter();
        });
    }

    // --- 10. AI SUPPORT CHATBOT ---
    const chatBtn = document.getElementById('chatbot-btn');
    const chatWindow = document.getElementById('chatbot-window');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    const chatMessages = document.getElementById('chat-messages');

    if (chatBtn && chatWindow) {
        chatBtn.addEventListener('click', () => {
            chatWindow.classList.toggle('hidden');
            if (!chatWindow.classList.contains('hidden')) {
                chatInput.focus();
            }
        });

        closeChatBtn.addEventListener('click', () => {
            chatWindow.classList.add('hidden');
        });

        function appendMessage(text, sender) {
            const msgEl = document.createElement('div');
            msgEl.className = `message ${sender}`;
            msgEl.innerHTML = text; // Allow HTML rendering for links
            chatMessages.appendChild(msgEl);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function handleChatSubmit() {
            const text = chatInput.value.trim();
            if (!text) return;

            appendMessage(text, 'user');
            chatInput.value = '';

            // Simple simulated responses
            setTimeout(() => {
                let reply = "I'm analyzing your network. Currently, your usage and anomalies are under surveillance. Everything looks stable.";
                const lowerText = text.toLowerCase();

                if (lowerText.includes('usage') || lowerText.includes('power')) {
                    reply = `Your current baseline usage is ${currentUsage.toFixed(1)} kWh. AI Optimization Mode is currently ${aiModeActive ? 'active' : 'inactive'}.`;
                } else if (lowerText.includes('shutdown') || lowerText.includes('turn off')) {
                    reply = "You can use the 'Shutdown Unused' button in the Smart Automation Panel to instantly cut off non-essential systems.";
                } else if (lowerText.includes('billing') || lowerText.includes('cost') || lowerText.includes('invoice')) {
                    reply = "For detailed billing inquiries or payment history, please visit our <a href='#' style='color:var(--accent-color);text-decoration:underline;'>Finance & Billing Portal</a>.";
                } else if (lowerText.includes('support') || lowerText.includes('contact') || lowerText.includes('help') || lowerText.includes('human')) {
                    reply = "Need more assistance? You can raise a technical support ticket at the <a href='#' style='color:var(--accent-color);text-decoration:underline;'>Customer Support Hub</a>, or talk to a real human.";
                } else if (lowerText.includes('documentation') || lowerText.includes('api') || lowerText.includes('guide')) {
                    reply = "You can read about API integrations and advanced configurations in our <a href='#' style='color:var(--accent-color);text-decoration:underline;'>Developer Documentation Platform</a>.";
                } else if (lowerText.includes('hello') || lowerText.includes('hi')) {
                    reply = "Hello again! I am Nexus, your energy optimization copilot. Tell me what you'd like to check or optimize today.";
                }

                appendMessage(reply, 'bot');
            }, 800 + Math.random() * 800);
        }

        sendChatBtn.addEventListener('click', handleChatSubmit);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChatSubmit();
        });
    }

    // Initial setup calls
    updateThemeConfig();
    updateRecommendations(currentUsage);
});
