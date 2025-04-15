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
let history = JSON.parse(localStorage.getItem('pomodoroHistory')) || [];
let isBreak = false;

// DOM要素の取得
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const pointsDisplay = document.getElementById('points');
const levelDisplay = document.getElementById('level');
const logList = document.getElementById('logList');
const progressRing = document.querySelector('.progress-ring__circle-progress');
const minimizeBtn = document.querySelector('.minimize-btn');
const container = document.querySelector('.container');
const minimizedTimer = document.getElementById('minimizedTimer');

// 設定関連の要素
const workTimeInput = document.getElementById('workTime');
const breakTimeInput = document.getElementById('breakTime');
const longBreakTimeInput = document.getElementById('longBreakTime');
const sessionsInput = document.getElementById('sessionsBeforeLongBreak');

// カレンダー関連の要素
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const currentMonthDisplay = document.getElementById('currentMonth');
const calendarGrid = document.getElementById('calendarGrid');

// グラフ関連
const statsChart = document.getElementById('statsChart');
let chart;

// プログレスリングの設定
const radius = progressRing.r.baseVal.value;
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
  const offset = circumference - (timeLeft / (isBreak ? BREAK_TIME : WORK_TIME)) * circumference;
  progressRing.style.strokeDashoffset = offset;
  
  // 縮小時のタイマーも更新
  updateMinimizedTimer();
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
        if (isBreak) {
          currentSession++;
          startWorkSession();
    } else {
          completePomodoro();
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
  document.body.style.backgroundColor = '#F5F5F7';
}

// 休憩セッションの開始
function startBreakSession() {
  isBreak = true;
  timeLeft = currentSession % SESSIONS_BEFORE_LONG_BREAK === 0 ? LONG_BREAK_TIME : BREAK_TIME;
  updateTimer();
  startBtn.textContent = 'スタート';
  document.body.style.backgroundColor = '#E8F5E9';
}

// タイマーのリセット
function resetTimer() {
  clearInterval(timerId);
  timerId = null;
  timeLeft = isBreak ? BREAK_TIME : WORK_TIME;
  updateTimer();
  startBtn.textContent = 'スタート';
}

// ポモドーロ完了
function completePomodoro() {
  sessionCount++;
  // 作業時間に基づいてポイントを計算（作業時間×10）
  const pointsEarned = WORK_TIME * 10;
  points += pointsEarned;
  levelProgress += pointsEarned;
  
  // レベルアップチェック
  if (levelProgress >= 100) {
    level++;
    levelProgress = 0;
    // レベルアップエフェクトを追加
    document.querySelector('.level-circle').classList.add('level-up');
    setTimeout(() => {
      document.querySelector('.level-circle').classList.remove('level-up');
    }, 1000);
  }
  
  // 表示の更新
  pointsDisplay.textContent = points;
  levelDisplay.textContent = level;
  levelProgressBar.style.transform = `rotate(${levelProgress * 3.6}deg)`;
  
  // ログの追加
  const logItem = document.createElement('li');
  logItem.textContent = `セッション ${sessionCount} 完了 - ${new Date().toLocaleTimeString()} (+${pointsEarned}ポイント)`;
  logList.insertBefore(logItem, logList.firstChild);
  
  // 履歴の追加
  addHistory();
}

