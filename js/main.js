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
let saveInterval;
let gameLoopId; // [New]
// [코어 과부하 로직]
function upgradeCore() {
    // [Balance] 설정된 밸런스 적용
    const cost = Math.floor(GAME_CONFIG.CORE.BASE_COST * Math.pow(GAME_CONFIG.CORE.COST_MULTIPLIER, game.coreLevel - 1));

    if (game.minerals < cost) {
        alert(`코어 에너지가 부족합니다!\n최소 ${cost.toLocaleString()} 미네랄이 필요합니다.`);
        return;
    }

    const chance = Math.floor(Math.max(GAME_CONFIG.CORE.MIN_CHANCE, GAME_CONFIG.CORE.BASE_CHANCE - (game.coreLevel - 1) * GAME_CONFIG.CORE.CHANCE_DECREASE));

    if (confirm(`[COSMIC EVENT] 코어 진화를 시도하시겠습니까?\n\n현재 레벨: Lv.${game.coreLevel}\n성공 확률: ${chance}%\n비용: 보유 미네랄 50% 소멸\n\n⚠ 실패 시 진화 에너지를 감당하지 못하고 행성이 붕괴됩니다.`)) {

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
                game.multiplier += GAME_CONFIG.CORE.REWARD_MULTIPLIER;
                // alert 제거 (연출로 대체)
                showLevelUpEffect(game.coreLevel);
            } else {
                // [실패] 행성 파괴 (하지만 미네랄은 보존)

                // 1. 자동 저장 및 게임 루프 중단
                clearInterval(saveInterval);
                cancelAnimationFrame(gameLoopId);

                // 2. 미네랄 제외한 모든 데이터 초기화
                game.coreLevel = 1;
                game.multiplier = 1.0;
                game.clickPower = 1;
                game.autoMinerals = 0;

                // [New] 새로운 행성 발견 (색상 변경)
                game.planetColor = generateRandomPlanetColor();
                setPlanetAppearance();

                // 아이템 초기화
                items.forEach(item => item.count = 0);

                // 3. 변경된 상태(초기화 + 미네랄 보존) 저장
                saveGame();

                // 4. 왼쪽 화면(Mining Zone) 게임 오버 UI
                const miningZone = document.getElementById('mining-zone');
                miningZone.innerHTML = `
                    <div style='display:flex;justify-content:center;align-items:center;height:100%;flex-direction:column;text-align:center;'>
                        <h1 style='color:#aaddff; font-size:3rem; margin-bottom: 20px; text-shadow: 0 0 30px rgba(100,200,255,0.5);'>EVOLUTION FAILED</h1>
                        <p style='font-size: 1.2rem; margin-bottom: 10px; color:#ccc;'>에너지 역류로 인해 행성이 붕괴되었습니다.</p>
                        <p style='color:#44ff44; margin-bottom: 30px; font-size:0.9rem; font-weight:bold;'>✨ 탈출 포드로 미네랄은 회수했습니다! ✨</p>
                        <button onclick='location.reload()' style='padding:15px 30px; background:linear-gradient(135deg, #667eea, #764ba2); color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size: 1rem; box-shadow: 0 0 15px rgba(118, 75, 162, 0.5);'>🧬 새로운 행성에서 재시작</button>
                    </div>
                `;
            }
            updateDisplay();
            // 성공 시에만 저장 (실패 시에는 이미 지웠고 저장하면 안됨)
            if (success) saveGame();
        }, 1500); // 1.5초 두근두근 연출
    }
}

// [Helper: 최대 저장 용량 계산]
function getMaxCapacity() {
    // 기본 3000 * (2.1 ^ (Lv-1))
    // 비용(1.9배)보다 항상 빠르게 성장하도록 설정 (Deadlock 방지)
    return Math.floor(GAME_CONFIG.CORE.BASE_CAPACITY * Math.pow(GAME_CONFIG.CORE.CAPACITY_MULTIPLIER, game.coreLevel - 1));
}
function init() {
    loadGame();
    setPlanetAppearance(); // 행성 외형 적용
    renderShop();
    updateDisplay();
    gameLoopId = requestAnimationFrame(gameLoop); // ID 저장
    saveInterval = setInterval(saveGame, 1000);
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
            game.minerals += (game.autoMinerals * game.multiplier) * dt;
            if (game.minerals > maxCapacity) game.minerals = maxCapacity; // 초과 절삭
            updateDisplay();
        }
    }

    gameLoopId = requestAnimationFrame(gameLoop); // ID 업데이트
}

