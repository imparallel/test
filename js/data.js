// [게임 설정 및 밸런스]
var GAME_CONFIG = {
    CORE: {
        BASE_COST: 1000,           // 코어 진화 기본 비용
        COST_MULTIPLIER: 2.0,      // 진화 비용 증가 배율 (x2.0)
        BASE_CAPACITY: 3000,       // 기본 미네랄 저장 용량
        CAPACITY_MULTIPLIER: 2.0,  // 저장 용량 증가 배율 (x2.0)
        REWARD_MULTIPLIER: 0.2,    // 진화 성공 시 채굴 배율 증가량 (+20%)
        BASE_CHANCE: 95,           // 진화 기본 성공 확률 (Lv.1 -> Lv.2)
        CHANCE_DECREASE: 5,       // 레벨 당 확률 감소폭 (-5%)
        MIN_CHANCE: 5,             // 최소 성공 확률 (5%)
        FAIL_INHERITANCE_RATE: 0.5, // [Balance] 남은 자산의 50% 구조 (총 자산의 25% 생존 - Hardcore)
        EVOLUTION_COST_RATE: 0.5   // [New] 진화 비용 계수 (보유 자산의 50%)
    },
    ITEM: {
        COST_MULTIPLIER: 1.15      // 아이템 가격 증가 배율 (x1.15)
    },
    SYSTEM: {
        AUTO_SAVE_INTERVAL: 1000   // 자동 저장 주기 (ms)
    }
};

// [행성 색상 팔레트]
var PLANET_COLORS = [
    ['#ef5350', '#b71c1c'], // Red Mars
    ['#42a5f5', '#1565c0'], // Blue Neptune
    ['#66bb6a', '#2e7d32'], // Green Terra
    ['#ffd54f', '#ff8f00'], // Yellow Venus
    ['#ab47bc', '#6a1b9a'], // Purple Void
    ['#8d6e63', '#4e342e'], // Brown Rocky
    ['#bdbdbd', '#424242'], // Grey Moon
    ['#26c6da', '#00838f'], // Cyan Ice
];

// [상점 아이템 데이터]
var items = [
    { id: 'pickaxe', name: '레이저 곡괭이', type: 'click', baseCost: 15, basePower: 1, count: 0, desc: '클릭당 채굴량 +1' },
    { id: 'drone', name: '채굴 드론', type: 'auto', baseCost: 100, basePower: 5, count: 0, desc: '초당 자동 채굴 +5' },
    { id: 'drill', name: '플라즈마 드릴', type: 'click', baseCost: 500, basePower: 10, count: 0, desc: '클릭당 채굴량 +10' },
    { id: 'bot', name: '채굴 로봇 MK-1', type: 'auto', baseCost: 1000, basePower: 25, count: 0, desc: '초당 자동 채굴 +25' },
    { id: 'station', name: '채굴 정거장', type: 'auto', baseCost: 10000, basePower: 150, count: 0, desc: '초당 자동 채굴 +150' },
];

// [패치노트 데이터]
const patchNotes = [
    {
        version: "v0.1.3.2",
        date: "2026-02-04",
        changes: [
            "[System] 하드코어 경제 밸런스 적용 (Risky Wallet)",
            "[Balance] 코어 진화 비용: 보유 자산의 50% (최소 비용 보장)",
            "[Balance] 진화 실패 시: 남은 자산의 50%만 구조 (총자산의 25% 생존)",
            "[UI] 상점 구매 조건 완화 (용량 초과해도 자산 충분하면 구매 가능)",
            "[Fix] 상점 아이템 붉은색 표시 오류 수정"
        ]
    },
    {
        version: "v0.1.2.0",
        date: "2026-02-02",
        changes: [
            "[System] '코어 과부하' ➔ '코어 진화(Evolution)' 리브랜딩",
            "[System] 저장 용량 제한 시스템 도입 (코어 레벨에 비례)",
            "[Visual] 행성 랜덤 색상 생성 (진화 실패 시 변경)",
            "[Balance] 진화 비용 및 용량 밸런스 전면 재조정",
            "[Dev] 밸런스 설정 중앙화 (GAME_CONFIG)"
        ]
    },
    {
        version: "v0.1.1.0",
        date: "2026-02-01",
        changes: [
            "[New] 행성 코어 과부하(Risk Upgrade) 시스템 추가",
            "[System] 코어 레벨 도입 (레벨당 채굴 효율 +20%)",
            "[Effect] 과부하 성공/실패 연출 추가"
        ]
    },
    {
        version: "v0.1.0.3",
        date: "2026-02-01",
        changes: [
            "[System] 프로젝트 구조 리팩토링 및 롤백",
            "[Fix] 디자인 레이아웃 및 아이템 표기 오류 수정"
        ]
    },
    {
        version: "v0.1.0.2",
        date: "2026-02-01",
        changes: [
            "[UI] 모바일 버전 표시 위치 개선 (목록 하단 이동)",
            "[UI] PC 버전 표시 위치 변경 (좌측 하단 → 우측 하단)",
            "[Fix] 아이템 목록과 버전 정보가 겹치는 현상 해결"
        ]
    },
    {
        version: "v0.1.0.1",
        date: "2026-02-01",
        changes: [
            "[Fix] 클릭 효과(숫자)가 행성 뒤에 가려지는 문제 수정",
            "[System] 패치노트 시스템 추가"
        ]
    },
    {
        version: "v0.1.0.0",
        date: "2026-02-01",
        changes: [
            "[New] Space Miner Clicker 게임 출시!",
            "[New] 저장/불러오기 기능 추가",
            "[New] 초기화(Reset) 기능 추가"
        ]
    }
];
