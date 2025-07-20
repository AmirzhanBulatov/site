let currentLanguage = 'ru';
        let carsData = [
            {
                id: 1,
                brand: 'BYD',
                model: 'Tang',
                name: 'BYD Tang',
                description: 'Премиальный электрический кроссовер с передовыми технологиями',
                price: 8900000,
                year: 2023,
                address: 'Астана, ул. Хусейн бен Талал 28',
                body: 'Кроссовер',
                customs: 'да',
                drive: 'Полный',
                engine: '2.0',
                fuel: 'Электро',
                color: 'Белый',
                mileage: '15000',
                transmission: 'Автомат',
                averagePrice: 9500000
            },
            {
                id: 2,
                brand: 'Geely',
                model: 'Coolray',
                name: 'Geely Coolray',
                description: 'Стильный и экономичный компактный кроссовер',
                price: 6500000,
                year: 2022,
                address: 'Астана, ул. Хусейн бен Талал 28',
                body: 'Кроссовер',
                customs: 'да',
                drive: 'Передний',
                engine: '1.5',
                fuel: 'Бензин',
                color: 'Синий',
                mileage: '25000',
                transmission: 'Автомат',
                averagePrice: 7200000
            },
            {
                id: 3,
                brand: 'Chery',
                model: 'Tiggo 8',
                name: 'Chery Tiggo 8',
                description: 'Семейный кроссовер с просторным салоном',
                price: 7800000,
                year: 2023,
                address: 'Астана, ул. Хусейн бен Талал 28',
                body: 'Кроссовер',
                customs: 'нет',
                drive: 'Передний',
                engine: '1.6',
                fuel: 'Бензин',
                color: 'Черный',
                mileage: '8000',
                transmission: 'Автомат',
                averagePrice: 8300000
            },
            {
                id: 4,
                brand: 'Haval',
                model: 'Jolion',
                name: 'Haval Jolion',
                description: 'Современный городской кроссовер с гибридной установкой',
                price: 5900000,
                year: 2024,
                address: 'Астана, ул. Хусейн бен Талал 28',
                body: 'Кроссовер',
                customs: 'да',
                drive: 'Передний',
                engine: '1.5',
                fuel: 'Гибрид',
                color: 'Красный',
                mileage: '5000',
                transmission: 'Автомат',
                averagePrice: 6400000
            }
        ];

        let favorites = [];
        let filteredCars = [...carsData];

        const modelsByBrand = {
            'BYD': ['Tang', 'Song', 'Yuan'],
            'Geely': ['Coolray', 'Atlas', 'Emgrand'],
            'Chery': ['Tiggo 8', 'Tiggo 7', 'Arrizo'],
            'Haval': ['Jolion', 'H6', 'F7']
        };

        function switchLanguage(lang) {
            currentLanguage = lang;
            document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            document.querySelectorAll('[data-ru]').forEach(el => {
                el.textContent = el.getAttribute('data-' + lang);
            });
        }

        function updateModelFilter() {
            const brandFilter = document.getElementById('brandFilter');
            const modelFilter = document.getElementById('modelFilter');
            const selectedBrand = brandFilter.value;
            
            modelFilter.innerHTML = '<option value="">Все модели</option>';
            
            if (selectedBrand && modelsByBrand[selectedBrand]) {
                modelsByBrand[selectedBrand].forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    modelFilter.appendChild(option);
                });
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

        function sortCars(type) {
            if (type === 'price') {
                filteredCars.sort((a, b) => a.price - b.price);
            } else if (type === 'year') {
                filteredCars.sort((a, b) => b.year - a.year);
            }
            renderCars();
        }

        function renderCars() {
            const grid = document.getElementById('carsGrid');
            grid.innerHTML = '';

            filteredCars.forEach(car => {
                const carCard = document.createElement('div');
                carCard.className = 'car-card';
                carCard.innerHTML = `
                    <div class="car-image">🚗</div>
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
                            onclick="toggleFavorite(${car.id}, event)">
                        ❤️
                    </button>
                `;
                
                carCard.addEventListener('click', () => showCarDetail(car));
                grid.appendChild(carCard);
            });
        }

        function renderFavorites() {
            const grid = document.getElementById('favoritesGrid');
            const favoriteCars = carsData.filter(car => favorites.includes(car.id));
            
            if (favoriteCars.length === 0) {
                grid.innerHTML = '<p>Нет избранных автомобилей</p>';
                return;
            }

            grid.innerHTML = '';
            favoriteCars.forEach(car => {
                const carCard = document.createElement('div');
                carCard.className = 'car-card';
                carCard.innerHTML = `
                    <div class="car-image">🚗</div>
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
                    <button class="favorite-btn active" onclick="toggleFavorite(${car.id}, event)">
                        ❤️
                    </button>
                `;
                
                carCard.addEventListener('click', () => showCarDetail(car));
                grid.appendChild(carCard);
            });
        }

        function toggleFavorite(carId, event) {
            event.stopPropagation();
            
            if (favorites.includes(carId)) {
                favorites = favorites.filter(id => id !== carId);
            } else {
                favorites.push(carId);
            }
            
            renderCars();
            renderFavorites();
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
            
            const savings = car.averagePrice - car.price;
            const savingsPercent = Math.round((savings / car.averagePrice) * 100);
            
            detailContent.innerHTML = `
                <div class="detail-image">🚗</div>
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

                    <h5 class="text-muted">Указанный расчет имеет неточные вычесления. Уточните у менеджера точные условия.</h5>
                    
                    <button class="apply-btn" onclick="showApplicationForm()">
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
            
            detailFrame.classList.add('open');
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

        function closeDetail() {
            document.getElementById('detailFrame').classList.remove('open');
        }

        function showApplicationForm() {
            document.getElementById('applicationModal').style.display = 'block';
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

        document.getElementById('applicationForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('applicantName').value;
            const phone = document.getElementById('applicantPhone').value;
            
            alert(`Заявка отправлена!\nИмя: ${name}\nТелефон: ${phone}`);
            closeModal();
            
            // Reset form
            this.reset();
        });

        // Close modal when clicking outside
        document.getElementById('applicationModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });

        // Initialize
        updateModelFilter();
        renderCars();