// ========== НАСТРОЙКИ (ЗАМЕНИТЕ НА СВОИ) ==========
const REPO_OWNER = 'ВАШ_ЛОГИН_GITHUB';  // 👈 ВАШ ЛОГИН
const REPO_NAME = 'crack-track';         // 👈 НАЗВАНИЕ РЕПОЗИТОРИЯ
const GITHUB_TOKEN = 'ВАШ_ТОКЕН';        // 👈 ПОЛУЧИТЕ НИЖЕ

// АДМИН ДАННЫЕ
const ADMIN_USERNAME = 'M4RKOVKA';
const ADMIN_PASSWORD = 'Kabalevsky2011';

// КАТЕГОРИИ
const GAME_GENRES = ['action', 'rpg', 'strategy', 'simulator', 'indy'];
const MOVIE_COUNTRIES = ['russia', 'usa', 'uk', 'france', 'japan', 'korea', 'other'];

const GENRE_NAMES = {
    action: '🎮 ЭКШЕН', rpg: '📖 RPG', strategy: '♟️ СТРАТЕГИИ',
    simulator: '🚗 СИМУЛЯТОРЫ', indy: '🎨 ИНДИ'
};

const COUNTRY_NAMES = {
    russia: '🇷🇺 РОССИЯ', usa: '🇺🇸 США', uk: '🇬🇧 ВЕЛИКОБРИТАНИЯ',
    france: '🇫🇷 ФРАНЦИЯ', japan: '🇯🇵 ЯПОНИЯ', korea: '🇰🇷 КОРЕЯ', other: '🌍 ДРУГИЕ'
};

// ========== ЗАГРУЗКА ДАННЫХ ==========
async function loadTorrents() {
    try {
        const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/torrents.json`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Файл не найден');
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        return { games: {}, movies: {} };
    }
}

// ========== СОХРАНЕНИЕ В GITHUB ==========
async function saveTorrents(data, commitMessage) {
    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/torrents.json`;
        const response = await fetch(url, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });
        const fileData = await response.json();
        
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
        
        const updateResponse = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: commitMessage,
                content: content,
                sha: fileData.sha
            })
        });
        
        if (!updateResponse.ok) throw new Error('Ошибка сохранения');
        return true;
    } catch (error) {
        console.error('Ошибка:', error);
        return false;
    }
}

// ========== ОТОБРАЖЕНИЕ ИГР ==========
async function displayGames() {
    const container = document.getElementById('games-container');
    if (!container) return;
    
    const data = await loadTorrents();
    container.innerHTML = '';
    
    for (const genre of GAME_GENRES) {
        const games = data.games?.[genre] || [];
        if (games.length === 0) continue;
        
        const section = document.createElement('div');
        section.className = 'genre-section';
        section.innerHTML = `<h3>${GENRE_NAMES[genre]}</h3><div class="torrents-list"></div>`;
        
        const list = section.querySelector('.torrents-list');
        games.forEach(game => {
            const item = document.createElement('div');
            item.className = 'torrent-item';
            item.innerHTML = `
                <div class="torrent-info">
                    <div class="torrent-title">🎮 ${game.title}</div>
                    <div class="torrent-meta">👤 ${game.added_by || 'anon'} | 📅 ${game.date || 'недавно'}</div>
                    ${game.description ? `<div class="torrent-meta">📝 ${game.description.substring(0, 100)}</div>` : ''}
                </div>
                <a href="${game.magnet}" class="magnet-link"><i class="fas fa-magnet"></i> МАГНЕТ</a>
            `;
            list.appendChild(item);
        });
        container.appendChild(section);
    }
}

// ========== ОТОБРАЖЕНИЕ ФИЛЬМОВ ==========
async function displayMovies() {
    const container = document.getElementById('movies-container');
    if (!container) return;
    
    const data = await loadTorrents();
    container.innerHTML = '';
    
    for (const country of MOVIE_COUNTRIES) {
        const movies = data.movies?.[country] || [];
        if (movies.length === 0) continue;
        
        const section = document.createElement('div');
        section.className = 'country-section';
        section.innerHTML = `<h3>${COUNTRY_NAMES[country]}</h3><div class="torrents-list"></div>`;
        
        const list = section.querySelector('.torrents-list');
        movies.forEach(movie => {
            const item = document.createElement('div');
            item.className = 'torrent-item';
            item.innerHTML = `
                <div class="torrent-info">
                    <div class="torrent-title">🎬 ${movie.title}</div>
                    <div class="torrent-meta">👤 ${movie.added_by || 'anon'} | 📅 ${movie.date || 'недавно'}</div>
                    ${movie.description ? `<div class="torrent-meta">📝 ${movie.description.substring(0, 100)}</div>` : ''}
                </div>
                <a href="${movie.magnet}" class="magnet-link"><i class="fas fa-magnet"></i> МАГНЕТ</a>
            `;
            list.appendChild(item);
        });
        container.appendChild(section);
    }
}

