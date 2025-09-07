/* =========================================================
 * Fuzion – Game Script (정리본)
 * - 기능 변경 없음: 주석 강화, 중복 제거, 구조 정리
 * - 전역 상수/상태 → 상단 정리
 * - DOM 접근 캐싱, 보조 헬퍼 소규모 정리
 * =======================================================*/

/* =============== 0) 상수/전역 상태 =============== */

// 보드 크기 (4x4)
const size = 4;

// 최종 보상
const ultimateReward = { id: "worldtree", name: "World Tree", emoji: "🌳" };

// 전역 상태
let discovered = new Set();            // 발견된 타일 ID
let score = 0;                         // 점수
let worldtreeUnlocked = false;         // 월드트리 해금 여부
let enableCrossElementDestroy = false; // 💥 다른 원소 충돌 시 소멸: 기본 OFF

// DOM 캐시
const $ = (sel) => document.querySelector(sel);
const containerEl = $("#game-container");
const scoreEl = $("#score");
const toggleDestroyBtn = $("#toggle-destroy");
const toggleDexBtn = $("#toggle-dex");
const dexEl = $("#dex");
const dexListEl = $("#dex-list");

// 보드(1차원 배열, null 또는 타일 오브젝트 저장)
let board = Array(size * size).fill(null);


/* =============== 1) 원소 데이터 =============== */

const elements = {
    fire: [
        { id: "fire1", name: "Fire",      emoji: "🔥",   next: "fire2" },
        { id: "fire2", name: "Flame",     emoji: "✨",   next: "fire3" },
        { id: "fire3", name: "Inferno",   emoji: "🔥🔥", next: "fire4" },
        { id: "fire4", name: "Sun",       emoji: "☀️",   next: "fire5" },
        { id: "fire5", name: "Star",      emoji: "⭐",   next: "fire6" },
        { id: "fire6", name: "Supernova", emoji: "💥",   next: null }
    ],
    water: [
        { id: "water1", name: "Water",    emoji: "💧",   next: "water2" },
        { id: "water2", name: "Wave",     emoji: "🌊",   next: "water3" },
        { id: "water3", name: "Ocean",    emoji: "🌊🌊", next: "water4" },
        { id: "water4", name: "Cloud",    emoji: "☁️",   next: "water5" },
        { id: "water5", name: "Storm",    emoji: "🌧",   next: "water6" },
        { id: "water6", name: "Typhoon",  emoji: "🌀",   next: null }
    ],
    air: [
        { id: "air1", name: "Breeze",     emoji: "🌬",   next: "air2" },
        { id: "air2", name: "Gust",       emoji: "💨",   next: "air3" },
        { id: "air3", name: "Tempest",    emoji: "🌪",   next: "air4" },
        { id: "air4", name: "Thunder",    emoji: "⚡",   next: "air5" },
        { id: "air5", name: "Lightning",  emoji: "🌩",   next: "air6" },
        { id: "air6", name: "Stormlord",  emoji: "⚡👑", next: null }
    ],
    earth: [
        { id: "earth1", name: "Soil",        emoji: "🪨",   next: "earth2" },
        { id: "earth2", name: "Mountain",    emoji: "🏔",   next: "earth3" },
        { id: "earth3", name: "Continent",   emoji: "🌍",   next: "earth4" },
        { id: "earth4", name: "Planet",      emoji: "🪐",   next: "earth5" },
        { id: "earth5", name: "Earth",       emoji: "🌏",   next: "earth6" },
        { id: "earth6", name: "World Titan", emoji: "🌌",   next: null }
    ]
};

const tileDesc = {
    // Fire
    fire1: "The primal spark of fire, fragile yet fierce.",
    fire2: "A living flame, dancing with energy.",
    fire3: "An inferno, consuming everything in its path.",
    fire4: "The blazing sun, source of endless light.",
    fire5: "A star, shining eternally in the cosmos.",
    fire6: "A supernova, a cataclysm of creation and destruction.",

    // Water
    water1: "A droplet, the seed of all life.",
    water2: "A wave, shaping the shore with rhythm.",
    water3: "The vast ocean, cradle of mysteries.",
    water4: "A cloud, drifting and ever-changing.",
    water5: "A raging storm, pouring fury upon the earth.",
    water6: "A typhoon, nature’s unstoppable wrath.",

    // Air
    air1: "A gentle breeze, whispering through the sky.",
    air2: "A sudden gust, swift and playful.",
    air3: "A tempest, wild and relentless.",
    air4: "Thunder, herald of the storm.",
    air5: "Lightning, a flash of divine power.",
    air6: "The Stormlord, master of winds and skies.",

    // Earth
    earth1: "Soil, the humble foundation of life.",
    earth2: "A mountain, ancient and unyielding.",
    earth3: "A continent, vast and immovable.",
    earth4: "A planet, turning in the endless void.",
    earth5: "The Earth, teeming with life.",
    earth6: "The World Titan, embodying all creation."
};


