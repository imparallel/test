// [게임 데이터]
const game = {
    vault: 0,       // [New] 안전 자산 (저장된 돈)
    minerals: 0,    // 현재 채굴통 (위험한 돈)
    clickPower: 1,
    autoMinerals: 0,
    coreLevel: 1,      // 행성 레벨
    multiplier: 1.0,   // 전체 채굴 배율
    planetColor: null  // 행성 색상
};
window.onload = init;

// [엘리먼트 참조]
const elScore = document.getElementById('score-display');
const elSps = document.getElementById('sps-display');
const asteroid = document.getElementById('asteroid');
const shopList = document.getElementById('shop-list');

// [이니셜라이저]
let saveInterval;
let gameLoopId;

// [자원 소비 로직: 금고 우선 차감]
function spendResources(amount) {
    if (game.vault >= amount) {
        game.vault -= amount;
    } else {
        const remainder = amount - game.vault;
        game.vault = 0;
        game.minerals -= remainder;
    }
}

function init() {
    loadGame();
    setPlanetAppearance(); // 행성 외형 적용
    renderShop();
    updateDisplay();

    // [UI] 버전 정보 자동 동기화 (data.js 연동)
    if (typeof patchNotes !== 'undefined' && patchNotes.length > 0) {
        const latestVersion = patchNotes[0].version;
        // 우측 하단 버전 표시 업데이트
        const elVersion = document.getElementById('version-display');
        if (elVersion) elVersion.innerText = latestVersion;
    }

    gameLoopId = requestAnimationFrame(gameLoop); // ID 저장
    saveInterval = setInterval(saveGame, GAME_CONFIG.SYSTEM.AUTO_SAVE_INTERVAL);
}

// [게임 루프 - 자동 채굴]
let lastTime = Date.now();
function gameLoop() {
    const now = Date.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    if (game.autoMinerals > 0) {
        // 최대 용량 계산 (Helper 사용)
        const maxCapacity = getMaxCapacity();

        // 용량 여유가 있을 때만 채굴
        if (game.minerals < maxCapacity) {
            const amount = (game.autoMinerals * game.multiplier) * dt;
            // [Fix] 하드 캡 적용 (1도 초과하지 않도록)
            game.minerals = Math.min(game.minerals + amount, maxCapacity);
            updateDisplay();
        }
    }

    gameLoopId = requestAnimationFrame(gameLoop); // ID 업데이트
}

// [데이터 저장]
function saveGame() {
    const saveData = {
        vault: game.vault, // [New]
        minerals: game.minerals,
        clickPower: game.clickPower,
        autoMinerals: game.autoMinerals,
        itemCounts: items.map(item => item.count),
        coreLevel: game.coreLevel,
        multiplier: game.multiplier,
        planetColor: game.planetColor
    };
    localStorage.setItem('spaceMinerSave', JSON.stringify(saveData));
}

// [데이터 로드]
function loadGame() {
    const saveString = localStorage.getItem('spaceMinerSave');
    if (saveString) {
        const saveData = JSON.parse(saveString);
        game.vault = saveData.vault || 0; // [New]
        game.minerals = saveData.minerals || 0;
        game.clickPower = saveData.clickPower || 1;
        game.autoMinerals = saveData.autoMinerals || 0;
        game.coreLevel = saveData.coreLevel || 1;
        game.multiplier = saveData.multiplier || 1.0;
        game.planetColor = saveData.planetColor || null;

        // 아이템 개수 복구
        if (saveData.itemCounts && saveData.itemCounts.length === items.length) {
            items.forEach((item, index) => {
                item.count = saveData.itemCounts[index];
            });
        }
    }
}

// [행성 외형 설정]
function setPlanetAppearance() {
    const asteroid = document.getElementById('asteroid');
    if (!game.planetColor) {
        // 색상이 없으면 랜덤 생성
        game.planetColor = generateRandomPlanetColor();
    }
    // CSS 변수 대신 직접 스타일 주입 (그라데이션)
    asteroid.style.background = `linear-gradient(135deg, ${game.planetColor[0]}, ${game.planetColor[1]})`;
    asteroid.style.boxShadow = `0 0 30px ${game.planetColor[0]}44, inset -20px -20px 50px rgba(0,0,0,0.5)`;
}

function generateRandomPlanetColor() {
    // data.js에 정의된 PLANET_COLORS 사용
    if (typeof PLANET_COLORS !== 'undefined') {
        return PLANET_COLORS[Math.floor(Math.random() * PLANET_COLORS.length)];
    }
    // Fallback (혹시 모를 에러 방지)
    return ['#ef5350', '#b71c1c'];
}

// [데이터 초기화]
function resetGame() {
    if (confirm("정말로 모든 데이터를 삭제하고 처음부터 시작하시겠습니까?")) {
        localStorage.removeItem('spaceMinerSave');
        game.planetColor = null;
        location.reload();
    }
}

// [Helper: 최대 저장 용량 계산]
function getMaxCapacity() {
    // 기본 3000 * (2.0 ^ (Lv-1))
    return Math.floor(GAME_CONFIG.CORE.BASE_CAPACITY * Math.pow(GAME_CONFIG.CORE.CAPACITY_MULTIPLIER, game.coreLevel - 1));
}