// ========== СТАТИСТИКА ==========
async function updateStats() {
    const data = await loadTorrents();
    let gamesCount = 0;
    let moviesCount = 0;
    
    if (data.games) {
        for (const genre of GAME_GENRES) {
            gamesCount += (data.games[genre] || []).length;
        }
    }
    
    if (data.movies) {
        for (const country of MOVIE_COUNTRIES) {
            moviesCount += (data.movies[country] || []).length;
        }
    }
    
    const gamesSpan = document.getElementById('games-count');
    const moviesSpan = document.getElementById('movies-count');
    if (gamesSpan) gamesSpan.textContent = gamesCount;
    if (moviesSpan) moviesSpan.textContent = moviesCount;
}

// ========== ФОРМА ДОБАВЛЕНИЯ ==========
function setupAddForm() {
    const form = document.getElementById('addForm');
    if (!form) return;
    
    const contentType = document.getElementById('contentType');
    const category = document.getElementById('category');
    
    function updateCategories() {
        const type = contentType.value;
        category.innerHTML = '<option value="">-- ВЫБЕРИТЕ --</option>';
        
        const items = type === 'game' ? GAME_GENRES : MOVIE_COUNTRIES;
        const names = type === 'game' ? GENRE_NAMES : COUNTRY_NAMES;
        
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = names[item];
            category.appendChild(option);
        });
    }
    
    contentType.addEventListener('change', updateCategories);
    updateCategories();
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newTorrent = {
            title: document.getElementById('title').value,
            magnet: document.getElementById('magnet').value,
            description: document.getElementById('description').value || '',
            added_by: 'user',
            date: new Date().toISOString().split('T')[0]
        };
        
        const messageDiv = document.getElementById('message');
        messageDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> ОТПРАВКА...</div>';
        
        try {
            const issueData = {
                title: `[НОВАЯ РАЗДАЧА] ${newTorrent.title}`,
                body: JSON.stringify({
                    type: contentType.value,
                    category: category.value,
                    ...newTorrent
                }),
                labels: ['pending']
            };
            
            const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(issueData)
            });
            
            if (response.ok) {
                messageDiv.innerHTML = '<div class="success"><i class="fas fa-check-circle"></i> ✅ РАЗДАЧА ОТПРАВЛЕНА! ЖДИТЕ ПРОВЕРКИ АДМИНОМ</div>';
                form.reset();
                updateCategories();
            } else {
                throw new Error('Ошибка');
            }
        } catch (error) {
            messageDiv.innerHTML = '<div class="error"><i class="fas fa-exclamation-triangle"></i> ❌ ОШИБКА! ПОПРОБУЙТЕ ПОЗЖЕ</div>';
        }
    });
}

// ========== АДМИН-ПАНЕЛЬ ==========
let currentAdminSession = false;

function checkAdminLogin() {
    const username = document.getElementById('adminUsername')?.value;
    const password = document.getElementById('adminPassword')?.value;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        currentAdminSession = true;
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        loadAdminData();
    } else {
        alert('❌ НЕВЕРНЫЙ ЛОГИН ИЛИ ПАРОЛЬ!');
    }
}

function logout() {
    currentAdminSession = false;
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
}

async function loadAdminData() {
    await loadPendingIssues();
    await loadAllTorrents();
}

