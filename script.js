// Harita ve marker değişkenleri
let map;
let markers = [];

// Harita başlatma
function initMap() {
    // Türkiye'nin sınırları - daha geniş doğu-batı ekseni
    const turkeyBounds = L.latLngBounds(
        L.latLng(35.0, 24.0), // Güneybatı köşesi
        L.latLng(42.5, 46.0)  // Kuzeydoğu köşesi
    );

    map = L.map('map', {
        minZoom: 6,
        maxZoom: 10,
        maxBounds: turkeyBounds,
        maxBoundsViscosity: 1.0,
    }).setView([38.5, 35.5], 6.5); // Merkez konumu ve zoom seviyesi ayarlandı

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        bounds: turkeyBounds
    }).addTo(map);
}

let allEarthquakes = [];
let isShowingAll = false;
let lastEarthquakeTime = null;

// Deprem hissetme sayaçları için obje
let earthquakeFeedback = {};

// Local Storage'dan hissetme verilerini yükle
function loadFeedbackData() {
    const savedData = localStorage.getItem('earthquakeFeedback');
    if (savedData) {
        earthquakeFeedback = JSON.parse(savedData);
    }
}

// Local Storage'a hissetme verilerini kaydet
function saveFeedbackData() {
    localStorage.setItem('earthquakeFeedback', JSON.stringify(earthquakeFeedback));
}

// Kullanıcının daha önce oy kullanıp kullanmadığını kontrol et
function hasUserVoted(earthquakeId) {
    const votedEarthquakes = localStorage.getItem('votedEarthquakes');
    if (votedEarthquakes) {
        const votedList = JSON.parse(votedEarthquakes);
        return votedList.includes(earthquakeId);
    }
    return false;
}

// Kullanıcının oyunu kaydet
function saveUserVote(earthquakeId) {
    let votedEarthquakes = localStorage.getItem('votedEarthquakes');
    if (votedEarthquakes) {
        votedEarthquakes = JSON.parse(votedEarthquakes);
    } else {
        votedEarthquakes = [];
    }
    votedEarthquakes.push(earthquakeId);
    localStorage.setItem('votedEarthquakes', JSON.stringify(votedEarthquakes));
}

// Hissetme butonlarına tıklama işlevi
function handleFeedback(earthquakeId, felt) {
    if (hasUserVoted(earthquakeId)) {
        alert('Bu deprem için daha önce oy kullandınız.');
        return;
    }

    if (!earthquakeFeedback[earthquakeId]) {
        earthquakeFeedback[earthquakeId] = {
            felt: 0,
            notFelt: 0
        };
    }

    if (felt) {
        earthquakeFeedback[earthquakeId].felt++;
    } else {
        earthquakeFeedback[earthquakeId].notFelt++;
    }

    saveUserVote(earthquakeId);
    saveFeedbackData();
    updateEarthquakeTable();
}

// Yeni deprem kontrolü ve uyarı fonksiyonları
function showNewEarthquakeAlert(earthquake) {
    const toast = document.getElementById('newEarthquakeToast');
    const toastInfo = document.getElementById('newEarthquakeToastInfo');
    
    // Uyarı metnini oluştur
    toastInfo.textContent = ` ${earthquake.title} bölgesinde ${earthquake.mag} büyüklüğünde deprem meydana geldi.`;
    
    // Toast'u göster
    toast.style.display = 'block';
    toast.classList.add('show');
    
    // 5 saniye sonra gizle
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.style.display = 'none';
        }, 150); // fade efekti için küçük bir gecikme
    }, 5000);
}

// Son deprem bilgisini göster
function showLatestEarthquakeAlert(earthquake) {
    const alert = document.getElementById('latestEarthquakeAlert');
    const info = document.getElementById('latestEarthquakeInfo');
    
    // Bilgi metnini oluştur
    info.innerHTML = `
        <div class="d-flex align-items-center gap-3">
            <div>
                <strong>Büyüklük:</strong> ${earthquake.mag.toFixed(1)}<br>
                <strong>Yer:</strong> ${earthquake.title}<br>
                <strong>Derinlik:</strong> ${earthquake.depth.toFixed(1)} km
            </div>
            <div class="ms-auto">
                <span class="text-muted">${formatDate(earthquake.date)}</span>
            </div>
        </div>
    `;
    
    // Alert'i göster
    alert.style.display = 'block';
    alert.classList.add('show');
}