// [핵심: 화면 갱신]
function updateDisplay() {
    // 실제 채굴량 = (기본 + 자동) * 배율
    const totalSps = game.autoMinerals * game.multiplier;

    // 저장 용량 계산
    const maxCapacity = getMaxCapacity();
    const totalWealth = game.vault + game.minerals; // 총 자산

    // [UI] 미네랄 표시: 금고(Vault) + 채굴통(Minerals)
    let scoreHTML = '';

    // 1. 금고에 돈이 있을 때만 상단에 표시 (초록색)
    if (game.vault > 0) {
        scoreHTML += `<div style='font-size:0.6rem; color:#44ff44; margin-bottom:5px;'>
            (+ ${Math.floor(game.vault).toLocaleString()} Saved)
        </div>`;
    }

    // 2. 메인 채굴통 표시 (꽉 차면 빨간색)
    const isFull = game.minerals >= maxCapacity;
    const colorStyle = isFull ? 'color:#ff4444' : '';

    scoreHTML += `
        <span style="${colorStyle}">${Math.floor(game.minerals).toLocaleString()}</span> 
        <span style="font-size:0.5em; color:#666;"> / ${maxCapacity.toLocaleString()}</span>
        ${isFull ? '<span style="font-size:0.4em; color:#ff4444; margin-left:5px;">(MAX)</span>' : ''}
    `;

    elScore.innerHTML = scoreHTML;

    elSps.innerHTML = `${totalSps.toLocaleString()} Minerals / sec<br><span style="font-size:0.8rem; color:#bbaadd">Core Lv.${game.coreLevel} (x${game.multiplier.toFixed(1)})</span>`;

    // 상점 버튼 활성/비활성 업데이트
    items.forEach(item => {
        const btn = document.getElementById(`btn-${item.id}`);
        if (btn) {
            const currentCost = Math.floor(item.baseCost * Math.pow(GAME_CONFIG.ITEM.COST_MULTIPLIER, item.count));

            // [구매력 체크] 지갑 + 금고 합산 금액으로 판단
            const affordable = totalWealth >= currentCost;

            // [용량 체크] 시각적 경고용 (구매는 막지 않음)
            const capacityLimit = currentCost > maxCapacity;

            // [Fix] 구매 가능하면 무조건 활성화 (용량 초과 경고는 별도)
            if (affordable) {
                btn.classList.remove('disabled');
                btn.classList.remove('impossible');
            } else {
                btn.classList.add('disabled');
                if (capacityLimit) btn.classList.add('impossible');
            }

            // 가격 표시
            const costEl = btn.querySelector('.item-cost');
            // [Fix] 돈이 부족할 때만 빨갛게? 아니면 용량 초과일 때?
            // "살 수 있으면 하얀색, 못 사면 빨간색/회색"이 국룰.
            // 여기선 'affordable'하면 원래 색, 아니면 딤드 처리됨.
            // 추가로 '용량 초과'임을 알리기 위해 텍스트 색상을 주황색 등으로 변경 가능하나,
            // 유저 요청은 "살 수 있는데 빨간 건 당황스럽다"였으므로,
            // affordable일 때는 색상 강제 변경을 하지 않도록 수정.
            costEl.style.color = capacityLimit ? '#ffaa00' : ''; // 용량 초과는 주황색 경고
            if (costEl) costEl.innerText = `${currentCost.toLocaleString()} M`;
        }
    });

    // 코어 진화 비용 표시 업데이트 (버튼 텍스트는 그대로 두고 툴팁이나 비용 표시를 동적으로 할 수 있음)
    // 현재는 버튼 클릭 시 confirm 창에서 비용 확인
}

