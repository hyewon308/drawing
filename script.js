// script.js

// [중요] 사용 중인 구글 시트 CSV 링크를 여기에 붙여넣으세요 (끝이 pub?output=csv 인지 확인!)
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTaexlDP6OM2RS7etcnYNiazJXyohbieidwYddAFyRefSF-tAg7yJywDp3P3QL5P7ibQl58ZDPVquSq/pub?gid=0&single=true&output=csv'; 

// --- 공통: 오버레이 메뉴 토글 로직 ---
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const closeOverlayBtn = document.getElementById('close-overlay-btn'); // 오버레이 전용 'X' 닫기 버튼
const menuOverlayArea = document.getElementById('menu-overlay-area');

function toggleMenu() {
    document.body.classList.toggle('menu-open');
}

if (menuToggleBtn && closeOverlayBtn && menuOverlayArea) {
    menuToggleBtn.addEventListener('click', toggleMenu);
    closeOverlayBtn.addEventListener('click', toggleMenu); // 오버레이 'X'로 닫기
    
    // 오버레이 배경 클릭 시에도 닫기
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
        // 첫 줄(헤더) 제외하고 데이터 자르기
        const rows = csvData.split('\n').slice(1);
        return rows.map(row => row.split(',').map(col => col.trim()));
    } catch (error) {
        console.error('데이터 페칭 오류:', error);
        return [];
    }
}

// 1. [메인 페이지] 조밀한 불규칙 갤러리 로딩 (클릭 가능하게)
async function loadMainGallery() {
    if (!galleryFeed) return;
    
    galleryFeed.innerHTML = '<p style="text-align:center; width:100%; grid-column: 1 / -1;">데이터를 불러오는 중입니다...</p>';
    
    const rowsData = await fetchAndParseCSV();
    galleryFeed.innerHTML = ''; // 로딩 메시지 지우기

    rowsData.forEach((columns, index) => {
        if (columns.length < 2) return;

        const title = columns[0];
        const imageUrl = columns[1];
        // 날짜 데이터 가져오기 (C열)
        const date = columns[2] ? columns[2] : ''; 

        if(imageUrl) {
            const article = document.createElement('article');
            // [핵심] 클릭 가능한 상세 페이지 링크 추가 (post.html?id=행번호)
            // ugly purple links 제거를 위해 `<a>`에 직접 스타일 적용 대신 script.js에서 article 태그에 `post-article-card` 클래스 부여
            // script.js에 style.css의 .post-article-card {display:block} 가 적용되도록 article 태그의 innerHTML을 수정
            article.innerHTML = `
                <a href="post.html?id=${index + 2}" class="post-article-card">
                    <img src="${imageUrl}" alt="${title}" class="post-image-thumbnail">
                </a>
            `;
            galleryFeed.appendChild(article);
        }
    });
}

// 2. [상 상세 페이지] 동적 컨텐츠 로딩 (image_2.png 스타일)
async function loadPostDetail() {
    if (!detailContentArea || !document.body.classList.contains('page-detail')) return;

    // URL에서 포스트 ID 추출 (post.html?id=행번호)
    const urlParams = new URLSearchParams(window.location.search);
    const postId = parseInt(urlParams.get('id'));

    if (!postId || isNaN(postId)) {
        detailContentArea.innerHTML = '<p style="text-align:center; color:red;">잘못된 접근입니다.</p>';
        return;
    }

    detailContentArea.innerHTML = '<p style="text-align:center;">작품을 불러오는 중입니다...</p>';

    const rowsData = await fetchAndParseCSV();
    
    // ID에 해당하는 데이터 가져오기 (배열 인덱스 = postId - 2)
    const columns = rowsData[postId - 2];
    detailContentArea.innerHTML = ''; // 로딩 메시지 지우기

    if (columns && columns.length >= 2) {
        const title = columns[0];
        const imageUrl = columns[1];
        // [수정] 날짜 데이터 (C열) 및 본문 데이터 (D열) 추가
        const date = columns[2] ? columns[2] : ''; 
        const content = columns[3] ? columns[3] : ''; 

        if(imageUrl) {
            // HTML 구조 생성 (image_2.png 스타일)
            detailContentArea.innerHTML = `
                <article class="detail-post-article">
                    <img src="${imageUrl}" alt="${title}" class="detail-post-image">
                    
                    <div class="detail-post-meta-area">
                        <h2 class="detail-post-title">${title}</h2>
                        <span class="detail-post-date">${date}</span>
                    }

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