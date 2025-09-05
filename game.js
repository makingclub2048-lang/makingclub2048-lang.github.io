// ===== 1) 원소 데이터 =====


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
        { id: "earth1", name: "Soil",     emoji: "🪨",   next: "earth2" },
        { id: "earth2", name: "Mountain", emoji: "🏔",   next: "earth3" },
        { id: "earth3", name: "Continent",emoji: "🌍",   next: "earth4" },
        { id: "earth4", name: "Planet",   emoji: "🪐",   next: "earth5" },
        { id: "earth5", name: "Earth",    emoji: "🌏",   next: "earth6" },
        { id: "earth6", name: "World Titan", emoji: "🌌", next: null }
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






const ultimateReward = { id: "worldtree", name: "World Tree", emoji: "🌳" };

// ===== 2) 전역 상태 =====
let discovered = new Set();
let score = 0;
let worldtreeUnlocked = false;
let enableCrossElementDestroy = true; // 💥 다른 원소 충돌 소멸 토글

const size = 4;
let board = Array(size * size).fill(null);

// ===== 3) 헬퍼 =====
function getTileById(id) {
    for (let group in elements) {
        const found = elements[group].find(t => t.id === id);
        if (found) return found;
    }
    return null;
}

function getGroup(id) {
    if (id.startsWith("fire"))  return "fire";
    if (id.startsWith("water")) return "water";
    if (id.startsWith("air"))   return "air";
    if (id.startsWith("earth")) return "earth";
    return "";
}

function getLevel(id) {
    const m = id.match(/\d+$/);
    return m ? parseInt(m[0], 10) : 1;
}


function getNext(id) {
    const tile = getTileById(id);
    return tile && tile.next ? getTileById(tile.next) : null;
}

function updateScore(points) {
    score += points;
    document.getElementById("score").textContent = `Score: ${score}`;
}

function addRandomTile() {
    const empties = board.map((t, i) => (t === null ? i : null)).filter(i => i !== null);
    if (empties.length === 0) return;
    const startTiles = ["fire1", "water1", "air1", "earth1"];
    const id = startTiles[Math.floor(Math.random() * startTiles.length)];
    const tile = getTileById(id);

    const idx = Math.floor(Math.random() * empties.length);
    board[empties[idx]] = tile;

    discovered.add(tile.id);
    updateDex();
}

// 방향에 따라 전 타일에 너지 + 글로우
function subtleFeedback(direction) {
    const container = document.getElementById("game-container");
    const tiles = container.querySelectorAll(".tile");

    // 클래스명 결정
    const dirClass =
        direction === "left"  ? "anim-nudge-left"  :
            direction === "right" ? "anim-nudge-right" :
                direction === "up"    ? "anim-nudge-up"    : "anim-nudge-down";

    tiles.forEach(el => {
        // 내용 있는 칸(타일 있는 칸)에만 강조
        if (el.textContent && el.textContent.trim().length > 0) {
            // 연속 입력에서도 재시작되도록 리셋 후 강제 리플로우
            el.classList.remove("anim-glow", "anim-nudge-left", "anim-nudge-right", "anim-nudge-up", "anim-nudge-down");
            void el.offsetWidth;
            el.classList.add("anim-glow", dirClass);
            // 자동 제거 (중복 누적 방지)
            setTimeout(() => {
                el.classList.remove("anim-glow", dirClass);
            }, 400);
        }
    });
}


// ===== 4) 렌더 =====


// render() 내부에서 각 타일 생성할 때:
function render() {
    const container = document.getElementById("game-container");
    container.innerHTML = "";
    board.forEach((tile, i) => {
        const div = document.createElement("div");
        div.className = "tile";
        if (tile) {
            const name = getTileById(tile.id).name;
            const desc = tileDesc?.[tile.id] || "";  // 설명 사전(없으면 빈 문자열)
            const level = getLevel(tile.id);         // ⬅️ 레벨 추출

            div.textContent = tile.emoji;
            div.setAttribute("data-id", tile.id);
            div.setAttribute("data-group", getGroup(tile.id));
            div.setAttribute("data-level", level);

            // ⬅️ 툴팁 텍스트: "LV. X · 이름 — 설명"
            const tip = `LV. ${level} · ${name}${desc ? " — " + desc : ""}`;
            div.setAttribute("data-title", tip);
        } else {
            div.textContent = "";
            div.removeAttribute("data-title");
            div.removeAttribute("data-level");
        }
        div.setAttribute("data-idx", i);
        container.appendChild(div);
    });
    checkUltimateReward();
}


/* 특정 인덱스에 애니메이션 클래스 부여 후 제거 */
function pulseAt(indices, className) {
    const container = document.getElementById("game-container");
    indices.forEach(idx => {
        const cell = container.querySelector(`.tile[data-idx="${idx}"]`);
        if (!cell) return;
        cell.classList.remove(className); // 연속 입력 대비 리셋
        // 강제 리플로우(재시작 트릭)
        // eslint-disable-next-line no-unused-expressions
        cell.offsetWidth;
        cell.classList.add(className);
        setTimeout(() => cell.classList.remove(className), 260);
    });
}


