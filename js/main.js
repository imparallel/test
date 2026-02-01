// [게임 데이터]
const game = {
    minerals: 0,
    clickPower: 1,
    autoMinerals: 0,
    coreLevel: 1,      // 행성 레벨 (New)
    multiplier: 1.0    // 전체 채굴 배율 (New)
};

// [엘리먼트 참조]
const elScore = document.getElementById('score-display');
const elSps = document.getElementById('sps-display');
const asteroid = document.getElementById('asteroid');
const shopList = document.getElementById('shop-list');

// [이니셜라이저]
function init() {
    loadGame(); // 저장된 데이터 불러오기
    renderShop();
    updateDisplay();
    requestAnimationFrame(gameLoop);

    // 1초마다 자동 저장
    setInterval(saveGame, 1000);
}

// [데이터 저장]
function saveGame() {
    const saveData = {
        minerals: game.minerals,
        clickPower: game.clickPower,
        autoMinerals: game.autoMinerals,
        itemCounts: items.map(item => item.count),
        coreLevel: game.coreLevel,
        multiplier: game.multiplier
    };
    localStorage.setItem('spaceMinerSave', JSON.stringify(saveData));
}

// [데이터 로드]
function loadGame() {
    const saveString = localStorage.getItem('spaceMinerSave');
    if (saveString) {
        const saveData = JSON.parse(saveString);
        game.minerals = saveData.minerals || 0;
        game.clickPower = saveData.clickPower || 1;
        game.autoMinerals = saveData.autoMinerals || 0;
        game.coreLevel = saveData.coreLevel || 1;
        game.multiplier = saveData.multiplier || 1.0;

        // 아이템 개수 복구
        if (saveData.itemCounts && saveData.itemCounts.length === items.length) {
            items.forEach((item, index) => {
                item.count = saveData.itemCounts[index];
            });
        }
    }
}

// [데이터 초기화]
function resetGame() {
    if (confirm("정말로 모든 데이터를 삭제하고 처음부터 시작하시겠습니까?")) {
        localStorage.removeItem('spaceMinerSave');
        location.reload();
    }
}

// [핵심: 화면 갱신]
function updateDisplay() {
    // 실제 채굴량 = (기본 + 자동) * 배율
    const totalSps = game.autoMinerals * game.multiplier;

    elScore.innerText = Math.floor(game.minerals).toLocaleString();
    elSps.innerHTML = `${totalSps.toLocaleString()} Minerals / sec<br><span style="font-size:0.8rem; color:#ff4444">Core Lv.${game.coreLevel} (x${game.multiplier.toFixed(1)})</span>`;

    // 상점 버튼 활성/비활성 업데이트
    items.forEach(item => {
        const btn = document.getElementById(`btn-${item.id}`);
        if (btn) { // 버튼이 존재할 때만 업데이트
            const currentCost = Math.floor(item.baseCost * Math.pow(1.15, item.count));
            if (game.minerals >= currentCost) {
                btn.classList.remove('disabled');
            } else {
                btn.classList.add('disabled');
            }
            // 가격 표시 업데이트
            const costEl = btn.querySelector('.item-cost');
            if (costEl) costEl.innerText = `${currentCost.toLocaleString()} M`;
        }
    });
}

// [핵심: 채굴]
function mine(x, y) {
    const amount = game.clickPower * game.multiplier; // 배율 적용
    game.minerals += amount;

    // 클릭 효과 (파티클)
    createParticle(x, y, `+${Math.floor(amount)}`);

    // 행성 흔들림 효과
    asteroid.style.transform = `scale(0.95) rotate(${Math.random() * 4 - 2}deg)`;
    setTimeout(() => {
        asteroid.style.transform = 'scale(1) rotate(0deg)';
    }, 100);

    updateDisplay();
}

// [이벤트 리스너]
if (asteroid) {
    asteroid.addEventListener('mousedown', (e) => mine(e.clientX, e.clientY));
    asteroid.addEventListener('touchstart', (e) => {
        e.preventDefault(); // 더블탭 줌 방지
        const touch = e.changedTouches[0];
        mine(touch.clientX, touch.clientY);
    });
}

// [파티클 생성]
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