/* =============== 2) 보드 헬퍼 =============== */

/** id로 타일 객체 검색 */
function getTileById(id) {
    for (const group in elements) {
        const found = elements[group].find(t => t.id === id);
        if (found) return found;
    }
    return null;
}

/** id 접두로 그룹명 반환 */
function getGroup(id) {
    if (id.startsWith("fire"))  return "fire";
    if (id.startsWith("water")) return "water";
    if (id.startsWith("air"))   return "air";
    if (id.startsWith("earth")) return "earth";
    return "";
}

/** id에서 레벨(숫자) 추출 */
function getLevel(id) {
    const m = id.match(/\d+$/);
    return m ? parseInt(m[0], 10) : 1;
}

/** 다음 단계 타일 찾기 */
function getNext(id) {
    const tile = getTileById(id);
    return tile && tile.next ? getTileById(tile.next) : null;
}

/** 점수 업데이트 */
function updateScore(points) {
    score += points;
    if (scoreEl) scoreEl.textContent = `Score: ${score}`;
}

/** 무작위 시작 타일 1개 스폰 */
function addRandomTile() {
    const empties = board
        .map((t, i) => (t === null ? i : null))
        .filter(i => i !== null);
    if (!empties.length) return;

    const startTiles = ["fire1", "water1", "air1", "earth1"];
    const id = startTiles[Math.floor(Math.random() * startTiles.length)];
    const tile = getTileById(id);

    const idx = empties[Math.floor(Math.random() * empties.length)];
    board[idx] = tile;

    discovered.add(tile.id);
    updateDex();
}

/* === 절대 슬라이드 좌표 헬퍼 === */
const N = size;            // 보드 한 변 (4)
let isAnimating = false;   // 애니 중 입력 잠금

function getBoardGeom(){
    const cont = document.getElementById('game-container');
    const cs = getComputedStyle(cont);
    const gap = parseFloat(cs.gap || cs.gridGap || '5') || 5;
    const pad = parseFloat(cs.padding || '0') || 0;
    const w = cont.clientWidth;
    const cell = (w - pad*2 - gap*(N-1)) / N;
    return {cont, gap, pad, cell};
}
/** (r,c) -> 보드 내부 좌상단 픽셀 */
function rcToXY(r, c){
    const {gap, pad, cell} = getBoardGeom();
    return { x: pad + c*(cell+gap), y: pad + r*(cell+gap), cell };
}

/** 고스트 슬라이드 플레이어 */
function playSlideAnimations(moves, done){
    if (!moves || !moves.length){ done?.(); return; }
    isAnimating = true;

    const fx = document.getElementById('fx-layer');
    fx.innerHTML = '';

    const {cell} = getBoardGeom();
    fx.style.setProperty('--cell', `${cell}px`);

    // 시작 프레임: from 좌표에 고스트 생성
    const ghosts = moves.map(m => {
        const p0 = rcToXY(m.from.r, m.from.c);
        const p1 = rcToXY(m.to.r,   m.to.c);

        const g = document.createElement('div');
        g.className = 'tile-ghost';
        g.textContent = m.text;
        if (m.group) g.dataset.group = m.group;

        g.style.left = `${p0.x}px`;
        g.style.top  = `${p0.y}px`;
        g.style.width  = `${cell}px`;   // 👈 여기 추가
        g.style.height = `${cell}px`;   // 👈 여기 추가
        g._dx = p1.x - p0.x;
        g._dy = p1.y - p0.y;



        fx.appendChild(g);
        return g;
    });

    // 다음 프레임에 목적지로 이동
    requestAnimationFrame(()=>{
        ghosts.forEach(g=>{
            g.style.transform = `translate3d(${g._dx}px, ${g._dy}px, 0)`;
        });
        setTimeout(()=>{
            fx.innerHTML = '';
            isAnimating = false;
            done?.();
        }, 160); // CSS 150ms + 여유
    });
}


