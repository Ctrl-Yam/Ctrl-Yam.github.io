let currentIdentity = {
    name: "Yamkelo Vilakazi",
    role: "IT Student & Class Representative",
    studentId: "ST1052••••",
    ip: "10.52.64.19",
    bio: "Dedicated IT student with a strong foundation in network infrastructure, system administration, and automation scripting."
};

let audioCtx = null;
let sonifierActive = false;
let oscType = 'sine';
let basePitchFreq = 330;
let backgroundRouterHum = null;
let masterGain = null;

const sonifierToggleBtn = document.getElementById('sonifierToggleBtn');
const synthIcon = document.getElementById('synthIcon');

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        masterGain.connect(audioCtx.destination);

        const humOsc = audioCtx.createOscillator();
        const humGain = audioCtx.createGain();
        humOsc.type = 'triangle';
        humOsc.frequency.setValueAtTime(55, audioCtx.currentTime);
        humGain.gain.setValueAtTime(0, audioCtx.currentTime);
        humOsc.connect(humGain);
        humGain.connect(masterGain);
        humOsc.start();

        const fanOsc = audioCtx.createOscillator();
        const fanGain = audioCtx.createGain();
        fanOsc.type = 'sine';
        fanOsc.frequency.setValueAtTime(120, audioCtx.currentTime);
        fanGain.gain.setValueAtTime(0, audioCtx.currentTime);
        fanOsc.connect(fanGain);
        fanGain.connect(masterGain);
        fanOsc.start();

        const rumbleOsc = audioCtx.createOscillator();
        const rumbleGain = audioCtx.createGain();
        rumbleOsc.type = 'sawtooth';
        rumbleOsc.frequency.setValueAtTime(38, audioCtx.currentTime);
        rumbleGain.gain.setValueAtTime(0, audioCtx.currentTime);
        rumbleOsc.connect(rumbleGain);
        rumbleGain.connect(masterGain);
        rumbleOsc.start();

        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.12, audioCtx.currentTime);
        lfoGain.gain.setValueAtTime(24, audioCtx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(fanOsc.frequency);
        lfo.start();

        backgroundRouterHum = {
            humGain,
            fanGain,
            rumbleGain,
            lfo
        };
    }
}

sonifierToggleBtn.addEventListener('click', () => {
    initAudio();
    const resumePromise = audioCtx.state === 'suspended' ? audioCtx.resume() : Promise.resolve();

    resumePromise.then(() => {
        if (!sonifierActive) {
            if (backgroundRouterHum) {
                backgroundRouterHum.humGain.gain.setTargetAtTime(0.014, audioCtx.currentTime, 0.08);
                backgroundRouterHum.fanGain.gain.setTargetAtTime(0.018, audioCtx.currentTime, 0.08);
                backgroundRouterHum.rumbleGain.gain.setTargetAtTime(0.008, audioCtx.currentTime, 0.1);
            }
            sonifierActive = true;
            sonifierToggleBtn.classList.remove('bg-emerald-950/20', 'text-emerald-400', 'border-emerald-500/30');
            sonifierToggleBtn.classList.add('bg-emerald-500', 'text-black', 'border-emerald-400');
            sonifierToggleBtn.innerHTML = '<i class="fa-solid fa-volume-high mr-1 animate-pulse" id="synthIcon"></i> SONIFIER [ON]';
            triggerSonifierSfx('ping');
            triggerToast("Sonification online. Server room atmospheric frequency active.", "headphones");
        } else {
            if (backgroundRouterHum) {
                backgroundRouterHum.humGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.08);
                backgroundRouterHum.fanGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.08);
                backgroundRouterHum.rumbleGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
            }
            sonifierActive = false;
            sonifierToggleBtn.classList.add('bg-emerald-950/20', 'text-emerald-400', 'border-emerald-500/30');
            sonifierToggleBtn.classList.remove('bg-emerald-500', 'text-black', 'border-emerald-400');
            sonifierToggleBtn.innerHTML = '<i class="fa-solid fa-volume-xmark mr-1" id="synthIcon"></i> SONIFIER [OFF]';
            triggerToast("Sonification offline.", "volume-xmark");
        }
    });
});