// [상점 렌더링]
function renderShop() {
    shopList.innerHTML = '';
    items.forEach((item, idx) => {
        const currentCost = Math.floor(item.baseCost * Math.pow(1.15, item.count));

        const div = document.createElement('div');
        div.id = `btn-${item.id}`;
        div.className = 'upgrade-item disabled'; // 처음엔 비활성
        div.onclick = () => buyItem(item); // 객체 직접 전달

        div.innerHTML = `
            <div class="item-info">
                <h4>${item.name} <span class="item-count">${item.count}</span></h4>
                <p>${item.desc}</p>
            </div>
            <div class="item-cost">${currentCost.toLocaleString()} M</div>
        `;
        shopList.appendChild(div);
    });
}

// [아이템 구매]
function buyItem(item) {
    const cost = Math.floor(item.baseCost * Math.pow(1.15, item.count));
    if (game.minerals >= cost) {
        game.minerals -= cost;
        item.count++;

        if (item.type === 'click') {
            game.clickPower += item.basePower;
        } else if (item.type === 'auto') {
            game.autoMinerals += item.basePower;
        }

        updateDisplay();

        // 간단 UI 업데이트
        const btn = document.getElementById(`btn-${item.id}`);
        if (btn) btn.querySelector('.item-count').innerText = item.count;
    }
}

// [코어 과부하 로직]
function upgradeCore() {
    const cost = 1000 * Math.pow(2, game.coreLevel - 1); // 레벨별 최소 요구량

    if (game.minerals < cost) {
        alert(`코어 에너지가 부족합니다!\n최소 ${cost.toLocaleString()} 미네랄이 필요합니다.`);
        return;
    }

    const chance = Math.max(10, 90 - (game.coreLevel - 1) * 10); // 레벨당 10%씩 감소 (최소 10%)

    if (confirm(`[위험] 코어 과부하를 시도합니까?\n\n현재 레벨: Lv.${game.coreLevel}\n성공 확률: ${chance}%\n비용: 보유 미네랄 절반 소멸\n\n실패 시 행성이 파괴됩니다.`)) {

        // 비용 지불 (보유량의 50%)
        game.minerals = Math.floor(game.minerals / 2);
        updateDisplay();

        // 연출: 행성 떨림
        asteroid.style.transition = "transform 0.1s";
        const shakeInterval = setInterval(() => {
            asteroid.style.transform = `scale(1.1) rotate(${Math.random() * 20 - 10}deg)`;
        }, 50);

        setTimeout(() => {
            clearInterval(shakeInterval);
            asteroid.style.transform = "scale(1)";
            const success = Math.random() * 100 < chance;

            if (success) {
                game.coreLevel++;
                game.multiplier += 0.2; // 20% 증가
                alert(`[SUCCESS] 과부하 성공! 코어 레벨이 상승했습니다!\nLv.${game.coreLevel} (채굴 효율 +${Math.round((game.multiplier - 1) * 100)}%)`);
                createParticle(window.innerWidth / 2, window.innerHeight / 2, "CORE LEVEL UP!");
            } else {
                // 실패 시 행성 파괴
                localStorage.removeItem('spaceMinerSave');
                document.body.innerHTML = `
                    <div style='display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;color:white;background:black;text-align:center;'>
                        <h1 style='color:red;font-size:3rem;'>GAME OVER</h1>
                        <p>코어 과부하로 행성이 붕괴되었습니다.</p>
                        <p style='color:#666;'>미네랄과 업그레이드가 모두 소멸했습니다.</p>
                        <button onclick='location.reload()' style='margin-top:20px;padding:10px 20px;background:white;color:black;border:none;border-radius:5px;cursor:pointer;font-weight:bold;'>새로운 행성 찾기</button>
                    </div>
                `;
            }
            updateDisplay();
            saveGame();
        }, 1500); // 1.5초 두근두근 연출
    }
}

// [게임 루프 - 자동 채굴]
let lastTime = Date.now();
function gameLoop() {
    const now = Date.now();
    const dt = (now - lastTime) / 1000; // 델타 타임 (초 단위)
    lastTime = now;

    if (game.autoMinerals > 0) {
        game.minerals += (game.autoMinerals * game.multiplier) * dt; // 배율 적용
        updateDisplay();
    }

    requestAnimationFrame(gameLoop);
}

// [모달 제어]
function openModal() {
    const list = document.getElementById('patch-list');
    list.innerHTML = '';

    // items 변수와 patchNotes 변수는 data.js에서 로드됨
    if (typeof patchNotes !== 'undefined') {
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
    }

    document.getElementById('modal-overlay').style.display = 'flex';
}

function closeModal(e) {
    if (e.target.id === 'modal-overlay') {
        document.getElementById('modal-overlay').style.display = 'none';
    }
}

// 게임 시작
init();
