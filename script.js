```javascript
// タイマーの設定
let WORK_TIME = 25 * 60; // 25分
let BREAK_TIME = 5 * 60; // 5分
let LONG_BREAK_TIME = 15 * 60; // 15分
let SESSIONS_BEFORE_LONG_BREAK = 4;
let currentSession = 0;

let timeLeft = WORK_TIME;
let timerId = null;
let points = 0;
let level = 1;
let levelProgress = 0; // レベル進捗の追加
let sessionCount = 0; // セッションカウントの追加
let history = JSON.parse(localStorage.getItem('pomodoroHistory')) || [];
let isBreak = false;

// サウンドの設定
const timerEndSound = new Audio('sounds/timer-end.mp3');
const levelUpSound = new Audio('sounds/level-up.mp3');

// DOM要素の取得
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const pointsDisplay = document.getElementById('points');
const levelDisplay = document.getElementById('level');
const historyList = document.getElementById('historyList');
const progressRing = document.querySelector('.progress-ring__circle-progress');
const minimizeBtn = document.querySelector('.minimize-btn');
const container = document.querySelector('.container');
const minimizedTimer = document.getElementById('minimizedTimer');
const levelProgressBar = document.querySelector('.points-bar');
const nextLevelInfo = document.getElementById('nextLevelInfo');

// 設定関連の要素
const workTimeInput = document.getElementById('workTime');
const breakTimeInput = document.getElementById('breakTime');
const longBreakTimeInput = document.getElementById('longBreakTime');
const sessionsInput = document.getElementById('sessionsBeforeLongBreak');

// サウンド設定の要素
const soundEnabledCheckbox = document.getElementById('soundEnabled');

// カレンダー関連の要素
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const currentMonthDisplay = document.getElementById('currentMonth');
const calendarGrid = document.getElementById('calendarGrid');

// グラフ関連
const statsChart = document.getElementById('statsChart');
let chart;

// プログレスリングの設定
const radius = 100; // 固定値を使用
const circumference = radius * 2 * Math.PI;
progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
progressRing.style.strokeDashoffset = circumference;

// テーマ設定
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// テーマの初期設定
const savedTheme = localStorage.getItem('theme') || 'light';
body.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'light' ? '🌙' : '☀️';

// 画面上に固定する設定
const fixedPositionCheckbox = document.getElementById('fixedPosition');
const savedFixedPosition = localStorage.getItem('fixedPosition') === 'true';
fixedPositionCheckbox.checked = savedFixedPosition;
if (savedFixedPosition) {
  container.classList.add('fixed');
}

fixedPositionCheckbox.addEventListener('change', () => {
  const isFixed = fixedPositionCheckbox.checked;
  container.classList.toggle('fixed', isFixed);
  localStorage.setItem('fixedPosition', isFixed);
});

// テーマ切り替え
themeToggle.addEventListener('click', () => {
  const currentTheme = body.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  body.setAttribute('data-theme', newTheme);
  themeToggle.textContent = newTheme === 'light' ? '🌙' : '☀️';
  localStorage.setItem('theme', newTheme);
});

// ページ遷移
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

function showPage(pageId) {
  pages.forEach(page => {
    page.classList.remove('active');
    if (page.id === pageId) {
      page.classList.add('active');
    }
  });
  
  navItems.forEach(nav => {
    nav.classList.remove('active');
    if (nav.getAttribute('data-page') === pageId.replace('-page', '')) {
      nav.classList.add('active');
    }
  });
  
  // ページが切り替わったときにグラフを更新
  if (pageId === 'history-page') {
    updateCharts();
  }
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const targetPage = item.getAttribute('data-page');
    showPage(`${targetPage}-page`);
  });
});

// タイマーの更新
function updateTimer() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  minutesDisplay.textContent = minutes.toString().padStart(2, '0');
  secondsDisplay.textContent = seconds.toString().padStart(2, '0');
  
  // プログレスリングの更新
  const maxTime = isBreak ? 
    (currentSession % SESSIONS_BEFORE_LONG_BREAK === 0 ? LONG_BREAK_TIME : BREAK_TIME) : 
    WORK_TIME;
  const offset = circumference - (timeLeft / maxTime) * circumference;
  
  // アニメーションをよりスムーズに
  requestAnimationFrame(() => {
    progressRing.style.strokeDashoffset = offset;
  });
  
  // 縮小時のタイマーも更新
  updateMinimizedTimer();
  
  // タイトルも更新してタブで分かるようにする
  document.title = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} - ポモドーロ`;
}

