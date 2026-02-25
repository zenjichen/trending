/* ====================================================
   TRENDING CHART APP — YouTube Data API v3
   ==================================================== */

// ─── Constants ──────────────────────────────────────
const API_BASE = 'https://www.googleapis.com/youtube/v3/videos';
const LS_KEY   = 'tc_yt_api_key';

const CATEGORY_NAMES = {
  '':   'Tất cả video',
  '10': 'Âm nhạc',
  '20': 'Gaming',
  '17': 'Thể thao',
  '24': 'Giải trí',
  '25': 'Tin tức & Chính trị',
  '28': 'Khoa học & Công nghệ',
  '1':  'Phim & Hoạt hình',
  '22': 'Người & Blog',
  '23': 'Hài kịch',
  '26': 'Phong cách sống'
};

const COUNTRY_FLAGS = {
  VN:'🇻🇳', US:'🇺🇸', KR:'🇰🇷', JP:'🇯🇵', GB:'🇬🇧',
  FR:'🇫🇷', DE:'🇩🇪', IN:'🇮🇳', BR:'🇧🇷', MX:'🇲🇽',
  CA:'🇨🇦', AU:'🇦🇺', ID:'🇮🇩', TH:'🇹🇭', SG:'🇸🇬',
  PH:'🇵🇭', TW:'🇹🇼', HK:'🇭🇰', RU:'🇷🇺', IT:'🇮🇹',
  ES:'🇪🇸', NL:'🇳🇱', PL:'🇵🇱', TR:'🇹🇷', SA:'🇸🇦',
  EG:'🇪🇬', ZA:'🇿🇦', AR:'🇦🇷', CL:'🇨🇱', CO:'🇨🇴'
};

const COUNTRY_NAMES = {
  VN:'Việt Nam', US:'Hoa Kỳ', KR:'Hàn Quốc', JP:'Nhật Bản',
  GB:'Anh', FR:'Pháp', DE:'Đức', IN:'Ấn Độ', BR:'Brazil',
  MX:'Mexico', CA:'Canada', AU:'Úc', ID:'Indonesia',
  TH:'Thái Lan', SG:'Singapore', PH:'Philippines', TW:'Đài Loan',
  HK:'Hồng Kông', RU:'Nga', IT:'Ý', ES:'Tây Ban Nha',
  NL:'Hà Lan', PL:'Ba Lan', TR:'Thổ Nhĩ Kỳ', SA:'A.Rập Saudi',
  EG:'Ai Cập', ZA:'Nam Phi', AR:'Argentina', CL:'Chile', CO:'Colombia'
};

// ─── State ───────────────────────────────────────────
let apiKey         = '';
let currentCountry = 'US';
let currentCat     = '';
let isLoading      = false;

// ─── DOM Refs ────────────────────────────────────────
const $modal      = document.getElementById('api-modal');
const $keyInput   = document.getElementById('api-key-input');
const $keySubmit  = document.getElementById('api-key-submit');
const $keyError   = document.getElementById('modal-error');
const $changeKey  = document.getElementById('change-key-btn');
const $countrySelect = document.getElementById('country-select');
const $selectedFlag  = document.getElementById('selected-flag');
const $grid       = document.getElementById('video-grid');
const $errorState = document.getElementById('error-state');
const $emptyState = document.getElementById('empty-state');
const $errorMsg   = document.getElementById('error-message');
const $retryBtn   = document.getElementById('retry-btn');
const $chartTitle = document.getElementById('chart-title');
const $chartSub   = document.getElementById('chart-subtitle');
const $updateTime = document.getElementById('update-time');

// ─── Init ────────────────────────────────────────────
function init() {
  apiKey = localStorage.getItem(LS_KEY) || '';
  currentCountry = localStorage.getItem('tc_country') || 'US';

  // Restore country picker
  $countrySelect.value = currentCountry;
  $selectedFlag.textContent = COUNTRY_FLAGS[currentCountry] || '🌍';

  if (!apiKey) {
    showModal();
  } else {
    fetchTrending();
  }

  bindEvents();
}