/* =============== 3) 연출/렌더 =============== */

/** 보드 전체 렌더 */
function render() {
    containerEl.innerHTML = "";
    board.forEach((tile, i) => {
        const div = document.createElement("div");
        div.className = "tile";
        div.setAttribute("data-idx", i);

        if (tile) {
            const name = getTileById(tile.id).name;
            const desc = tileDesc?.[tile.id] || "";
            const level = getLevel(tile.id);

            div.textContent = tile.emoji;
            div.setAttribute("data-id", tile.id);
            div.setAttribute("data-group", getGroup(tile.id));
            div.setAttribute("data-level", level);

            // 툴팁: "LV. X · 이름 — 설명"
            const tip = `LV. ${level} · ${name}${desc ? " — " + desc : ""}`;
            div.setAttribute("data-title", tip);
        } else {
            div.textContent = "";
            div.removeAttribute("data-title");
            div.removeAttribute("data-level");
        }

        containerEl.appendChild(div);
    });

    checkUltimateReward();
}

/** 특정 인덱스들에 애니메이션 클래스 부여 후 제거 */
function pulseAt(indices, className) {
    indices.forEach(idx => {
        const cell = containerEl.querySelector(`.tile[data-idx="${idx}"]`);
        if (!cell) return;
        // 재시작을 위해 제거 → 강제 리플로우 → 추가
        cell.classList.remove(className);
        void cell.offsetWidth; // reflow
        cell.classList.add(className);
        setTimeout(() => cell.classList.remove(className), 260);
    });
}

/** 이동 불발 시 전체에 살짝 피드백(너지+글로우) */
function subtleFeedback(direction) {
    const tiles = containerEl.querySelectorAll(".tile");
    const dirClass =
        direction === "left"  ? "anim-nudge-left"  :
            direction === "right" ? "anim-nudge-right" :
                direction === "up"    ? "anim-nudge-up"    : "anim-nudge-down";

    tiles.forEach(el => {
        if (el.textContent && el.textContent.trim().length > 0) {
            el.classList.remove("anim-glow", "anim-nudge-left", "anim-nudge-right", "anim-nudge-up", "anim-nudge-down");
            void el.offsetWidth; // reflow
            el.classList.add("anim-glow", dirClass);
            setTimeout(() => el.classList.remove("anim-glow", dirClass), 400);
        }
    });
}


/* =============== 4) 슬라이드/합성 로직 =============== */

/**
 * 한 줄(배열 4칸)을 왼쪽 기준으로 슬라이드/합성
 * - 같은 타일: 업그레이드 + 점수 (현재 100 고정)
 * - 다른 원소: (토글 ON & 레벨 같을 때만) 소멸, 점수 X
 * - 토글 OFF: 유지
 * return { line: 결과배열, mergedAt: 합성 인덱스[], destroyedPairs: 소멸쌍 인덱스[] }
 */
/**
 * 한 줄(배열 4칸)을 왼쪽 기준으로 슬라이드/합성
 * positions: line의 각 칸 인덱스(0..size-1) 중 null이 아닌 원래 위치 목록 (예: [0,2,3])
 * returns:
 *  { line, mergedAt, destroyedPairs, movesLocal }
 *  - movesLocal: [{fromLoc, toLoc, text, group, type:'move'|'merge'|'vanish'}]
 */
