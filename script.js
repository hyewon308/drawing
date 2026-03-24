// [주의] 작은따옴표 안에 구글 시트 '웹에 게시' CSV 링크를 붙여넣으세요
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTaexlDP6OM2RS7etcnYNiazJXyohbieidwYddAFyRefSF-tAg7yJywDp3P3QL5P7ibQl58ZDPVquSq/pub?gid=0&single=true&output=csv'; 

const galleryFeed = document.getElementById('gallery-feed');

async function fetchGalleryData() {
    try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        const csvData = await response.text();
        const rows = csvData.split('\n').slice(1); // 첫 줄 제외

        rows.forEach((row, index) => {
            // 내용에 쉼표가 있을 수 있으므로 정규식으로 안전하게 분리
            const columns = row.split(',').map(col => col.trim());
            
            // 데이터가 유효한지 확인 (제목과 이미지만 사용)
            if (columns.length < 2) return;

            const title = columns[0];
            const imageUrl = columns[1];

            // 이미지가 있을 때만 화면에 출력
            if(imageUrl) {
                const article = document.createElement('article');
                article.className = 'post-article';
                
                article.innerHTML = `
                    <img src="${imageUrl}" alt="${title}" class="post-image">
                `;
                
                galleryFeed.appendChild(article);
            }
        });
    } catch (error) {
        console.error('데이터를 불러오는 중 오류 발생:', error);
    }
}

fetchGalleryData();