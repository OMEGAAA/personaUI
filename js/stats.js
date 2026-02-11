/**
 * stats.js - パラメータ管理
 * Persona 5 カスタムランクシステム
 */

// ランク計算（カスタム閾値に基づいてランクレベルを決定）
function calculateRankLevel(stat) {
  const thresholds = stat.thresholds || [0, 34, 82, 126, 192];
  const value = stat.value;

  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (value >= thresholds[i]) {
      return i;
    }
  }
  return 0;
}

// ランク名を取得
function getRankName(stat) {
  const level = calculateRankLevel(stat);
  const ranks = stat.ranks || ['Lv1', 'Lv2', 'Lv3', 'Lv4', 'Lv5'];
  return ranks[level] || ranks[0];
}

// 次のランクまでの進捗を計算
function calculateProgress(stat) {
  const thresholds = stat.thresholds || [0, 34, 82, 126, 192];
  const ranks = stat.ranks || ['Lv1', 'Lv2', 'Lv3', 'Lv4', 'Lv5'];
  const value = stat.value;
  const currentLevel = calculateRankLevel(stat);

  // 最大ランクの場合
  if (currentLevel >= thresholds.length - 1) {
    return { progress: 100, nextRank: null, remaining: 0, currentLevel: currentLevel + 1 };
  }

  const currentThreshold = thresholds[currentLevel];
  const nextThreshold = thresholds[currentLevel + 1];
  const progress = ((value - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  return {
    progress: Math.min(100, Math.max(0, progress)),
    nextRank: ranks[currentLevel + 1],
    remaining: nextThreshold - value,
    currentLevel: currentLevel + 1
  };
}

// トータルレベル計算
function calculateTotalLevel(stats) {
  let total = 0;
  stats.forEach(stat => {
    total += calculateRankLevel(stat) + 1;
  });
  return total;
}

// パラメータに値を加算
function addToStat(statId, amount) {
  const stats = getStats();
  const stat = stats.find(s => s.id === statId);
  if (stat) {
    stat.value = Math.max(0, stat.value + amount);
    saveStats(stats);
    return stat;
  }
  return null;
}

// パラメータカードのHTML生成
function renderStatCard(stat, compact = false) {
  const rankName = getRankName(stat);
  const { progress, nextRank, remaining, currentLevel } = calculateProgress(stat);

  const starsFilled = currentLevel;
  const starsEmpty = 5 - currentLevel;
  const starsHtml = '★'.repeat(starsFilled) + '☆'.repeat(starsEmpty);

  if (compact) {
    return `
      <div class="card stat-card" data-stat-id="${stat.id}">
        <div class="card-header">
          <span class="card-title">${stat.name}</span>
        </div>
        <div class="stat-stars">${starsHtml}</div>
        <div class="stat-rank-name">${rankName}</div>
        <div class="stat-value-small">${stat.value} pts</div>
        <div class="stat-progress">
          <div class="stat-progress-bar" style="width: ${progress}%"></div>
        </div>
        ${nextRank ? `<div class="stat-next-rank">次: ${nextRank} (あと${remaining})</div>` : '<div class="stat-next-rank">MAX!</div>'}
      </div>
    `;
  }

  return `
    <div class="card stat-card" data-stat-id="${stat.id}">
      <div class="card-header">
      </div>
      <span class="card-title">${stat.name}</span>
      <div class="stat-stars">${starsHtml}</div>
      <div class="stat-rank-name">${rankName}</div>
      <div class="stat-value-container">
        <span class="stat-value">${stat.value}</span>
        <span style="color: var(--persona-light-gray); font-size: 0.8rem;">pts</span>
      </div>
      <div class="stat-progress">
        <div class="stat-progress-bar" style="width: ${progress}%"></div>
      </div>
      ${nextRank ? `<div class="stat-next-rank">→ ${nextRank} まであと ${remaining} pt</div>` : '<div class="stat-next-rank">MAX RANK</div>'}
    </div>
  `;
}

// Persona 5 スタイル 5芒星グラフのSVG生成
function renderStarChart(stats) {
  const size = 320;
  const center = size / 2;
  const maxOuterRadius = 90;
  const maxInnerRadius = 35;

  // 各パラメータのレベル（1-5）を取得
  // 順序: Knowledge(0), Guts(1), Proficiency(2), Kindness(3), Charm(4)
  // 5芒星の頂点順序に合わせてマッピングが必要ならここで行う
  // stats配列の順番が Knowledge, Guts, Proficiency, Kindness, Charm であると仮定
  const levels = stats.map(stat => calculateRankLevel(stat) + 1);

  function getStarPointsWithLevels(levelArray) {
    const points = [];
    for (let i = 0; i < 10; i++) {
      // -PI/2 (上) からスタート
      const angle = (Math.PI * 2 * i / 10) - Math.PI / 2;
      let radius;

      if (i % 2 === 0) {
        // 外側頂点
        const paramIndex = i / 2;
        const level = levelArray[paramIndex];
        radius = maxOuterRadius * (level / 5);
      } else {
        // 内側頂点
        const leftIndex = Math.floor(i / 2);
        const rightIndex = (leftIndex + 1) % 5;
        const avgLevel = (levelArray[leftIndex] + levelArray[rightIndex]) / 2;
        radius = maxInnerRadius * (avgLevel / 5);
      }

      points.push({
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle)
      });
    }
    return points;
  }

  // ラベル位置（半径を少し大きめに）
  function getPentagonPoint(index, radius) {
    const angle = (Math.PI * 2 * index / 5) - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  }

  // グレーの外枠星（最大サイズ）
  const maxLevels = [5, 5, 5, 5, 5];
  const outerStarPoints = getStarPointsWithLevels(maxLevels);
  const outerStarPath = outerStarPoints.map((p, i) =>
    (i === 0 ? 'M' : 'L') + p.x + ',' + p.y
  ).join(' ') + ' Z';

  // 黄色の内側星
  const innerStarPoints = getStarPointsWithLevels(levels);
  const innerStarPath = innerStarPoints.map((p, i) =>
    (i === 0 ? 'M' : 'L') + p.x + ',' + p.y
  ).join(' ') + ' Z';

  // ラベル生成
  let labelsHtml = '';

  stats.forEach((stat, i) => {
    const level = calculateRankLevel(stat) + 1;
    const rankName = getRankName(stat);
    // ラベル位置調整
    const labelRadius = 145;
    const p = getPentagonPoint(i, labelRadius);

    // 背景装飾（ランダムな回転など）
    const rotation = (i * 72) % 360;

    labelsHtml += `
      <g class="p5-stat-label-group" transform="translate(${p.x}, ${p.y})">
        <!-- 背景の黒い "ステッカー" 風 -->
        <path d="M-35,-25 L35,-30 L40,20 L-30,25 Z" class="p5-label-bg" fill="#000" />
        
        <!-- パラメータ名 (Knowledge etc) -->
        <text y="-8" class="p5-stat-name">${stat.name}</text>
        
        <!-- レベル番号 (右下、黄色) -->
        <text x="30" y="0" class="p5-stat-rank-num">${level}</text>
        
        <!-- ランク名 (平均的、など) -->
        <text y="18" class="p5-stat-desc">${rankName}</text>
      </g>
    `;
  });

  return `
    <div class="star-chart-container">
      <svg viewBox="0 0 ${size} ${size}" class="star-chart" style="overflow: visible;">
        <defs>
          <filter id="star-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ffdd00"/>
            <stop offset="100%" style="stop-color:#ff9900"/>
          </linearGradient>
        </defs>
        
        <!-- 背景ストライプ -->
        <path d="${outerStarPath}" fill="none" class="star-gray-bg" style="stroke: #333; stroke-width: 1; fill: rgba(50,50,50,0.5);" />
        
        <!-- グレーの外枠星 -->
        <path d="${outerStarPath}" class="star-outline"/>
        
        <!-- 黄色の内側星 -->
        <path d="${innerStarPath}" class="star-fill" filter="url(#star-glow)"/>
        
        <!-- 各頂点のラベル -->
        <g class="star-labels">
          ${labelsHtml}
        </g>
      </svg>
    </div>
  `;
}

// レーダーチャート（旧バージョン、renderStarChartに置き換え）
function renderRadarChart(stats) {
  return renderStarChart(stats);
}

// サマリーカードのHTML生成
function renderSummaryCard(stats) {
  const totalLevel = calculateTotalLevel(stats);
  const totalActions = getHistory().length;

  // 星形グラフを含める
  const radarChart = renderRadarChart(stats);

  return `
    <div class="card summary-card">
      <div class="summary-header">
        <div class="summary-title">SOCIAL STATS</div>
      </div>
      ${radarChart}
      <div class="summary-stats">
        <div>
          <div class="summary-stat-value">Lv.${totalLevel}</div>
          <div class="summary-stat-label">TOTAL</div>
        </div>
        <div>
          <div class="summary-stat-value">${totalActions}</div>
          <div class="summary-stat-label">ACTIONS</div>
        </div>
      </div>
    </div>
  `;
}
