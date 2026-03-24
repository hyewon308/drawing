// script.js

// 1. 요청하신 정확한 DB 주소로 교체 완료
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTaexlDP6OM2RS7etcnYNiazJXyohbieidwYddAFyRefSF-tAg7yJywDp3P3QL5P7ibQl58ZDPVquSq/pub?gid=0&single=true&output=csv'; 

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

// --- 핵심: 본문 내 이미지 주소를 <img> 태그로 자동 변환 ---
function formatContent(text) {
    if (!text) return '';
    // http로 시작하고 이미지 확장자로 끝나는 주소를 찾아서 태그로 변환
    const imageRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))/gi;
    return text.replace(imageRegex, '<img src="$1" class="detail-post-image" style="max-width:100%; display:block; margin:20px auto;">');
}

// --- 정밀 CSV 파서 (본문 내 쉼표 무시) ---
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
    return rows.slice(1); // 첫 줄(헤더) 제외
}

// 1. [메인 페이지] 갤러리 로딩
async function loadMainGallery() {
    const galleryFeed = document.getElementById('gallery-feed');
    if (!galleryFeed) return;
    
    galleryFeed.innerHTML = '<p style="text-align:center; width:100%; grid-column: 1 / -1;">데이터를 불러오는 중입니다...</p>';
    
    try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        const csvData = await response.text();
        const rowsData = parseCSV(csvData);
        galleryFeed.innerHTML = ''; 

        rowsData.forEach((columns, index) => {
            if (columns.length < 2) return;
            const title = columns[0];
            const imageUrl = columns[1];
            // ID가 없으면 행 번호(index + 2)를 ID로 사용
            const postId = index + 2;

            if(imageUrl) {
                const article = document.createElement('article');
                article.innerHTML = `
                    <a href="post.html?id=${postId}" class="post-article-card">
                        <img src="${imageUrl}" alt="${title}" class="post-image-thumbnail">
                    </a>
                `;
                galleryFeed.appendChild(article);
            }
        });
    } catch (e) { console.error('에러 발생:', e); }
}

// 2. [상세 페이지] 동적 컨텐츠 로딩
async function loadPostDetail() {
    const detailContentArea = document.getElementById('detail-content-area');
    if (!detailContentArea || !document.body.classList.contains('page-detail')) return;

    const urlParams = new URLSearchParams(window.location.search);
    const postId = parseInt(urlParams.get('id'));

    detailContentArea.innerHTML = '<p style="text-align:center;">작품을 불러오는 중입니다...</p>';

    try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        const csvData = await response.text();
        const rowsData = parseCSV(csvData);
        
        // 해당 행(postId - 2) 가져오기
        const columns = rowsData[postId - 2];
        detailContentArea.innerHTML = ''; 

        if (columns) {
            const title = columns[0];
            const imageUrl = columns[1];
            const date = columns[2] || ''; 
            const content = columns[3] || ''; 

            // 본문 이미지 자동 변환 적용
            const formattedBody = formatContent(content).replace(/\\n/g, '<br>');

            detailContentArea.innerHTML = `
                <article class="detail-post-article">
                    <img src="${imageUrl}" alt="${title}" class="detail-post-image">
                    <div class="detail-post-meta-area">
                        <h2 class="detail-post-title">${title}</h2>
                        <span class="detail-post-date">${date}</span>