// 履歴データの取得
let history = JSON.parse(localStorage.getItem('pomodoroHistory')) || [];

// DOM要素の取得
const dateFilter = document.getElementById('dateFilter');
const totalTimeDisplay = document.getElementById('totalTime');
const completedPomodorosDisplay = document.getElementById('completedPomodoros');
const historyItems = document.getElementById('historyItems');

// 日付フィルターの変更を監視
dateFilter.addEventListener('change', updateHistory);

// 履歴の更新
function updateHistory() {
  const filteredHistory = filterHistory(history, dateFilter.value);
  updateStats(filteredHistory);
  displayHistoryItems(filteredHistory);
}

// 履歴のフィルタリング
function filterHistory(history, filter) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  return history.filter(item => {
    const itemDate = new Date(item.date);
    switch (filter) {
      case 'today':
        return itemDate >= today;
      case 'week':
        return itemDate >= weekAgo;
      case 'month':
        return itemDate >= monthAgo;
      default:
        return true;
    }
  });
}

// 統計情報の更新
function updateStats(filteredHistory) {
  const totalMinutes = filteredHistory.reduce((sum, item) => sum + item.duration / 60, 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  totalTimeDisplay.textContent = `${hours}時間${minutes}分`;
  completedPomodorosDisplay.textContent = `${filteredHistory.length}回`;
}

// 履歴アイテムの表示
function displayHistoryItems(filteredHistory) {
  historyItems.innerHTML = '';
  filteredHistory.reverse().forEach(item => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    const date = new Date(item.date);
    const dateStr = date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    historyItem.innerHTML = `
      <span class="date">${dateStr}</span>
      <span class="duration">${item.duration / 60}分</span>
      <span class="points">+${item.points}ポイント</span>
    `;

    historyItems.appendChild(historyItem);
  });
}

// 初期表示
updateHistory(); 