// タイマーの開始
function startTimer() {
  if (timerId === null) {
    timerId = setInterval(() => {
      timeLeft--;
      updateTimer();

      if (timeLeft <= 0) {
        clearInterval(timerId);
        timerId = null;
        
        // タイマー終了音を再生
        if (soundEnabledCheckbox && soundEnabledCheckbox.checked) {
          timerEndSound.play().catch(e => console.log('音声再生エラー:', e));
        }
        
        if (isBreak) {
          // 休憩終了時の処理
          startWorkSession();
        } else {
          // 作業終了時の処理
          completePomodoro();
          startBreakSession();
        }
      }
    }, 1000);
    startBtn.textContent = '一時停止';
  } else {
    clearInterval(timerId);
    timerId = null;
    startBtn.textContent = 'スタート';
  }
}

// 作業セッションの開始
function startWorkSession() {
  isBreak = false;
  timeLeft = WORK_TIME;
  updateTimer();
  startBtn.textContent = 'スタート';
  document.body.classList.remove('break-mode');
  // 縮小画面でも状態が分かるように
  container.classList.remove('break-mode');
}

// 休憩セッションの開始
function startBreakSession() {
  isBreak = true;
  currentSession++;
  // 長い休憩か通常の休憩かを判断
  timeLeft = currentSession % SESSIONS_BEFORE_LONG_BREAK === 0 ? LONG_BREAK_TIME : BREAK_TIME;
  updateTimer();
  startBtn.textContent = 'スタート';
  document.body.classList.add('break-mode');
  // 縮小画面でも状態が分かるように
  container.classList.add('break-mode');
}

// タイマーのリセット
function resetTimer() {
  clearInterval(timerId);
  timerId = null;
  timeLeft = isBreak ? 
    (currentSession % SESSIONS_BEFORE_LONG_BREAK === 0 ? LONG_BREAK_TIME : BREAK_TIME) : 
    WORK_TIME;
  updateTimer();
  startBtn.textContent = 'スタート';
}

// ポモドーロ完了
function completePomodoro() {
  sessionCount++;
  
  // 作業時間に基づいてポイントを計算（基本ポイント + ボーナスポイント）
  const pointsEarned = 10; // 基本ポイント
  points += pointsEarned;
  levelProgress += pointsEarned;
  
  // ポイント獲得のアニメーション
  pointsDisplay.classList.add('point-gain');
  setTimeout(() => {
    pointsDisplay.classList.remove('point-gain');
  }, 300);
  
  // レベルアップチェック
  if (levelProgress >= 100) {
    level++;
    levelProgress = levelProgress - 100; // 余剰ポイントを次のレベルに持ち越し
    
    // レベルアップエフェクトを追加
    levelDisplay.classList.add('level-up');
    setTimeout(() => {
      levelDisplay.classList.remove('level-up');
    }, 800);
    
    // レベルアップサウンドを再生
    if (soundEnabledCheckbox && soundEnabledCheckbox.checked) {
      levelUpSound.play().catch(e => console.log('音声再生エラー:', e));
    }
    
    // レベルアップメッセージを表示
    showLevelUpMessage();
  }
  
  // 表示の更新
  pointsDisplay.textContent = points;
  levelDisplay.textContent = level;
  updatePointsBar();
  
  // 履歴の追加
  addHistory();
  
  // グラフを更新
  updateCharts();
}

// ポイントバーの更新
function updatePointsBar() {
  if (levelProgressBar) {
    levelProgressBar.style.width = `${levelProgress}%`;
  }
  
  if (nextLevelInfo) {
    nextLevelInfo.textContent = `次のレベルまで: ${100 - levelProgress}ポイント`;
  }
}

// レベルアップメッセージの表示
function showLevelUpMessage() {
  const messageElement = document.createElement('div');
  messageElement.className = 'level-up-message';
  messageElement.innerHTML = `
    <h2>レベルアップ！</h2>
    <p>おめでとうございます！レベル${level}に到達しました。</p>
    <div class="confetti-container"></div>
  `;
  
  document.body.appendChild(messageElement);
  
  // 紙吹雪エフェクト
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    confetti.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
    messageElement.querySelector('.confetti-container').appendChild(confetti);
  }
  
  // 数秒後にメッセージを消す
  setTimeout(() => {
    messageElement.remove();
  }, 3000);
}