function slideLine(line, positions) {
    const compact = line.filter(Boolean); // null 제거
    const result = [];
    const mergedAt = [];       // 시각 강조용(로컬 인덱스)
    const destroyedPairs = []; // 시각 강조용(로컬 인덱스쌍)
    const movesLocal = [];     // 절대 슬라이드용(fromLoc -> toLoc)

    for (let i = 0; i < compact.length; i++) {
        const cur = compact[i];
        const fromLocCur = positions[i];
        const hasNext = i < compact.length - 1;

        if (hasNext) {
            const nxt = compact[i + 1];
            const fromLocNxt = positions[i + 1];

            // 1) 같은 타일 → 합성(두 개 모두 같은 toLoc로 이동)
            if (cur.id === nxt.id) {
                const upgraded = getNext(cur.id);
                if (upgraded) {
                    const place = result.length; // toLoc
                    // 슬라이드 계획: 두 조각이 같은 칸으로 모임
                    movesLocal.push(
                        { fromLoc: fromLocCur, toLoc: place, text: cur.emoji, group: getGroup(cur.id), type: 'merge' },
                        { fromLoc: fromLocNxt, toLoc: place, text: nxt.emoji, group: getGroup(nxt.id), type: 'merge' }
                    );
                    discovered.add(upgraded.id);
                    updateDex();
                    updateScore(100); // 합성 점수
                    result.push(upgraded);
                    mergedAt.push(place);
                    i++; // nxt 소비
                    continue;
                } else {
                    // 최종단계 → 합성 불가 → 그대로 밀착
                    const place = result.length;
                    movesLocal.push({ fromLoc: fromLocCur, toLoc: place, text: cur.emoji, group: getGroup(cur.id), type: 'move' });
                    result.push(cur);
                    continue;
                }
            }

            // 2) 다른 원소
            if (enableCrossElementDestroy) {
                // 같은 레벨의 다른 원소만 소멸 → 둘 다 같은 충돌점으로 이동 후 사라짐
                if (getLevel(cur.id) === getLevel(nxt.id)) {
                    const collideAt = result.length; // 충돌 지점
                    movesLocal.push(
                        { fromLoc: fromLocCur, toLoc: collideAt, text: cur.emoji, group: getGroup(cur.id), type: 'vanish' },
                        { fromLoc: fromLocNxt, toLoc: collideAt, text: nxt.emoji, group: getGroup(nxt.id), type: 'vanish' }
                    );
                    destroyedPairs.push([collideAt, collideAt]); // 시각 강조용(옵션)
                    i++; // cur, nxt 둘 다 제거
                    continue;
                } else {
                    // 레벨 다르면 유지 → cur만 자리로 이동
                    const place = result.length;
                    movesLocal.push({ fromLoc: fromLocCur, toLoc: place, text: cur.emoji, group: getGroup(cur.id), type: 'move' });
                    result.push(cur);
                    continue;
                }
            } else {
                // 소멸 OFF → 유지 → cur만 자리로 이동
                const place = result.length;
                movesLocal.push({ fromLoc: fromLocCur, toLoc: place, text: cur.emoji, group: getGroup(cur.id), type: 'move' });
                result.push(cur);
                continue;
            }
        }

        // 마지막/단독 요소 push
        const place = result.length;
        movesLocal.push({ fromLoc: fromLocCur, toLoc: place, text: cur.emoji, group: getGroup(cur.id), type: 'move' });
        result.push(cur);
    }

    // 뒤쪽 null 채우기
    while (result.length < size) result.push(null);

    return { line: result, mergedAt, destroyedPairs, movesLocal };
}