// [데이터 저장]
function saveGame() {
    const saveData = {
        minerals: game.minerals,
        clickPower: game.clickPower,
        autoMinerals: game.autoMinerals,
        itemCounts: items.map(item => item.count),
        coreLevel: game.coreLevel,
        multiplier: game.multiplier,
        planetColor: game.planetColor // 색상 저장
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
        game.planetColor = saveData.planetColor || null; // 색상 로드

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
    // 예쁜 우주 색상 팔레트
    const colors = [
        ['#ef5350', '#b71c1c'], // Red Mars
        ['#42a5f5', '#1565c0'], // Blue Neptune
        ['#66bb6a', '#2e7d32'], // Green Terra
        ['#ffd54f', '#ff8f00'], // Yellow Venus
        ['#ab47bc', '#6a1b9a'], // Purple Void
        ['#8d6e63', '#4e342e'], // Brown Rocky
        ['#bdbdbd', '#424242'], // Grey Moon
        ['#26c6da', '#00838f'], // Cyan Ice
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// [데이터 초기화]
function resetGame() {
    if (confirm("정말로 모든 데이터를 삭제하고 처음부터 시작하시겠습니까?")) {
        localStorage.removeItem('spaceMinerSave');
        game.planetColor = null; // 색상 초기화
        location.reload();
    }
}

// [핵심: 화면 갱신]
function updateDisplay() {
    // 실제 채굴량 = (기본 + 자동) * 배율
    const totalSps = game.autoMinerals * game.multiplier;

    // 저장 용량 계산 (Helper 사용)
    const maxCapacity = getMaxCapacity();

    // 미네랄 한계 보정 (초과 시 버림)
    if (game.minerals > maxCapacity) game.minerals = maxCapacity;

    const isFull = game.minerals >= maxCapacity;
    const colorStyle = isFull ? 'color:#ff4444' : ''; // 가득 차면 빨간색

    elScore.innerHTML = `
        <span style="${colorStyle}">${Math.floor(game.minerals).toLocaleString()}</span> 
        <span style="font-size:0.5em; color:#666;"> / ${maxCapacity.toLocaleString()}</span>
        ${isFull ? '<span style="font-size:0.4em; color:#ff4444; margin-left:5px;">(MAX)</span>' : ''}
    `;

    elSps.innerHTML = `${totalSps.toLocaleString()} Minerals / sec<br><span style="font-size:0.8rem; color:#bbaadd">Core Lv.${game.coreLevel} (x${game.multiplier.toFixed(1)})</span>`;

    // 상점 버튼 활성/비활성 업데이트
    items.forEach(item => {
        const btn = document.getElementById(`btn-${item.id}`);
        if (btn) { // 버튼이 존재할 때만 업데이트
            const currentCost = Math.floor(item.baseCost * Math.pow(GAME_CONFIG.ITEM.COST_MULTIPLIER, item.count));

            // 비용이 최대 용량보다 비싸면 '영원히 못 사는' 상태
            const affordable = game.minerals >= currentCost;
            const impossible = currentCost > maxCapacity;

            if (affordable) {
                btn.classList.remove('disabled');
                btn.classList.remove('impossible');
            } else {
                btn.classList.add('disabled');
                if (impossible) btn.classList.add('impossible'); // 용량 부족 표시용 클래스 (CSS 필요)
            }
            // 가격 표시 업데이트
            const costEl = btn.querySelector('.item-cost');
            // 용량 초과 시 가격을 빨갛게 표시
            costEl.style.color = impossible ? '#ff4444' : '';
            if (costEl) costEl.innerText = `${currentCost.toLocaleString()} M`;
        }
    });
}

// [핵심: 채굴]
function mine(x, y) {
    const maxCapacity = getMaxCapacity();

    if (game.minerals >= maxCapacity) {
        // 이미 가득 찼으면 채굴 불가 이펙트
        createParticle(x, y, "MAX!");
        return;
    }

    const amount = game.clickPower * game.multiplier; // 배율 적용
    game.minerals += amount;
    if (game.minerals > maxCapacity) game.minerals = maxCapacity;

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
        const currentCost = Math.floor(item.baseCost * Math.pow(GAME_CONFIG.ITEM.COST_MULTIPLIER, item.count));

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
    const cost = Math.floor(item.baseCost * Math.pow(GAME_CONFIG.ITEM.COST_MULTIPLIER, item.count));
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



// [레벨업 연출 함수]
function showLevelUpEffect(level) {
    const miningZone = document.getElementById('mining-zone');
    const el = document.createElement('div');
    el.className = 'levelup-overlay';
    el.style.position = 'absolute'; // mining-zone 기준 절대 좌표
    el.innerHTML = `CORE LEVEL UP!<br><span style="font-size:2rem; color:#fff;">Lv.${level}</span>`;
    miningZone.appendChild(el); // body가 아니라 mining-zone에 추가

    // 번쩍이는 배경 효과 (선택 사항) - mining-zone만
    miningZone.style.transition = "background-color 0.1s";
    miningZone.style.backgroundColor = "#2a3544"; // 잠시 밝아짐
    setTimeout(() => miningZone.style.backgroundColor = "", 200);

    setTimeout(() => el.remove(), 2000); // 2초 후 제거
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