// ===== 5) 슬라이드/합성 핵심 =====
// BUG FIX: 다른 원소 소멸 OFF일 때 양쪽 모두 유지되도록 로직을 재작성.
function slideLine(line) {
    const compact = line.filter(Boolean);
    const result = [];
    const mergedAt = [];
    const destroyedPairs = [];

    for (let i = 0; i < compact.length; i++) {
        const cur = compact[i];
        const hasNext = i < compact.length - 1;

        if (hasNext) {
            const nxt = compact[i + 1];

            if (cur.id === nxt.id) {
                const upgraded = getNext(cur.id);
                if (upgraded) {
                    discovered.add(upgraded.id);
                    updateDex();
                    updateScore(100);
                    const place = result.length; // 병합 결과가 들어갈 로컬 위치
                    result.push(upgraded);
                    mergedAt.push(place);
                    i++; // nxt 소비
                    continue;
                } else {
                    // 최종단계 → 병합 불가
                    result.push(cur);
                    continue;
                }
            } else {
                // 다른 계열
                if (enableCrossElementDestroy) {
                    if (getLevel(cur.id) === getLevel(nxt.id)) {
                        // 같은 단계의 다른 원소만 소멸
                        updateScore(10);
                        destroyedPairs.push([result.length, result.length + 1]); // 로컬 기준
                        i++; // cur, nxt 둘 다 제거
                        continue;
                    } else {
                        // 단계 다르면 유지
                        result.push(cur);
                        continue;
                    }
                } else {
                    // 소멸 OFF → 유지
                    result.push(cur);
                    continue;
                }
            }
        }

        result.push(cur);
    }

    while (result.length < size) result.push(null);
    return { line: result, mergedAt, destroyedPairs };
}


function move(direction) {
    const before = JSON.stringify(board.map(t => (t ? t.id : null)));

    // 애니메이션 모음
    const mergedGlobals = [];
    const destroyedGlobals = [];
    let spawnedGlobal = null;

    const pushSpawnIdx = () => {
        // addRandomTile()가 채운 칸을 찾아서 popIn 효과 주기
        const afterEmptyMask = board.map(t => (t ? 1 : 0));
        // 이미 추가 전/후 비교가 필요하지만 간단히 마지막에 빈칸→채움 변화 탐색
        // move 호출 직후 addRandomTile에서 하나만 채우므로, 가장 최근 빈 칸을 추정:
        // 안전하게: 렌더 직후 전체를 스캔하면서 'anim-spawn'을 부여하도록 처리.
    };

    if (direction === "left") {
        for (let r = 0; r < size; r++) {
            const row = board.slice(r*size, r*size+size);
            const { line: newRow, mergedAt, destroyedPairs } = slideLine(row);
            for (let c = 0; c < size; c++) {
                board[r*size+c] = newRow[c];
            }
            // 로컬 → 전역 매핑
            mergedAt.forEach(loc => mergedGlobals.push(r*size + loc));
            destroyedPairs.forEach(([aLoc, bLoc]) => {
                destroyedGlobals.push(r*size + aLoc, r*size + bLoc);
            });
        }
    }

    if (direction === "right") {
        for (let r = 0; r < size; r++) {
            const row = board.slice(r*size, r*size+size).reverse();
            const { line: newRowRev, mergedAt, destroyedPairs } = slideLine(row);
            const newRow = newRowRev.reverse();
            for (let c = 0; c < size; c++) {
                board[r*size+c] = newRow[c];
            }
            // 로컬(역방향) → 전역: loc=0은 우측 끝
            mergedAt.forEach(loc => mergedGlobals.push(r*size + (size - 1 - loc)));
            destroyedPairs.forEach(([aLoc, bLoc]) => {
                destroyedGlobals.push(r*size + (size - 1 - aLoc),
                    r*size + (size - 1 - bLoc));
            });
        }
    }

    if (direction === "up") {
        for (let c = 0; c < size; c++) {
            const col = [];
            for (let r = 0; r < size; r++) col.push(board[r*size+c]);
            const { line: newCol, mergedAt, destroyedPairs } = slideLine(col);
            for (let r = 0; r < size; r++) board[r*size+c] = newCol[r];
            mergedAt.forEach(loc => mergedGlobals.push(loc*size + c));
            destroyedPairs.forEach(([aLoc, bLoc]) => {
                destroyedGlobals.push(aLoc*size + c, bLoc*size + c);
            });
        }
    }

    if (direction === "down") {
        for (let c = 0; c < size; c++) {
            const col = [];
            for (let r = 0; r < size; r++) col.push(board[r*size+c]);
            const { line: newColRev, mergedAt, destroyedPairs } = slideLine(col.reverse());
            const newCol = newColRev.reverse();
            for (let r = 0; r < size; r++) board[r*size+c] = newCol[r];
            mergedAt.forEach(loc => {
                const global = (size - 1 - loc)*size + c;
                mergedGlobals.push(global);
            });
            destroyedPairs.forEach(([aLoc, bLoc]) => {
                destroyedGlobals.push((size - 1 - aLoc)*size + c,
                    (size - 1 - bLoc)*size + c);
            });
        }
    }

    const after = JSON.stringify(board.map(t => (t ? t.id : null)));
    if (before !== after) {
        // 새 타일 추가 전, 이전 빈칸 스냅샷
        const emptyBefore = [];
        for (let i = 0; i < board.length; i++) {
            if (board[i] === null) emptyBefore.push(i);
        }

        addRandomTile();

        // 새로 채워진 칸 찾기
        const spawned = [];
        for (let i = 0; i < board.length; i++) {
            const wasEmpty = emptyBefore.includes(i);
            const nowFilled = board[i] !== null;
            if (wasEmpty && nowFilled) spawned.push(i);
        }

        render();

        // 애니메이션 적용
        if (mergedGlobals.length)    pulseAt(mergedGlobals, "anim-merge");
        if (destroyedGlobals.length) pulseAt(destroyedGlobals, "anim-destroy");
        if (spawned.length)          pulseAt(spawned, "anim-spawn");
    }
    // 변화 없을 때 살짝 깜빡임
    else {
        // 이동이 없을 때: 부드러운 글로우 + 방향감 있는 너지
        render();                 // 최신 상태 반영(안전)
        subtleFeedback(direction); // 새 애니메이션
    }

}


