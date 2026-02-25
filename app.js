/* ====================================================
   TRENDING CHART APP — YouTube Data API v3
   ==================================================== */

// ─── Constants ──────────────────────────────────────
const API_BASE = 'https://www.googleapis.com/youtube/v3/videos';
const SEARCH_BASE = 'https://www.googleapis.com/youtube/v3/search';
const LS_KEY = 'tc_yt_api_key';

const CATEGORY_NAMES = {
  '': 'Tất cả video',
  '10': 'Âm nhạc',
  '20': 'Gaming',
  '17': 'Thể thao',
  '24': 'Giải trí',
  '25': 'Tin tức & Chính trị',
  '28': 'Khoa học & Công nghệ',
  '1': 'Phim & Hoạt hình',
  '22': 'Người & Blog',
  '23': 'Hài kịch',
  '26': 'Phong cách sống'
};

const COUNTRIES = [
  { code: 'VN', flag: '🇻🇳', name: 'Việt Nam' },
  { code: 'US', flag: '🇺🇸', name: 'United States' },
  { code: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'FR', flag: '🇫🇷', name: 'France' },
  { code: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: 'IN', flag: '🇮🇳', name: 'India' },
  { code: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: 'ID', flag: '🇮🇩', name: 'Indonesia' },
  { code: 'TH', flag: '🇹🇭', name: 'Thailand' },
  { code: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: 'PH', flag: '🇵🇭', name: 'Philippines' },
  { code: 'TW', flag: '🇹🇼', name: 'Taiwan' },
  { code: 'HK', flag: '🇭🇰', name: 'Hong Kong' },
  { code: 'RU', flag: '🇷🇺', name: 'Russia' },
  { code: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: 'PL', flag: '🇵🇱', name: 'Poland' },
  { code: 'TR', flag: '🇹🇷', name: 'Turkey' },
  { code: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'EG', flag: '🇪🇬', name: 'Egypt' },
  { code: 'ZA', flag: '🇿🇦', name: 'South Africa' },
  { code: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: 'CO', flag: '🇨🇴', name: 'Colombia' },
];

// ─── State ───────────────────────────────────────────
let apiKey = '';
let currentCountry = 'US';
let currentCat = '';
let currentMode = 'trending'; // 'trending' | 'keyword'
let currentKeyword = '';
let isLoading = false;

// ─── DOM Refs ────────────────────────────────────────
const $modal = document.getElementById('api-modal');
const $keyInput = document.getElementById('api-key-input');
const $keySubmit = document.getElementById('api-key-submit');
const $keyError = document.getElementById('modal-error');
const $changeKey = document.getElementById('change-key-btn');
const $dropdown = document.getElementById('country-dropdown');
const $trigger = document.getElementById('dropdown-trigger');
const $dropMenu = document.getElementById('dropdown-menu');
const $dropSearch = document.getElementById('dropdown-search');
const $dropList = document.getElementById('dropdown-list');
const $selectedFlag = document.getElementById('selected-flag');
const $selectedName = document.getElementById('selected-name');
const $grid = document.getElementById('video-grid');
const $errorState = document.getElementById('error-state');
const $emptyState = document.getElementById('empty-state');
const $errorMsg = document.getElementById('error-message');
const $retryBtn = document.getElementById('retry-btn');
const $chartTitle = document.getElementById('chart-title');
const $chartSub = document.getElementById('chart-subtitle');
const $updateTime = document.getElementById('update-time');
const $keywordBar = document.getElementById('keyword-bar');
const $keywordInput = document.getElementById('keyword-input');
const $kwSearchBtn = document.getElementById('keyword-search-btn');

// ─── Init ────────────────────────────────────────────
function init() {
  apiKey = localStorage.getItem(LS_KEY) || '';
  currentCountry = localStorage.getItem('tc_country') || 'US';

  buildDropdown();
  setCountry(currentCountry, false);

  if (!apiKey) {
    showModal();
  } else {
    fetchTrending();
  }

  bindEvents();
}