// 履歴の追加
function addHistory() {
  const now = new Date();
  const historyItem = {
    date: now.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }),
    time: now.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    points: points
  };
  
  history.unshift(historyItem);
  if (history.length > 10) {
    history.pop();
  }
  
  updateHistory();
  saveHistory();
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
  const statsCtx = document.getElementById('statsChart').getContext('2d');
  const last7Days = getLast7DaysData();
  
  window.statsChart = new Chart(statsCtx, {
    type: 'bar',
    data: {
      labels: last7Days.map(day => day.date),
      datasets: [{
        label: 'ポモドーロ数',
        data: last7Days.map(day => day.count),
        backgroundColor: 'rgba(0, 122, 255, 0.5)',
        borderColor: 'rgba(0, 122, 255, 1)',
        borderWidth: 1
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
      }
    }
  });
  
  // レベル進捗グラフ
  const levelCtx = document.getElementById('levelChart').getContext('2d');
  const levelData = getLevelData();
  
  window.levelChart = new Chart(levelCtx, {
    type: 'line',
    data: {
      labels: levelData.map(item => item.date),
      datasets: [{
        label: 'レベル',
        data: levelData.map(item => item.level),
        borderColor: 'rgba(0, 122, 255, 1)',
        tension: 0.4,
        fill: false
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
      }
    }
  });
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
  const levelHistory = [];
  let currentLevel = 1;
  let currentPoints = 0;
  
  history.forEach(item => {
    currentPoints += 10;
    const newLevel = Math.floor(currentPoints / 100) + 1;
    if (newLevel > currentLevel) {
      currentLevel = newLevel;
      levelHistory.push({
        date: new Date(item.date).toLocaleDateString(),
        level: currentLevel
      });
    }
  });
  
  return levelHistory;
}

// 設定の更新
function updateSettings() {
  WORK_TIME = parseInt(workTimeInput.value) * 60;
  BREAK_TIME = parseInt(breakTimeInput.value) * 60;
  LONG_BREAK_TIME = parseInt(longBreakTimeInput.value) * 60;
  SESSIONS_BEFORE_LONG_BREAK = parseInt(sessionsInput.value);
  
  if (!isBreak) {
    timeLeft = WORK_TIME;
    updateTimer();
  }
}

// 最小化機能
minimizeBtn.addEventListener('click', () => {
  container.classList.toggle('minimized');
  minimizeBtn.textContent = container.classList.contains('minimized') ? '+' : '−';
  
  if (container.classList.contains('minimized')) {
    // 縮小時のタイマー表示を更新
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    minimizedTimer.innerHTML = `
      <div class="progress-ring">
        <svg class="progress-ring__circle" width="180" height="180">
          <circle class="progress-ring__circle-bg" cx="90" cy="90" r="85" />
          <circle class="progress-ring__circle-progress" cx="90" cy="90" r="85" />
        </svg>
        <div class="timer">
          <span>${minutes.toString().padStart(2, '0')}</span>:<span>${seconds.toString().padStart(2, '0')}</span>
        </div>
      </div>
      <div class="minimized-controls">
        <button id="minimizedStartBtn">${timerId ? '一時停止' : 'スタート'}</button>
        <button id="minimizedResetBtn">リセット</button>
      </div>
    `;
    
    // プログレスリングの更新
    const progressRing = minimizedTimer.querySelector('.progress-ring__circle-progress');
    const circumference = 85 * 2 * Math.PI;
    const offset = circumference - (timeLeft / (isBreak ? BREAK_TIME : WORK_TIME)) * circumference;
    progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
    progressRing.style.strokeDashoffset = offset;
    
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
});

// 縮小時のタイマー更新関数
function updateMinimizedTimer() {
  if (container.classList.contains('minimized')) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timer = minimizedTimer.querySelector('.timer');
    timer.innerHTML = `<span>${minutes.toString().padStart(2, '0')}</span>:<span>${seconds.toString().padStart(2, '0')}</span>`;
    
    const progressRing = minimizedTimer.querySelector('.progress-ring__circle-progress');
    const circumference = 85 * 2 * Math.PI;
    const offset = circumference - (timeLeft / (isBreak ? BREAK_TIME : WORK_TIME)) * circumference;
    progressRing.style.strokeDashoffset = offset;
  }
}

// イベントリスナーの設定
startBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', resetTimer);
prevMonthBtn.addEventListener('click', () => {
  const currentDate = new Date(currentMonthDisplay.textContent.replace('年', '-').replace('月', ''));
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateCalendar(currentDate.getFullYear(), currentDate.getMonth());
});
nextMonthBtn.addEventListener('click', () => {
  const currentDate = new Date(currentMonthDisplay.textContent.replace('年', '-').replace('月', ''));
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateCalendar(currentDate.getFullYear(), currentDate.getMonth());
});

// 設定の変更を監視
workTimeInput.addEventListener('change', updateSettings);
breakTimeInput.addEventListener('change', updateSettings);
longBreakTimeInput.addEventListener('change', updateSettings);
sessionsInput.addEventListener('change', updateSettings);

// 初期表示
updateTimer();
updatePointsBar();
initCalendar();
initCharts();
