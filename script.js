// script.js

// 1. 구글 시트 주소 업데이트 (정확한 링크로 수정)
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTMsp7P7HBbupv1HqtWgw8koVO9p28myR3bFmMfLdaAaGeo72ufEhZo3meZHzjLTskYDeJg-TI4kBD/pub?gid=0&single=true&output=csv'; 

// --- 공통: 오버레이 메뉴 토글 로직 ---
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const menuOverlayArea = document.getElementById('menu-overlay-area');

function toggleMenu() {
    document.body.classList.toggle('menu-open');
}

if (menuToggleBtn && menuOverlayArea) {
    menuToggleBtn.addEventListener('click', toggleMenu);
    menuOverlayArea.addEventListener('click', (e) => {
        if (e.target === menuOverlayArea) toggleMenu();
    });
}

// --- 핵심: 이미지 주소 자동 변환 함수 ---
function formatContent(text) {
    if (!text) return '';
    // http로 시작하고 확장자로 끝나는 주소를 찾아서 img 태그로 변환
    const imageRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))/gi;
    return text.replace(imageRegex, '<img src="$1" class="in-content-image">');
}

// --- 정밀 CSV 파서 (데이터 밀림 방지) ---
function parseCSV(text) {
    const rows = []; let row = []; let cell = ''; let isQuoted = false;
    for (let i = 0; i < text.length; i++) {
        let c = text[i], next = text[i+1];
        if (c === '"' && isQuoted && next === '"') { cell += '"'; i++; }
        else if (c === '"') { isQuoted = !isQuoted; }
        else if (c === ',' && !isQuoted) { row.push(cell); cell = ''; }
        else if (c === '\n' && !isQuoted) {
            row.push(cell); rows.push(row); row = []; cell = '';
        } else { cell += c; }
    }
    if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); }
    const headers = rows[0].map(h => h.trim().toLowerCase());
    return rows.slice(1).map(r => {
        let obj = {};
        headers.forEach((h, i) => obj[h] = r[i] ? r[i].trim() : "");
        return obj;
    }).filter(item => item.id);
}

async function getSheetData() {
    try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error('데이터 페칭 오류:', error);
        return [];
    }
}

// 1. [메인 페이지] 갤러리 로딩
async function loadMainGallery() {
    const galleryFeed = document.getElementById('gallery-feed');
    if (!galleryFeed) return;
    
    galleryFeed.innerHTML = '<p style="text-align:center; width:100%; grid-column: 1 / -1;">데이터를 불러오는 중입니다...</p>';
    
    const data = await getSheetData();
    galleryFeed.innerHTML = ''; 

    data.reverse().forEach(post => {
        // 본문에서 첫 번째 이미지를 썸네일로 사용하거나 별도 로직 적용
        const contentHTML = formatContent(post.content || '');
        const article = document.createElement('article');
        article.className = 'post-card';
        article.innerHTML = `
            <a href="post.html?id=${post.id}" class="post-article-link">
                <div class="card-thumbnail">${contentHTML}</div>
                <h2 class="post-title">${post.title}</h2>
            </a>
        `;
        galleryFeed.appendChild(article);
    });
}

// 2. [상세 페이지] 컨텐츠 로딩
async function loadPostDetail() {
    const detailContentArea = document.getElementById('detail-content-area');
    if (!detailContentArea || !document.body.classList.contains('page-detail')) return;

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
        detailContentArea.innerHTML = '<p style="text-align:center; color:red;">잘못된 접근입니다.</p>';
        return;
    }

    detailContentArea.innerHTML = '<p style="text-align:center;">작품을 불러오는 중입니다...</p>';

    const data = await getSheetData();
    const post = data.find(p => p.id === postId);

    if (post) {
        const formattedBody = formatContent(post.content || '').replace(/\\n/g, '<br>');
        detailContentArea.innerHTML = `
            <article class="detail-post-article">
                <div class="detail-post-meta-area">
                    <h2 class="detail-post-title">${post.title}</h2>
                    <span class="detail-post-date">${post.date || ''}</span>
                </div>
                <div class="detail-post-body">
                    ${formattedBody}
                </div>
                <div style="text-align:center; margin-top:50px;">
                    <a href="index.html" style="font-weight:bold; text-decoration:underline;">목록으로 돌아가기</a>
                </div>
            </article>
        `;
    } else {
        detailContentArea.innerHTML = '<p style="text-align:center; color:red;">작품 정보를 찾을 수 없습니다.</p>';
    }
}

// 페이지 로드 시 실행
window.onload = () => {
    loadMainGallery();
    loadPostDetail();
};