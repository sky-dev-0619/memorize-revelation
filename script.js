// 전역 변수
let currentQuestion = null;
let userInputs = [];

// DOM 요소들
const chapterStartSelect = document.getElementById('chapterStart');
const verseStartSelect = document.getElementById('verseStart');
const chapterEndSelect = document.getElementById('chapterEnd');
const verseEndSelect = document.getElementById('verseEnd');
// Radio 버튼으로 변경됨 - 직접 선택된 값을 가져오는 함수 사용
const generateBtn = document.getElementById('generateBtn');
const showAnswerBtn = document.getElementById('showAnswerBtn');
const gradeBtn = document.getElementById('gradeBtn');
const retryBtn = document.getElementById('retryBtn');
const questionArea = document.getElementById('questionArea');
const answerArea = document.getElementById('answerArea');
const gradeArea = document.getElementById('gradeArea');
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
const questionContent = document.getElementById('questionContent');
const answerContent = document.getElementById('answerContent');
const gradeContent = document.getElementById('gradeContent');

// 초기화
document.addEventListener('DOMContentLoaded', async function() {
    // 초기 상태에서 모든 영역 숨기기
    questionArea.classList.add('hidden');
    answerArea.classList.add('hidden');
    gradeArea.classList.add('hidden');
    
    // 모달 확실히 숨기기
    const modal = document.getElementById('answerModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // 버튼 초기 상태 설정
    showAnswerBtn.disabled = true;
    gradeBtn.disabled = true;
    retryBtn.disabled = true;
    
    // 요한계시록 데이터 로드
    await loadRevelationData();
    
    // 선택기 초기화
    initializeSelectors();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 모달 관련 이벤트 리스너
    setupModalEventListeners();
    
    // 스크롤 투 탑 버튼 이벤트 리스너
    setupScrollToTopButton();
    

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
    chapterStartSelect.addEventListener('change', updateStartVerseSelector);
    verseStartSelect.addEventListener('change', updateEndRangeOptions);
    chapterEndSelect.addEventListener('change', updateEndVerseForRange);
    verseEndSelect.addEventListener('change', validateEndRange);
    generateBtn.addEventListener('click', generateQuestion);
    showAnswerBtn.addEventListener('click', showAnswer);
    gradeBtn.addEventListener('click', gradeAnswers);
    retryBtn.addEventListener('click', retryQuestion);
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
    
    // 빈칸 문제 생성
    currentQuestion = createBlankQuestion(verses, difficulty);
    
    // UI 업데이트
    displayQuestion(currentQuestion);
    showAnswerBtn.disabled = false;
    gradeBtn.disabled = false;
    
    // 영역 표시
    questionArea.classList.remove('hidden');
    answerArea.classList.add('hidden');
    gradeArea.classList.add('hidden');
    
    // 이전 채점 결과 초기화
    resetGradingStyles();
}

function getSelectedDifficulty() {
    const checkedRadio = document.querySelector('input[name="difficulty"]:checked');
    return checkedRadio ? parseInt(checkedRadio.value) : 1;
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
        let processedText;
        let blankInfo;
        
        // 1-5단계: 빈칸 생성 (전역 머지 ID 사용)
        const result = createBlanksInText(text, difficulty, globalMergedId);
        processedText = result.text;
        blankInfo = { blanks: result.blanks };
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
            
            // 연속된 빈칸들을 하나의 입력 필드로 합치기
            if (currentBlankGroup.length > 0) {
                const combinedAnswer = currentBlankGroup.join(' ');
                const isMobile = window.innerWidth <= 768;
                
                let inputWidth;
                if (isMobile) {
                    // 모바일에서는 한글 입력 시 레이아웃 변화를 방지하기 위해 여유 있는 크기로 설정
                    const maxMobileWidth = Math.min(window.innerWidth - 80, 300);
                    inputWidth = Math.min(combinedAnswer.length * 16 + 40, maxMobileWidth);
                } else {
                    // PC에서는 기존 로직 유지
                    inputWidth = Math.max(combinedAnswer.length * 16, 60) + 30;
                }
                
                mergedBlanks.push({
                    id: currentMergedId,
                    answer: combinedAnswer,
                    wordCount: currentBlankGroup.length
                });
                
                mergedWords.push(`<input type="text" class="blank-input" data-blank-id="${currentMergedId}" style="width: ${inputWidth}px;">`);
                currentMergedId++;
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
}

function showAnswer() {
    if (!currentQuestion) {
        alert('먼저 문제를 생성해주세요.');
        return;
    }
    
    let html = '<div class="verses">';
    
    currentQuestion.verses.forEach(verseData => {
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
    document.getElementById('answerModal').classList.remove('hidden');
}

function gradeAnswers() {
    if (!currentQuestion) return;
    
    let totalBlanks = 0;
    let correctAnswers = 0;
    let results = [];
    
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
    
    // 점수 표시 업데이트
    updateScoreDisplay(correctAnswers, totalBlanks);
    
    // 채점 후 절별 클릭 기능 활성화
    enableVerseClickToShowAnswer();
    
    // 다시 문제풀기 버튼 활성화
    retryBtn.classList.remove('hidden');
    retryBtn.disabled = false;
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
    
    if (!verseNumber || !currentQuestion) return;
    
    // 절 번호에서 장:절 정보 추출
    const verseText = verseNumber.textContent;
    const [chapter, verseNum] = verseText.split(':').map(num => parseInt(num));
    
    // 해당 절의 원본 텍스트 찾기
    const verseData = currentQuestion.verses.find(v => v.chapter === chapter && v.verse === verseNum);
    
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
    document.getElementById('answerModal').classList.remove('hidden');
}

function resetGradingStyles() {
    // 모든 빈칸의 정답/오답 스타일 제거
    const inputs = document.querySelectorAll('.blank-input');
    inputs.forEach(input => {
        input.classList.remove('correct', 'incorrect');
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
    
    // 다시 문제풀기 버튼 숨기기
    retryBtn.classList.add('hidden');
    retryBtn.disabled = true;
}

function retryQuestion() {
    if (!currentQuestion) return;
    
    // 채점 스타일만 제거하고 입력된 텍스트는 유지
    const inputs = document.querySelectorAll('.blank-input');
    inputs.forEach(input => {
        input.classList.remove('correct', 'incorrect');
    });
    
    // 절 클릭 기능 제거
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
    
    // 다시 문제풀기 버튼 숨기기
    retryBtn.classList.add('hidden');
    retryBtn.disabled = true;
    
    // 채점 영역 숨기기
    gradeArea.classList.add('hidden');
}



// 모달 관련 함수들
function closeAnswerModal() {
    document.getElementById('answerModal').classList.add('hidden');
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