// ─── Events ──────────────────────────────────────────
function bindEvents() {
  // API Key submit
  $keySubmit.addEventListener('click', handleKeySubmit);
  $keyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleKeySubmit();
  });

  // Change key button
  $changeKey.addEventListener('click', () => {
    $keyInput.value = apiKey;
    $keyError.classList.add('hidden');
    showModal();
  });

  // Country change
  $countrySelect.addEventListener('change', () => {
    currentCountry = $countrySelect.value;
    $selectedFlag.textContent = COUNTRY_FLAGS[currentCountry] || '🌍';
    localStorage.setItem('tc_country', currentCountry);
    fetchTrending();
  });

  // Category tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCat = tab.dataset.cat;
      fetchTrending();
    });
  });

  // Retry button
  $retryBtn.addEventListener('click', fetchTrending);
}

// ─── Modal ───────────────────────────────────────────
function showModal() {
  $modal.classList.remove('hidden');
  setTimeout(() => $keyInput.focus(), 100);
}

function hideModal() {
  $modal.classList.add('hidden');
}

async function handleKeySubmit() {
  const key = $keyInput.value.trim();
  if (!key) return;

  $keySubmit.textContent = 'Đang kiểm tra...';
  $keySubmit.disabled = true;
  $keyError.classList.add('hidden');

  const valid = await validateApiKey(key);

  $keySubmit.textContent = 'Xác nhận';
  $keySubmit.disabled = false;

  if (valid) {
    apiKey = key;
    localStorage.setItem(LS_KEY, apiKey);
    hideModal();
    fetchTrending();
  } else {
    $keyError.classList.remove('hidden');
  }
}