function triggerSonifierSfx(type = 'ping') {
    if (!sonifierActive || !audioCtx) return;

    let osc = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();

    osc.type = oscType;
    gainNode.connect(masterGain || audioCtx.destination);
    osc.connect(gainNode);

    if (type === 'ping') {
        osc.frequency.setValueAtTime(basePitchFreq, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.14, audioCtx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.002, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
    } else if (type === 'alert') {
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(580, audioCtx.currentTime + 0.5);

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.002, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    }
}

function updateSynthWaveform(val) {
    oscType = val;
    document.getElementById('synthWaveType').textContent = val;
    triggerSonifierSfx('ping');
}

function updateSynthPitch(val) {
    basePitchFreq = parseInt(val);
    document.getElementById('synthPitchVal').textContent = val + "Hz";
    triggerSonifierSfx('ping');
}

const terminalInput = document.getElementById('terminalInput');
const terminalOutput = document.getElementById('terminalOutput');

terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const cmd = terminalInput.value.trim().toLowerCase();
        terminalInput.value = '';
        if (cmd) {
            processTerminalCommand(cmd);
        }
    }
});

function executeQuickCommand(cmd) {
    processTerminalCommand(cmd);
}

function processTerminalCommand(cmd) {
    const userLine = document.createElement('p');
    userLine.className = "text-emerald-400 mt-2";
    userLine.innerHTML = `<span class="text-neutral-500">yamkelo@noc-node:~$</span> ${cmd}`;
    terminalOutput.appendChild(userLine);

    const response = document.createElement('p');
    response.className = "text-neutral-300 ml-2 border-l border-emerald-500/20 pl-2 py-1";

    switch (cmd) {
        case 'help':
            response.innerHTML = `
                Available diagnostics parameters inside Yamkelo's Shell:<br>
                - <strong class="text-emerald-400">neofetch</strong>: Displays Tux system statistics and active environment status.<br>
                - <strong class="text-emerald-400">about</strong>: Display main personal biography and summary card.<br>
                - <strong class="text-emerald-400">qualifications</strong>: Queries qualifications and key focus areas at Rosebank International.<br>
                - <strong class="text-emerald-400">projects</strong>: Queries details of physical labs and script automation packages.<br>
                - <strong class="text-emerald-400">traceroute</strong>: Generates the logical hop-route to IP designation ${currentIdentity.ip}.<br>
                - <strong class="text-emerald-400">ping</strong>: Executes simulated ICMP requests to the Rosebank server node.<br>
                - <strong class="text-emerald-400">clear</strong>: Clears history trace buffers from active terminal shell space.
            `;
            break;
        case 'neofetch':
            response.innerHTML = `
                <div class="flex flex-col md:flex-row gap-4 items-start py-1">
                    <pre class="text-emerald-400 font-bold leading-tight text-[10px]">
  /\        
 /  \       
/\   \      
/  \   \     
/    \   \    
/  /\  \   \   
/  /  \  \  /   
/_______/__\/    
                    </pre>
                    <div class="text-xs space-y-0.5 font-mono text-neutral-300">
                        <p><strong class="text-emerald-400">yamkelo@rosebank-noc</strong></p>
                        <p>----------------------</p>
                        <p><strong class="text-emerald-400">OS:</strong> Arch Linux x86_64</p>
                        <p><strong class="text-emerald-400">Kernel:</strong> 6.9.12-arch-tux-NOC</p>
                        <p><strong class="text-emerald-400">Uptime:</strong> 23 days, 11 hours, 45 mins</p>
                        <p><strong class="text-emerald-400">Shell:</strong> bash 5.2.26</p>
                        <p><strong class="text-emerald-400">WM:</strong> Hyprland & GlazeWM</p>
                        <p><strong class="text-emerald-400">Terminal:</strong> Alacritty (NOC-Immersive)</p>
                        <p><strong class="text-emerald-400">CPU:</strong> Rosebank Virtual Node Core (8) @ 3.40GHz</p>
                        <p><strong class="text-emerald-400">Memory:</strong> 12.64 GB / 16.00 GB (79%)</p>
                        <p><strong class="text-emerald-400">Mascot Mode:</strong> Tux Protocol Online 🐧</p>
                    </div>
                </div>
            `;
            break;
        case 'about':
            response.innerHTML = `
                NOC CONSOLE OPERATOR: ${currentIdentity.name}<br>
                ASSIGNMENT SPEC: ${currentIdentity.role}<br>
                SUMMARY LOG: ${currentIdentity.bio}<br>
                ADDRESS HANDLE: ${currentIdentity.ip}
            `;
            break;
        case 'qualifications':
            response.innerHTML = `
                ACADEMIC RECORD ROUTE:<br>
                - <strong class="text-emerald-400">Institution:</strong> Rosebank International<br>
                - <strong class="text-emerald-400">Program:</strong> Diploma in IT (Network Management)<br>
                - <strong class="text-emerald-400">Student Serial:</strong> ST1052•••• [ENC/REDACTED]<br>
                - <strong class="text-emerald-400">Key Subnets Focus:</strong> Digital Transformation, Computer Architecture, Operating System security models.
            `;
            break;
        case 'projects':
            response.innerHTML = `
                Detected Active Projects switch ports:<br>
                - Route: 10.52.10.1: Physical Networking Laboratory (D-Link 24-Port architecture)<br>
                - Route: 10.52.20.1: System Automation Suite (Bash & Batch scripts)<br>
                - Route: 10.52.30.1: Linux Customization & Window Managers (Arch / Hyprland)<br>
                - Route: 10.52.40.1: IT Research Labs (Architecture Security Hardening models)
            `;
            break;
        case 'traceroute':
            response.innerHTML = `
                traceroute to network-node (${currentIdentity.ip}), 30 hops max:<br>
                1  10.52.0.1 (Local DNS Server Router)  1.425 ms  1.321 ms<br>
                2  10.52.1.254 (Departmental Core Switch)  4.901 ms  5.221 ms<br>
                3  ${currentIdentity.ip} (Yamkelo Vilakazi Core Node)  12.11 ms
            `;
            break;
        case 'ping':
            response.innerHTML = `
                PING ${currentIdentity.ip} with 64 bytes of diagnostic payload:<br>
                Reply from ${currentIdentity.ip}: seq_id=1 bytes=64 time=12ms TTL=64<br>
                Reply from ${currentIdentity.ip}: seq_id=2 bytes=64 time=13ms TTL=64<br>
                Packet loss: 0% nominal.
            `;
            triggerSonifierSfx('ping');
            break;
        case 'clear':
            terminalOutput.innerHTML = '<p class="text-neutral-500">// Terminal history cache cleared successfully.</p>';
            return;
        default:
            response.innerHTML = `Shell Command '${cmd}' not recognized in local terminal. Run <span class="text-emerald-400">help</span> to query available commands.`;
            break;
    }

    terminalOutput.appendChild(response);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

const canvas = document.getElementById('topologyCanvas');
const ctx = canvas.getContext('2d');
let nodes = [];
let syntaxParticles = [];
let mouseNode = { x: null, y: null, isMouse: true, vx: 0, vy: 0 };
let draggedNode = null;

class NetworkNode {
    constructor(x, y, label, role = "Node") {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = (Math.random() - 0.5) * 0.7;
        this.radius = 6;
        this.label = label;
        this.role = role;
        this.pulseFactor = Math.random() * Math.PI;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 40 || this.x > canvas.width - 40) this.vx *= -1;
        if (this.y < 40 || this.y > canvas.height - 40) this.vy *= -1;

        this.pulseFactor += 0.04;
    }

    draw() {
        const activeColor = '#10b981';
        
        if (this.role === "Linux Engine" || this.role === "UI Optimization") {
            ctx.font = '16px "Fira Code", monospace';
            ctx.textAlign = 'center';
            ctx.fillText("🐧", this.x, this.y + 5);
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 6 + Math.sin(this.pulseFactor) * 4, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(16, 185, 129, 0.2)`;
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '10px "Fira Code", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(this.label, this.x + 14, this.y + 4);
            return;
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + Math.sin(this.pulseFactor) * 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(16, 185, 129, 0.12)`;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius);
        ctx.fillStyle = activeColor;
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = '10px "Fira Code", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(this.label, this.x + 12, this.y + 4);
    }
}