// ===== 6) 입력 & 도감 & 보상 =====
document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") move("left");
    if (e.key === "ArrowRight") move("right");
    if (e.key === "ArrowUp") move("up");
    if (e.key === "ArrowDown") move("down");
});

document.getElementById("toggle-destroy").addEventListener("click", () => {
    enableCrossElementDestroy = !enableCrossElementDestroy;
    document.getElementById("toggle-destroy").textContent =
        enableCrossElementDestroy ? "💥 Cross-element collision: ON"
            : "💥 Cross-element collision: OFF";
});


function updateDex() {
    const dexList = document.getElementById("dex-list");
    if (!dexList) return;
    dexList.innerHTML = "";
    // 정렬: 보기 좋게
    const ids = Array.from(discovered.values());
    ids.sort();
    ids.forEach(id => {
        const tile = getTileById(id);
        if (tile) {
            const div = document.createElement("div");
            div.className = "dex-item";
            div.title = tile.name;
            div.textContent = tile.emoji;
            dexList.appendChild(div);
        }
    });
    if (worldtreeUnlocked) {
        const div = document.createElement("div");
        div.className = "dex-item";
        div.title = ultimateReward.name;
        div.textContent = ultimateReward.emoji;
        dexList.appendChild(div);
    }
}

document.getElementById("toggle-dex").addEventListener("click", () => {
    const dex = document.getElementById("dex");
    dex.style.display = dex.style.display === "none" ? "block" : "none";
});

function checkUltimateReward() {
    const done =
        discovered.has("fire6") &&
        discovered.has("water6") &&
        discovered.has("air6") &&
        discovered.has("earth6");
    if (done && !worldtreeUnlocked) {
        worldtreeUnlocked = true;
        updateDex();
        alert("🌳 The World Tree has emerged! You have mastered all elements!");
    }
}

// ===== 7) 초기화 =====
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

init();

const boardEl = document.getElementById('game-container');
let startX=0, startY=0, isTouching=false;

boardEl.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    startX = t.clientX; startY = t.clientY;
    isTouching = true;
}, {passive:true});

boardEl.addEventListener('touchmove', (e) => {
    // 게임 영역에서 스크롤 방지(수평/수직 스와이프 모두 사용한다면)
    if (isTouching) e.preventDefault();
}, {passive:false});

boardEl.addEventListener('touchend', (e) => {
    if (!isTouching) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    isTouching = false;

    const absX = Math.abs(dx), absY = Math.abs(dy);
    const threshold = 24; // 최소 스와이프 거리
    if (absX < threshold && absY < threshold) return;

    const dir = absX > absY ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down' : 'up');
    move(dir); // 기존 키보드 로직과 동일 함수 호출
});



// 롱프레스 툴팁 (간단 버전)
let pressTimer;
boardEl.addEventListener('touchstart', (e)=>{
    const target = e.target.closest('.tile[data-title]');
    if (!target) return;
    pressTimer = setTimeout(()=> target.classList.add('show-tip'), 350);
}, {passive:true});
boardEl.addEventListener('touchend', ()=> { clearTimeout(pressTimer);
    document.querySelectorAll('.tile.show-tip').forEach(el=>el.classList.remove('show-tip'));
}, {passive:true});

