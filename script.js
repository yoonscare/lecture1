// 강의 데이터를 저장할 배열
let lectures = JSON.parse(localStorage.getItem('lectures')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || [
    'programming', 'design', 'business', 'language'
];

// DOM 요소들
const lecturesGrid = document.getElementById('lecturesGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortBy = document.getElementById('sortBy');
const addLectureForm = document.getElementById('addLectureForm');
const modal = document.getElementById('lectureModal');
const modalContent = document.getElementById('modalContent');
const closeModal = document.querySelector('.close-modal');

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    loadLectures();
    updateStatistics();
    updateCategoryStats();
    initializeEventListeners();
    
    // 샘플 데이터 추가 (처음 사용 시)
    if (lectures.length === 0) {
        addSampleData();
    }
});

// 이벤트 리스너 초기화
function initializeEventListeners() {
    // 탭 네비게이션
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // 검색 및 필터
    searchInput.addEventListener('input', filterLectures);
    categoryFilter.addEventListener('change', filterLectures);
    sortBy.addEventListener('change', filterLectures);

    // 강의 추가 폼
    addLectureForm.addEventListener('submit', handleAddLecture);

    // 모달 닫기
    closeModal.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

// 탭 전환 함수
function switchTab(tabName) {
    // 모든 탭 콘텐츠 숨기기
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // 모든 탭 버튼 비활성화
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // 선택된 탭 표시
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // 통계 탭이 선택되면 차트 업데이트
    if (tabName === 'statistics') {
        updateStatistics();
        drawCategoryChart();
    }
}

// 강의 목록 로드
function loadLectures() {
    lecturesGrid.innerHTML = '';
    
    const filteredLectures = getFilteredLectures();
    
    if (filteredLectures.length === 0) {
        lecturesGrid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">등록된 강의가 없습니다.</p>';
        return;
    }

    filteredLectures.forEach(lecture => {
        const card = createLectureCard(lecture);
        lecturesGrid.appendChild(card);
    });
}

// 강의 카드 생성
function createLectureCard(lecture) {
    const card = document.createElement('div');
    card.className = 'lecture-card';
    card.innerHTML = `
        <div class="lecture-thumbnail" style="background: ${lecture.thumbnail || getRandomGradient()}">
            ${!lecture.thumbnail ? `<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 3rem;">📚</div>` : `<img src="${lecture.thumbnail}" alt="${lecture.title}" style="width: 100%; height: 100%; object-fit: cover;">`}
        </div>
        <div class="lecture-info">
            <span class="lecture-category">${getCategoryName(lecture.category)}</span>
            <h3 class="lecture-title">${lecture.title}</h3>
            <p class="lecture-instructor">강사: ${lecture.instructor}</p>
            <div class="lecture-meta">
                <span class="lecture-duration">
                    ⏱️ ${lecture.duration}분
                </span>
                <div class="lecture-actions">
                    <button class="btn-icon" onclick="viewLecture('${lecture.id}')" title="상세보기">👁️</button>
                    <button class="btn-icon" onclick="editLecture('${lecture.id}')" title="수정">✏️</button>
                    <button class="btn-icon" onclick="deleteLecture('${lecture.id}')" title="삭제">🗑️</button>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// 필터링된 강의 목록 가져오기
function getFilteredLectures() {
    let filtered = [...lectures];
    
    // 검색어 필터
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(lecture => 
            lecture.title.toLowerCase().includes(searchTerm) ||
            lecture.instructor.toLowerCase().includes(searchTerm) ||
            lecture.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // 카테고리 필터
    const category = categoryFilter.value;
    if (category) {
        filtered = filtered.filter(lecture => lecture.category === category);
    }
    
    // 정렬
    const sort = sortBy.value;
    switch(sort) {
        case 'date':
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'name':
            filtered.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'popular':
            filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
    }
    
    return filtered;
}

// 강의 필터링
function filterLectures() {
    loadLectures();
}

// 강의 추가 처리
function handleAddLecture(e) {
    e.preventDefault();
    
    const lecture = {
        id: generateId(),
        title: document.getElementById('lectureTitle').value,
        instructor: document.getElementById('lectureInstructor').value,
        category: document.getElementById('lectureCategory').value,
        duration: parseInt(document.getElementById('lectureDuration').value),
        description: document.getElementById('lectureDescription').value,
        content: document.getElementById('lectureContent').value,
        thumbnail: document.getElementById('lectureThumbnail').value,
        createdAt: new Date().toISOString(),
        views: 0
    };
    
    lectures.push(lecture);
    saveLectures();
    
    // 폼 초기화
    addLectureForm.reset();
    
    // 알림 표시
    showAlert('강의가 성공적으로 추가되었습니다!', 'success');
    
    // 강의 목록 탭으로 전환
    switchTab('lectures');
    loadLectures();
    updateStatistics();
    updateCategoryStats();
}

// 강의 상세보기
function viewLecture(id) {
    const lecture = lectures.find(l => l.id === id);
    if (!lecture) return;
    
    // 조회수 증가
    lecture.views = (lecture.views || 0) + 1;
    saveLectures();
    
    modalContent.innerHTML = `
        <h2>${lecture.title}</h2>
        <div style="margin: 20px 0;">
            <span class="lecture-category">${getCategoryName(lecture.category)}</span>
            <span style="margin-left: 15px; color: #666;">👁️ ${lecture.views}회 조회</span>
        </div>
        <p><strong>강사:</strong> ${lecture.instructor}</p>
        <p><strong>강의 시간:</strong> ${lecture.duration}분</p>
        <p><strong>등록일:</strong> ${new Date(lecture.createdAt).toLocaleDateString('ko-KR')}</p>
        
        <h3 style="margin-top: 30px;">강의 설명</h3>
        <p style="line-height: 1.8; color: #555;">${lecture.description}</p>
        
        ${lecture.content ? `
            <h3 style="margin-top: 30px;">강의 내용</h3>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; white-space: pre-wrap; line-height: 1.8;">
                ${lecture.content}
            </div>
        ` : ''}
        
        <div style="margin-top: 30px; display: flex; gap: 15px;">
            <button class="btn btn-primary" onclick="startLecture('${lecture.id}')">강의 시작</button>
            <button class="btn btn-secondary" onclick="editLecture('${lecture.id}')">수정</button>
            <button class="btn btn-danger" onclick="deleteLecture('${lecture.id}')">삭제</button>
        </div>
    `;
    
    modal.classList.add('show');
}

// 강의 수정
function editLecture(id) {
    const lecture = lectures.find(l => l.id === id);
    if (!lecture) return;
    
    // 수정 폼으로 데이터 채우기
    document.getElementById('lectureTitle').value = lecture.title;
    document.getElementById('lectureInstructor').value = lecture.instructor;
    document.getElementById('lectureCategory').value = lecture.category;
    document.getElementById('lectureDuration').value = lecture.duration;
    document.getElementById('lectureDescription').value = lecture.description;
    document.getElementById('lectureContent').value = lecture.content || '';
    document.getElementById('lectureThumbnail').value = lecture.thumbnail || '';
    
    // 기존 강의 삭제 (수정 완료 시 새로 추가)
    lectures = lectures.filter(l => l.id !== id);
    saveLectures();
    
    // 수정 탭으로 전환
    switchTab('add');
    modal.classList.remove('show');
    
    showAlert('강의 정보를 수정하고 다시 추가해주세요.', 'info');
}

// 강의 삭제
function deleteLecture(id) {
    if (!confirm('정말로 이 강의를 삭제하시겠습니까?')) return;
    
    lectures = lectures.filter(l => l.id !== id);
    saveLectures();
    
    loadLectures();
    updateStatistics();
    updateCategoryStats();
    modal.classList.remove('show');
    
    showAlert('강의가 삭제되었습니다.', 'success');
}

// 강의 시작
function startLecture(id) {
    const lecture = lectures.find(l => l.id === id);
    if (!lecture) return;
    
    showAlert(`"${lecture.title}" 강의를 시작합니다...`, 'info');
    
    // 여기에 실제 강의 재생 로직 추가 가능
    // 예: 비디오 플레이어 열기, PDF 뷰어 열기 등
}

// 카테고리 추가
function addCategory() {
    const input = document.getElementById('newCategoryName');
    const categoryName = input.value.trim();
    
    if (!categoryName) {
        showAlert('카테고리 이름을 입력해주세요.', 'error');
        return;
    }
    
    const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');
    
    if (categories.includes(categoryId)) {
        showAlert('이미 존재하는 카테고리입니다.', 'error');
        return;
    }
    
    categories.push(categoryId);
    localStorage.setItem('categories', JSON.stringify(categories));
    
    // 카테고리 필터 업데이트
    updateCategoryFilters();
    updateCategoryStats();
    
    input.value = '';
    showAlert('카테고리가 추가되었습니다.', 'success');
}

// 카테고리 필터 업데이트
function updateCategoryFilters() {
    const filters = document.querySelectorAll('#categoryFilter, #lectureCategory');
    
    filters.forEach(filter => {
        const currentValue = filter.value;
        filter.innerHTML = '<option value="">모든 카테고리</option>';
        
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = getCategoryName(cat);
            filter.appendChild(option);
        });
        
        filter.value = currentValue;
    });
}

// 통계 업데이트
function updateStatistics() {
    // 전체 강의 수
    document.getElementById('totalLectures').textContent = lectures.length;
    
    // 총 강의 시간
    const totalDuration = lectures.reduce((sum, lecture) => sum + lecture.duration, 0);
    document.getElementById('totalDuration').textContent = `${totalDuration}분`;
    
    // 강사 수
    const instructors = new Set(lectures.map(l => l.instructor));
    document.getElementById('totalInstructors').textContent = instructors.size;
    
    // 카테고리 수
    document.getElementById('totalCategories').textContent = categories.length;
}

// 카테고리별 통계 업데이트
function updateCategoryStats() {
    const stats = {};
    categories.forEach(cat => {
        stats[cat] = lectures.filter(l => l.category === cat).length;
    });
    
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        if (index < categories.length) {
            const category = categories[index];
            card.querySelector('h3').textContent = getCategoryName(category);
            card.querySelector('.stat-number').textContent = stats[category] || 0;
        }
    });
}