class SyntaxParticle {
    constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
    }

    reset() {
        const syntaxes = [
            "SYN", "ACK", "SYN-ACK", "10.52.64.19/24", "255.255.255.0",
            "OSPF", "BGP", "ICMP Echo", "PORT: 22 (SSH)", "PORT: 443 (HTTPS)",
            "packet_id: 0x4F2A", "TTL: 64", "ARP WHO HAS 10.52.0.1",
            "ESTABLISHED", "LISTEN", "TIME_WAIT", "01010110", "ROUTE ADD",
            "TCP/IP", "DNS query", "DHCP ACK", "Tux Core Active"
        ];
        this.text = syntaxes[Math.floor(Math.random() * syntaxes.length)];
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 50;
        this.vy = -0.2 - Math.random() * 0.4;
        this.alpha = 0;
        this.maxAlpha = 0.05 + Math.random() * 0.15;
        this.fadeSpeed = 0.002 + Math.random() * 0.003;
        this.state = 'fadein';
        this.font = `${Math.floor(Math.random() * 4) + 9}px "Fira Code", monospace`;
    }

    update() {
        this.y += this.vy;
        if (this.state === 'fadein') {
            this.alpha += this.fadeSpeed;
            if (this.alpha >= this.maxAlpha) {
                this.alpha = this.maxAlpha;
                this.state = 'fadeout';
            }
        } else if (this.state === 'fadeout') {
            this.alpha -= this.fadeSpeed;
            if (this.alpha <= 0) {
                this.reset();
            }
        }

        if (this.y < -50 || this.x < -50 || this.x > canvas.width + 50) {
            this.reset();
        }
    }

    draw() {
        ctx.fillStyle = `rgba(16, 185, 129, ${this.alpha})`;
        ctx.font = this.font;
        ctx.textAlign = 'left';
        ctx.fillText(this.text, this.x, this.y);
    }
}

