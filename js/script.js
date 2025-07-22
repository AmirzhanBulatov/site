// В самом начале скрипта, после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    switchLanguage('kz');
    loadCars(); // Загружаем автомобили из Firebase
    
    // Проверяем, есть ли сохраненные избранные в localStorage
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
        favorites = JSON.parse(savedFavorites);
    }
});

// Обновим функцию toggleFavorite для сохранения в localStorage
function toggleFavorite(carId, event) {
    event.stopPropagation();
    
    if (favorites.includes(carId)) {
        favorites = favorites.filter(id => id !== carId);
    } else {
        favorites.push(carId);
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    renderCars();
    renderFavorites();
}

// Заменим статический массив carsData на загрузку из Firestore
let carsData = [];
let favorites = [];
let filteredCars = [];

// Функция загрузки автомобилей из Firestore
async function loadCars() {
    const grid = document.getElementById('carsGrid');
    grid.innerHTML = '<div class="loading">Загрузка автомобилей...</div>';

    try {
        const querySnapshot = await db.collection("cars").get();
        if (querySnapshot.empty) {
            console.warn("No cars found in Firestore");
            return;
        }
        
        carsData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                brand: data.brand || "Unknown",
                model: data.model || "Unknown",
                name: data.name || `${data.brand || ''} ${data.model || ''}`.trim(),
                description: data.description || "Описание отсутствует",
                price: data.price || 0,
                year: data.year || new Date().getFullYear(),
                address: data.address || "Адрес не указан",
                body: data.body || "Не указан",
                customs: data.customs || "нет",
                drive: data.drive || "Не указан",
                engine: data.engine || "Не указан",
                fuel: data.fuel || "Не указан",
                color: data.color || "Не указан",
                mileage: data.mileage || "0",
                transmission: data.transmission || "Не указана",
                averagePrice: data.averagePrice || data.price || 0,
                images: data.images || [data.imageUrl || 'https://via.placeholder.com/300'],
                createdAt: data.createdAt?.toDate() || new Date()
            };
        });
        
        // Собираем уникальные бренды и модели
        brandsAndModels = {};
        carsData.forEach(car => {
            if (!brandsAndModels[car.brand]) {
                brandsAndModels[car.brand] = new Set();
            }
            brandsAndModels[car.brand].add(car.model);
        });
        
        // Обновляем фильтры
        updateBrandFilter();
        updateModelFilter();
        
        filteredCars = [...carsData];
        renderCars();
    } catch (error) {
        console.error("Ошибка загрузки автомобилей:", error);
        document.getElementById('carsGrid').innerHTML = `
            <div class="error-message">
                <p>Не удалось загрузить данные об автомобилях. Пожалуйста, попробуйте позже.</p>
                <button onclick="loadCars()">Попробовать снова</button>
            </div>
        `;
    }
}



function updateBrandFilter() {
    const brandFilter = document.getElementById('brandFilter');
    // Сохраняем текущее значение
    const currentValue = brandFilter.value;
    
    // Очищаем и добавляем только "Все марки"
    brandFilter.innerHTML = '<option value="" data-ru="Все марки" data-kz="Барлық маркалар">Все марки</option>';
    
    // Добавляем бренды из Firebase
    Object.keys(brandsAndModels).sort().forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        brandFilter.appendChild(option);
    });
    
    // Восстанавливаем выбранное значение, если оно есть
    if (currentValue && Array.from(brandFilter.options).some(opt => opt.value === currentValue)) {
        brandFilter.value = currentValue;
    }
}



