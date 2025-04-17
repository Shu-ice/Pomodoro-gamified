// 履歴データの取得
let history = JSON.parse(localStorage.getItem('pomodoroHistory')) || [];

// DOM要素の取得
const dateFilter = document.getElementById('dateFilter');
const totalTimeDisplay = document.getElementById('totalTime');
const completedPomodorosDisplay = document.getElementById('completedPomodoros');
const historyItems = document.getElementById('historyItems');

// 日付フィルターの変更を監視
if (dateFilter) {
  dateFilter.addEventListener('change', updateHistory);
}

// 履歴の更新
function updateHistory() {
  if (!dateFilter || !historyItems) return;
  
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
  if (!totalTimeDisplay || !completedPomodorosDisplay) return;
  
  const totalMinutes = filteredHistory.reduce((sum, item) => sum + (item.duration || 0) / 60, 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  totalTimeDisplay.textContent = `${hours}時間${minutes}分`;
  completedPomodorosDisplay.textContent = `${filteredHistory.length}回`;
}

// 履歴アイテムの表示
function displayHistoryItems(filteredHistory) {
  if (!historyItems) return;
  
  historyItems.innerHTML = '';
  
  if (filteredHistory.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-history';
    emptyMessage.textContent = 'この期間に記録はありません';
    historyItems.appendChild(emptyMessage);
    return;
  }
  
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

    // フォーマットを改善
    historyItem.innerHTML = `
      <div class="history-item-date">
        <span class="date">${dateStr}</span>
      </div>
      <div class="history-item-details">
        <span class="duration">${(item.duration || 0) / 60}分</span>
        <span class="points">+${item.points || 0}ポイント</span>
      </div>
    `;

    historyItems.appendChild(historyItem);
    
    // アニメーション効果追加
    setTimeout(() => {
      historyItem.classList.add('visible');
    }, 50 * filteredHistory.indexOf(item));
  });
}

// チャートの初期化
function initHistoryCharts() {
  const ctx = document.getElementById('historyChartWeekly');
  if (ctx) {
    const weeklyData = getWeeklyData();
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: weeklyData.labels,
        datasets: [{
          label: '完了したポモドーロ',
          data: weeklyData.values,
          backgroundColor: 'rgba(0, 122, 255, 0.6)',
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
  }
}

// 週間データの取得
function getWeeklyData() {
  const labels = [];
  const values = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    
    const dayName = date.toLocaleDateString('ja-JP', { weekday: 'short' });
    const dayDate = date.getDate();
    labels.push(`${dayName} ${dayDate}`);
    
    const count = history.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate.getDate() === date.getDate() && 
             itemDate.getMonth() === date.getMonth() && 
             itemDate.getFullYear() === date.getFullYear();
    }).length;
    
    values.push(count);
  }
  
  return { labels, values };
}

// CSVエクスポート機能
function exportHistoryToCSV() {
  if (history.length === 0) {
    alert('エクスポートするデータがありません');
    return;
  }
  
  let csvContent = "日付,時間,セッション時間（分）,獲得ポイント\n";
  
  history.forEach(item => {
    const date = new Date(item.date);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString();
    const duration = (item.duration || 0) / 60;
    const points = item.points || 0;
    
    csvContent += `${dateStr},${timeStr},${duration},${points}\n`;
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `pomodoro_history_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// エクスポートボタンにイベントリスナーを追加
const exportBtn = document.getElementById('exportBtn');
if (exportBtn) {
  exportBtn.addEventListener('click', exportHistoryToCSV);
}

// 初期表示
document.addEventListener('DOMContentLoaded', () => {
  updateHistory();
  initHistoryCharts();
});