// 카테고리 차트 그리기
function drawCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const stats = {};
    
    categories.forEach(cat => {
        stats[cat] = lectures.filter(l => l.category === cat).length;
    });
    
    // 간단한 막대 차트 그리기
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = 300;
    const barWidth = width / categories.length * 0.6;
    const maxValue = Math.max(...Object.values(stats), 1);
    
    ctx.clearRect(0, 0, width, height);
    
    categories.forEach((cat, index) => {
        const value = stats[cat] || 0;
        const barHeight = (value / maxValue) * (height - 60);
        const x = (width / categories.length) * index + (width / categories.length - barWidth) / 2;
        const y = height - barHeight - 40;
        
        // 막대 그리기
        const gradient = ctx.createLinearGradient(0, y, 0, height - 40);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // 카테고리 이름
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(getCategoryName(cat), x + barWidth / 2, height - 20);
        
        // 값 표시
        ctx.fillStyle = '#666';
        ctx.fillText(value, x + barWidth / 2, y - 10);
    });
}

// 유틸리티 함수들
function generateId() {
    return 'lecture-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function getCategoryName(category) {
    const names = {
        'programming': '프로그래밍',
        'design': '디자인',
        'business': '비즈니스',
        'language': '어학'
    };
    return names[category] || category;
}