// ─── Custom Dropdown ─────────────────────────────────
function buildDropdown(filter = '') {
  $dropList.innerHTML = '';
  const filtered = filter
    ? COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.code.toLowerCase().includes(filter.toLowerCase())
    )
    : COUNTRIES;

  if (filtered.length === 0) {
    $dropList.innerHTML = '<li class="dropdown-no-results">Không tìm thấy quốc gia</li>';
    return;
  }

  filtered.forEach(country => {
    const li = document.createElement('li');
    li.className = `dropdown-item${country.code === currentCountry ? ' selected' : ''}`;
    li.dataset.code = country.code;
    li.innerHTML = `
      <span class="dropdown-item-flag">${country.flag}</span>
      <span class="dropdown-item-name">${country.name}</span>
    `;
    li.addEventListener('click', () => {
      setCountry(country.code, true);
      closeDropdown();
    });
    $dropList.appendChild(li);
  });
}

function openDropdown() {
  $dropdown.classList.add('open');
  $trigger.classList.add('open');
  $dropSearch.value = '';
  buildDropdown();
  setTimeout(() => $dropSearch.focus(), 50);
}

function closeDropdown() {
  $dropdown.classList.remove('open');
  $trigger.classList.remove('open');
}

function setCountry(code, fetch = true) {
  currentCountry = code;
  localStorage.setItem('tc_country', code);
  const c = COUNTRIES.find(x => x.code === code) || COUNTRIES[1];
  $selectedFlag.textContent = c.flag;
  $selectedName.textContent = c.name;

  // Refresh selected state in open list
  document.querySelectorAll('.dropdown-item').forEach(el => {
    el.classList.toggle('selected', el.dataset.code === code);
  });

  if (fetch && currentMode === 'trending') fetchTrending();
}

// ─── Events ──────────────────────────────────────────
function bindEvents() {
  // API Key
  $keySubmit.addEventListener('click', handleKeySubmit);
  $keyInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleKeySubmit(); });

  // Change key
  $changeKey.addEventListener('click', () => {
    $keyInput.value = apiKey;
    $keyError.classList.add('hidden');
    showModal();
  });

  // Dropdown toggle
  $trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    $dropdown.classList.contains('open') ? closeDropdown() : openDropdown();
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!$dropdown.contains(e.target)) closeDropdown();
  });

  // Dropdown search filter
  $dropSearch.addEventListener('input', () => buildDropdown($dropSearch.value));
  $dropSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDropdown();
  });

  // Category tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const mode = tab.dataset.mode;
      currentMode = mode;
      currentCat = tab.dataset.cat || '';

      if (mode === 'keyword') {
        // Show keyword bar, hide country dropdown
        $keywordBar.classList.remove('hidden');
        $dropdown.style.opacity = '0.4';
        $dropdown.style.pointerEvents = 'none';
        // Focus input
        setTimeout(() => $keywordInput.focus(), 100);
      } else {
        $keywordBar.classList.add('hidden');
        $dropdown.style.opacity = '';
        $dropdown.style.pointerEvents = '';
        fetchTrending();
      }
    });
  });

  // Keyword search button
  $kwSearchBtn.addEventListener('click', doKeywordSearch);
  $keywordInput.addEventListener('keydown', e => { if (e.key === 'Enter') doKeywordSearch(); });

  // Retry
  $retryBtn.addEventListener('click', () => {
    currentMode === 'keyword' ? doKeywordSearch() : fetchTrending();
  });
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
    currentMode === 'keyword' ? doKeywordSearch() : fetchTrending();
  } else {
    $keyError.classList.remove('hidden');
  }
}

