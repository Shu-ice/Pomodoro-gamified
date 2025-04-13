// タイマーの設定
const WORK_TIME = 25 * 60; // 25分
let timeLeft = WORK_TIME;
let timerId = null;
let points = 0;
let level = 1;
let history = JSON.parse(localStorage.getItem('pomodoroHistory')) || [];

// DOM要素の取得
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const pointsDisplay = document.getElementById('points');
const levelDisplay = document.getElementById('level');
const logList = document.getElementById('logList');
const progressRing = document.querySelector('.progress-ring__circle-progress');

// プログレスリングの設定
const radius = progressRing.r.baseVal.value;
const circumference = radius * 2 * Math.PI;
progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
progressRing.style.strokeDashoffset = circumference;

// タイマーの更新
function updateTimer() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  minutesDisplay.textContent = minutes.toString().padStart(2, '0');
  secondsDisplay.textContent = seconds.toString().padStart(2, '0');

  // プログレスリングの更新
  const offset = circumference - (timeLeft / WORK_TIME) * circumference;
  progressRing.style.strokeDashoffset = offset;
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
        completePomodoro();
      }
    }, 1000);
    startBtn.textContent = '一時停止';
  } else {
    clearInterval(timerId);
    timerId = null;
    startBtn.textContent = 'スタート';
  }
}

// タイマーのリセット
function resetTimer() {
  clearInterval(timerId);
  timerId = null;
  timeLeft = WORK_TIME;
  updateTimer();
  startBtn.textContent = 'スタート';
}

// ポモドーロ完了時の処理
function completePomodoro() {
  // ポイント獲得アニメーション
  const pointsElement = document.getElementById('points');
  pointsElement.classList.add('point-gain');
  setTimeout(() => pointsElement.classList.remove('point-gain'), 300);

  points += 10;
  pointsDisplay.textContent = points;

  // ポイントバーの更新
  updatePointsBar();

  // レベルアップ判定
  const newLevel = Math.floor(points / 100) + 1;
  if (newLevel > level) {
    level = newLevel;
    levelDisplay.textContent = level;
    showLevelUpAnimation();
  }

  // 履歴に追加
  const now = new Date();
  const historyItem = {
    date: now.toISOString(),
    duration: WORK_TIME,
    points: 10
  };
  history.push(historyItem);
  localStorage.setItem('pomodoroHistory', JSON.stringify(history));

  // ログに追加
  const logItem = document.createElement('li');
  logItem.textContent = `${now.toLocaleString()} - ポモドーロ完了！ +10ポイント`;
  logList.insertBefore(logItem, logList.firstChild);

  // 通知音を再生
  const audio = new Audio('sounds/complete.mp3');
  audio.play();
}

// ポイントバーの更新
function updatePointsBar() {
  const pointsBar = document.getElementById('pointsBar');
  const nextLevelPoints = document.getElementById('nextLevelPoints');
  const currentLevelPoints = (level - 1) * 100;
  const nextLevelThreshold = level * 100;
  const progress = ((points - currentLevelPoints) / (nextLevelThreshold - currentLevelPoints)) * 100;
  
  pointsBar.style.width = `${progress}%`;
  nextLevelPoints.textContent = `次のレベルまで: ${nextLevelThreshold - points}`;
}

// レベルアップアニメーション
function showLevelUpAnimation() {
  // レベルアップエフェクト
  const levelElement = document.getElementById('level');
  levelElement.classList.add('level-up');
  setTimeout(() => levelElement.classList.remove('level-up'), 500);

  // レベルアップメッセージ
  const message = document.createElement('div');
  message.className = 'level-up-message';
  message.innerHTML = `
    <h2>レベルアップ！</h2>
    <p>レベル ${level} に到達しました！</p>
  `;
  document.body.appendChild(message);
  setTimeout(() => message.remove(), 2000);

  // 紙吹雪エフェクト
  createConfetti();
}

// 紙吹雪エフェクトの作成
function createConfetti() {
  const container = document.querySelector('.container');
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.backgroundColor = getRandomColor();
    container.appendChild(confetti);
    setTimeout(() => confetti.remove(), 1000);
  }
}

// ランダムな色を生成
function getRandomColor() {
  const colors = ['#007AFF', '#34C759', '#FF9500', '#FF2D55', '#5856D6'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// イベントリスナーの設定
startBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', resetTimer);

// 初期表示
updateTimer();
updatePointsBar();