// Функция сохранения автомобиля
async function saveCar(carData, imageFile) {
    try {
        let imageUrl = '';
        
        // Если есть файл изображения, загружаем его в Storage
        if (imageFile) {
            const storageRef = storage.ref(`car_images/${Date.now()}_${imageFile.name}`);
            const uploadTask = await storageRef.put(imageFile);
            imageUrl = await uploadTask.ref.getDownloadURL();
        }
        
        // Добавляем данные в Firestore
        const carRef = await db.collection("cars").add({
            ...carData,
            imageUrl: imageUrl || 'https://via.placeholder.com/300',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return carRef.id;
    } catch (error) {
        console.error("Ошибка сохранения автомобиля:", error);
        throw error;
    }
}

// Функция сохранения заявки
async function saveApplication(carId, applicationData) {
    try {
        await db.collection("applications").add({
            carId: carId,
            name: applicationData.name,
            phone: applicationData.phone,
            carName: applicationData.carName, // Добавляем название машины
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Ошибка сохранения заявки:", error);
        throw error;
    }
}

// ИСПРАВЛЕНА: Единственная функция showApplicationForm
function showApplicationForm(carId, carName) {
    const modal = document.getElementById('applicationModal');
    modal.setAttribute('data-car-id', carId);
    modal.setAttribute('data-car-name', carName);
    modal.style.display = 'block';
}

// Обновленный обработчик формы заявки
document.getElementById('applicationForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('applicantName').value;
    const phone = document.getElementById('applicantPhone').value;
    const carId = document.getElementById('applicationModal').getAttribute('data-car-id');
    const carName = document.getElementById('applicationModal').getAttribute('data-car-name') || 'Неизвестная модель';
    
    // ДОБАВЛЕНА: Отладочная информация
    console.log('Form submission data:', {
        name: name,
        phone: phone,
        carId: carId,
        carName: carName
    });
    
    if (!carId) {
        alert('Ошибка: не найден ID автомобиля. Пожалуйста, попробуйте еще раз.');
        return;
    }
    
    try {
        await saveApplication(carId, {
            name: name,
            phone: phone,
            carName: carName
        });
        
        alert(currentLanguage === 'kz' 
            ? 'Өтінім сәтті жіберілді! Жуық арада сізбен хабарласамыз.' 
            : 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.');
        
        closeModal();
        this.reset();
    } catch (error) {
        console.error('Error submitting application:', error);
        alert(currentLanguage === 'kz' 
            ? 'Қате орын алды. Өтінімді қайта жіберіңіз.' 
            : 'Произошла ошибка. Пожалуйста, попробуйте отправить заявку еще раз.');
    }
});

let currentLanguage = 'kz';

let brandsAndModels = {};

function switchLanguage(lang) {
    // Переключение активной кнопки языка
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if ((lang === 'ru' && btn.textContent === 'Русский') || 
            (lang === 'kz' && btn.textContent === 'Қазақша')) {
            btn.classList.add('active');
        }
    });

    // Обновление текстовых элементов
    document.querySelectorAll('[data-ru], [data-kz]').forEach(element => {
        if (lang === 'ru') {
            if (element.hasAttribute('data-ru')) {
                element.textContent = element.getAttribute('data-ru');
            }
            if (element.hasAttribute('placeholder-ru')) {
                element.setAttribute('placeholder', element.getAttribute('placeholder-ru'));
            }
        } else if (lang === 'kz') {
            if (element.hasAttribute('data-kz')) {
                element.textContent = element.getAttribute('data-kz');
            }
            if (element.hasAttribute('placeholder-kz')) {
                element.setAttribute('placeholder', element.getAttribute('placeholder-kz'));
            }
        }
    });

    currentLanguage = lang;
}

function updateModelFilter() {
    const brandFilter = document.getElementById('brandFilter');
    const modelFilter = document.getElementById('modelFilter');
    const selectedBrand = brandFilter.value;
    
    // Сохраняем текущее значение
    const currentValue = modelFilter.value;
    
    modelFilter.innerHTML = '<option value="" data-ru="Все модели" data-kz="Барлық үлгілер">Все модели</option>';
    
    if (selectedBrand && brandsAndModels[selectedBrand]) {
        // Сортируем модели перед добавлением
        Array.from(brandsAndModels[selectedBrand]).sort().forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelFilter.appendChild(option);
        });
    }
    
    // Восстанавливаем выбранное значение, если оно есть
    if (currentValue && Array.from(modelFilter.options).some(opt => opt.value === currentValue)) {
        modelFilter.value = currentValue;
    }
}

