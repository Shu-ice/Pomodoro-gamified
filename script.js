// タイマー初期値
let workMinutes = 25;
let workSeconds = 0;

// ポイント & レベル
let points = parseInt(localStorage.getItem('points')) || 0;
let level = parseInt(localStorage.getItem('level')) || 1;

// ログ（配列で管理）
let log = JSON.parse(localStorage.getItem('log')) || [];

// タイマー状態
let timerInterval;
let isRunning = false;

// DOM 取得
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const pointsDisplay = document.getElementById('points');
const levelDisplay = document.getElementById('level');
const logList = document.getElementById('logList');

// 初期表示反映
updateDisplay();
updateStats();
updateLog();

// スタートボタン処理
startBtn.addEventListener('click', () => {
  if (isRunning) return;
  isRunning = true;
  timerInterval = setInterval(runTimer, 1000);
});

// リセットボタン処理
resetBtn.addEventListener('click', resetTimer);

// タイマー動作
function runTimer() {
  if (workSeconds === 0) {
    if (workMinutes === 0) {
      completeSession();
      return;
    } else {
      workMinutes--;
      workSeconds = 59;
    }
  } else {
    workSeconds--;
  }
  updateDisplay();
}

// タイマー表示更新
function updateDisplay() {
  minutesDisplay.textContent = String(workMinutes).padStart(2, '0');
  secondsDisplay.textContent = String(workSeconds).padStart(2, '0');
}

// タイマー完了処理
function completeSession() {
  clearInterval(timerInterval);
  isRunning = false;
  playSound('timer-end');

  // ポイント付与
  points += 10;
  localStorage.setItem('points', points);

  // レベルアップ判定
  const newLevel = Math.floor(points / 50) + 1;
  if (newLevel > level) {
    level = newLevel;
    localStorage.setItem('level', level);
    playSound('level-up');
    alert('レベルアップしました！');
  }

  // 作業ログ保存
  const now = new Date();
  log.push(`✅ ${now.toLocaleString()} 作業完了`);
  localStorage.setItem('log', JSON.stringify(log));

  // 表示更新
  updateStats();
  updateLog();

  // タイマーリセット
  resetTimer();
}

// ポイント・レベル表示更新
function updateStats() {
  pointsDisplay.textContent = points;
  levelDisplay.textContent = level;
}

// 作業ログ表示更新
function updateLog() {
  logList.innerHTML = '';
  log.slice().reverse().forEach(entry => {
    const li = document.createElement('li');
    li.textContent = entry;
    logList.appendChild(li);
  });
}

// タイマーリセット処理
function resetTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  workMinutes = 25;
  workSeconds = 0;
  updateDisplay();
}

// サウンド再生
function playSound(name) {
  const audio = new Audio(`sounds/${name}.mp3`);
  audio.play();
}