// 履歴の追加
function addHistory() {
  const now = new Date();
  const historyItem = {
    date: now.toISOString(), // 日付をISO形式で保存
    duration: WORK_TIME, // 作業時間（秒単位）
    points: 10, // 獲得ポイント
    isComplete: true
  };
  
  history.unshift(historyItem);
  saveHistory();
  updateHistoryDisplay();
}

// 履歴の保存
function saveHistory() {
  localStorage.setItem('pomodoroHistory', JSON.stringify(history));
}

// 履歴表示の更新
function updateHistoryDisplay() {
  if (!historyList) return;
  
  historyList.innerHTML = '';
  
  // 最新の5件だけ表示
  const recentHistory = history.slice(0, 5);
  
  if (recentHistory.length === 0) {
    const emptyMessage = document.createElement('li');
    emptyMessage.className = 'empty-history';
    emptyMessage.textContent = '履歴はまだありません';
    historyList.appendChild(emptyMessage);
    return;
  }
  
  recentHistory.forEach(item => {
    const date = new Date(item.date);
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="history-date">${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
      <span class="history-duration">${Math.floor(item.duration / 60)}分</span>
      <span class="history-points">+${item.points}ポイント</span>
    `;
    historyList.appendChild(li);
    
    // アニメーション効果を追加
    setTimeout(() => {
      li.classList.add('visible');
    }, 50);
  });
}

// カレンダーの初期化
function initCalendar() {
  const now = new Date();
  updateCalendar(now.getFullYear(), now.getMonth());
}

// カレンダーの更新
function updateCalendar(year, month) {
  if (!calendarGrid || !currentMonthDisplay) return;
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const firstDayOfWeek = firstDay.getDay();
  
  currentMonthDisplay.textContent = `${year}年${month + 1}月`;
  calendarGrid.innerHTML = '';
  
  // 曜日の表示
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  weekdays.forEach(day => {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-weekday';
    dayElement.textContent = day;
    calendarGrid.appendChild(dayElement);
  });
  
  // 先月の残りの日を表示
  for (let i = 0; i < firstDayOfWeek; i++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day prev-month';
    calendarGrid.appendChild(dayElement);
  }
  
  // 今月の日を表示
  for (let i = 1; i <= daysInMonth; i++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = i;
    
    // その日のポモドーロデータがあるかチェック
    const currentDate = new Date(year, month, i);
    const hasData = history.some(item => {
      const itemDate = new Date(item.date);
      return itemDate.getDate() === currentDate.getDate() 
        && itemDate.getMonth() === currentDate.getMonth()
        && itemDate.getFullYear() === currentDate.getFullYear();
    });
    
    if (hasData) {
      dayElement.classList.add('has-data');
      
      // その日のセッション数を取得して表示
      const sessions = history.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getDate() === currentDate.getDate() 
          && itemDate.getMonth() === currentDate.getMonth()
          && itemDate.getFullYear() === currentDate.getFullYear();
      }).length;
      
      // ポモドーロ数をツールチップとして表示
      dayElement.title = `${sessions}回のポモドーロ`;
    }
    
    // 今日の日付をハイライト
    const today = new Date();
    if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      dayElement.classList.add('today');
    }
    
    calendarGrid.appendChild(dayElement);
  }
}

// グラフの更新
function updateCharts() {
  // 既存のグラフを破棄
  if (window.statsChart) {
    window.statsChart.destroy();
  }
  if (window.levelChart) {
    window.levelChart.destroy();
  }
  
  // 新しいグラフを初期化
  initCharts();
}

// グラフの初期化
function initCharts() {
  // 週間統計グラフ
  const statsCtx = document.getElementById('statsChart');
  if (statsCtx) {
    const last7Days = getLast7DaysData();
    
    window.statsChart = new Chart(statsCtx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: last7Days.map(day => day.date),
        datasets: [{
          label: 'ポモドーロ数',
          data: last7Days.map(day => day.count),
          backgroundColor: 'rgba(0, 122, 255, 0.5)',
          borderColor: 'rgba(0, 122, 255, 1)',
          borderWidth: 1,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
  
  // レベル進捗グラフ
  const levelCtx = document.getElementById('levelChart');
  if (levelCtx) {
    const levelData = getLevelData();
    
    window.levelChart = new Chart(levelCtx.getContext('2d'), {
      type: 'line',
      data: {
        labels: levelData.map(item => item.date),
        datasets: [{
          label: 'レベル',
          data: levelData.map(item => item.level),
          borderColor: 'rgba(0, 122, 255, 1)',
          backgroundColor: 'rgba(0, 122, 255, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgba(0, 122, 255, 1)',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
}

// 過去7日間のデータを取得
function getLast7DaysData() {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = `${date.getMonth() + 1}/${date.getDate()}`;
    
    const count = history.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate.toDateString() === date.toDateString();
    }).length;
    
    result.push({ date: dateString, count });
  }
  return result;
}

// レベルデータを取得
function getLevelData() {
  const result = [];
  
  // 履歴があまりない場合はダミーデータを使用
  if (history.length < 3) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBefore = new Date();
    dayBefore.setDate(dayBefore.getDate() - 2);
    
    result.push({ 
      date: dayBefore.toLocaleDateString(),
      level: level - 2 > 0 ? level - 2 : 1
    });
    
    result.push({ 
      date: yesterday.toLocaleDateString(),
      level: level - 1 > 0 ? level - 1 : 1
    });
    
    result.push({ 
      date: today.toLocaleDateString(),
      level: level
    });
    
    return result;
  }
  
  // 実際のデータから計算
  let currentLevel = 1;
  let currentPoints = 0;
  const levelHistory = [];
  
  // 日付ごとにグループ化
  const dateGroups = {};
  
  history.forEach(item => {
    const date = new Date(item.date).toLocaleDateString();
    if (!dateGroups[date]) {
      dateGroups[date] = { date, points: 0 };
    }
    dateGroups[date].points += item.points;
  });
  
  // ソートして日付順に処理
  const sortedDates = Object.values(dateGroups).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  sortedDates.forEach(dayData => {
    currentPoints += dayData.points;
    const newLevel = Math.floor(currentPoints / 100) + 1;
    
    if (newLevel > currentLevel) {
      currentLevel = newLevel;
      levelHistory.push({
        date: dayData.date,
        level: currentLevel
      });
    }
  });
  
  // 最新のレベルを追加（変化がない場合）
  if (levelHistory.length === 0 || levelHistory[levelHistory.length - 1].level !== currentLevel) {
    levelHistory.push({
      date: new Date().toLocaleDateString(),
      level: currentLevel
    });
  }
  
  return levelHistory;
}

// 設定の更新
function updateSettings() {
  WORK_TIME = parseInt(workTimeInput.value) * 60;
  BREAK_TIME = parseInt(breakTimeInput.value) * 60;
  LONG_BREAK_TIME = parseInt(longBreakTimeInput.value) * 60;
  SESSIONS_BEFORE_LONG_BREAK = parseInt(sessionsInput.value);
  
  // 設定を保存
  localStorage.setItem('workTime', workTimeInput.value);
  localStorage.setItem('breakTime', breakTimeInput.value);
  localStorage.setItem('longBreakTime', longBreakTimeInput.value);
  localStorage.setItem('sessionsBeforeLongBreak', sessionsInput.value);
  
  // 現在のタイマーをリセット
  if (!isBreak) {
    timeLeft = WORK_TIME;
  } else {
    timeLeft = currentSession % SESSIONS_BEFORE_LONG_BREAK === 0 ? LONG_BREAK_TIME : BREAK_TIME;
  }
  updateTimer();
}

// 縮小時のタイマー更新関数
function updateMinimizedTimer() {
  if (!minimizedTimer) return;
  
  if (container.classList.contains('minimized')) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    // 既存の内容をクリア
    minimizedTimer.innerHTML = '';
    
    // 新しい内容を追加
    const timerDiv = document.createElement('div');
    timerDiv.className = 'timer';
    timerDiv.innerHTML = `<span>${minutes.toString().padStart(2, '0')}</span>:<span>${seconds.toString().padStart(2, '0')}</span>`;
    
    // SVG要素を作成
    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement.setAttribute("class", "progress-ring__circle");
    svgElement.setAttribute("width", "140");
    svgElement.setAttribute("height", "140");
    
    // Defs要素を作成
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    
    // プログレスグラデーション
    const progressGrad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    progressGrad.setAttribute("id", "minimizedProgressGradient");
    progressGrad.setAttribute("x1", "0%");
    progressGrad.setAttribute("y1", "0%");
    progressGrad.setAttribute("x2", "100%");
    progressGrad.setAttribute("y2", "0%");
    
    const progressStop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    progressStop1.setAttribute("offset", "0%");
    progressStop1.setAttribute("stop-color", "#007AFF");
    
    const progressStop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    progressStop2.setAttribute("offset", "100%");
    progressStop2.setAttribute("stop-color", "#00C6FF");
    
    progressGrad.appendChild(progressStop1);
    progressGrad.appendChild(progressStop2);
    
    // 休憩グラデーション
    const breakGrad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    breakGrad.setAttribute("id", "minimizedBreakGradient");
    breakGrad.setAttribute("x1", "0%");
    breakGrad.setAttribute("y1", "0%");
    breakGrad.setAttribute("x2", "100%");
    breakGrad.setAttribute("y2", "0%");
    
    const breakStop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    breakStop1.setAttribute("offset", "0%");
    breakStop1.setAttribute("stop-color", "#4CAF50");
    
    const breakStop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    breakStop2.setAttribute("offset", "100%");
    breakStop2.setAttribute("stop-color", "#8BC34A");
    
    breakGrad.appendChild(breakStop1);
    breakGrad.appendChild(breakStop2);
    
    defs.appendChild(progressGrad);
    defs.appendChild(breakGrad);
    svgElement.appendChild(defs);
    
    // 背景円を作成
    const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bgCircle.setAttribute("class", "progress-ring__circle-bg");
    bgCircle.setAttribute("cx", "70");
    bgCircle.setAttribute("cy", "70");
    bgCircle.setAttribute("r", "65");
    
    // プログレス円を作成
    const progressCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    progressCircle.setAttribute("class", "progress-ring__circle-progress");
    progressCircle.setAttribute("cx", "70");
    progressCircle.setAttribute("cy", "70");
    progressCircle.setAttribute("r", "65");
    progressCircle.setAttribute("stroke", isBreak ? "url(#minimizedBreakGradient)" : "url(#minimizedProgressGradient)");
    
    svgElement.appendChild(bgCircle);
    svgElement.appendChild(progressCircle);
    
    // SVGコンテナを作成
    const svgContainer = document.createElement('div');
    svgContainer.className = 'progress-ring';
    svgContainer.appendChild(svgElement);
    
    // ミニコントロールを追加
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'minimized-controls';
    controlsDiv.innerHTML = `
      <button id="minimizedStartBtn">${timerId ? '一時停止' : 'スタート'}</button>
      <button id="minimizedResetBtn">リセット</button>
    `;
    
    // 要素を追加
    minimizedTimer.appendChild(timerDiv);
    minimizedTimer.appendChild(svgContainer);
    minimizedTimer.appendChild(controlsDiv);
    
    // プログレスリングの更新
    const progressRing = minimizedTimer.querySelector('.progress-ring__circle-progress');
    const maxTime = isBreak ? 
      (currentSession % SESSIONS_BEFORE_LONG_BREAK === 0 ? LONG_BREAK_TIME : BREAK_TIME) : 
      WORK_TIME;
    const circumference = 65 * 2 * Math.PI;
    const offset = circumference - (timeLeft / maxTime) * circumference;
    progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
    
    // アニメーションをスムーズに
    requestAnimationFrame(() => {
      progressRing.style.strokeDashoffset = offset;
    });
    
    // 縮小時のコントロールボタンのイベントリスナーを設定
    const minimizedStartBtn = minimizedTimer.querySelector('#minimizedStartBtn');
    const minimizedResetBtn = minimizedTimer.querySelector('#minimizedResetBtn');
    
    minimizedStartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startTimer();
      minimizedStartBtn.textContent = timerId ? '一時停止' : 'スタート';
    });
    
    minimizedResetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetTimer();
      minimizedStartBtn.textContent = 'スタート';
      updateMinimizedTimer();
    });
  }
}

// 最小化機能
minimizeBtn.addEventListener('click', () => {
  container.classList.toggle('minimized');
  minimizeBtn.textContent = container.classList.contains('minimized') ? '+' : '−';
  
  if (container.classList.contains('minimized')) {
    // 縮小時のタイマー表示を更新
    updateMinimizedTimer();
  } else {
    // 通常表示に戻したときの処理
    minimizedTimer.innerHTML = ''; // 内容をクリア
  }
});

// 縮小表示をクリックすると元に戻る機能
if (minimizedTimer) {
  minimizedTimer.addEventListener('click', (e) => {
    // ボタンのクリックイベントがバブリングしないように
    if (e.target.tagName !== 'BUTTON') {
      container.classList.remove('minimized');
      minimizeBtn.textContent = '−';
      minimizedTimer.innerHTML = ''; // 内容をクリア
    }
  });
}

// リップルエフェクトの追加
document.querySelectorAll('.ripple').forEach(button => {
  button.addEventListener('click', function(e) {
    const x = e.clientX - e.target.getBoundingClientRect().left;
    const y = e.clientY - e.target.getBoundingClientRect().top;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    this.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
});

// ドキュメントのロード完了時の処理
document.addEventListener('DOMContentLoaded', () => {
  // 保存されている設定を読み込む
  const savedWorkTime = localStorage.getItem('workTime');
  const savedBreakTime = localStorage.getItem('breakTime');
  const savedLongBreakTime = localStorage.getItem('longBreakTime');
  const savedSessions = localStorage.getItem('sessionsBeforeLongBreak');
  
  if (savedWorkTime) workTimeInput.value = savedWorkTime;
  if (savedBreakTime) breakTimeInput.value = savedBreakTime;
  if (savedLongBreakTime) longBreakTimeInput.value = savedLongBreakTime;
  if (savedSessions) sessionsInput.value = savedSessions;
  
  // 設定を適用
  updateSettings();
  
  // ポイントとレベルを保存されたデータから読み込む
  const savedPoints = localStorage.getItem('points');
  const savedLevel = localStorage.getItem('level');
  const savedLevelProgress = localStorage.getItem('levelProgress');
  
  if (savedPoints) points = parseInt(savedPoints);
  if (savedLevel) level = parseInt(savedLevel);
  if (savedLevelProgress) levelProgress = parseInt(savedLevelProgress);
  
  // 表示を更新
  pointsDisplay.textContent = points;
  levelDisplay.textContent = level;
  updatePointsBar();
  
  // 履歴の表示を更新
  updateHistoryDisplay();
  
  // カレンダーとグラフを初期化
  initCalendar();
  initCharts();
  
  // 通知権限のリクエスト
  if ('Notification' in window) {
    Notification.requestPermission();
  }
});

// イベントリスナーの設定
if (startBtn) startBtn.addEventListener('click', startTimer);
if (resetBtn) resetBtn.addEventListener('click', resetTimer);
if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => {
  const currentDate = new Date(currentMonthDisplay.textContent.replace('年', '-').replace('月', ''));
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateCalendar(currentDate.getFullYear(), currentDate.getMonth());
});
if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => {
  const currentDate = new Date(currentMonthDisplay.textContent.replace('年', '-').replace('月', ''));
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateCalendar(currentDate.getFullYear(), currentDate.getMonth());
});

// 設定の変更を監視
if (workTimeInput) workTimeInput.addEventListener('change', updateSettings);
if (breakTimeInput) breakTimeInput.addEventListener('change', updateSettings);
if (longBreakTimeInput) longBreakTimeInput.addEventListener('change', updateSettings);
if (sessionsInput) sessionsInput.addEventListener('change', updateSettings);

// デスクトップ通知の送信
function sendNotification(title, message) {
  if ('Notification' in window && Notification.permission === 'granted' && document.getElementById('desktopNotifications').checked) {
    new Notification(title, {
      body: message,
      icon: '/favicon.ico'
    });
  }
}

// アプリケーション終了時（ページ移動・タブ閉じる時）にデータ保存
window.addEventListener('beforeunload', () => {
  // ポイント、レベル、進捗を保存
  localStorage.setItem('points', points);
  localStorage.setItem('level', level);
  localStorage.setItem('levelProgress', levelProgress);
  
  // 履歴も保存
  saveHistory();
});

// カスタムイベント - 円形アニメーション完了時
document.addEventListener('animationComplete', () => {
  console.log('アニメーション完了');
});

// 初期表示
updateTimer();
updatePointsBar();
initCalendar();
initCharts();
```
