// 전역 변수
let currentQuestion = null;
let currentBlankTest = null;

// 글자 크기 배율 상태
const READING_SCALES = [0.85, 1.0, 1.15, 1.3, 1.45, 1.6];
let readingScaleIndex = 1; // 기본값: 1.0

// iPad/iOS 판별 (iPadOS 13+는 Mac으로 위장하므로 터치 포인트로 구분)
const IS_IOS_LIKE = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

let userInputs = [];
let previousRangeValues = {
    chapterStart: 1,
    verseStart: 1,
    chapterEnd: 1,
    verseEnd: 1
};

// DOM 요소들
const chapterStartSelect = document.getElementById('chapterStart');
const verseStartSelect = document.getElementById('verseStart');
const chapterEndSelect = document.getElementById('chapterEnd');
const verseEndSelect = document.getElementById('verseEnd');
// Radio 버튼으로 변경됨 - 직접 선택된 값을 가져오는 함수 사용
const generateBtn = document.getElementById('generateBtn');
const blankTestBtn = document.getElementById('blankTestBtn');
const showAnswerBtn = document.getElementById('showAnswerBtn');
const gradeBtn = document.getElementById('gradeBtn');
const clearBlanksBtn = document.getElementById('clearBlanksBtn');
const quickMenu = document.getElementById('quickMenu');
const quickAnswerBtn = document.getElementById('quickAnswerBtn');
const quickClearBtn = document.getElementById('quickClearBtn');
const quickGradeBtn = document.getElementById('quickGradeBtn');
const questionArea = document.getElementById('questionArea');
const blankTestArea = document.getElementById('blankTestArea');
const answerArea = document.getElementById('answerArea');
const gradeArea = document.getElementById('gradeArea');
const fontSizeControl = document.getElementById('fontSizeControl');
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
const questionContent = document.getElementById('questionContent');
const blankTestContent = document.getElementById('blankTestContent');
const answerContent = document.getElementById('answerContent');
const gradeContent = document.getElementById('gradeContent');

