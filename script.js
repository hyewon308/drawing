// script.js

// 1. 사용자님의 정확한 DB 주소
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTaexlDP6OM2RS7etcnYNiazJXyohbieidwYddAFyRefSF-tAg7yJywDp3P3QL5P7ibQl58ZDPVquSq/pub?gid=0&single=true&output=csv'; 

// --- 메뉴 토글 로직 ---
const menuToggleBtn = document.getElementById('menu-toggle-btn');
if (menuToggleBtn) {
    menuToggleBtn.onclick = () => document.body.classList.toggle('menu-open');
}

// --- [강력해진] 이미지 변환 함수 ---
function formatContent(text) {
    if (!text) return '';

    // 1. 주소 뒤에 옵션(?raw=true 등)이 붙어도 끝까지 인식하도록 규칙 수정
    const imageRegex = /(https?:\/\/[^\s\n]*\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?[^\s\n]*)?)/gi;

    return text.replace(imageRegex, (url) => {
        let directUrl = url;
        
        // 2. [자동 변환 기능] 깃허브 일반 주소를 넣었을 경우 '진짜 이미지 주소'로 교체
        if (directUrl.includes('github.com') && directUrl.includes('/blob/')) {
            directUrl = directUrl
                .replace('github.com', 'raw.githubusercontent.com')
                .replace('/blob/', '/')
                .split('?')[0]; // ?raw=true 같은 옵션은 이제 필요 없으므로 제거
        }
        
        return `<img src="${directUrl}" class="in-content-image">`;
    });
}

// --- CSV 파서 (데이터 밀림 방지) ---
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
    return rows.slice(1).map(r => r.map(c => c.trim()));
}

// [메인] 갤러리 로딩
async function loadMainGallery() {
    const galleryFeed = document.getElementById('gallery-feed');
    if (!galleryFeed) return;
    galleryFeed.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">작품을 불러오는 중...</p>';
    
    try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        const data = parseCSV(await response.text());
        galleryFeed.innerHTML = ''; 

        data.reverse().forEach((cols, idx) => {
            if (!cols[1]) return;
            const article = document.createElement('article');
            article.className = 'post-card';
            // 썸네일 주소도 자동 변환 적용
            let thumbUrl = cols[1].replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/').split('?')[0];
            
            article.innerHTML = `
                <a href="post.html?id=${data.length - idx + 1}" class="post-article-card">
                    <img src="${thumbUrl}" alt="${cols[0]}" class="post-image-thumbnail">
                </a>`;
            galleryFeed.appendChild(article);
        });
    } catch (e) { console.error(e); }
}

// [상세] 내용 로딩
async function loadPostDetail() {
    const detailArea = document.getElementById('detail-content-area');
    if (!detailArea) return;

    const postId = new URLSearchParams(window.location.search).get('id');
    detailArea.innerHTML = '<p style="text-align:center;">작품 정보를 불러오는 중...</p>';

    try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        const data = parseCSV(await response.text());
        const post = data[parseInt(postId) - 2];

        if (post) {
            const body = formatContent(post[3]).replace(/\\n/g, '<br>');
            let mainImg = post[1].replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/').split('?')[0];
            
            detailArea.innerHTML = `
                <article class="detail-post-article">
                    <img src="${mainImg}" alt="${post[0]}" class="detail-post-image">
                    <div class="detail-post-meta-area">
                        <h2 class="detail-post-title">${post[0]}</h2>
                        <span class="detail-post-date">${post[2] || ''}</span>
                    </div>
                    <div class="detail-post-body">${body}</div>
                </article>`;
        }
    } catch (e) { console.error(e); }
}

window.onload = () => {
    loadMainGallery();
    loadPostDetail();
};