function checkForNewEarthquake(earthquakes) {
    if (!lastEarthquakeTime) {
        lastEarthquakeTime = new Date(earthquakes[0].date);
        showLatestEarthquakeAlert(earthquakes[0]); // İlk yüklemede son depremi göster
        return;
    }

    const latestEarthquake = new Date(earthquakes[0].date);
    if (latestEarthquake > lastEarthquakeTime) {
        showNewEarthquakeAlert(earthquakes[0]);
        showLatestEarthquakeAlert(earthquakes[0]); // Son depremi güncelle
        lastEarthquakeTime = latestEarthquake;
        
        // Yeni deprem için ses çal
        const audio = new Audio('data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=');
        audio.play();
    }
}

// Marker ekleme fonksiyonu
function addEarthquakeMarker(quake) {
    const lat = quake.geojson.coordinates[1];
    const lng = quake.geojson.coordinates[0];
    
    const marker = L.circle([lat, lng], {
        color: getColorByMagnitude(quake.mag),
        fillColor: getColorByMagnitude(quake.mag),
        fillOpacity: 0.7,
        weight: 1,
        radius: quake.mag * 10000
    }).addTo(map);

    const popupContent = `
        <div class="earthquake-popup">
            <strong>Büyüklük:</strong> ${quake.mag.toFixed(1)}<br>
            <strong>Yer:</strong> ${quake.title}<br>
            <strong>Tarih:</strong> ${formatDate(quake.date)}<br>
            <strong>Derinlik:</strong> ${quake.depth.toFixed(1)} km
        </div>
    `;

    marker.bindPopup(popupContent);
    marker.quakeData = quake;
    markers.push(marker);
}

async function fetchEarthquakeData() {
    try {
        const response = await fetch('https://api.orhanaydogdu.com.tr/deprem/kandilli/live');
        const data = await response.json();
        
        if (data.status && Array.isArray(data.result)) {
            allEarthquakes = data.result;
            
            // Yeni deprem kontrolü
            if (allEarthquakes.length > 0) {
                checkForNewEarthquake(allEarthquakes);
            }
            
            // Haritadaki tüm işaretçileri temizle
            markers.forEach(marker => map.removeLayer(marker));
            markers = [];
            
            // Deprem verilerini güncelle
            updateEarthquakeTable();
            
            // Haritaya işaretçileri ekle
            allEarthquakes.forEach(addEarthquakeMarker);

            // Bölgesel durumu güncelle
            updateRegionalStatus();
        } else {
            console.error('Geçersiz veri formatı:', data);
        }
    } catch (error) {
        console.error('Veri çekme hatası:', error);
    }
}

