const REPO_OWNER = 'markovkafromhell';
const REPO_NAME = 'CRACK-TRACK';
const GITHUB_TOKEN = 'ВАШ_ТОКЕН';

const GAME_GENRES = ['action', 'rpg', 'strategy', 'simulator', 'indy'];
const MOVIE_COUNTRIES = ['russia', 'usa', 'uk', 'france', 'japan', 'korea', 'other'];

const GENRE_NAMES = {
    action: 'ЭКШЕН', rpg: 'RPG', strategy: 'СТРАТЕГИИ',
    simulator: 'СИМУЛЯТОРЫ', indy: 'ИНДИ'
};

const COUNTRY_NAMES = {
    russia: 'РОССИЯ', usa: 'США', uk: 'ВЕЛИКОБРИТАНИЯ',
    france: 'ФРАНЦИЯ', japan: 'ЯПОНИЯ', korea: 'КОРЕЯ', other: 'ДРУГИЕ'
};

async function loadTorrents() {
    try {
        const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/torrents.json`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка загрузки');
        return await response.json();
    } catch (error) {
        console.error('Ошибка:', error);
        return { games: {}, movies: {} };
    }
}

async function displayGames() {
    const container = document.getElementById('games-container');
    if (!container) return;
    
    const data = await loadTorrents();
    container.innerHTML = '';
    
    let found = false;
    
    for (const genre of GAME_GENRES) {
        const games = data.games?.[genre] || [];
        if (games.length === 0) continue;
        
        found = true;
        const section = document.createElement('div');
        section.className = 'genre-section';
        section.innerHTML = `<h3><i class="fas fa-gamepad"></i> ${GENRE_NAMES[genre]}</h3><div class="torrents-list"></div>`;
        
        const list = section.querySelector('.torrents-list');
        games.forEach(game => {
            const item = document.createElement('div');
            item.className = 'torrent-item';
            item.innerHTML = `
                <div class="torrent-info">
                    <div class="torrent-title">🎮 ${game.title}</div>
                    <div class="torrent-meta">➕ ${game.added_by || 'M4RKOVKA'} | 📅 ${game.date || 'недавно'}</div>
                    ${game.description ? `<div class="torrent-desc">📝 ${game.description}</div>` : ''}
                </div>
                <a href="${game.magnet}" class="magnet-link" target="_blank"><i class="fas fa-magnet"></i> МАГНЕТ</a>
            `;
            list.appendChild(item);
        });
        container.appendChild(section);
    }
    
    if (!found) {
        container.innerHTML = '<div class="info-box">😢 ПОКА НЕТ РАЗДАЧ В ЭТОМ РАЗДЕЛЕ</div>';
    }
}

async function displayMovies() {
    const container = document.getElementById('movies-container');
    if (!container) return;
    
    const data = await loadTorrents();
    container.innerHTML = '';
    
    let found = false;
    
    for (const country of MOVIE_COUNTRIES) {
        const movies = data.movies?.[country] || [];
        if (movies.length === 0) continue;
        
        found = true;
        const section = document.createElement('div');
        section.className = 'country-section';
        section.innerHTML = `<h3><i class="fas fa-film"></i> ${COUNTRY_NAMES[country]}</h3><div class="torrents-list"></div>`;
        
        const list = section.querySelector('.torrents-list');
        movies.forEach(movie => {
            const item = document.createElement('div');
            item.className = 'torrent-item';
            item.innerHTML = `
                <div class="torrent-info">
                    <div class="torrent-title">🎬 ${movie.title}</div>
                    <div class="torrent-meta">➕ ${movie.added_by || 'M4RKOVKA'} | 📅 ${movie.date || 'недавно'}</div>
                    ${movie.description ? `<div class="torrent-desc">📝 ${movie.description}</div>` : ''}
                </div>
                <a href="${movie.magnet}" class="magnet-link" target="_blank"><i class="fas fa-magnet"></i> МАГНЕТ</a>
            `;
            list.appendChild(item);
        });
        container.appendChild(section);
    }
    
    if (!found) {
        container.innerHTML = '<div class="info-box">😢 ПОКА НЕТ РАЗДАЧ В ЭТОМ РАЗДЕЛЕ</div>';
    }
}

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
        messageDiv.innerHTML = '<div class="loading">ОТПРАВКА...</div>';
        
        try {
            const issueData = {
                title: `[РАЗДАЧА] ${newTorrent.title}`,
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
                messageDiv.innerHTML = '<div class="success">✅ РАЗДАЧА ОТПРАВЛЕНА НА ПРОВЕРКУ!</div>';
                form.reset();
                updateCategories();
            } else {
                throw new Error('Ошибка');
            }
        } catch (error) {
            messageDiv.innerHTML = '<div class="error">❌ ОШИБКА! ПОПРОБУЙТЕ ПОЗЖЕ</div>';
        }
    });
}

function checkAdminLogin() {
    const username = document.getElementById('adminUsername')?.value;
    const password = document.getElementById('adminPassword')?.value;
    
    if (username === 'M4RKOVKA' && password === 'Kabalevsky2011') {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        loadAdminData();
    } else {
        alert('НЕВЕРНЫЙ ЛОГИН ИЛИ ПАРОЛЬ');
    }
}

function logout() {
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
        container.innerHTML = '<div class="info-box">✨ НЕТ НОВЫХ РАЗДАЧ</div>';
        return;
    }
    
    container.innerHTML = '';
    for (const issue of issues) {
        const data = JSON.parse(issue.body);
        const div = document.createElement('div');
        div.className = 'pending-item';
        div.innerHTML = `
            <div class="pending-title">${data.title}</div>
            <div class="pending-meta">${data.type === 'game' ? 'ИГРА' : 'ФИЛЬМ'} | ${data.type === 'game' ? GENRE_NAMES[data.category] : COUNTRY_NAMES[data.category]}</div>
            <div class="pending-desc">${data.description || 'Нет описания'}</div>
            <div class="pending-actions">
                <button class="approve-btn" onclick="approveIssue(${issue.number})">✅ ОДОБРИТЬ</button>
                <button class="reject-btn" onclick="rejectIssue(${issue.number})">❌ ОТКЛОНИТЬ</button>
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
    
    if (data.games) {
        for (const genre of GAME_GENRES) {
            const games = data.games[genre] || [];
            games.forEach((game, idx) => {
                const div = document.createElement('div');
                div.className = 'torrent-item';
                div.innerHTML = `
                    <div class="torrent-info">
                        <div class="torrent-title">🎮 ${game.title}</div>
                        <div class="torrent-meta">${GENRE_NAMES[genre]}</div>
                    </div>
                    <button class="delete-btn" onclick="deleteTorrent('games', '${genre}', ${idx})">🗑 УДАЛИТЬ</button>
                `;
                container.appendChild(div);
            });
        }
    }
    
    if (data.movies) {
        for (const country of MOVIE_COUNTRIES) {
            const movies = data.movies[country] || [];
            movies.forEach((movie, idx) => {
                const div = document.createElement('div');
                div.className = 'torrent-item';
                div.innerHTML = `
                    <div class="torrent-info">
                        <div class="torrent-title">🎬 ${movie.title}</div>
                        <div class="torrent-meta">${COUNTRY_NAMES[country]}</div>
                    </div>
                    <button class="delete-btn" onclick="deleteTorrent('movies', '${country}', ${idx})">🗑 УДАЛИТЬ</button>
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
    
    const newId = Date.now();
    data[type][category].push({
        id: newId,
        title: torrentData.title,
        magnet: torrentData.magnet,
        description: torrentData.description || '',
        added_by: torrentData.added_by,
        date: torrentData.date
    });
    
    const saved = await saveTorrents(data, `Одобрена: ${torrentData.title}`);
    
    if (saved) {
        await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ state: 'closed' })
        });
        alert('✅ РАЗДАЧА ОДОБРЕНА');
        loadAdminData();
        updateStats();
    } else {
        alert('❌ ОШИБКА');
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
    alert('❌ РАЗДАЧА ОТКЛОНЕНА');
    loadAdminData();
}

async function deleteTorrent(type, category, index) {
    if (!confirm('УДАЛИТЬ РАЗДАЧУ?')) return;
    
    const data = await loadTorrents();
    data[type][category].splice(index, 1);
    
    const saved = await saveTorrents(data, `Удалена раздача из ${type}/${category}`);
    
    if (saved) {
        alert('✅ РАЗДАЧА УДАЛЕНА');
        loadAdminData();
        updateStats();
    } else {
        alert('❌ ОШИБКА');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('games-container')) displayGames();
    if (document.getElementById('movies-container')) displayMovies();
    if (document.getElementById('stats')) updateStats();
    if (document.getElementById('addForm')) setupAddForm();
});

document.addEventListener('mousemove', (e) => {
    const glow = document.querySelector('.cursor-glow');
    if (glow) {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    }
});