function initTopology() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    nodes = [];
    syntaxParticles = [];

    nodes.push(new NetworkNode(canvas.width * 0.22, canvas.height * 0.35, currentIdentity.name, "Host"));
    nodes.push(new NetworkNode(canvas.width * 0.45, canvas.height * 0.22, "D-Link 24-Port switch", "Hardware Lab"));
    nodes.push(new NetworkNode(canvas.width * 0.68, canvas.height * 0.3, "Bash & Windows Batch", "Automation"));
    nodes.push(new NetworkNode(canvas.width * 0.32, canvas.height * 0.65, "Arch Linux Core OS", "Linux Engine"));
    nodes.push(new NetworkNode(canvas.width * 0.52, canvas.height * 0.72, "Hyprland & GlazeWM", "UI Optimization"));
    nodes.push(new NetworkNode(canvas.width * 0.78, canvas.height * 0.58, "Java Systems", "Software Dev"));

    const particleCount = Math.floor((canvas.width * canvas.height) / 60000) + 10;
    for (let i = 0; i < Math.min(particleCount, 25); i++) {
        syntaxParticles.push(new SyntaxParticle());
    }

    document.getElementById('activeNodesCounter').textContent = `${nodes.length} NOC NODE MODULES SECURE`;
}

window.addEventListener('resize', initTopology);

window.addEventListener('mousemove', (e) => {
    mouseNode.x = e.clientX;
    mouseNode.y = e.clientY;
});

window.addEventListener('mousedown', (e) => {
    for (let node of nodes) {
        let dx = e.clientX - node.x;
        let dy = e.clientY - node.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 22) {
            draggedNode = node;
            triggerSonifierSfx('ping');
            break;
        }
    }
});

window.addEventListener('mouseup', () => {
    draggedNode = null;
});

function addTopologyNode(label, type) {
    const rx = Math.random() * (canvas.width - 240) + 120;
    const ry = Math.random() * (canvas.height - 240) + 120;
    nodes.push(new NetworkNode(rx, ry, label, type));
    document.getElementById('activeNodesCounter').textContent = `${nodes.length} NOC NODE MODULES SECURE`;
}