function applyFilters() {
    const brand = document.getElementById('brandFilter').value;
    const model = document.getElementById('modelFilter').value;
    const body = document.getElementById('bodyFilter').value;
    const customs = document.getElementById('customsFilter').value;
    const yearFrom = document.getElementById('yearFrom').value;
    const yearTo = document.getElementById('yearTo').value;

    filteredCars = carsData.filter(car => {
        return (!brand || car.brand === brand) &&
               (!model || car.model === model) &&
               (!body || car.body === body) &&
               (!customs || car.customs === customs) &&
               (!yearFrom || car.year >= parseInt(yearFrom)) &&
               (!yearTo || car.year <= parseInt(yearTo));
    });

    renderCars();
}

let currentSort = {
    type: null,
    order: 'asc'
};

function sortCars(type) {
    const buttons = document.querySelectorAll('.sort-btn');

    if (currentSort.type === type) {
        // Переключаем порядок
        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.type = type;
        currentSort.order = 'asc';
    }

    if (type === 'price') {
        filteredCars.sort((a, b) => currentSort.order === 'asc' ? a.price - b.price : b.price - a.price);
    } else if (type === 'year') {
        filteredCars.sort((a, b) => currentSort.order === 'asc' ? a.year - b.year : b.year - a.year);
    }

    // Обновляем стрелки
    buttons.forEach(btn => {
        const btnType = btn.getAttribute('data-type');
        const arrow = btn.querySelector('.arrow');
        if (btnType === currentSort.type) {
            arrow.innerHTML = currentSort.order === 'asc' ? '▲' : '▼';
        } else {
            arrow.innerHTML = '';
        }
    });

    renderCars();
}

// Глобальный объект для хранения состояний галереи
const galleryStates = {};

// ИСПРАВЛЕНА: Инициализация состояния галереи для каждого автомобиля
function initCarGallery(car) {
    if (!galleryStates[car.id]) {
        galleryStates[car.id] = {
            currentIndex: 0,
            images: car.images || [car.imageUrl || 'https://via.placeholder.com/300']
        };
    }
    return galleryStates[car.id];
}

function renderCars() {
    const grid = document.getElementById('carsGrid');
    grid.innerHTML = '';

    filteredCars.forEach(car => {
        const gallery = initCarGallery(car);
        const carCard = createCarCard(car, gallery);
        grid.appendChild(carCard);
    });
}

// ИСПРАВЛЕНА: Функция renderFavorites теперь правильно инициализирует галереи
function renderFavorites() {
    const grid = document.getElementById('favoritesGrid');
    const favoriteCars = carsData.filter(car => favorites.includes(car.id));
    
    if (favoriteCars.length === 0) {
        grid.innerHTML = '<p>Нет избранных автомобилей</p>';
        return;
    }

    grid.innerHTML = '';
    favoriteCars.forEach(car => {
        // Инициализация галереи для каждого автомобиля
        if (!galleryStates[car.id]) {
            galleryStates[car.id] = {
                currentIndex: 0,
                images: car.images || [car.imageUrl || 'https://via.placeholder.com/300']
            };
        }
        const gallery = galleryStates[car.id];
        
        const carCard = createCarCard(car, gallery);
        grid.appendChild(carCard);
    });
}