function getRandomGradient() {
    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
}

function saveLectures() {
    localStorage.setItem('lectures', JSON.stringify(lectures));
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// 샘플 데이터 추가
function addSampleData() {
    const sampleLectures = [
        {
            id: generateId(),
            title: 'JavaScript 기초부터 심화까지',
            instructor: '김개발',
            category: 'programming',
            duration: 120,
            description: 'JavaScript의 기본 문법부터 고급 기능까지 배우는 완벽한 강의입니다. ES6+ 문법, 비동기 프로그래밍, DOM 조작 등을 다룹니다.',
            content: '1. JavaScript 소개\n2. 변수와 자료형\n3. 함수와 스코프\n4. 객체와 배열\n5. ES6+ 문법\n6. 비동기 프로그래밍\n7. DOM 조작\n8. 이벤트 처리',
            createdAt: new Date().toISOString(),
            views: 150
        },
        {
            id: generateId(),
            title: 'UI/UX 디자인 마스터클래스',
            instructor: '이디자인',
            category: 'design',
            duration: 90,
            description: '사용자 경험을 중심으로 한 모던 디자인 기법을 배웁니다. Figma, Adobe XD 등의 도구 활용법도 포함됩니다.',
            content: '1. UX 디자인 원칙\n2. 사용자 리서치\n3. 와이어프레임 제작\n4. 프로토타이핑\n5. Figma 실습\n6. 디자인 시스템 구축',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            views: 230
        },
        {
            id: generateId(),
            title: '스타트업 창업 가이드',
            instructor: '박비즈니스',
            category: 'business',
            duration: 180,
            description: '아이디어 발굴부터 사업계획서 작성, 투자 유치까지 스타트업 창업의 모든 것을 다룹니다.',
            content: '1. 창업 아이디어 발굴\n2. 시장 조사와 분석\n3. 비즈니스 모델 수립\n4. 사업계획서 작성\n5. 투자 유치 전략\n6. 팀 빌딩\n7. 마케팅 전략',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            views: 89
        },
        {
            id: generateId(),
            title: '비즈니스 영어 회화',
            instructor: '최영어',
            category: 'language',
            duration: 60,
            description: '실무에서 바로 사용할 수 있는 비즈니스 영어 표현을 학습합니다. 이메일, 프레젠테이션, 회의 영어를 마스터하세요.',
            content: '1. 비즈니스 이메일 작성법\n2. 전화 영어\n3. 회의 진행 영어\n4. 프레젠테이션 스킬\n5. 협상 영어\n6. 네트워킹 표현',
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            views: 175
        }
    ];
    
    lectures = sampleLectures;
    saveLectures();
    loadLectures();
    updateStatistics();
    updateCategoryStats();
}