function drawTopology() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let syntax of syntaxParticles) {
        syntax.update();
        syntax.draw();
    }

    if (draggedNode && mouseNode.x && mouseNode.y) {
        draggedNode.x = mouseNode.x;
        draggedNode.y = mouseNode.y;
    }

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.lineWidth = 1;

    for (let i = 0; i < nodes.length; i++) {
        nodes[i].update();
        nodes[i].draw();

        for (let j = i + 1; j < nodes.length; j++) {
            let dx = nodes[i].x - nodes[j].x;
            let dy = nodes[i].y - nodes[j].y;
            let dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 290) {
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.stroke();
            }
        }

        if (mouseNode.x && mouseNode.y) {
            let mdx = mouseNode.x - nodes[i].x;
            let mdy = mouseNode.y - nodes[i].y;
            let mdist = Math.sqrt(mdx*mdx + mdy*mdy);
            if (mdist < 190) {
                ctx.strokeStyle = `rgba(16, 185, 129, ${0.12 * (1 - mdist/190)})`;
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(mouseNode.x, mouseNode.y);
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(drawTopology);
}

function injectIdentity(e) {
    e.preventDefault();

    currentIdentity.name = document.getElementById('configName').value.trim();
    currentIdentity.role = document.getElementById('configRole').value.trim();
    currentIdentity.studentId = document.getElementById('configStudentId').value.trim();
    currentIdentity.ip = document.getElementById('configIp').value.trim();
    currentIdentity.bio = document.getElementById('configBio').value.trim();

    document.getElementById('brandName').textContent = currentIdentity.name.toUpperCase();
    document.getElementById('brandRole').textContent = "NOC-MGMT";
    document.getElementById('hudName').textContent = currentIdentity.name.toUpperCase();
    document.getElementById('hudIp').textContent = currentIdentity.ip;
    
    document.getElementById('termNodeId').textContent = currentIdentity.name;
    document.getElementById('termId').textContent = currentIdentity.studentId;
    document.getElementById('termSpecialty').textContent = currentIdentity.role;
    document.getElementById('termIp').textContent = currentIdentity.ip;

    initTopology();
    addTopologyNode(`Node: ${currentIdentity.name}`, "Host");
    addTopologyNode(`IP: ${currentIdentity.ip}`, "IP Addr");

    triggerSonifierSfx('alert');
    triggerToast("NOC Configuration State updated successfully!", "sliders");

    localStorage.setItem('portfolio_yamkelo_identity', JSON.stringify(currentIdentity));
}

function simulateRoutePing(ip) {
    triggerSonifierSfx('ping');
    triggerToast(`Sending ICMP echo request to node ${ip}...`, "network-wired");
    
    setTimeout(() => {
        triggerSonifierSfx('ping');
        triggerToast(`Diagnostic Nominal: Node ${ip} responded in 12ms. Loss: 0%`, "circle-check");
    }, 300);
}

function filterProjects(subnet) {
    const cards = document.querySelectorAll('#projectsContainer > div');
    const buttons = document.querySelectorAll('.project-filter-btn');

    buttons.forEach(btn => {
        btn.classList.add('bg-neutral-950', 'text-neutral-400', 'border-neutral-900');
        btn.classList.remove('bg-emerald-950/20', 'text-emerald-400', 'border-emerald-500/30');
    });

    event.target.classList.remove('bg-neutral-950', 'text-neutral-400', 'border-neutral-900');
    event.target.classList.add('bg-emerald-950/20', 'text-emerald-400', 'border-emerald-500/30');

    cards.forEach(card => {
        if (subnet === 'all' || card.dataset.subnet === subnet) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
    triggerSonifierSfx('ping');
}

const incidentLogsList = document.getElementById('incidentLogsList');

const defaultIncidents = [
    { name: "Rosebank-Supervisor", message: "Successfully verified student portal connectivity. Network Management topology operational.", date: "06/08/2026 12:41" },
    { name: "IT-ClassMate", message: "Clean console interface and solid integration with Arch Linux custom parameters!", date: "06/08/2026 18:24" }
];

function getIncidentLogs() {
    const data = localStorage.getItem('yamkelo_incident_tickets');
    if (!data) {
        localStorage.setItem('yamkelo_incident_tickets', JSON.stringify(defaultIncidents));
        return defaultIncidents;
    }
    return JSON.parse(data);
}

function renderIncidentLogs() {
    const logs = getIncidentLogs();
    incidentLogsList.innerHTML = '';

    logs.forEach(log => {
        const item = document.createElement('div');
        item.className = "bg-black border border-neutral-900 p-3 rounded font-mono text-xs text-neutral-300 flex flex-col space-y-1.5";
        item.innerHTML = `
            <div class="flex justify-between items-center text-[10px] text-neutral-500">
                <span>OPERATOR TAG: <strong class="text-emerald-400">${escapeHtml(log.name)}</strong></span>
                <span>${log.date}</span>
            </div>
            <p class="text-neutral-400">${escapeHtml(log.message)}</p>
        `;
        incidentLogsList.appendChild(item);
    });
}

function submitIncident(e) {
    e.preventDefault();
    const name = document.getElementById('reporterName').value.trim();
    const msg = document.getElementById('reporterMessage').value.trim();

    if (!name || !msg) return;

    const timeNow = new Date();
    const formattedDate = `${String(timeNow.getMonth() + 1).padStart(2, '0')}/${String(timeNow.getDate()).padStart(2, '0')}/${timeNow.getFullYear()} ${String(timeNow.getHours()).padStart(2, '0')}:${String(timeNow.getMinutes()).padStart(2, '0')}`;

    const newTicket = {
        name: name,
        message: msg,
        date: formattedDate
    };

    const logs = getIncidentLogs();
    logs.unshift(newTicket);
    localStorage.setItem('yamkelo_incident_tickets', JSON.stringify(logs));
    
    document.getElementById('reporterName').value = '';
    document.getElementById('reporterMessage').value = '';

    renderIncidentLogs();
    triggerSonifierSfx('ping');
    triggerToast("Incident Ticket filed and logged locally.", "circle-check");
}

function clearIncidentLogs() {
    localStorage.setItem('yamkelo_incident_tickets', JSON.stringify(defaultIncidents));
    renderIncidentLogs();
    triggerSonifierSfx('alert');
    triggerToast("Incident logs flushed to default templates.", "circle-exclamation");
}

function triggerToast(msg, icon = "shield-halved") {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    toastMessage.textContent = msg;
    toastIcon.className = `fa-solid fa-${icon}`;

    toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
    }, 3000);
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    if (document.documentElement.classList.contains('light')) {
        document.documentElement.classList.remove('light');
        document.getElementById('themeIcon').className = "fa-solid fa-moon";
        triggerToast("Dark mode activated. Visual scan matrices calibrated.", "moon");
    } else {
        document.documentElement.classList.add('light');
        document.getElementById('themeIcon').className = "fa-solid fa-sun";
        triggerToast("Light mode activated. Luminescence levels increased.", "sun");
    }
});