function move(direction) {
    if (isAnimating) return; // 애니 중 입력 잠금

    const before = JSON.stringify(board.map(t => (t ? t.id : null)));
    const tempBoard = Array(size * size).fill(null);

    // 연출 인덱스(기존) + 절대 슬라이드 이동 계획(추가)
    const mergedGlobals = [];
    const destroyedGlobals = [];
    const absMoves = []; // [{from:{r,c}, to:{r,c}, text, group, type}]

    // 헬퍼: 한 줄에서 null이 아닌 원래 인덱스 목록 만들기
    const nonNullPositions = (arr) =>
        arr.map((v, idx) => (v ? idx : null)).filter(v => v !== null);

    if (direction === "left") {
        for (let r = 0; r < size; r++) {
            const row = board.slice(r*size, r*size+size);
            const pos = nonNullPositions(row);
            const { line: newRow, mergedAt, destroyedPairs, movesLocal } = slideLine(row, pos);

            // tempBoard에 반영
            for (let c = 0; c < size; c++) tempBoard[r*size+c] = newRow[c];

            // 전역 인덱스 수집(기존 펄스용)
            mergedAt.forEach(loc => mergedGlobals.push(r*size + loc));
            destroyedPairs.forEach(([a,b]) => {
                destroyedGlobals.push(r*size + a, r*size + b);
            });

            // 절대 슬라이드용 전역 좌표 변환
            movesLocal.forEach(m=>{
                absMoves.push({
                    from: { r, c: m.fromLoc },
                    to:   { r, c: m.toLoc   },
                    text: m.text, group: m.group, type: m.type
                });
            });
        }
    }

    if (direction === "right") {
        for (let r = 0; r < size; r++) {
            const rowOrig = board.slice(r*size, r*size+size);
            const row = rowOrig.slice().reverse(); // 좌로 처리
            const posOrig = nonNullPositions(rowOrig);
            const posRev  = posOrig.map(p => size - 1 - p).reverse();

            const { line: newRowRev, mergedAt, destroyedPairs, movesLocal } = slideLine(row, posRev);
            const newRow = newRowRev.reverse();

            for (let c = 0; c < size; c++) tempBoard[r*size+c] = newRow[c];

            mergedAt.forEach(loc => mergedGlobals.push(r*size + (size - 1 - loc)));
            destroyedPairs.forEach(([a,b]) => {
                destroyedGlobals.push(r*size + (size - 1 - a), r*size + (size - 1 - b));
            });

            movesLocal.forEach(m=>{
                absMoves.push({
                    from: { r, c: (size - 1 - m.fromLoc) },
                    to:   { r, c: (size - 1 - m.toLoc)   },
                    text: m.text, group: m.group, type: m.type
                });
            });
        }
    }

    if (direction === "up") {
        for (let c = 0; c < size; c++) {
            const col = []; for (let r = 0; r < size; r++) col.push(board[r*size+c]);
            const pos = nonNullPositions(col);

            const { line: newCol, mergedAt, destroyedPairs, movesLocal } = slideLine(col, pos);
            for (let r = 0; r < size; r++) tempBoard[r*size+c] = newCol[r];

            mergedAt.forEach(loc => mergedGlobals.push(loc*size + c));
            destroyedPairs.forEach(([a,b]) => {
                destroyedGlobals.push(a*size + c, b*size + c);
            });

            movesLocal.forEach(m=>{
                absMoves.push({
                    from: { r: m.fromLoc, c },
                    to:   { r: m.toLoc,   c },
                    text: m.text, group: m.group, type: m.type
                });
            });
        }
    }

    if (direction === "down") {
        for (let c = 0; c < size; c++) {
            const colOrig = []; for (let r = 0; r < size; r++) colOrig.push(board[r*size+c]);
            const col = colOrig.slice().reverse();
            const posOrig = nonNullPositions(colOrig);
            const posRev  = posOrig.map(p => size - 1 - p).reverse();

            const { line: newColRev, mergedAt, destroyedPairs, movesLocal } = slideLine(col, posRev);
            const newCol = newColRev.reverse();

            for (let r = 0; r < size; r++) tempBoard[r*size+c] = newCol[r];

            mergedAt.forEach(loc => mergedGlobals.push((size - 1 - loc)*size + c));
            destroyedPairs.forEach(([a,b]) => {
                destroyedGlobals.push((size - 1 - a)*size + c, (size - 1 - b)*size + c);
            });

            movesLocal.forEach(m=>{
                absMoves.push({
                    from: { r: (size - 1 - m.fromLoc), c },
                    to:   { r: (size - 1 - m.toLoc),   c },
                    text: m.text, group: m.group, type: m.type
                });
            });
        }
    }

    const after = JSON.stringify(tempBoard.map(t => (t ? t.id : null)));

    // 변화가 있으면: 절대 슬라이드 → 끝나고 확정/스폰/렌더
    if (before !== after) {
        // 스폰 전 빈칸 스냅샷
        const emptyBefore = [];
        for (let i = 0; i < board.length; i++) if (board[i] === null) emptyBefore.push(i);

        playSlideAnimations(absMoves, ()=>{
            // 애니 끝 → 실제 보드 확정
            board = tempBoard.slice();

            // 스폰
            addRandomTile();

            // 어떤 칸이 새로 채워졌는지 탐지
            const spawned = [];
            for (let i = 0; i < board.length; i++) {
                const wasEmpty = emptyBefore.includes(i);
                const nowFilled = board[i] !== null;
                if (wasEmpty && nowFilled) spawned.push(i);
            }

            // 렌더 + 연출
            render();
            if (mergedGlobals.length)    pulseAt(mergedGlobals, "anim-merge");
            if (destroyedGlobals.length) pulseAt(destroyedGlobals, "anim-destroy");
            if (spawned.length)          pulseAt(spawned, "anim-spawn");
        });
    }
    // 변화 없으면 미세 피드백만
    else {
        render();
        subtleFeedback(direction);
    }
}