async function validateApiKey(key) {
  try {
    const url = `${API_BASE}?part=id&chart=mostPopular&maxResults=1&key=${key}`;
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Fetch Trending ──────────────────────────────────
async function fetchTrending() {
  if (isLoading) return;
  isLoading = true;

  const catName = CATEGORY_NAMES[currentCat] || 'Tất cả video';
  const c = COUNTRIES.find(x => x.code === currentCountry) || { flag: '🌍', name: currentCountry };
  $chartTitle.textContent = `YouTube Trending — ${c.flag} ${c.name}`;
  $chartSub.textContent = catName;

  showSkeletons(30);
  hideStates();

  try {
    let allVideos = [];
    let pageToken = '';
    const maxPages = 2;

    for (let p = 0; p < maxPages; p++) {
      const params = new URLSearchParams({
        part: 'snippet,statistics,contentDetails',
        chart: 'mostPopular',
        maxResults: 50,
        regionCode: currentCountry,
        key: apiKey,
      });
      if (currentCat) params.set('videoCategoryId', currentCat);
      if (pageToken) params.set('pageToken', pageToken);

      const res = await fetch(`${API_BASE}?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      allVideos.push(...(data.items || []));
      pageToken = data.nextPageToken || '';
      if (!pageToken) break;
    }

    allVideos.length === 0 ? showEmpty() : renderGrid(allVideos);
    stampTime();

  } catch (err) {
    console.error(err);
    $errorMsg.textContent = err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
    showError();
  }

  isLoading = false;
}

// ─── Keyword Search ───────────────────────────────────
async function doKeywordSearch() {
  const kw = $keywordInput.value.trim();
  if (!kw) {
    $keywordInput.focus();
    return;
  }
  if (isLoading) return;
  isLoading = true;
  currentKeyword = kw;

  $chartTitle.textContent = `🔍 Kết quả: "${kw}"`;
  $chartSub.textContent = 'Tìm kiếm toàn cầu theo từ khóa';

  showSkeletons(30);
  hideStates();

  try {
    // Step 1: Search for video IDs
    const searchParams = new URLSearchParams({
      part: 'id',
      type: 'video',
      q: kw,
      maxResults: 50,
      order: 'viewCount',
      key: apiKey,
    });

    const searchRes = await fetch(`${SEARCH_BASE}?${searchParams}`);
    if (!searchRes.ok) {
      const err = await searchRes.json();
      throw new Error(err?.error?.message || `HTTP ${searchRes.status}`);
    }
    const searchData = await searchRes.json();
    const ids = (searchData.items || []).map(i => i.id.videoId).filter(Boolean);

    if (ids.length === 0) {
      showEmpty();
      isLoading = false;
      return;
    }

    // Step 2: Get full video details
    const videoParams = new URLSearchParams({
      part: 'snippet,statistics,contentDetails',
      id: ids.join(','),
      key: apiKey,
    });

    const videoRes = await fetch(`${API_BASE}?${videoParams}`);
    if (!videoRes.ok) {
      const err = await videoRes.json();
      throw new Error(err?.error?.message || `HTTP ${videoRes.status}`);
    }
    const videoData = await videoRes.json();

    // Sort by viewCount desc to show most viewed first
    const sorted = (videoData.items || []).sort((a, b) => {
      return parseInt(b.statistics?.viewCount || 0) - parseInt(a.statistics?.viewCount || 0);
    });

    sorted.length === 0 ? showEmpty() : renderGrid(sorted);
    stampTime();

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
  const title = snippet.title;
  const channel = snippet.channelTitle;
  const thumb = getBestThumb(snippet.thumbnails);
  const views = formatViews(statistics?.viewCount);
  const duration = parseDuration(contentDetails?.duration);
  const age = timeAgo(snippet.publishedAt);
  const ytUrl = `https://www.youtube.com/watch?v=${id}`;

  const { badgeClass, barClass, rankLabel } = getRankStyle(rank);

  const card = document.createElement('a');
  card.className = 'video-card';
  card.href = ytUrl;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';
  card.dataset.rank = rank;

  card.innerHTML = `
    <div class="card-top-bar ${barClass}"></div>
    <div class="card-thumb">
      <img
        src="${thumb}"
        alt="${escHtml(title)}"
        loading="lazy"
        onerror="this.src='https://img.youtube.com/vi/${id}/mqdefault.jpg'"
      />
      ${rank <= 3
      ? `<div class="card-rank-badge ${badgeClass}">${rankLabel}</div>`
      : `<div class="card-rank-badge rank-number">${rank}</div>`}
      ${duration ? `<span class="card-duration">${duration}</span>` : ''}
    </div>
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

function stampTime() {
  const now = new Date();
  $updateTime.textContent = `Cập nhật lúc ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
}

// ─── Helpers ─────────────────────────────────────────
function getRankStyle(rank) {
  if (rank === 1) return { badgeClass: 'rank-gold', barClass: 'bar-gold', rankLabel: '🥇' };
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
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(0) + 'K';
  return num.toLocaleString();
}

function parseDuration(iso) {
  if (!iso) return '';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '';
  const h = parseInt(m[1] || '0');
  const mi = parseInt(m[2] || '0');
  const s = parseInt(m[3] || '0');
  return h > 0
    ? `${h}:${String(mi).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${mi}:${String(s).padStart(2, '0')}`;
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400 / 7)} tuần trước`;
  if (diff < 86400 * 365) return `${Math.floor(diff / 86400 / 30)} tháng trước`;
  return `${Math.floor(diff / 86400 / 365)} năm trước`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Bootstrap ───────────────────────────────────────
init();
