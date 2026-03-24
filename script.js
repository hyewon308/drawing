// script.js
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTaexlDP6OM2RS7etcnYNiazJXyohbieidwYddAFyRefSF-tAg7yJywDp3P3QL5P7ibQl58ZDPVquSq/pub?gid=0&single=true&output=csv'; 

// 메뉴 토글 (오버레이 작동용)
const menuToggleBtn = document.getElementById('menu-toggle-btn');
if (menuToggleBtn) {
    menuToggleBtn.onclick = () => document.body.classList.toggle('menu-open');
}

// 오버레이 클릭 시 닫기
const menuOverlayArea = document.getElementById('menu-overlay-area');
if (menuOverlayArea) {
    menuOverlayArea.onclick = (e) => {
        if (e.target === menuOverlayArea) document.body.classList.remove('menu-open');
    };
}

// 본문 이미지 주소 자동 인식 및 깃허브 주소 변환
function formatContent(text) {
    if (!text) return '';
    const imageRegex = /(https?:\/\/[^\s\n]*\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?[^\s\n]*)?)/gi;
    return text.replace(imageRegex, (url) => {
        let dUrl = url;
        if (dUrl.includes('github.com') && dUrl.includes('/blob/')) {
            dUrl = dUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/').split('?')[0];
        }
        return `<img src="${dUrl}" class="in-content-image">`;
    });
}

function parseCSV(text) {
    const rows = []; let row = []; let cell = ''; let isQ = false;
    for (let i = 0; i < text.length; i++) {
        let c = text[i], next = text[i+1];
        if (c === '"' && isQ && next === '"') { cell += '"'; i++; }
        else if (c === '"') { isQ = !isQ; }
        else if (c === ',' && !isQ) { row.push(cell); cell = ''; }
        else if (c === '\n' && !isQ) { row.push(cell); rows.push(row); row = []; cell = ''; }
        else { cell += c; }
    }
    if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); }
    return rows.slice(1).map(r => r.map(c => c.trim()));
}

async function loadMainGallery() {
    const feed = document.getElementById('gallery-feed');
    if (!feed) return;
    try {
        const res = await fetch(GOOGLE_SHEET_CSV_URL);
        const data = parseCSV(await res.text());
        feed.innerHTML = ''; 
        data.reverse().forEach((cols, idx) => {
            if (!cols[1]) return;
            let thumb = cols[1].replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/').split('?')[0];
            const art = document.createElement('article');
            art.innerHTML = `<a href="post.html?id=${data.length - idx + 1}"><img src="${thumb}" class="post-image-thumbnail"></a>`;
            feed.appendChild(art);
        });
    } catch (e) { console.error(e); }
}

async function loadPostDetail() {
    const area = document.getElementById('detail-content-area');
    if (!area) return;
    const postId = new URLSearchParams(window.location.search).get('id');
    try {
        const res = await fetch(GOOGLE_SHEET_CSV_URL);
        const data = parseCSV(await res.text());
        const post = data[parseInt(postId) - 2];
        if (post) {
            const body = formatContent(post[3]).replace(/\\n/g, '<br>');
            let img = post[1].replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/').split('?')[0];
            area.innerHTML = `
                <article class="detail-post-article">
                    <img src="${img}" class="detail-post-image">
                    <div class="detail-post-meta-area">
                        <h2 class="detail-post-title">${post[0]}</h2>
                        <span class="detail-post-date">${post[2] || ''}</span>
                    </div>
                    <div class="detail-post-body">${body}</div>
                </article>`;
        }
    } catch (e) { console.error(e); }
}

window.onload = () => { loadMainGallery(); loadPostDetail(); };