// 초기화
document.addEventListener('DOMContentLoaded', async function() {
    // 초기 상태에서 모든 영역 숨기기
    questionArea.classList.add('hidden');
    blankTestArea.classList.add('hidden');
    answerArea.classList.add('hidden');
    gradeArea.classList.add('hidden');
    fontSizeControl.classList.add('hidden');
    
    // 모달 확실히 숨기기
    const modal = document.getElementById('answerModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // 보조 버튼 그룹은 문제 생성 전까지 숨김
    setSecondaryButtonsVisible(false);
    
    // 요한계시록 데이터 로드
    await loadRevelationData();

    // 글자 크기 복원
    const savedScale = parseFloat(localStorage.getItem('reading-scale'));
    if (savedScale && READING_SCALES.includes(savedScale)) {
        readingScaleIndex = READING_SCALES.indexOf(savedScale);
    }
    applyReadingScale(READING_SCALES[readingScaleIndex]);

    // 선택기 초기화
    initializeSelectors();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 모달 관련 이벤트 리스너
    setupModalEventListeners();
    
    // 스크롤 투 탑 버튼 이벤트 리스너
    setupScrollToTopButton();
    
    // 페이지 reload 시 최상단으로 이동
    setupPageReloadHandler();
});

function initializeSelectors() {
    // 장 선택기 초기화
    const chapters = getAllChapters();
    chapters.forEach(chapter => {
        const option1 = new Option(chapter, chapter);
        const option2 = new Option(chapter, chapter);
        chapterStartSelect.appendChild(option1);
        chapterEndSelect.appendChild(option2);
    });
    
    // 초기 절 선택기 업데이트 (첫 번째 장 기준)
    updateStartVerseSelector();
    updateEndVerseSelector();
}

function setupEventListeners() {
    chapterStartSelect.addEventListener('change', handleRangeChange);
    verseStartSelect.addEventListener('change', handleRangeChange);
    chapterEndSelect.addEventListener('change', handleRangeChange);
    verseEndSelect.addEventListener('change', handleRangeChange);
    document.querySelectorAll('input[name="difficulty"]').forEach(radio => {
        radio.addEventListener('change', updateDifficultyDescMobile);
    });
    updateDifficultyDescMobile();

    generateBtn.addEventListener('click', generateQuestion);
    blankTestBtn.addEventListener('click', generateBlankTest);
    showAnswerBtn.addEventListener('click', showAnswer);
    gradeBtn.addEventListener('click', gradeAnswers);
    clearBlanksBtn.addEventListener('click', clearAllBlanks);
    quickAnswerBtn.addEventListener('click', showAnswer);
    quickClearBtn.addEventListener('click', clearAllBlanks);
    quickGradeBtn.addEventListener('click', gradeAnswers);

    const fontDecreaseBtn = document.getElementById('fontDecreaseBtn');
    const fontResetBtn = document.getElementById('fontResetBtn');
    const fontIncreaseBtn = document.getElementById('fontIncreaseBtn');
    if (fontDecreaseBtn) {
        fontDecreaseBtn.addEventListener('click', () => {
            if (readingScaleIndex > 0) {
                readingScaleIndex--;
                applyReadingScale(READING_SCALES[readingScaleIndex]);
            }
        });
    }
    if (fontResetBtn) {
        fontResetBtn.addEventListener('click', () => {
            readingScaleIndex = 1;
            applyReadingScale(READING_SCALES[readingScaleIndex]);
        });
    }
    if (fontIncreaseBtn) {
        fontIncreaseBtn.addEventListener('click', () => {
            if (readingScaleIndex < READING_SCALES.length - 1) {
                readingScaleIndex++;
                applyReadingScale(READING_SCALES[readingScaleIndex]);
            }
        });
    }
}

function updateVerseSelectors() {
    updateStartVerseSelector();
    updateEndVerseSelector();
}

function updateStartVerseSelector() {
    const startChapter = parseInt(chapterStartSelect.value) || 1;
    
    // 시작 절 업데이트 (항상 1절로 초기화)
    verseStartSelect.innerHTML = '';
    const startVerseCount = getVerseCount(startChapter);
    for (let i = 1; i <= startVerseCount; i++) {
        const option = new Option(i, i);
        verseStartSelect.appendChild(option);
    }
    verseStartSelect.value = '1';
    
    // 시작이 변경되면 끝 범위도 업데이트
    updateEndRangeOptions();
}

function updateEndVerseSelector() {
    const endChapter = parseInt(chapterEndSelect.value) || 1;
    
    // 끝 절 업데이트 (항상 마지막절로 초기화)
    verseEndSelect.innerHTML = '';
    const endVerseCount = getVerseCount(endChapter);
    for (let i = 1; i <= endVerseCount; i++) {
        const option = new Option(i, i);
        verseEndSelect.appendChild(option);
    }
    verseEndSelect.value = endVerseCount.toString();
    
    // 끝이 변경되면 범위 검증
    validateEndRange();
}

function updateEndRangeOptions() {
    const startChapter = parseInt(chapterStartSelect.value) || 1;
    const startVerse = parseInt(verseStartSelect.value) || 1;
    
    // 끝 장 선택기 업데이트 (시작 장 이후만 표시)
    chapterEndSelect.innerHTML = '';
    const allChapters = getAllChapters();
    
    allChapters.forEach(chapter => {
        if (chapter >= startChapter) {
            const option = new Option(chapter, chapter);
            chapterEndSelect.appendChild(option);
        }
    });
    
    // 끝 장이 시작 장보다 작으면 시작 장으로 설정
    if (parseInt(chapterEndSelect.value) < startChapter) {
        chapterEndSelect.value = startChapter.toString();
    }
    
    // 끝 절 업데이트
    updateEndVerseForRange();
}

function updateEndVerseForRange() {
    const startChapter = parseInt(chapterStartSelect.value) || 1;
    const startVerse = parseInt(verseStartSelect.value) || 1;
    const endChapter = parseInt(chapterEndSelect.value) || 1;
    
    verseEndSelect.innerHTML = '';
    const endVerseCount = getVerseCount(endChapter);
    
    if (startChapter === endChapter) {
        // 같은 장인 경우: 시작 절 이후부터만 표시
        for (let i = startVerse; i <= endVerseCount; i++) {
            const option = new Option(i, i);
            verseEndSelect.appendChild(option);
        }
        verseEndSelect.value = endVerseCount.toString();
    } else {
        // 다른 장인 경우: 모든 절 표시
        for (let i = 1; i <= endVerseCount; i++) {
            const option = new Option(i, i);
            verseEndSelect.appendChild(option);
        }
        verseEndSelect.value = endVerseCount.toString();
    }
}

function validateEndRange() {
    const startChapter = parseInt(chapterStartSelect.value) || 1;
    const startVerse = parseInt(verseStartSelect.value) || 1;
    const endChapter = parseInt(chapterEndSelect.value) || 1;
    const endVerse = parseInt(verseEndSelect.value) || 1;
    
    // 같은 장에서 끝 절이 시작 절보다 작으면 조정
    if (startChapter === endChapter && endVerse < startVerse) {
        verseEndSelect.value = startVerse.toString();
    }
}

function generateQuestion() {
    const startChapter = parseInt(chapterStartSelect.value);
    const startVerse = parseInt(verseStartSelect.value);
    const endChapter = parseInt(chapterEndSelect.value);
    const endVerse = parseInt(verseEndSelect.value);
    const difficulty = getSelectedDifficulty();
    
    // 범위 검증
    if (!validateRange(startChapter, startVerse, endChapter, endVerse)) {
        alert('올바른 범위를 선택해주세요.');
        return;
    }
    
    // 범위 내 구절들 수집
    const verses = collectVerses(startChapter, startVerse, endChapter, endVerse);

    // 빈칸 칸 폭/분할 계산이 questionContent의 실제 너비를 측정할 수 있도록
    // 문제 생성 전에 영역을 먼저 표시한다(숨김 상태면 clientWidth가 0이 됨).
    questionArea.classList.remove('hidden');
    blankTestArea.classList.add('hidden');
    answerArea.classList.add('hidden');
    gradeArea.classList.add('hidden');
    fontSizeControl.classList.remove('hidden');

    // 빈칸 문제 생성
    currentQuestion = createBlankQuestion(verses, difficulty);

    // UI 업데이트
    displayQuestion(currentQuestion);
    setSecondaryButtonsVisible(true);
    
    // 이전 채점 결과 초기화
    resetGradingStyles();
    
    // 현재 범위 값을 이전 값으로 저장
    updatePreviousRangeValues();
    
    // questionArea로 스크롤
    setTimeout(() => {
        questionArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function getSelectedDifficulty() {
    const checkedRadio = document.querySelector('input[name="difficulty"]:checked');
    return checkedRadio ? parseInt(checkedRadio.value) : 1;
}

function clearDifficultySelection() {
    const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
    difficultyRadios.forEach(radio => {
        radio.checked = false;
    });
    updateDifficultyDescMobile();
}

const DIFFICULTY_DESCS = {
    '1': '기초 - 빈칸 15%',
    '2': '초급 - 빈칸 25%',
    '3': '중급 - 빈칸 40%',
    '4': '고급 - 빈칸 60%',
    '5': '최고급 - 빈칸 80%'
};

function updateDifficultyDescMobile() {
    const el = document.getElementById('difficultyDescMobile');
    if (!el) return;
    const checked = document.querySelector('input[name="difficulty"]:checked');
    el.textContent = checked ? DIFFICULTY_DESCS[checked.value] : '';
}

function validateRange(startChapter, startVerse, endChapter, endVerse) {
    if (startChapter > endChapter) return false;
    if (startChapter === endChapter && startVerse > endVerse) return false;
    return true;
}

function collectVerses(startChapter, startVerse, endChapter, endVerse) {
    const verses = [];
    
    for (let chapter = startChapter; chapter <= endChapter; chapter++) {
        const chapterData = getChapterData(chapter);
        if (!chapterData) continue;
        
        const verseCount = getVerseCount(chapter);
        const firstVerse = (chapter === startChapter) ? startVerse : 1;
        const lastVerse = (chapter === endChapter) ? endVerse : verseCount;
        
        for (let verse = firstVerse; verse <= lastVerse; verse++) {
            const verseText = getVerseData(chapter, verse);
            if (verseText) {
                verses.push({
                    chapter,
                    verse,
                    text: verseText
                });
            }
        }
    }
    
    return verses;
}

function createBlankQuestion(verses, difficulty) {
    const question = {
        verses: [],
        difficulty,
        blanks: []
    };
    
    let globalMergedId = 0; // 전역 머지된 빈칸 ID
    
    verses.forEach((verseData, verseIndex) => {
        const { chapter, verse, text } = verseData;
        
        // 1-5단계: 빈칸 생성 (전역 머지 ID 사용)
        const result = createBlanksInText(text, difficulty, globalMergedId);
        const processedText = result.text;
        const blankInfo = { blanks: result.blanks };
        globalMergedId = result.nextMergedId; // 다음 머지 ID 업데이트
        
        question.verses.push({
            chapter,
            verse,
            originalText: text,
            processedText,
            blankInfo
        });
    });
    
    return question;
}

function createBlanksInText(text, difficulty, startBlankId = 0) {
    let words = text.split(' ');
    let blanks = [];
    let blankCount;
    
    // 난이도별 빈칸 개수 결정 (점진적 증가)
    switch(difficulty) {
        case 1: blankCount = Math.max(2, Math.floor(words.length * 0.15)); break;  // 15%
        case 2: blankCount = Math.max(3, Math.floor(words.length * 0.25)); break;  // 25%
        case 3: blankCount = Math.max(4, Math.floor(words.length * 0.40)); break;  // 40%
        case 4: blankCount = Math.max(5, Math.floor(words.length * 0.60)); break;  // 60%
        case 5: blankCount = Math.max(6, Math.floor(words.length * 0.80)); break;  // 80%
        default: blankCount = 2;
    }
    
    // 랜덤하게 빈칸 위치 선정
    const blankPositions = getRandomPositions(words.length, blankCount);
    
    // 빈칸 처리 및 연속 빈칸 표시
    let blankId = startBlankId;
    blankPositions.forEach((position, index) => {
        // 모든 단계에서 모든 단어에 빈칸 가능
        blanks.push({ position, answer: words[position], id: blankId });
        words[position] = `__BLANK_${blankId}__`;
        blankId++;
    });
    
    // 연속된 빈칸을 하나로 합치기
    const mergedResult = mergeConsecutiveBlanks(words, blanks, startBlankId);
    
    return {
        text: mergedResult.text,
        blanks: mergedResult.blanks,
        nextMergedId: mergedResult.nextMergedId // 다음에 사용할 머지 ID
    };
}

function mergeConsecutiveBlanks(words, blanks, startMergedId = 0) {
    let mergedWords = [];
    let mergedBlanks = [];
    let i = 0;
    let currentBlankGroup = [];
    let currentMergedId = startMergedId;
    
    while (i < words.length) {
        if (words[i].startsWith('__BLANK_')) {
            // 빈칸 시작 - 연속된 빈칸들을 수집
            currentBlankGroup = [];
            while (i < words.length && words[i].startsWith('__BLANK_')) {
                const blankId = parseInt(words[i].replace('__BLANK_', '').replace('__', ''));
                const originalBlank = blanks.find(b => b.id === blankId);
                if (originalBlank) {
                    currentBlankGroup.push(originalBlank.answer);
                }
                i++;
            }
            
            // 연속된 빈칸들을 입력 필드로 만든다.
            // 한 줄을 넘칠 만큼 긴 연속 빈칸은 단어 경계 기준으로 여러 칸으로 나눠
            // 화면 밖으로 넘치지 않게 한다(칸 사이에서 자연스럽게 줄바꿈).
            if (currentBlankGroup.length > 0) {
                const boxes = splitGroupIntoBoxes(currentBlankGroup);
                const isSplit = boxes.length > 1;
                const groupName = `g${currentMergedId}`; // 분할 그룹 식별자(자동 이동용)

                boxes.forEach(boxWords => {
                    const combinedAnswer = boxWords.join(' ');
                    const inputWidth = computeBlankWidth(combinedAnswer.length, boxWords.length);

                    mergedBlanks.push({
                        id: currentMergedId,
                        answer: combinedAnswer,
                        wordCount: boxWords.length
                    });

                    // 분할된 경우에만 자동 이동 정보를 부여한다.
                    // data-fill-len 은 공백을 제외한 정답 글자 수(띄어쓰기는 세지 않음).
                    let groupAttr = '';
                    if (isSplit) {
                        const fillLen = combinedAnswer.replace(/\s/g, '').length;
                        groupAttr = ` data-blank-group="${groupName}" data-fill-len="${fillLen}"`;
                    }

                    mergedWords.push(`<input type="text" class="blank-input" data-blank-id="${currentMergedId}" style="width: ${inputWidth}px;"${groupAttr} autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="next">`);
                    currentMergedId++;
                });
            }
        } else {
            // 일반 단어
            mergedWords.push(words[i]);
            i++;
        }
    }
    
    return {
        text: mergedWords.join(' '),
        blanks: mergedBlanks,
        nextMergedId: currentMergedId
    };
}

// 절(verse) 한 줄에 빈칸이 차지할 수 있는 실제 최대 너비(px).
// questionContent의 렌더된 너비에서 verse 패딩(15*2)+왼쪽 보더(3)를 뺀 값.
// 이 값을 칸 폭 상한이자 분할 기준으로 써야 카드 밖으로 넘치지 않는다.
function getVerseContentWidth() {
    const qc = document.getElementById('questionContent');
    let w = qc ? qc.clientWidth : 0;
    // 영역이 아직 숨김이라 측정이 0이면 window 기반으로 보수적 추정.
    if (!w) w = Math.min(window.innerWidth, 1200) - 40;
    return Math.max(w - 33, 60);
}

// 글자 수에 비례한 '상한 적용 전' 칸 너비(px). 분할 판단과 폭 계산의 공통 기준.
function rawBlankWidth(answerLength) {
    const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--reading-scale')) || 1;
    const isMobile = window.innerWidth <= 768;
    const perChar = isMobile ? 13 : 15;
    return (answerLength * perChar + 20) * scale;
}

function computeBlankWidth(answerLength, wordCount) {
    // 절 내용 너비를 절대 넘지 않게 상한을 둔다(보더/마진 여유 8px).
    const cap = getVerseContentWidth() - 8;
    return Math.round(Math.min(rawBlankWidth(answerLength), cap));
}

// 연속 빈칸 단어 묶음을, 한 줄에 들어가는 크기로 단어 경계에서 나눈다.
// 단어 중간은 절대 자르지 않는다(한 단어가 한 줄보다 길면 그 단어만 단독 칸).
function splitGroupIntoBoxes(groupWords) {
    // 빌드 시점엔 세로 스크롤바가 아직 없어 폭이 더 크게 측정될 수 있으므로,
    // 스크롤바 여유(~18px)를 더 빼 보수적으로 나눈다(렌더 후 recompute가 최종 보정).
    const budget = getVerseContentWidth() - 26;
    const boxes = [];
    let current = [];
    groupWords.forEach(word => {
        const trial = current.concat([word]);
        // 상한 적용 전 너비로 비교해야, 칸이 budget을 넘기 직전에 새 칸으로 나뉜다.
        const width = rawBlankWidth(trial.join(' ').length);
        if (current.length > 0 && width > budget) {
            boxes.push(current);
            current = [word];
        } else {
            current = trial;
        }
    });
    if (current.length > 0) boxes.push(current);
    return boxes;
}

function getRandomPositions(totalLength, count) {
    const positions = [];
    while (positions.length < count && positions.length < totalLength) {
        const pos = Math.floor(Math.random() * totalLength);
        if (!positions.includes(pos)) {
            positions.push(pos);
        }
    }
    return positions.sort((a, b) => a - b);
}



function displayQuestion(question) {
    let html = '<div class="verses">';
    
    question.verses.forEach(verseData => {
        const { chapter, verse, processedText } = verseData;
        
        html += `
            <div class="verse">
                <span class="verse-number">${chapter}:${verse}</span>
                <span class="verse-text">${processedText}</span>
            </div>
        `;
    });
    
    html += '</div>';
    questionContent.innerHTML = html;
    // 렌더 후(세로 스크롤바 포함) 실제 폭으로 칸 너비를 다시 클램프해 카드 밖 넘침을 막는다.
    recomputeBlankWidths();
    setupBlankInputBehavior();
}

// 백지시험 생성 함수
function generateBlankTest() {
    const startChapter = parseInt(chapterStartSelect.value);
    const startVerse = parseInt(verseStartSelect.value);
    const endChapter = parseInt(chapterEndSelect.value);
    const endVerse = parseInt(verseEndSelect.value);
    
    // 범위 검증
    if (!validateRange(startChapter, startVerse, endChapter, endVerse)) {
        alert('올바른 범위를 선택해주세요.');
        return;
    }
    
    // 난이도 선택 해제
    clearDifficultySelection();
    
    // 범위 내 구절들 수집
    const verses = collectVerses(startChapter, startVerse, endChapter, endVerse);
    
    // 백지시험 생성
    currentBlankTest = createBlankTest(verses);
    
    // UI 업데이트
    displayBlankTest(currentBlankTest);
    setSecondaryButtonsVisible(true);

    // 영역 표시
    blankTestArea.classList.remove('hidden');
    questionArea.classList.add('hidden');
    answerArea.classList.add('hidden');
    gradeArea.classList.add('hidden');
    fontSizeControl.classList.remove('hidden');
    
    // 이전 채점 결과 초기화
    resetGradingStyles();
    
    // 현재 범위 값을 이전 값으로 저장
    updatePreviousRangeValues();
    
    // blankTestArea로 스크롤
    setTimeout(() => {
        blankTestArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function createBlankTest(verses) {
    const blankTest = {
        verses: [],
        blanks: []
    };
    
    verses.forEach((verseData, verseIndex) => {
        const { chapter, verse, text } = verseData;
        
        // 백지시험: 완전한 입력 영역 제공
        const processedText = `<textarea class="blank-test-input" data-blank-id="${verseIndex}" placeholder="여기에 ${chapter}:${verse} 구절을 입력하세요..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>`;
        const blankInfo = { blanks: [{ id: verseIndex, answer: text, wordCount: text.split(' ').length }] };
        
        blankTest.verses.push({
            chapter,
            verse,
            originalText: text,
            processedText,
            blankInfo
        });
    });
    
    return blankTest;
}

function displayBlankTest(blankTest) {
    let html = '<div class="verses">';
    
    blankTest.verses.forEach(verseData => {
        const { chapter, verse, processedText } = verseData;
        
        html += `
            <div class="verse">
                <span class="verse-number">${chapter}:${verse}</span>
                <div class="verse-text">${processedText}</div>
            </div>
        `;
    });
    
    html += '</div>';
    blankTestContent.innerHTML = html;

    // PC: 포커싱된 백지시험 입력 칸 중앙 스크롤
    setupPcFocusScroll(Array.from(blankTestContent.querySelectorAll('.blank-test-input')));
}

function showAnswer() {
    let verses = [];
    
    if (currentQuestion) {
        verses = currentQuestion.verses;
    } else if (currentBlankTest) {
        verses = currentBlankTest.verses;
    } else {
        alert('먼저 문제를 생성해주세요.');
        return;
    }
    
    let html = '<div class="verses">';
    
    verses.forEach(verseData => {
        const { chapter, verse, originalText } = verseData;
        html += `
            <div class="verse">
                <span class="verse-number">${chapter}:${verse}</span>
                <span class="verse-text">${originalText}</span>
            </div>
        `;
    });
    
    html += '</div>';
    
    // 모달에 내용 표시
    document.getElementById('modalAnswerContent').innerHTML = html;
    openAnswerModal();
}

function gradeAnswers() {
    let totalBlanks = 0;
    let correctAnswers = 0;
    let results = [];
    
    if (currentBlankTest) {
        // 백지시험 채점
        const textareas = document.querySelectorAll('.blank-test-input');
        textareas.forEach(textarea => {
            const blankId = parseInt(textarea.dataset.blankId);
            const userInput = textarea.value.trim();
            
            // 해당 빈칸의 정답 찾기
            let correctAnswer = '';
            
            currentBlankTest.verses.forEach(verseData => {
                if (verseData.blankInfo && verseData.blankInfo.blanks) {
                    const blank = verseData.blankInfo.blanks.find(b => b.id === blankId);
                    if (blank) {
                        correctAnswer = blank.answer;
                    }
                }
            });
            
            totalBlanks += 1;
            const isCorrect = compareTexts(userInput, correctAnswer);
            if (isCorrect) correctAnswers += 1;
            
            // 텍스트 영역에 정답/오답 스타일 적용
            textarea.classList.remove('correct', 'incorrect');
            if (isCorrect) {
                textarea.classList.add('correct');
            } else {
                textarea.classList.add('incorrect');
            }
            
            results.push({
                userInput,
                correctAnswer,
                isCorrect
            });
        });
        
        // 백지시험 점수 표시 업데이트
        updateBlankTestScoreDisplay(correctAnswers, totalBlanks);
    } else if (currentQuestion) {
        // 1-5단계: 빈칸 채점
        const inputs = document.querySelectorAll('.blank-input');
        inputs.forEach(input => {
            const blankId = parseInt(input.dataset.blankId);
            const userInput = input.value.trim();
            
            // 해당 빈칸의 정답 찾기
            let correctAnswer = '';
            
            currentQuestion.verses.forEach(verseData => {
                if (verseData.blankInfo && verseData.blankInfo.blanks) {
                    const blank = verseData.blankInfo.blanks.find(b => b.id === blankId);
                    if (blank) {
                        correctAnswer = blank.answer;
                    }
                }
            });
            
            // 사용자에게 보여지는 input 박스 개수로 계산 (각 input당 1개)
            totalBlanks += 1;
            const isCorrect = compareTexts(userInput, correctAnswer);
            if (isCorrect) correctAnswers += 1;
            
            // 빈칸에 정답/오답 스타일 적용
            input.classList.remove('correct', 'incorrect');
            if (isCorrect) {
                input.classList.add('correct');
            } else {
                input.classList.add('incorrect');
            }
            
            results.push({
                userInput,
                correctAnswer,
                isCorrect
            });
        });
        
        // 빈칸문제 점수 표시 업데이트
        updateScoreDisplay(correctAnswers, totalBlanks);
    } else {
        alert('먼저 문제를 생성해주세요.');
        return;
    }
    
    // 첫 번째 오답으로 스크롤
    setTimeout(() => {
        const firstWrong = document.querySelector('.blank-input.incorrect, .blank-test-input.incorrect');
        if (firstWrong) {
            firstWrong.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 200);
}

function updateScoreDisplay(correctAnswers, totalBlanks) {
    const scoreDisplay = document.getElementById('scoreDisplay');
    if (!scoreDisplay) return;
    
    // 점수 텍스트 설정
    scoreDisplay.textContent = `${correctAnswers}/${totalBlanks}`;
    
    // 스타일 클래스 제거
    scoreDisplay.classList.remove('perfect', 'incorrect');
    
    // 점수에 따른 스타일 적용
    if (correctAnswers === totalBlanks) {
        scoreDisplay.classList.add('perfect');
    } else {
        scoreDisplay.classList.add('incorrect');
    }
    
    // 점수 표시 영역 보이기
    scoreDisplay.classList.remove('hidden');
}

function updateBlankTestScoreDisplay(correctAnswers, totalBlanks) {
    const scoreDisplay = document.getElementById('blankTestScoreDisplay');
    if (!scoreDisplay) return;
    
    // 점수 텍스트 설정
    scoreDisplay.textContent = `${correctAnswers}/${totalBlanks}`;
    
    // 스타일 클래스 제거
    scoreDisplay.classList.remove('perfect', 'incorrect');
    
    // 점수에 따른 스타일 적용
    if (correctAnswers === totalBlanks) {
        scoreDisplay.classList.add('perfect');
    } else {
        scoreDisplay.classList.add('incorrect');
    }
    
    // 점수 표시 영역 보이기
    scoreDisplay.classList.remove('hidden');
}

function compareTexts(userInput, correctAnswer) {
    // 띄어쓰기와 공백을 고려하지 않고 텍스트의 일치 여부만 확인
    const normalize = (text) => text.replace(/\s+/g, '').toLowerCase();
    const normalizedUser = normalize(userInput);
    const normalizedCorrect = normalize(correctAnswer);
    return normalizedUser === normalizedCorrect;
}

function enableVerseClickToShowAnswer() {
    // 모든 절에 클릭 가능한 스타일과 이벤트 추가
    const verses = document.querySelectorAll('.verse');
    verses.forEach(verse => {
        verse.classList.add('clickable');
        
        // 기존 이벤트 리스너 제거 (중복 방지)
        verse.removeEventListener('click', handleVerseClick);
        
        // 새 이벤트 리스너 추가
        verse.addEventListener('click', handleVerseClick);
    });
}

function handleVerseClick(event) {
    const verse = event.currentTarget;
    const verseNumber = verse.querySelector('.verse-number');
    
    if (!verseNumber) return;
    
    // 절 번호에서 장:절 정보 추출
    const verseText = verseNumber.textContent;
    const [chapter, verseNum] = verseText.split(':').map(num => parseInt(num));
    
    // 해당 절의 원본 텍스트 찾기
    let verseData = null;
    if (currentQuestion) {
        verseData = currentQuestion.verses.find(v => v.chapter === chapter && v.verse === verseNum);
    } else if (currentBlankTest) {
        verseData = currentBlankTest.verses.find(v => v.chapter === chapter && v.verse === verseNum);
    }
    
    if (verseData) {
        showVerseAnswer(chapter, verseNum, verseData.originalText);
    }
}

function showVerseAnswer(chapter, verse, originalText) {
    const html = `
        <div class="verses">
            <div class="verse">
                <span class="verse-number">${chapter}:${verse}</span>
                <span class="verse-text">${originalText}</span>
            </div>
        </div>
    `;
    
    // 모달에 내용 표시
    document.getElementById('modalAnswerContent').innerHTML = html;
    openAnswerModal();
}

function resetGradingStyles() {
    // 모든 빈칸의 정답/오답 스타일 제거
    const inputs = document.querySelectorAll('.blank-input');
    inputs.forEach(input => {
        input.classList.remove('correct', 'incorrect');
    });
    
    // 백지시험 텍스트 영역의 정답/오답 스타일 제거
    const textareas = document.querySelectorAll('.blank-test-input');
    textareas.forEach(textarea => {
        textarea.classList.remove('correct', 'incorrect');
    });
    
    // 모든 절의 클릭 가능 스타일 제거
    const verses = document.querySelectorAll('.verse');
    verses.forEach(verse => {
        verse.classList.remove('clickable');
        verse.removeEventListener('click', handleVerseClick);
    });
    
    // 점수 표시 숨기기
    const scoreDisplay = document.getElementById('scoreDisplay');
    if (scoreDisplay) {
        scoreDisplay.classList.add('hidden');
        scoreDisplay.classList.remove('perfect', 'incorrect');
    }

    const blankTestScoreDisplay = document.getElementById('blankTestScoreDisplay');
    if (blankTestScoreDisplay) {
        blankTestScoreDisplay.classList.add('hidden');
        blankTestScoreDisplay.classList.remove('perfect', 'incorrect');
    }
}


function clearAllBlanks() {
    if (currentBlankTest) {
        // 백지시험: 텍스트 영역 초기화
        const textareas = document.querySelectorAll('.blank-test-input');
        textareas.forEach(textarea => {
            textarea.value = '';
            textarea.classList.remove('correct', 'incorrect');
        });
        
        // 백지시험 점수 표시 숨기기
        const blankTestScoreDisplay = document.getElementById('blankTestScoreDisplay');
        if (blankTestScoreDisplay) {
            blankTestScoreDisplay.classList.add('hidden');
            blankTestScoreDisplay.classList.remove('perfect', 'incorrect');
        }
    } else if (currentQuestion) {
        // 일반 빈칸: 입력 필드 초기화
        const inputs = document.querySelectorAll('.blank-input');
        inputs.forEach(input => {
            input.value = '';
            input.classList.remove('correct', 'incorrect');
        });
        
        // 빈칸문제 점수 표시 숨기기
        const scoreDisplay = document.getElementById('scoreDisplay');
        if (scoreDisplay) {
            scoreDisplay.classList.add('hidden');
            scoreDisplay.classList.remove('perfect', 'incorrect');
        }
    } else {
        return;
    }
    
    // 절 클릭 기능 제거
    const verses = document.querySelectorAll('.verse');
    verses.forEach(verse => {
        verse.classList.remove('clickable');
        verse.removeEventListener('click', handleVerseClick);
    });

    // 채점 영역 숨기기
    gradeArea.classList.add('hidden');
}

function handleRangeChange(event) {
    // 문제가 생성된 상태인지 확인
    const hasActiveQuestion = (currentQuestion && !questionArea.classList.contains('hidden')) || 
                             (currentBlankTest && !blankTestArea.classList.contains('hidden'));
    
    if (hasActiveQuestion) {
        // 범위 재설정 확인 팝업
        if (confirm('범위를 재설정하시겠습니까? 현재 문제가 초기화됩니다.')) {
            resetToInitialState();
            // 새로운 값으로 업데이트
            updatePreviousRangeValues();
        } else {
            // 취소한 경우 이전 값으로 되돌리기
            restorePreviousRangeValues();
            return;
        }
    } else {
        // 문제가 없는 상태에서는 정상적으로 업데이트
        updatePreviousRangeValues();
    }
    
    // 범위 변경에 따른 기존 로직 실행
    if (event.target === chapterStartSelect) {
        updateStartVerseSelector();
    } else if (event.target === verseStartSelect) {
        updateEndRangeOptions();
    } else if (event.target === chapterEndSelect) {
        updateEndVerseForRange();
    } else if (event.target === verseEndSelect) {
        validateEndRange();
    }
}

function updatePreviousRangeValues() {
    previousRangeValues.chapterStart = parseInt(chapterStartSelect.value) || 1;
    previousRangeValues.verseStart = parseInt(verseStartSelect.value) || 1;
    previousRangeValues.chapterEnd = parseInt(chapterEndSelect.value) || 1;
    previousRangeValues.verseEnd = parseInt(verseEndSelect.value) || 1;
}

function restorePreviousRangeValues() {
    chapterStartSelect.value = previousRangeValues.chapterStart;
    verseStartSelect.value = previousRangeValues.verseStart;
    chapterEndSelect.value = previousRangeValues.chapterEnd;
    verseEndSelect.value = previousRangeValues.verseEnd;
}

function resetToInitialState() {
    // 현재 문제 초기화
    currentQuestion = null;
    currentBlankTest = null;
    
    // 모든 영역 숨기기
    questionArea.classList.add('hidden');
    blankTestArea.classList.add('hidden');
    answerArea.classList.add('hidden');
    gradeArea.classList.add('hidden');
    
    // 보조 버튼 그룹 숨기기
    setSecondaryButtonsVisible(false);
    
    // 점수 표시 숨기기
    resetGradingStyles();

    // 모달 닫기 (열려 있던 경우 body 고정 상태도 함께 해제)
    const modal = document.getElementById('answerModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    document.body.classList.remove('modal-open');
    document.body.style.top = '';
}



// 모달 관련 함수들
// body.modal-open 은 position:fixed 라서, 열 때 현재 스크롤 위치를 top 으로 고정해두고
// 닫을 때 그 위치로 되돌려야 페이지가 최상단으로 튀지 않는다.
let modalSavedScrollY = 0;
function openAnswerModal() {
    modalSavedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = `-${modalSavedScrollY}px`;
    document.getElementById('answerModal').classList.remove('hidden');
    document.body.classList.add('modal-open');
}

function closeAnswerModal() {
    document.getElementById('answerModal').classList.add('hidden');
    document.body.classList.remove('modal-open');
    document.body.style.top = '';
    window.scrollTo(0, modalSavedScrollY);
}

// 빈칸 입력 UX: Tab/엔터로 다음 빈칸 이동, 키보드에 가릴 때만 스크롤
function setupBlankInputBehavior() {
    const inputs = Array.from(document.querySelectorAll('.blank-input'));
    inputs.forEach((input, index) => {
        // 채점 후 수정 시 오답 표시 초기화
        input.addEventListener('input', () => {
            input.classList.remove('correct', 'incorrect');
        });

        // 조합 상태 추적(아래 keydown Tab/Enter 처리에서도 사용).
        let composing = false;
        input.addEventListener('compositionstart', () => { composing = true; });
        input.addEventListener('compositionend', () => { composing = false; });

        // 분할된 연속 빈칸: 현재 칸의 정답 글자 수(공백 제외)를 채우면 같은 그룹의
        // 다음 칸으로 자동 이동한다. 띄어쓰기는 세지 않는다.
        const maybeAdvance = () => {
            const group = input.dataset.blankGroup;
            if (!group) return;
            const fillLen = parseInt(input.dataset.fillLen, 10);
            if (!fillLen) return;
            const typedLen = input.value.replace(/\s/g, '').length;
            if (typedLen < fillLen) return;
            const next = inputs[index + 1];
            if (next && next.dataset.blankGroup === group) {
                moveFocusTo(next);
            }
        };

        // 자동 이동은 '공백 입력(= 단어 경계)'에서만 한다.
        // 받침 때문에 글자 수나 compositionend로 이동하면 음절이 쪼개진다: 예) "는"(ㄴㅡㄴ)은
        // IME가 받침 없는 "느"를 먼저 음절로 확정해버려 "이느" 시점에 이동→받침 ㄴ이 다음 칸으로 샘.
        // 반면 공백을 치는 순간엔 직전 음절이 받침까지 완전히 확정되고(공백은 조합이 아님),
        // 분할 칸 경계는 항상 원문 띄어쓰기와 일치하므로 받침이 절대 잘리지 않는다.
        input.addEventListener('input', (e) => {
            if (composing || e.isComposing) return;   // 조합 중이면 무시(공백은 조합이 아님)
            if (!/\s$/.test(input.value)) return;      // 방금 입력으로 끝이 공백이 된 경우만
            maybeAdvance();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab' && e.key !== 'Enter') return;

            e.preventDefault();

            const dir = (e.key === 'Tab' && e.shiftKey) ? -1 : 1;
            const target = inputs[index + dir];
            if (!target) return;

            // iOS/iPadOS는 입력 수단에 따라 처리를 나눈다.
            //
            // [소프트 키보드] '>' 같은 키보드 내장 다음칸 키는 Enter로 들어온다.
            //   이때 readOnly 가드를 쓰면 iOS가 다음 칸을 '편집 불가'로 보고 키보드를
            //   내려버린다. 또한 iOS는 '사용자 제스처' 안에서 '동기' focus를 해야 키보드가
            //   유지되므로, rAF/blur/readOnly 없이 즉시 focus만 한다.
            //
            // [물리 키보드] 소프트 키보드가 없는 상태. Tab으로 이동 시 IME 조합 글자가
            //   다음 칸에 '복제'되어 새는 누출이 발생한다(소스엔 정상 확정됨). 다음 칸을
            //   잠깐 readOnly로 막아 유입을 차단한다(타이밍 경쟁에 의존하지 않음).
            if (IS_IOS_LIKE) {
                if (isSoftKeyboardVisible()) {
                    target.focus(); // 동기 focus로 키보드 유지
                } else {
                    focusWithLeakGuard(target);
                }
                return;
            }

            // 데스크톱: 조합 중이면 compositionend 후 이동, 아니면 바로 이동.
            // rAF로 감싸 target에 Tab keydown이 재발사돼 한 칸 건너뛰는 현상 방지.
            const move = () => requestAnimationFrame(() => target.focus());
            if (composing) {
                let done = false;
                const finish = () => {
                    if (done) return;
                    done = true;
                    input.removeEventListener('compositionend', onEnd);
                    clearTimeout(safety);
                    move();
                };
                const onEnd = () => finish();
                input.addEventListener('compositionend', onEnd);
                const safety = setTimeout(finish, 250);
            } else {
                move();
            }
        });
    });

    // PC: 포커싱된 빈칸 중앙 스크롤
    setupPcFocusScroll(inputs);

    // 포커스당 1회만 auto-scroll: 키보드가 올라오는 순간(높이 감소)에만 반응
    if (window.visualViewport) {
        let prevVVHeight = window.visualViewport.height;
        let didScrollForCurrentFocus = false;

        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                didScrollForCurrentFocus = false;
                prevVVHeight = window.visualViewport.height;
            });
            input.addEventListener('blur', () => {
                didScrollForCurrentFocus = false;
            });
        });

        window.visualViewport.addEventListener('resize', () => {
            const vv = window.visualViewport;
            const heightDecreased = vv.height < prevVVHeight - 50; // 키보드 등장
            prevVVHeight = vv.height;

            if (!heightDecreased || didScrollForCurrentFocus) return;

            const active = document.activeElement;
            if (!active || !active.classList.contains('blank-input')) return;

            const rect = active.getBoundingClientRect();
            const visibleBottom = vv.offsetTop + vv.height;
            if (rect.bottom > visibleBottom - 16) {
                didScrollForCurrentFocus = true;
                active.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }
}

// 소프트(화면) 키보드가 떠 있는지 추정: 키보드가 올라오면 visualViewport 높이가
// 레이아웃 뷰포트보다 크게 줄어든다. 물리 키보드 사용 시엔 화면 키보드가 없어 거의 같다.
function isSoftKeyboardVisible() {
    if (!window.visualViewport) return false;
    return window.visualViewport.height < window.innerHeight - 100;
}

// iOS 수신 측 누출 가드: 다음 칸을 잠깐 readOnly로 두어 IME 잔여 조합 글자가
// 새로 포커스된 칸에 유입되는 것을 차단한다. 누출은 소스에 이미 확정된 글자의
// '중복'이므로 이 차단으로 데이터가 손실되지 않는다.
//
// 핵심: 누출 조합은 focus 직후(수 ms 내) '키 입력 없이' 들어오므로 readOnly로 막힌다.
// 반면 사용자의 실제 타이핑은 그보다 늦게 keydown으로 오니, 그 즉시 readOnly를 풀어
// '첫 글자(자음)가 씹히는' 현상을 없앤다. focus 직후 아주 이른 keydown만 누출로 보고 무시.
function focusWithLeakGuard(target, guardMs = 250) {
    target.readOnly = true;
    const startTime = performance.now();
    let released = false;
    const release = () => {
        if (released) return;
        released = true;
        clearTimeout(safety);
        target.removeEventListener('keydown', onKeydown);
        target.readOnly = false;
        const len = target.value.length;
        try { target.setSelectionRange(len, len); } catch (_) {}
        target.focus(); // readOnly 해제 후 입력 가능 상태로 재확정
    };
    // focus 직후 ~50ms 안의 keydown은 잔여 조합 플러시로 보고 무시(readOnly 유지),
    // 그 이후의 keydown(사용자 실제 입력)은 즉시 가드를 풀어 그 글자가 들어가게 한다.
    const onKeydown = () => { if (performance.now() - startTime > 50) release(); };
    target.addEventListener('keydown', onKeydown);
    const safety = setTimeout(release, guardMs); // keydown이 없어도 일정 시간 뒤 자동 해제
    requestAnimationFrame(() => target.focus());
}

// 자동 이동용 포커스 이동. iOS 소프트 키보드는 사용자 제스처 안에서 동기 focus 해야
// 키보드가 유지되므로 분기한다(Tab 이동 로직과 동일한 정책).
function moveFocusTo(target) {
    if (IS_IOS_LIKE) {
        if (isSoftKeyboardVisible()) {
            target.focus();
        } else {
            focusWithLeakGuard(target);
        }
    } else {
        requestAnimationFrame(() => target.focus());
    }
}

function recomputeBlankWidths() {
    if (!currentQuestion) return;
    const inputs = document.querySelectorAll('.blank-input');
    const allBlanks = currentQuestion.verses.flatMap(v => v.blankInfo.blanks);
    inputs.forEach(input => {
        const blankId = parseInt(input.dataset.blankId);
        const blank = allBlanks.find(b => b.id === blankId);
        if (!blank) return;
        input.style.width = computeBlankWidth(blank.answer.length, blank.wordCount) + 'px';
    });
}

function applyReadingScale(scale) {
    document.documentElement.style.setProperty('--reading-scale', scale);
    localStorage.setItem('reading-scale', scale);
    recomputeBlankWidths();
    const fontDecreaseBtn = document.getElementById('fontDecreaseBtn');
    const fontIncreaseBtn = document.getElementById('fontIncreaseBtn');
    const fontResetBtn2 = document.getElementById('fontResetBtn');
    if (fontDecreaseBtn) fontDecreaseBtn.disabled = (readingScaleIndex === 0);
    if (fontIncreaseBtn) fontIncreaseBtn.disabled = (readingScaleIndex === READING_SCALES.length - 1);
    if (fontResetBtn2) fontResetBtn2.disabled = (readingScaleIndex === 1);
}

// 아이패드 회전 시 빈칸 너비 재계산
let resizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(recomputeBlankWidths, 150);
});

function setupPageReloadHandler() {
    // 페이지 새로고침 시 스크롤 위치를 최상단으로 설정
    window.addEventListener('beforeunload', function() {
        window.scrollTo(0, 0);
    });
    
    // 페이지 로드 시에도 최상단으로 설정 (브라우저가 이전 위치를 기억하는 경우 대비)
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
}

// 모달 관련 이벤트 리스너 설정
function setupModalEventListeners() {
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAnswerModal();
        }
    });

    // 모달 배경 클릭으로 닫기
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('answerModal');
        if (event.target === modal) {
            closeAnswerModal();
        }
    });
}

function setupScrollToTopButton() {
    // 스크롤 이벤트 리스너
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.remove('hidden');
        } else {
            scrollToTopBtn.classList.add('hidden');
        }
    });

    // 클릭 이벤트 리스너
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 보조 버튼 그룹(본문확인/채점하기/빈칸초기화)과 퀵메뉴 노출 여부를 일괄 토글
function setSecondaryButtonsVisible(visible) {
    const secondaryGroup = document.querySelector('.action-group-secondary');
    if (visible) {
        secondaryGroup.classList.remove('hidden');
        quickMenu.classList.remove('hidden');
    } else {
        secondaryGroup.classList.add('hidden');
        quickMenu.classList.add('hidden');
    }
}

// PC: 포커싱된 입력 칸을 화면 중앙으로 자동 스크롤
function setupPcFocusScroll(inputs) {
    if (IS_IOS_LIKE) return;
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            requestAnimationFrame(() => {
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });
    });
}