function createCarCard(car, gallery) {
    const carCard = document.createElement('div');
    carCard.className = 'car-card';
    
    carCard.innerHTML = `
        <div class="car-image-container" id="carImageContainer-${car.id}">
            <div class="car-image-slider" id="carImageSlider-${car.id}" 
                 style="transform: translateX(-${gallery.currentIndex * 100}%)">
                ${gallery.images.map(img => `
                    <div class="car-image-slide">
                        <img src="${img}" alt="${car.name}" onerror="this.src='https://via.placeholder.com/300'">
                    </div>
                `).join('')}
            </div>
            ${gallery.images.length > 1 ? `
                <div class="car-image-nav">
                    <button class="car-image-btn" onclick="event.stopPropagation(); prevCardImage('${car.id}')">❮</button>
                    <button class="car-image-btn" onclick="event.stopPropagation(); nextCardImage('${car.id}')">❯</button>
                </div>
                <div class="car-image-dots">
                    ${gallery.images.map((_, index) => `
                        <div class="car-image-dot ${index === gallery.currentIndex ? 'active' : ''}" 
                             onclick="event.stopPropagation(); goToCardImage('${car.id}', ${index})"></div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
         <div class="car-info">
            <h3 class="car-title">${car.name}</h3>
            <p class="car-description">${car.description}</p>
            <div class="car-details">
                <div class="car-detail">Год: ${car.year}</div>
                <div class="car-detail">Кузов: ${car.body}</div>
                <div class="car-detail">Адрес: ${car.address}</div>
                <div class="car-detail">Растаможен: ${car.customs}</div>
            </div>
            <div class="car-price">${car.price.toLocaleString()} ₸</div>
        </div>
        <button class="favorite-btn ${favorites.includes(car.id) ? 'active' : ''}" 
                onclick="toggleFavorite('${car.id}', event)">
            ❤️
        </button>
    `;
    
    carCard.addEventListener('click', () => showCarDetail(car));
    return carCard;
}

// ИСПРАВЛЕНА: Функция обновления галереи в карточках
function updateCardGallery(carId) {
    const gallery = galleryStates[carId];
    if (!gallery) {
        console.warn(`Gallery state not found for car ${carId}`);
        return;
    }
    
    const slider = document.getElementById(`carImageSlider-${carId}`);
    if (slider) {
        slider.style.transform = `translateX(-${gallery.currentIndex * 100}%)`;
    }
    
    const dots = document.querySelectorAll(`#carImageContainer-${carId} .car-image-dot`);
    dots.forEach((dot, index) => {
        if (dot) dot.classList.toggle('active', index === gallery.currentIndex);
    });
}

// ИСПРАВЛЕНЫ: Функции управления галереей с проверкой существования состояния
function nextCardImage(carId) {
    const gallery = galleryStates[carId];
    if (!gallery) {
        console.warn(`Gallery state not found for car ${carId}`);
        return;
    }
    
    gallery.currentIndex = (gallery.currentIndex + 1) % gallery.images.length;
    updateCardGallery(carId);
}

function prevCardImage(carId) {
    const gallery = galleryStates[carId];
    if (!gallery) {
        console.warn(`Gallery state not found for car ${carId}`);
        return;
    }
    
    gallery.currentIndex = (gallery.currentIndex - 1 + gallery.images.length) % gallery.images.length;
    updateCardGallery(carId);
}

function goToCardImage(carId, index) {
    const gallery = galleryStates[carId];
    if (!gallery) {
        console.warn(`Gallery state not found for car ${carId}`);
        return;
    }
    
    gallery.currentIndex = index;
    updateCardGallery(carId);
}

function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('catalogTab').classList.toggle('hidden', tabName !== 'catalog');
    document.getElementById('favoritesTab').classList.toggle('hidden', tabName !== 'favorites');
    
    if (tabName === 'favorites') {
        renderFavorites();
    }
}

function showCarDetail(car) {
    const detailFrame = document.getElementById('detailFrame');
    const detailContent = document.getElementById('detailContent');
    const detailOverlay = document.getElementById('detailOverlay');

    detailOverlay.classList.add('active');
    
    const savings = car.averagePrice - car.price;
    const savingsPercent = Math.round((savings / car.averagePrice) * 100);
    
    const images = car.images || [car.imageUrl || 'https://via.placeholder.com/300'];
    
    detailContent.innerHTML = `
        <div class="car-gallery">
            <div class="car-gallery-container" id="galleryContainer">
                ${images.map(img => `
                    <img src="${img}" alt="${car.name}" class="car-gallery-image" onerror="this.src='https://via.placeholder.com/300'">
                `).join('')}
            </div>
            
            <div class="gallery-nav">
                <button class="gallery-nav-btn" onclick="prevDetailImage()">❮</button>
                <button class="gallery-nav-btn" onclick="nextDetailImage()">❯</button>
            </div>
            
            <div class="gallery-dots" id="galleryDots">
                ${images.map((_, index) => `
                    <div class="gallery-dot ${index === 0 ? 'active' : ''}" onclick="goToDetailImage(${index})"></div>
                `).join('')}
            </div>
        </div>
        <h2>${car.name}</h2>
        <div class="car-price">${car.price.toLocaleString()} ₸</div>
        <p>${car.description}</p>
        
        <div class="price-comparison">
            <h4>Сравнение цен</h4>
            <p>Средняя цена в других автосалонах: <strong>${car.averagePrice.toLocaleString()} ₸</strong></p>
            <p>Наша цена: <strong>${car.price.toLocaleString()} ₸</strong></p>
            <p style="color: #51cf66; font-weight: bold;">
                Вы экономите: ${savings.toLocaleString()} ₸ (${savingsPercent}%)
            </p>
        </div>
        
        <div class="bank-offers">
            <h4>Предложения от банков</h4>
            <p><strong>Стоимость автомобиля:</strong> ${car.price.toLocaleString()} ₸</p>
            <p><strong>Первоначальный взнос:</strong> ${(car.price * 0.1).toLocaleString()} ₸</p>
            
            <div class="month-options">
                <div class="month-btn" onclick="calculatePayment(${car.price}, 12)">12 мес</div>
                <div class="month-btn" onclick="calculatePayment(${car.price}, 24)">24 мес</div>
                <div class="month-btn" onclick="calculatePayment(${car.price}, 36)">36 мес</div>
                <div class="month-btn" onclick="calculatePayment(${car.price}, 48)">48 мес</div>
            </div>
            
            <div class="payment-info" id="paymentInfo">
                <p>Выберите срок кредитования</p>
            </div>

            <h5 class="text-muted">Указанный расчет имеет неточные вычисления. Уточните у менеджера точные условия.</h5>
            
            <button class="apply-btn" onclick="showApplicationForm('${car.id}', '${car.name.replace(/'/g, "\\'")}')">
                Отправить заявку
            </button>
        </div>
        
        <div class="characteristics">
            <h4>Характеристики</h4>
            <div class="char-grid">
                <div class="char-item">
                    <span>Адрес:</span>
                    <span>${car.address}</span>
                </div>
                <div class="char-item">
                    <span>Кузов:</span>
                    <span>${car.body}</span>
                </div>
                <div class="char-item">
                    <span>Год выпуска:</span>
                    <span>${car.year}</span>
                </div>
                <div class="char-item">
                    <span>Растаможен:</span>
                    <span>${car.customs}</span>
                </div>
                <div class="char-item">
                    <span>Привод:</span>
                    <span>${car.drive}</span>
                </div>
                <div class="char-item">
                    <span>Объем двигателя:</span>
                    <span>${car.engine}L</span>
                </div>
                <div class="char-item">
                    <span>Тип топлива:</span>
                    <span>${car.fuel}</span>
                </div>
                <div class="char-item">
                    <span>Цвет:</span>
                    <span>${car.color}</span>
                </div>
                <div class="char-item">
                    <span>Пробег:</span>
                    <span>${car.mileage} км</span>
                </div>
                <div class="char-item">
                    <span>КПП:</span>
                    <span>${car.transmission}</span>
                </div>
            </div>
        </div>
    `;
    
    initDetailGallery(images.length);
    detailFrame.classList.add('open');
}

// Переменные для управления галереей в детальном просмотре
let currentDetailImageIndex = 0;
let totalDetailImages = 0;

function initDetailGallery(count) {
    currentDetailImageIndex = 0;
    totalDetailImages = count;
}

function updateDetailGallery() {
    const container = document.getElementById('galleryContainer');
    const dots = document.querySelectorAll('.gallery-dot');
    
    if (container) {
        container.style.transform = `translateX(-${currentDetailImageIndex * 100}%)`;
    }
    
    dots.forEach((dot, index) => {
        if (dot) dot.classList.toggle('active', index === currentDetailImageIndex);
    });
}

function nextDetailImage() {
    if (currentDetailImageIndex < totalDetailImages - 1) {
        currentDetailImageIndex++;
    } else {
        currentDetailImageIndex = 0;
    }
    updateDetailGallery();
}

function prevDetailImage() {
    if (currentDetailImageIndex > 0) {
        currentDetailImageIndex--;
    } else {
        currentDetailImageIndex = totalDetailImages - 1;
    }
    updateDetailGallery();
}

function goToDetailImage(index) {
    currentDetailImageIndex = index;
    updateDetailGallery();
}

function closeDetail() {
    document.getElementById('detailFrame').classList.remove('open');
    document.getElementById('detailOverlay').classList.remove('active');
}

// Переменные для управления галереей
let currentImageIndex = 0;
let totalImages = 0;

function initGallery(count) {
    currentImageIndex = 0;
    totalImages = count;
}

function updateGallery() {
    const container = document.getElementById('galleryContainer');
    const dots = document.querySelectorAll('.gallery-dot');
    
    container.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentImageIndex);
    });
}