function updateEarthquakeTable() {
    const tableBody = document.getElementById('earthquakeData');
    const showMoreBtn = document.getElementById('showMoreBtn');
    
    if (!tableBody) {
        console.error('Tablo body elementi bulunamadı');
        return;
    }
    
    tableBody.innerHTML = '';

    if (!Array.isArray(allEarthquakes) || allEarthquakes.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" class="text-center">
                <div class="alert alert-info mb-0">
                    Deprem verisi bulunamadı veya yükleniyor...
                </div>
            </td>
        `;
        tableBody.appendChild(row);
        if (showMoreBtn) showMoreBtn.style.display = 'none';
        return;
    }

    // Gösterilecek deprem sayısını belirle
    const earthquakesToShow = isShowingAll ? allEarthquakes : allEarthquakes.slice(0, 15);

    earthquakesToShow.forEach(quake => {
        const row = document.createElement('tr');
        
        // Deprem için benzersiz ID oluştur
        const earthquakeId = `${quake.date}_${quake.geojson.coordinates[0]}_${quake.geojson.coordinates[1]}`;
        
        // Hissetme verilerini al
        const feedback = earthquakeFeedback[earthquakeId] || { felt: 0, notFelt: 0 };
        const hasVoted = hasUserVoted(earthquakeId);
        
        row.innerHTML = `
            <td class="ps-3">${formatDate(quake.date)}</td>
            <td>
                <span class="magnitude ${getMagnitudeClass(quake.mag)}">
                    ${quake.mag.toFixed(1)}
                </span>
            </td>
            <td>${quake.depth.toFixed(1)} km</td>
            <td>${quake.title}</td>
            <td class="text-end">
                <span class="badge ${quake.mag >= 4.0 ? 'bg-warning text-dark' : 'bg-secondary'} rounded-pill">
                    ${quake.mag >= 4.0 ? 'Önemli' : 'Normal'}
                </span>
            </td>
            <td class="text-center">
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn ${hasVoted ? 'btn-secondary' : 'btn-outline-success'}" 
                            onclick="event.stopPropagation(); handleFeedback('${earthquakeId}', true)" 
                            ${hasVoted ? 'disabled' : ''}>
                        <i class="fas fa-check me-1"></i>Hissettim 
                        <span class="badge bg-white text-success ms-1">${feedback.felt}</span>
                    </button>
                    <button type="button" class="btn ${hasVoted ? 'btn-secondary' : 'btn-outline-danger'}" 
                            onclick="event.stopPropagation(); handleFeedback('${earthquakeId}', false)" 
                            ${hasVoted ? 'disabled' : ''}>
                        <i class="fas fa-times me-1"></i>Hissetmedim
                        <span class="badge bg-white text-danger ms-1">${feedback.notFelt}</span>
                    </button>
                </div>
            </td>
        `;
        
        row.addEventListener('click', () => {
            // Haritaya smooth scroll
            document.querySelector('.map-container').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });

            // Haritayı deprem konumuna zoom yap
            const coords = [quake.geojson.coordinates[1], quake.geojson.coordinates[0]];
            map.setView(coords, 8, {
                animate: true,
                duration: 1
            });

            // İlgili marker'ı bul ve popup'ı göster
            markers.forEach(marker => {
                if (marker.quakeData === quake) {
                    marker.openPopup();
                    // Marker'ı vurgula
                    marker.setStyle({
                        fillOpacity: 0.9,
                        weight: 2
                    });
                    // 2 saniye sonra normal haline döndür
                    setTimeout(() => {
                        marker.setStyle({
                            fillOpacity: 0.7,
                            weight: 1
                        });
                    }, 2000);
                }
            });
        });
        
        tableBody.appendChild(row);
    });

    // Buton metnini ve görünürlüğünü güncelle
    if (showMoreBtn) {
        showMoreBtn.style.display = allEarthquakes.length <= 15 ? 'none' : 'inline-block';
        showMoreBtn.innerHTML = `
            <i class="fas fa-chevron-${isShowingAll ? 'up' : 'down'} me-1"></i>
            ${isShowingAll ? 'Daha Az Göster' : 'Daha Fazla Göster'}
        `;
    }
}

function toggleShowMore() {
    isShowingAll = !isShowingAll;
    updateEarthquakeTable();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getMagnitudeClass(magnitude) {
    if (magnitude < 4.0) return 'magnitude-small';
    if (magnitude < 5.0) return 'magnitude-medium';
    return 'magnitude-large';
}

function getColorByMagnitude(magnitude) {
    if (magnitude >= 5) return '#ff0000';
    if (magnitude >= 4) return '#ff6600';
    if (magnitude >= 3) return '#ffa500';
    return '#ffcc00';
}

// IP tabanlı konum tespiti
async function getLocationFromIP() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        // Konum bilgisini sakla
        window.userLocation = {
            lat: parseFloat(data.latitude),
            lng: parseFloat(data.longitude),
            city: data.city || data.region || 'Belirlenen Bölge'
        };

        console.log("IP'den alınan konum:", window.userLocation); // Debug için
        updateRegionalStatus();
    } catch (error) {
        console.error("IP tabanlı konum tespiti hatası:", error);
        // Hata durumunda varsayılan konum olarak Türkiye'nin merkezini kullan
        window.userLocation = {
            lat: 39.9334,
            lng: 32.8597,
            city: 'Ankara'
        };
        updateRegionalStatus();
    }
}

// Konum güncelleme fonksiyonu
async function updateLocation() {
    await getLocationFromIP();
}

// Bölgesel deprem durumunu güncelle
function updateRegionalStatus() {
    const statusDiv = document.getElementById('regionalStatus');
    const statusText = document.getElementById('regionalStatusText');
    const lastCheckTimeDiv = document.getElementById('lastCheckTime');
    const statusIcon = statusDiv.querySelector('i');

    // Konum bilgisi kontrolü
    if (!window.userLocation) {
        console.log("Konum bilgisi bulunamadı");
        return;
    }

    // Deprem verisi kontrolü
    if (!allEarthquakes || !Array.isArray(allEarthquakes)) {
        console.log("Deprem verisi bulunamadı");
        return;
    }

    console.log("Konum:", window.userLocation); // Debug için konum bilgisi
    console.log("Deprem sayısı:", allEarthquakes.length); // Debug için deprem sayısı

    // Son 30 dakika içindeki depremleri filtrele
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const radius = 50; // 50 km yarıçap

    const nearbyEarthquakes = allEarthquakes.filter(quake => {
        const quakeDate = new Date(quake.date);
        const distance = calculateDistance(
            window.userLocation.lat,
            window.userLocation.lng,
            quake.geojson.coordinates[1],
            quake.geojson.coordinates[0]
        );
        console.log("Deprem mesafesi:", distance, "km"); // Debug için mesafe bilgisi
        return quakeDate > thirtyMinutesAgo && distance <= radius;
    });

    // Son kontrol zamanını güncelle
    const now = new Date();
    lastCheckTimeDiv.textContent = `Son kontrol: ${now.toLocaleTimeString('tr-TR')}`;

    // Stil sınıflarını temizle
    statusDiv.classList.remove('d-none', 'alert-success', 'alert-warning');
    statusIcon.classList.remove('fa-check-circle', 'fa-exclamation-circle');

    // Bölgesel durum bilgisini göster
    if (nearbyEarthquakes.length === 0) {
        statusDiv.classList.add('alert-success');
        statusIcon.classList.add('fa-check-circle');
        statusText.innerHTML = `<strong>Bölgenizde Son 30 Dakika İçinde Deprem Kaydedilmedi</strong><br>
            <small class="text-muted">Konumunuz: ${window.userLocation.city || 'Belirlenen Bölge'}</small>`;
    } else {
        statusDiv.classList.add('alert-warning');
        statusIcon.classList.add('fa-exclamation-circle');
        const earthquakeList = nearbyEarthquakes.map(quake => 
            `${quake.title} (${quake.mag.toFixed(1)})`
        ).join(', ');
        statusText.innerHTML = `<strong>Bölgenizde Son 30 Dakika İçinde ${nearbyEarthquakes.length} Deprem Kaydedildi</strong><br>
            <small class="text-muted">${earthquakeList}</small>`;
    }

    // Görünürlüğü zorla
    statusDiv.style.display = 'block';
}

// Yakındaki depremleri kontrol et
function checkNearbyEarthquakes() {
    if (!window.userLocation || !allEarthquakes) return;

    const radius = 50; // 50 km yarıçap
    const recentEarthquakes = allEarthquakes.filter(quake => {
        const distance = calculateDistance(
            window.userLocation.lat,
            window.userLocation.lng,
            quake.lat,
            quake.lng
        );
        return distance <= radius;
    });

    // Son 1 saat içindeki yakın depremleri bildir
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentNearbyQuakes = recentEarthquakes.filter(quake => {
        const quakeDate = new Date(quake.date);
        return quakeDate > oneHourAgo;
    });

    recentNearbyQuakes.forEach(quake => {
        showNotification(quake);
    });
}

// İki nokta arasındaki mesafeyi hesapla (Haversine formülü)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Dünya'nın yarıçapı (km)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

// Bildirim göster
function showNotification(quake) {
    const distance = calculateDistance(
        window.userLocation.lat,
        window.userLocation.lng,
        quake.lat,
        quake.lng
    ).toFixed(1);

    const notification = new Notification("Yakınızda Deprem!", {
        body: `Büyüklük: ${quake.mag}
Yer: ${quake.title}
Uzaklık: ${distance} km
Derinlik: ${quake.depth} km`,
        icon: "/favicon.ico"
    });

    notification.onclick = function() {
        window.focus();
        // Deprem konumuna git ve popup'ı göster
        map.setView([quake.lat, quake.lng], 10);
        const marker = markers.find(m => m.quakeData.id === quake.id);
        if (marker) marker.openPopup();
    };
}

// Canlı saat ve tarih güncelleme fonksiyonu
function updateClock() {
    const now = new Date();
    const timeElement = document.getElementById('currentTime');
    const dateElement = document.getElementById('currentDate');
    const timezoneElement = document.getElementById('timezone');
    
    // Tarihi formatla
    const dateString = now.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    
    // Saati formatla
    const timeString = now.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    // Zaman dilimini al
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = -(now.getTimezoneOffset() / 60);
    const offsetString = (offset >= 0 ? '+' : '') + offset;
    
    // Ekranı güncelle
    if (dateElement) dateElement.textContent = dateString;
    if (timeElement) timeElement.textContent = timeString;
    if (timezoneElement) timezoneElement.textContent = `UTC${offsetString}`;
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    initMap();
    loadFeedbackData();
    
    // Saati başlat
    updateClock();
    setInterval(updateClock, 1000);
    
    // IP tabanlı konumu al
    await getLocationFromIP();
    
    // Deprem verilerini çek
    await fetchEarthquakeData();
    
    // Her 5 dakikada bir verileri güncelle
    setInterval(fetchEarthquakeData, 300000);
    
    // Her 5 dakikada bir konumu güncelle
    setInterval(updateLocation, 300000);
});

// Her yeni deprem verisi geldiğinde bölgesel durumu güncelle
let lastCheck = Date.now();
setInterval(() => {
    // Her dakika kontrol et
    if (Date.now() - lastCheck >= 60 * 1000) {
        updateRegionalStatus();
        lastCheck = Date.now();
    }
}, 60 * 1000); 