async function validateApiKey(key) {
  try {
    const url = `${API_BASE}?part=id&chart=mostPopular&maxResults=1&key=${key}`;
    const res  = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Fetch ───────────────────────────────────────────
async function fetchTrending() {
  if (isLoading) return;
  isLoading = true;

  // Update header info
  const catName = CATEGORY_NAMES[currentCat] || 'Tất cả video';
  const flag    = COUNTRY_FLAGS[currentCountry] || '';
  const cName   = COUNTRY_NAMES[currentCountry] || currentCountry;
  $chartTitle.textContent = `YouTube Trending — ${flag} ${cName}`;
  $chartSub.textContent   = catName;

  // Show skeletons
  showSkeletons(30);
  hideStates();

  try {
    let allVideos = [];
    let pageToken = '';
    const maxPages = 2; // up to 100 videos (50 per page)

    for (let p = 0; p < maxPages; p++) {
      const params = new URLSearchParams({
        part: 'snippet,statistics,contentDetails',
        chart: 'mostPopular',
        maxResults: 50,
        regionCode: currentCountry,
        key: apiKey,
      });
      if (currentCat) params.set('videoCategoryId', currentCat);
      if (pageToken)  params.set('pageToken', pageToken);

      const res  = await fetch(`${API_BASE}?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      allVideos.push(...(data.items || []));
      pageToken = data.nextPageToken || '';
      if (!pageToken) break;
    }

    if (allVideos.length === 0) {
      showEmpty();
    } else {
      renderGrid(allVideos);
      const now = new Date();
      $updateTime.textContent = `Cập nhật lúc ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    }

  } catch (err) {
    console.error(err);
    $errorMsg.textContent = err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
    showError();
  }

  isLoading = false;
}

// ─── Render ──────────────────────────────────────────
function renderGrid(videos) {
  $grid.innerHTML = '';
  videos.forEach((video, idx) => {
    const card = buildCard(video, idx + 1);
    $grid.appendChild(card);
  });
}

function buildCard(video, rank) {
  const { id, snippet, statistics, contentDetails } = video;
  const title        = snippet.title;
  const channel      = snippet.channelTitle;
  const thumb        = getBestThumb(snippet.thumbnails);
  const views        = formatViews(statistics?.viewCount);
  const duration     = parseDuration(contentDetails?.duration);
  const publishedAt  = snippet.publishedAt;
  const age          = timeAgo(publishedAt);
  const ytUrl        = `https://www.youtube.com/watch?v=${id}`;

  const { badgeClass, barClass, rankLabel } = getRankStyle(rank);

  const card = document.createElement('a');
  card.className     = 'video-card';
  card.href          = ytUrl;
  card.target        = '_blank';
  card.rel           = 'noopener noreferrer';
  card.dataset.rank  = rank;

  card.innerHTML = `
    <!-- Top bar (gold/silver/bronze/none) -->
    <div class="card-top-bar ${barClass}"></div>

    <!-- Thumbnail -->
    <div class="card-thumb">
      <img
        src="${thumb}"
        alt="${escHtml(title)}"
        loading="lazy"
        onerror="this.src='https://img.youtube.com/vi/${id}/mqdefault.jpg'"
      />
      ${rank <= 3 ? `<div class="card-rank-badge ${badgeClass}">${rankLabel}</div>` : `<div class="card-rank-badge rank-number">${rank}</div>`}
      ${duration ? `<span class="card-duration">${duration}</span>` : ''}
    </div>

    <!-- Body -->
    <div class="card-body">
      <div class="card-header-row">
        <div class="card-rank-num">${rank}</div>
        <div class="card-info">
          <div class="card-title">${escHtml(title)}</div>
          <div class="card-channel">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
            ${escHtml(channel)}
          </div>
          <div class="card-stats">
            <span class="stat-views">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
              ${views}
            </span>
            <span class="stat-dot"></span>
            <span class="stat-age">${age}</span>
            ${rank <= 10 ? `<span class="trend-new">TRENDING</span>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  return card;
}

// ─── Skeleton ────────────────────────────────────────
function showSkeletons(n) {
  $grid.innerHTML = '';
  for (let i = 0; i < n; i++) {
    $grid.innerHTML += `
      <div class="skeleton-card">
        <div class="skeleton-thumb"><div class="sk-thumb"></div></div>
        <div class="skeleton-body">
          <div class="skeleton-line" style="width:90%"></div>
          <div class="skeleton-line" style="width:60%"></div>
          <div class="skeleton-line" style="width:40%;margin-top:.25rem"></div>
        </div>
      </div>
    `;
  }
}

// ─── States ──────────────────────────────────────────
function hideStates() {
  $errorState.classList.add('hidden');
  $emptyState.classList.add('hidden');
}

function showError() {
  $grid.innerHTML = '';
  $errorState.classList.remove('hidden');
}

function showEmpty() {
  $grid.innerHTML = '';
  $emptyState.classList.remove('hidden');
}

// ─── Helpers ─────────────────────────────────────────
function getRankStyle(rank) {
  if (rank === 1) return { badgeClass: 'rank-gold',   barClass: 'bar-gold',   rankLabel: '🥇' };
  if (rank === 2) return { badgeClass: 'rank-silver', barClass: 'bar-silver', rankLabel: '🥈' };
  if (rank === 3) return { badgeClass: 'rank-bronze', barClass: 'bar-bronze', rankLabel: '🥉' };
  return { badgeClass: '', barClass: 'bar-none', rankLabel: '' };
}

function getBestThumb(thumbnails) {
  return (
    thumbnails?.maxres?.url ||
    thumbnails?.standard?.url ||
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    ''
  );
}

function formatViews(n) {
  if (!n) return '0';
  const num = parseInt(n, 10);
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (num >= 1_000_000)     return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000)         return (num / 1_000).toFixed(0) + 'K';
  return num.toLocaleString();
}

function parseDuration(iso) {
  if (!iso) return '';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '';
  const h  = parseInt(m[1] || '0');
  const mi = parseInt(m[2] || '0');
  const s  = parseInt(m[3] || '0');
  if (h > 0) {
    return `${h}:${String(mi).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  return `${mi}:${String(s).padStart(2,'0')}`;
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600)        return `${Math.floor(diff/60)} phút trước`;
  if (diff < 86400)       return `${Math.floor(diff/3600)} giờ trước`;
  if (diff < 86400*7)     return `${Math.floor(diff/86400)} ngày trước`;
  if (diff < 86400*30)    return `${Math.floor(diff/86400/7)} tuần trước`;
  if (diff < 86400*365)   return `${Math.floor(diff/86400/30)} tháng trước`;
  return `${Math.floor(diff/86400/365)} năm trước`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ─── Bootstrap ───────────────────────────────────────
init();