async function loadPendingIssues() {
    const container = document.getElementById('pendingList');
    if (!container) return;
    
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues?labels=pending&state=open`);
    const issues = await response.json();
    
    if (issues.length === 0) {
        container.innerHTML = '<div class="info-box">✨ НЕТ НОВЫХ РАЗДАЧ НА ПРОВЕРКЕ</div>';
        return;
    }
    
    container.innerHTML = '';
    for (const issue of issues) {
        const data = JSON.parse(issue.body);
        const div = document.createElement('div');
        div.className = 'pending-item';
        div.innerHTML = `
            <div class="pending-title">${data.title}</div>
            <div class="pending-meta">📁 ${data.type === 'game' ? 'ИГРА' : 'ФИЛЬМ'} | ${data.type === 'game' ? GENRE_NAMES[data.category] : COUNTRY_NAMES[data.category]}</div>
            ${data.description ? `<div class="pending-desc">📝 ${data.description}</div>` : ''}
            <div class="pending-actions">
                <button class="approve-btn" onclick="approveIssue(${issue.number})"><i class="fas fa-check"></i> ОДОБРИТЬ</button>
                <button class="reject-btn" onclick="rejectIssue(${issue.number})"><i class="fas fa-times"></i> ОТКЛОНИТЬ</button>
            </div>
        `;
        container.appendChild(div);
    }
}

async function loadAllTorrents() {
    const container = document.getElementById('allTorrentsList');
    if (!container) return;
    
    const data = await loadTorrents();
    container.innerHTML = '';
    
    // Игры
    if (data.games) {
        for (const genre of GAME_GENRES) {
            const games = data.games[genre] || [];
            games.forEach((game, idx) => {
                const div = document.createElement('div');
                div.className = 'torrent-item';
                div.innerHTML = `
                    <div class="torrent-info">
                        <div class="torrent-title">🎮 ${game.title}</div>
                        <div class="torrent-meta">📁 ${GENRE_NAMES[genre]}</div>
                    </div>
                    <button class="delete-btn" onclick="deleteTorrent('games', '${genre}', ${idx})"><i class="fas fa-trash"></i> УДАЛИТЬ</button>
                `;
                container.appendChild(div);
            });
        }
    }
    
    // Фильмы
    if (data.movies) {
        for (const country of MOVIE_COUNTRIES) {
            const movies = data.movies[country] || [];
            movies.forEach((movie, idx) => {
                const div = document.createElement('div');
                div.className = 'torrent-item';
                div.innerHTML = `
                    <div class="torrent-info">
                        <div class="torrent-title">🎬 ${movie.title}</div>
                        <div class="torrent-meta">📁 ${COUNTRY_NAMES[country]}</div>
                    </div>
                    <button class="delete-btn" onclick="deleteTorrent('movies', '${country}', ${idx})"><i class="fas fa-trash"></i> УДАЛИТЬ</button>
                `;
                container.appendChild(div);
            });
        }
    }
}

async function approveIssue(issueNumber) {
    const data = await loadTorrents();
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}`);
    const issue = await response.json();
    const torrentData = JSON.parse(issue.body);
    
    const category = torrentData.category;
    const type = torrentData.type;
    
    if (!data[type]) data[type] = {};
    if (!data[type][category]) data[type][category] = [];
    
    data[type][category].push({
        id: Date.now(),
        title: torrentData.title,
        magnet: torrentData.magnet,
        description: torrentData.description || '',
        added_by: torrentData.added_by,
        date: torrentData.date
    });
    
    const saved = await saveTorrents(data, `Одобрена раздача: ${torrentData.title}`);
    
    if (saved) {
        await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ state: 'closed' })
        });
        alert('✅ РАЗДАЧА ОДОБРЕНА!');
        loadAdminData();
        updateStats();
    } else {
        alert('❌ ОШИБКА СОХРАНЕНИЯ!');
    }
}

async function rejectIssue(issueNumber) {
    await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state: 'closed' })
    });
    alert('❌ РАЗДАЧА ОТКЛОНЕНА!');
    loadAdminData();
}

async function deleteTorrent(type, category, index) {
    if (!confirm('🗑️ УДАЛИТЬ РАЗДАЧУ?')) return;
    
    const data = await loadTorrents();
    data[type][category].splice(index, 1);
    
    const saved = await saveTorrents(data, `Удалена раздача из ${type}/${category}`);
    
    if (saved) {
        alert('✅ РАЗДАЧА УДАЛЕНА!');
        loadAdminData();
        updateStats();
    } else {
        alert('❌ ОШИБКА УДАЛЕНИЯ!');
    }
}

// ========== АНИМАЦИЯ КУРСОРА ==========
document.addEventListener('mousemove', (e) => {
    const glow = document.querySelector('.cursor-glow');
    if (glow) {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    }
});

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', () => {
    displayGames();
    displayMovies();
    updateStats();
    setupAddForm();
});