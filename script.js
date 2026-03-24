// script.js

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTaexlDP6OM2RS7etcnYNiazJXyohbieidwYddAFyRefSF-tAg7yJywDp3P3QL5P7ibQl58ZDPVquSq/pub?gid=0&single=true&output=csv'; 

// --- 공통: 오버레이 메뉴 토글 로직 ---
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const menuOverlayArea = document.getElementById('menu-overlay-area');

function toggleMenu() {
    document.body.classList.toggle('menu-open');
}

if (menuToggleBtn && menuOverlayArea) {
    menuToggleBtn.addEventListener('click', toggleMenu);
    
    // 오버레이 빈 배경 클릭 시에만 닫기
    menuOverlayArea.addEventListener('click', (e) => {
        if (e.target === menuOverlayArea) {
            toggleMenu();
        }
    });
}

// --- 페이지별 로직 구분 ---
const galleryFeed = document.getElementById('gallery-feed');
const detailContentArea = document.getElementById('detail-content-area');

async function fetchAndParseCSV() {
    try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        const csvData = await response.text();
        const rows = csvData.split('\n').slice(1);
        return rows.map(row => row.split(',').map(col => col.trim()));
    } catch (error) {
        console.error('데이터 페칭 오류:', error);
        return [];
    }
}

// 1. [메인 페이지] 갤러리 로딩
async function loadMainGallery() {
    if (!galleryFeed) return;
    
    galleryFeed.innerHTML = '<p style="text-align:center; width:100%; grid-column: 1 / -1;">데이터를 불러오는 중입니다...</p>';
    
    const rowsData = await fetchAndParseCSV();
    galleryFeed.innerHTML = ''; 

    rowsData.forEach((columns, index) => {
        if (columns.length < 2) return;

        const title = columns[0];
        const imageUrl = columns[1];

        if(imageUrl) {
            const article = document.createElement('article');
            article.innerHTML = `
                <a href="post.html?id=${index + 2}" class="post-article-card">
                    <img src="${imageUrl}" alt="${title}" class="post-image-thumbnail">
                </a>
            `;
            galleryFeed.appendChild(article);
        }
    });
}

// 2. [상세 페이지] 동적 컨텐츠 로딩
async function loadPostDetail() {
    if (!detailContentArea || !document.body.classList.contains('page-detail')) return;

    const urlParams = new URLSearchParams(window.location.search);
    const postId = parseInt(urlParams.get('id'));

    if (!postId || isNaN(postId)) {
        detailContentArea.innerHTML = '<p style="text-align:center; color:red;">잘못된 접근입니다.</p>';
        return;
    }

    detailContentArea.innerHTML = '<p style="text-align:center;">작품을 불러오는 중입니다...</p>';

    const rowsData = await fetchAndParseCSV();
    const columns = rowsData[postId - 2];
    detailContentArea.innerHTML = ''; 

    if (columns && columns.length >= 2) {
        const title = columns[0];
        const imageUrl = columns[1];
        const date = columns[2] ? columns[2] : ''; 
        const content = columns[3] ? columns[3] : ''; 

        if(imageUrl) {
            // [수정사항] <span class="detail-post-date">${date}</span> 뒤의 오타(})를 없애고 올바르게 </div>로 닫았습니다.
            detailContentArea.innerHTML = `
                <article class="detail-post-article">
                    <img src="${imageUrl}" alt="${title}" class="detail-post-image">
                    
                    <div class="detail-post-meta-area">
                        <h2 class="detail-post-title">${title}</h2>
                        <span class="detail-post-date">${date}</span>
                    </div>

                    <div class="detail-post-body">
                        ${content.replace(/\\n/g, '<br>')}
                    </div>
                </article>
            `;
        }
    } else {
        detailContentArea.innerHTML = '<p style="text-align:center; color:red;">작품 정보를 찾을 수 없습니다.</p>';
    }
}

// 페이지 로드 시 실행
loadMainGallery();
loadPostDetail();