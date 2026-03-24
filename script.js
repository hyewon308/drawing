// script.js
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTaexlDP6OM2RS7etcnYNiazJXyohbieidwYddAFyRefSF-tAg7yJywDp3P3QL5P7ibQl58ZDPVquSq/pub?gid=0&single=true&output=csv'; 

// 메뉴 토글
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const menuOverlayArea = document.getElementById('menu-overlay-area');
if (menuToggleBtn) {
    menuToggleBtn.onclick = () => document.body.classList.toggle('menu-open');
}

// 이미지 주소를 <img> 태그로 변환
function formatContent(text) {
    if (!text) return '';
    const imageRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))/gi;
    return text.replace(imageRegex, '<img src="$1" class="in-content-image">');
}

// 정밀 CSV 파서
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
    
    galleryFeed.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">데이터 로딩 중...</p>';
    
    try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        const data = parseCSV(await response.text());
        galleryFeed.innerHTML = ''; 

        data.forEach((cols, idx) => {
            if (!cols[1]) return;
            const article = document.createElement('article');
            article.innerHTML = `
                <a href="post.html?id=${idx + 2}" class="post-article-card">
                    <img src="${cols[1]}" alt="${cols[0]}" class="post-image-thumbnail">
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
    detailArea.innerHTML = '<p style="text-align:center;">작품 로딩 중...</p>';

    try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        const data = parseCSV(await response.text());
        const post = data[parseInt(postId) - 2];

        if (post) {
            const body = formatContent(post[3]).replace(/\\n/g, '<br>');
            detailArea.innerHTML = `
                <article>
                    <img src="${post[1]}" alt="${post[0]}" class="detail-post-image">
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