const serverNoiseBtn = document.getElementById('serverNoiseBtn');
const serverNoiseContainer = document.getElementById('serverNoiseContainer');
const serverNoiseAudio = document.getElementById('serverNoiseAudio');
let serverNoiseActive = false;

const themePickerBtn = document.getElementById('themePickerBtn');
const themePickerMenu = document.getElementById('themePickerMenu');
const serverNoiseDismiss = document.getElementById('serverNoiseDismiss');

const themeLabels = {
    cyber: 'Cyber Matrix',
    night: 'Night Shift',
    solar: 'Solar Array',
    neon: 'Neon Noir',
    arctic: 'Arctic Pulse',
    ember: 'Ember Grid',
    plasma: 'Plasma Horizon',
    retro: 'Retro Terminal',
    ocean: 'Ocean Circuit',
    aurora: 'Aurora Spectrum'
};

const themeClasses = [
    'theme-night',
    'theme-solar',
    'theme-neon',
    'theme-arctic',
    'theme-ember',
    'theme-plasma',
    'theme-retro',
    'theme-ocean',
    'theme-aurora'
];

function getThemeLabel(theme) {
    return themeLabels[theme] || themeLabels.cyber;
}

function applyTheme(theme) {
    document.documentElement.classList.remove('light', ...themeClasses);
    if (theme !== 'cyber') {
        document.documentElement.classList.add(`theme-${theme}`);
    }
    themePickerBtn.innerHTML = `<span>THEME</span> <span class="text-emerald-400 font-semibold">${getThemeLabel(theme)}</span> <i class="fa-solid fa-chevron-down"></i>`;
    localStorage.setItem('portfolio_theme_choice', theme);
}

