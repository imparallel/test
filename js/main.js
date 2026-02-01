// [Engine: Game Logic]
const game = { points: 0, clickPower: 1, autoPower: 0 };

// [Init]
function init() {
    loadGame();
    renderShop();
    updateDisplay();
    requestAnimationFrame(loop);
    setInterval(saveGame, 1000);

    // Interaction
    document.getElementById('asteroid').addEventListener('pointerdown', handleMine);
}

// [Core Action: Mine]
function handleMine(e) {
    // Check for pointer events or fallback to touch/mouse logic
    // Using simple clientX/Y from the event passed
    mine(e.clientX, e.clientY);
}

function mine(x, y) {
    game.points += game.clickPower;

    // 클릭 효과 (파티클)
    createParticle(x, y, `+${game.clickPower}`);
    updateDisplay();

    // 행성 흔들림 효과
    const asteroid = document.getElementById('asteroid');
    asteroid.style.transform = `scale(0.95) rotate(${Math.random() * 4 - 2}deg)`;
    setTimeout(() => {
        asteroid.style.transform = 'scale(1) rotate(0deg)';
    }, 100);
}

function createParticle(x, y, text) {
    const el = document.createElement('div');
    el.classList.add('click-effect');
    el.innerText = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    // 약간의 랜덤 위치 보정
    const randomX = (Math.random() - 0.5) * 40;
    el.style.transform = `translate(${randomX}px, 0)`;

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

// [System: Shop]
function renderShop() {
    const list = document.getElementById('shop-list');
    list.innerHTML = '';
    items.forEach((item, idx) => {
        const currentCost = Math.floor(item.baseCost * Math.pow(1.15, item.count));

        const el = document.createElement('div');
        el.className = 'upgrade-item disabled';
        el.id = `item-${idx}`; // Keeping ID consistent with logic
        el.onclick = () => buyItem(idx);

        el.innerHTML = `
            <div class="item-info">
                <h4>${item.name} <span class="item-count">${item.count}</span></h4>
                <p>${item.desc}</p>
            </div>
            <div class="item-cost">${currentCost.toLocaleString()} M</div>
        `;
        list.appendChild(el);
    });
    updateShopUI();
}

function updateShopUI() {
    items.forEach((item, idx) => {
        const price = Math.floor(item.baseCost * Math.pow(1.15, item.count));
        const el = document.getElementById(`item-${idx}`);
        if (el) {
            el.querySelector('.item-cost').innerText = price.toLocaleString() + ' M';
            el.querySelector('.item-count').innerText = item.count;

            if (game.points >= price) el.classList.remove('disabled');
            else el.classList.add('disabled');
        }
    });
}

function buyItem(idx) {
    const item = items[idx];
    const price = Math.floor(item.baseCost * Math.pow(1.15, item.count));
    if (game.points >= price) {
        game.points -= price;
        item.count++;
        if (item.type === 'click') game.clickPower += item.basePower;
        else game.autoPower += item.basePower;
        updateDisplay();
        updateShopUI();
    }
}

// [System: Display & Loop]
function updateDisplay() {
    document.getElementById('score-display').innerText = Math.floor(game.points).toLocaleString();
    document.getElementById('sps-display').innerText = `${game.autoPower.toLocaleString()} Minerals / sec`;
    updateShopUI();
}

let lastTime = Date.now();
function loop() {
    const now = Date.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    if (game.autoPower > 0) {
        game.points += game.autoPower * dt;
        updateDisplay();
    }
    requestAnimationFrame(loop);
}

// [System: Save/Load]
function saveGame() {
    const data = { points: game.points, clickPower: game.clickPower, autoPower: game.autoPower, counts: items.map(i => i.count) };
    localStorage.setItem('prlMinerSave', JSON.stringify(data));
}
function loadGame() {
    const data = JSON.parse(localStorage.getItem('prlMinerSave'));
    if (data) {
        game.points = data.points || 0;
        game.clickPower = data.clickPower || 1;
        game.autoPower = data.autoPower || 0;
        if (data.counts) items.forEach((i, idx) => i.count = data.counts[idx] || 0);
    }
}
function resetGame() {
    if (confirm("Reset all data?")) {
        localStorage.removeItem('prlMinerSave');
        location.reload();
    }
}

// [Theme]
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    const svg = document.querySelector('#theme-toggle svg');
    if (isDark) {
        // Sun Icon Code
        svg.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    } else {
        // Moon Icon Code
        svg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    }
}

// [모달 제어]
function openModal() {
    const list = document.getElementById('patch-list');
    list.innerHTML = '';

    // patchNotes는 data.js에서 로드됨
    patchNotes.forEach(note => {
        const item = document.createElement('div');
        item.className = 'patch-item';

        let changeHtml = '<ul class="patch-desc">';
        note.changes.forEach(c => changeHtml += `<li>${c}</li>`);
        changeHtml += '</ul>';

        item.innerHTML = `
            <div class="patch-ver">${note.version}</div>
            <div class="patch-date">${note.date}</div>
            ${changeHtml}
        `;
        list.appendChild(item);
    });

    document.getElementById('modal-overlay').style.display = 'flex';
}

function closeModal(e) {
    if (e.target.id === 'modal-overlay') {
        document.getElementById('modal-overlay').style.display = 'none';
    }
}

// 페이지 로드 완료 시 실행
window.onload = init;