function nextImage() {
    if (currentImageIndex < totalImages - 1) {
        currentImageIndex++;
    } else {
        currentImageIndex = 0;
    }
    updateGallery();
}

function prevImage() {
    if (currentImageIndex > 0) {
        currentImageIndex--;
    } else {
        currentImageIndex = totalImages - 1;
    }
    updateGallery();
}

function goToImage(index) {
    currentImageIndex = index;
    updateGallery();
}

function calculatePayment(price, months) {
    document.querySelectorAll('.month-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const downPayment = price * 0.1;
    const loanAmount = price - downPayment;
    const interestRate = 0.15; // 15% годовых
    const monthlyRate = interestRate / 12;
    
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                         (Math.pow(1 + monthlyRate, months) - 1);
    
    const totalPayment = monthlyPayment * months + downPayment;
    const overpayment = totalPayment - price;
    
    document.getElementById('paymentInfo').innerHTML = `
        <h5>Расчет для ${months} месяцев:</h5>
        <p><strong>Ежемесячный платеж:</strong> ${Math.round(monthlyPayment).toLocaleString()} ₸</p>
        <p><strong>Переплата:</strong> ${Math.round(overpayment).toLocaleString()} ₸</p>
        <p><strong>Общая сумма:</strong> ${Math.round(totalPayment).toLocaleString()} ₸</p>
    `;
}

function toggleFilterSidebar() {
    const sidebar = document.getElementById('filterSidebar');
    const overlay = document.getElementById('filterOverlay');

    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function closeFilterSidebar() {
    document.getElementById('filterSidebar').classList.remove('active');
    document.getElementById('filterOverlay').classList.remove('active');
}

function closeModal() {
    document.getElementById('applicationModal').style.display = 'none';
}

// Event Listeners
document.getElementById('brandFilter').addEventListener('change', function() {
    updateModelFilter();
    applyFilters();
});

document.getElementById('modelFilter').addEventListener('change', applyFilters);
document.getElementById('bodyFilter').addEventListener('change', applyFilters);
document.getElementById('customsFilter').addEventListener('change', applyFilters);
document.getElementById('yearFrom').addEventListener('input', applyFilters);
document.getElementById('yearTo').addEventListener('input', applyFilters);

// Close modal when clicking outside
document.getElementById('applicationModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Initialize
updateModelFilter();
renderCars();