function loadSavedTheme() {
    const saved = localStorage.getItem('portfolio_theme_choice') || 'cyber';
    applyTheme(saved);
}

themePickerBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    themePickerMenu.classList.toggle('hidden');
});

themePickerMenu.addEventListener('click', (event) => {
    event.stopPropagation();
});

themePickerMenu.querySelectorAll('button[data-theme]').forEach((button) => {
    button.addEventListener('click', () => {
        applyTheme(button.dataset.theme);
        themePickerMenu.classList.add('hidden');
    });
});

document.addEventListener('click', () => {
    themePickerMenu.classList.add('hidden');
});

serverNoiseBtn.addEventListener('click', () => {
    serverNoiseActive = !serverNoiseActive;
    if (serverNoiseActive) {
        if (serverNoiseContainer) serverNoiseContainer.classList.remove('hidden');
        if (serverNoiseAudio) {
            serverNoiseAudio.currentTime = 0;
            serverNoiseAudio.load();
            serverNoiseAudio.play().catch(() => {
                triggerToast('Server noise ready, but autoplay is blocked. Please interact with the page.', 'volume-xmark');
            });
        }
        serverNoiseBtn.classList.add('bg-emerald-500', 'text-black', 'border-emerald-400');
        serverNoiseBtn.classList.remove('bg-neutral-950', 'text-neutral-400', 'border-neutral-900');
        triggerToast('Server noise activated. Playing local rack ambience.', 'volume-high');
    } else {
        if (serverNoiseAudio) serverNoiseAudio.pause();
        if (serverNoiseContainer) serverNoiseContainer.classList.add('hidden');
        serverNoiseBtn.classList.remove('bg-emerald-500', 'text-black', 'border-emerald-400');
        serverNoiseBtn.classList.add('bg-neutral-950', 'text-neutral-400', 'border-neutral-900');
        triggerToast('Server noise turned off.', 'volume-xmark');
    }
});

if (serverNoiseDismiss) {
    serverNoiseDismiss.addEventListener('click', () => {
        serverNoiseActive = false;
        if (serverNoiseAudio) serverNoiseAudio.pause();
        if (serverNoiseContainer) serverNoiseContainer.classList.add('hidden');
        serverNoiseBtn.classList.remove('bg-emerald-500', 'text-black', 'border-emerald-400');
        serverNoiseBtn.classList.add('bg-neutral-950', 'text-neutral-400', 'border-neutral-900');
        triggerToast('Server noise dismissed.', 'volume-xmark');
    });
}

document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.toggle('hidden');
});

window.onload = function() {
    loadSavedTheme();
    const stored = localStorage.getItem('portfolio_yamkelo_identity');
    if (stored) {
        currentIdentity = JSON.parse(stored);
        document.getElementById('configName').value = currentIdentity.name;
        document.getElementById('configRole').value = currentIdentity.role;
        document.getElementById('configStudentId').value = currentIdentity.studentId;
        document.getElementById('configIp').value = currentIdentity.ip;
        document.getElementById('configBio').value = currentIdentity.bio;

        document.getElementById('brandName').textContent = currentIdentity.name.toUpperCase();
        document.getElementById('hudName').textContent = currentIdentity.name.toUpperCase();
        document.getElementById('hudIp').textContent = currentIdentity.ip;
        
        document.getElementById('termNodeId').textContent = currentIdentity.name;
        document.getElementById('termId').textContent = currentIdentity.studentId;
        document.getElementById('termSpecialty').textContent = currentIdentity.role;
        document.getElementById('termIp').textContent = currentIdentity.ip;
    }

    initTopology();
    drawTopology();
    renderIncidentLogs();

    setInterval(() => {
        const mockPing = Math.floor(Math.random() * (16 - 8) + 8);
        document.getElementById('hudLatency').textContent = `${mockPing}ms`;
    }, 3000);
};