// [핵심: 채굴]
function mine(x, y) {
    const maxCapacity = getMaxCapacity();

    if (game.minerals >= maxCapacity) {
        createParticle(x, y, "MAX!");
        return;
    }

    const amount = game.clickPower * game.multiplier;
    // [Fix] 하드 캡 적용
    game.minerals = Math.min(game.minerals + amount, maxCapacity);

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
        e.preventDefault();
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
    const randomX = (Math.random() - 0.5) * 40;
    el.style.transform = `translate(${randomX}px, 0)`;

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

// [상점 렌더링]
function renderShop() {
    shopList.innerHTML = '';
    items.forEach((item, idx) => {
        const currentCost = Math.floor(item.baseCost * Math.pow(GAME_CONFIG.ITEM.COST_MULTIPLIER, item.count));

        const div = document.createElement('div');
        div.id = `btn-${item.id}`;
        div.className = 'upgrade-item disabled';
        div.onclick = () => buyItem(item);

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
    const currentCost = Math.floor(item.baseCost * Math.pow(GAME_CONFIG.ITEM.COST_MULTIPLIER, item.count));
    const totalWealth = game.vault + game.minerals;

    // 구매력 & 용량 체크
    if (totalWealth >= currentCost) {
        // [New] 소비 로직 적용
        spendResources(currentCost);

        item.count++;

        if (item.type === 'click') {
            game.clickPower += item.basePower;
        } else if (item.type === 'auto') {
            game.autoMinerals += item.basePower;
        }

        updateDisplay();

        // 버튼 카운트 업데이트
        const btn = document.getElementById(`btn-${item.id}`);
        if (btn) btn.querySelector('.item-count').innerText = item.count;
    }
}

// [코어 과부하 로직]
function upgradeCore() {
    const totalWealth = game.vault + game.minerals;

    // [Fix] 최소 요구 비용 계산 (레벨별)
    const minCost = Math.floor(GAME_CONFIG.CORE.BASE_COST * Math.pow(GAME_CONFIG.CORE.COST_MULTIPLIER, game.coreLevel - 1));

    // 실제 비용: 보유 자산의 50% vs 최소 비용 중 큰 값
    let cost = Math.max(Math.floor(totalWealth * GAME_CONFIG.CORE.EVOLUTION_COST_RATE), minCost);

    const chance = Math.floor(Math.max(GAME_CONFIG.CORE.MIN_CHANCE, GAME_CONFIG.CORE.BASE_CHANCE - (game.coreLevel - 1) * GAME_CONFIG.CORE.CHANCE_DECREASE));

    // 비용 부족 시 (50% 룰 때문에 보통은 통과하지만, 돈이 최소비용보다 적으면 걸림)
    if (totalWealth < cost) {
        alert(`코어 에너지가 부족합니다!\n최소 ${minCost.toLocaleString()} 미네랄이 필요합니다.`);
        return;
    }

    // 메시지 수정: 고정 비용이 아닌 '현재 자산의 50%'임을 명시
    if (confirm(`[COSMIC EVENT] 코어 진화를 시도하시겠습니까?\n\n현재 레벨: Lv.${game.coreLevel}\n성공 확률: ${chance}%\n비용: ${cost.toLocaleString()} M (Min: ${minCost.toLocaleString()})\n\n⚠ 실패 시 행성이 붕괴되며, 남은 자산의 50%만 구조됩니다.`)) {

        // 비용 지불 (금고 우선)
        spendResources(cost);
        updateDisplay();

        const asteroid = document.getElementById('asteroid');
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
                game.multiplier += GAME_CONFIG.CORE.REWARD_MULTIPLIER;
                showLevelUpEffect(game.coreLevel);
            } else {
                // [실패]

                clearInterval(saveInterval);
                cancelAnimationFrame(gameLoopId);

                // 남은 돈(비용 내고 남은 50%)의 100%(설정값)를 구조
                const remainingWealth = game.vault + game.minerals;
                const inheritance = Math.floor(remainingWealth * GAME_CONFIG.CORE.FAIL_INHERITANCE_RATE);

                game.vault = inheritance;
                game.minerals = 0;

                game.coreLevel = 1;
                game.multiplier = 1.0;
                game.clickPower = 1;
                game.autoMinerals = 0;

                game.planetColor = generateRandomPlanetColor();
                setPlanetAppearance();

                items.forEach(item => item.count = 0);

                saveGame();

                // UI 업데이트
                const miningZone = document.getElementById('mining-zone');
                miningZone.innerHTML = `
                    <div style='display:flex;justify-content:center;align-items:center;height:100%;flex-direction:column;text-align:center;'>
                        <h1 style='color:#aaddff; font-size:3rem; margin-bottom: 20px; text-shadow: 0 0 30px rgba(100,200,255,0.5);'>EVOLUTION FAILED</h1>
                        <p style='font-size: 1.2rem; margin-bottom: 10px; color:#ccc;'>행성이 붕괴되었습니다.</p>
                        <p style='color:#44ff44; margin-bottom: 30px; font-size:0.9rem; font-weight:bold;'>
                            ✨ 자산 구조 성공: ${inheritance.toLocaleString()} M (50%) ✨
                        </p>
                        <button onclick='location.reload()' style='padding:15px 30px; background:linear-gradient(135deg, #667eea, #764ba2); color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size: 1rem; box-shadow: 0 0 15px rgba(118, 75, 162, 0.5);'>🧬 새로운 행성에서 재시작</button>
                    </div>
                `;
            }
            updateDisplay();
            if (success) saveGame();
        }, 1500);
    }
}

// [레벨업 연출 함수]
function showLevelUpEffect(level) {
    const miningZone = document.getElementById('mining-zone');
    const el = document.createElement('div');
    el.className = 'levelup-overlay';
    el.style.position = 'absolute';
    el.innerHTML = `CORE LEVEL UP!<br><span style="font-size:2rem; color:#fff;">Lv.${level}</span>`;
    miningZone.appendChild(el);

    miningZone.style.transition = "background-color 0.1s";
    miningZone.style.backgroundColor = "#2a3544";
    setTimeout(() => miningZone.style.backgroundColor = "", 200);

    setTimeout(() => el.remove(), 2000);
}

// [모달 제어]
function openModal() {
    const list = document.getElementById('patch-list');
    list.innerHTML = '';

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