/* =============== 5) 입력/도감/보상 =============== */

// 키보드 입력
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft")  move("left");
    if (e.key === "ArrowRight") move("right");
    if (e.key === "ArrowUp")    move("up");
    if (e.key === "ArrowDown")  move("down");
});

// 💥 충돌 소멸 토글
if (toggleDestroyBtn) {
    toggleDestroyBtn.addEventListener("click", () => {
        enableCrossElementDestroy = !enableCrossElementDestroy;
        toggleDestroyBtn.textContent = enableCrossElementDestroy
            ? "💥 Cross-element collision: ON"
            : "💥 Cross-element collision: OFF";
    });
}

/** 도감 렌더 */
function updateDex() {
    if (!dexListEl) return;
    dexListEl.innerHTML = "";

    // 정렬 후 그리기
    const ids = Array.from(discovered.values()).sort();
    ids.forEach(id => {
        const tile = getTileById(id);
        if (!tile) return;
        const div = document.createElement("div");
        div.className = "dex-item";
        div.title = tile.name;
        div.textContent = tile.emoji;
        dexListEl.appendChild(div);
    });

    if (worldtreeUnlocked) {
        const div = document.createElement("div");
        div.className = "dex-item";
        div.title = ultimateReward.name;
        div.textContent = ultimateReward.emoji;
        dexListEl.appendChild(div);
    }
}

// 도감 표시 토글
if (toggleDexBtn && dexEl) {
    toggleDexBtn.addEventListener("click", () => {
        dexEl.style.display = (dexEl.style.display === "none" ? "block" : "none");
    });
}

/** 최종 보상 체크 */
function checkUltimateReward() {
    const done =
        discovered.has("fire6")  &&
        discovered.has("water6") &&
        discovered.has("air6")   &&
        discovered.has("earth6");

    if (done && !worldtreeUnlocked) {
        worldtreeUnlocked = true;
        updateDex();
        alert("🌳 The World Tree has emerged! You have mastered all elements!");
    }
}


/* =============== 6) 초기화 =============== */

function init() {
    score = 0;
    worldtreeUnlocked = false;
    discovered = new Set();
    board = Array(size * size).fill(null);

    addRandomTile();
    addRandomTile();
    updateScore(0);
    updateDex();
    render();
}

// 시작!
init();


/* =============== 7) 터치/포인터 입력 =============== */
// (동작 동일, 가독성만 개선)
const boardEl = containerEl;
let startX = 0, startY = 0, dragging = false;

boardEl.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX = e.clientX; startY = e.clientY;
    boardEl.setPointerCapture(e.pointerId);
});

boardEl.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    // touch-action: none 으로 preventDefault 불필요
});

function endSwipe(e) {
    if (!dragging) return;
    dragging = false;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    const threshold = 24; // 최소 스와이프 길이

    if (ax < threshold && ay < threshold) return;

    const dir = ax > ay
        ? (dx > 0 ? "right" : "left")
        : (dy > 0 ? "down" : "up");

    move(dir);
}

// 입력창에서 타이핑 중일 땐 가로채지 않기
function isTypingTarget(el) {
    return el && (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.isContentEditable === true
    );
}

// 전역 키다운에서 화살표 기본 동작(스크롤 등) 차단 → move()만 호출
window.addEventListener('keydown', (e) => {
    if (isTypingTarget(e.target)) return; // 폼/입력에는 간섭 X

    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            move('left');
            break;
        case 'ArrowRight':
            e.preventDefault();
            move('right');
            break;
        case 'ArrowUp':
            e.preventDefault();
            move('up');
            break;
        case 'ArrowDown':
            e.preventDefault();
            move('down');
            break;
    }
}, { passive: false }); // ← 반드시 passive:false 여야 preventDefault가 먹음


boardEl.addEventListener("pointerup", endSwipe);
boardEl.addEventListener("pointercancel", () => (dragging = false));
