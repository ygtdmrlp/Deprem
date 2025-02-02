// Grafik renkleri ve seçenekleri
const chartColors = {
    primary: '#0d6efd',
    success: '#198754',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#0dcaf0',
    purple: '#6f42c1',
    teal: '#20c997'
};

const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false
};

// Grafikleri oluştur
let magnitudeChart, depthChart, timeChart;

// Veri işleme ve istatistik fonksiyonları
function calculateStatistics(earthquakes) {
    const stats = {
        total: earthquakes.length,
        significant: earthquakes.filter(q => q.mag >= 4.0).length,
        largest: Math.max(...earthquakes.map(q => q.mag)),
        largestLocation: '',
        average: (earthquakes.reduce((sum, q) => sum + q.mag, 0) / earthquakes.length).toFixed(1),
        averageDepth: (earthquakes.reduce((sum, q) => sum + q.depth, 0) / earthquakes.length).toFixed(1),
        mostActiveRegion: '',
        mostActiveHour: ''
    };

    // En büyük depremin lokasyonunu bul
    const largestEq = earthquakes.find(q => q.mag === stats.largest);
    stats.largestLocation = largestEq ? largestEq.title : '-';

    // En aktif bölgeyi bul
    const regionCounts = {};
    earthquakes.forEach(q => {
        const region = q.title.split(' ')[q.title.split(' ').length - 1];
        regionCounts[region] = (regionCounts[region] || 0) + 1;
    });
    stats.mostActiveRegion = Object.entries(regionCounts)
        .sort((a, b) => b[1] - a[1])[0][0];

    // En yoğun saati bul
    const hourCounts = {};
    earthquakes.forEach(q => {
        const hour = new Date(q.date).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const mostActiveHour = Object.entries(hourCounts)
        .sort((a, b) => b[1] - a[1])[0][0];
    stats.mostActiveHour = `${mostActiveHour}:00`;

    return stats;
}

function updateStatistics(stats) {
    document.getElementById('totalEarthquakes').textContent = stats.total;
    document.getElementById('significantEarthquakes').textContent = stats.significant;
    document.getElementById('largestEarthquake').textContent = stats.largest.toFixed(1);
    document.getElementById('largestLocation').textContent = stats.largestLocation;
    document.getElementById('averageMagnitude').textContent = stats.average;
    document.getElementById('averageDepth').textContent = stats.averageDepth;
    document.getElementById('mostActiveRegion').textContent = stats.mostActiveRegion;
    document.getElementById('mostActiveHour').textContent = stats.mostActiveHour;
}

function updateRegionTable(earthquakes) {
    const regionData = {};
    
    // Bölgesel verileri topla
    earthquakes.forEach(q => {
        const region = q.title.split(' ')[q.title.split(' ').length - 1];
        if (!regionData[region]) {
            regionData[region] = {
                count: 0,
                maxMag: 0,
                totalMag: 0,
                totalDepth: 0
            };
        }
        regionData[region].count++;
        regionData[region].maxMag = Math.max(regionData[region].maxMag, q.mag);
        regionData[region].totalMag += q.mag;
        regionData[region].totalDepth += q.depth;
    });

    // Tabloyu güncelle
    const tbody = document.getElementById('regionData');
    tbody.innerHTML = '';

    Object.entries(regionData)
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([region, data]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${region}</td>
                <td>${data.count}</td>
                <td>${data.maxMag.toFixed(1)}</td>
                <td>${(data.totalMag / data.count).toFixed(1)}</td>
                <td>${(data.totalDepth / data.count).toFixed(1)} km</td>
            `;
            tbody.appendChild(row);
        });
}

function updateCharts(earthquakes) {
    updateMagnitudeChart(earthquakes);
    updateDepthChart(earthquakes);
    updateTimeChart(earthquakes);
}

function updateMagnitudeChart(earthquakes) {
    const magnitudeCounts = {
        '0-2.9': 0,
        '3.0-3.9': 0,
        '4.0-4.9': 0,
        '5.0-5.9': 0,
        '6.0+': 0
    };

    earthquakes.forEach(q => {
        if (q.mag < 3.0) magnitudeCounts['0-2.9']++;
        else if (q.mag < 4.0) magnitudeCounts['3.0-3.9']++;
        else if (q.mag < 5.0) magnitudeCounts['4.0-4.9']++;
        else if (q.mag < 6.0) magnitudeCounts['5.0-5.9']++;
        else magnitudeCounts['6.0+']++;
    });

    const ctx = document.getElementById('magnitudeChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(magnitudeCounts),
            datasets: [{
                label: 'Deprem Sayısı',
                data: Object.values(magnitudeCounts),
                backgroundColor: Object.values(chartColors),
                borderWidth: 1
            }]
        },
        options: {
            ...commonChartOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateDepthChart(earthquakes) {
    const depthRanges = {
        '0-30': 0,
        '30-70': 0,
        '70-300': 0,
        '300+': 0
    };

    earthquakes.forEach(q => {
        if (q.depth <= 30) depthRanges['0-30']++;
        else if (q.depth <= 70) depthRanges['30-70']++;
        else if (q.depth <= 300) depthRanges['70-300']++;
        else depthRanges['300+']++;
    });

    const ctx = document.getElementById('depthChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(depthRanges),
            datasets: [{
                label: 'Deprem Sayısı',
                data: Object.values(depthRanges),
                borderColor: chartColors.success,
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: commonChartOptions
    });
}

function updateTimeChart(earthquakes) {
    const hourCounts = Array(24).fill(0);
    
    earthquakes.forEach(q => {
        const hour = new Date(q.date).getHours();
        hourCounts[hour]++;
    });

    const ctx = document.getElementById('timeChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Deprem Sayısı',
                data: hourCounts,
                backgroundColor: chartColors.info,
                borderWidth: 1
            }]
        },
        options: {
            ...commonChartOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

async function fetchAndProcessData() {
    try {
        const response = await fetch('https://api.orhanaydogdu.com.tr/deprem/kandilli/live');
        const data = await response.json();
        
        if (data.status && Array.isArray(data.result)) {
            const earthquakes = data.result;
            
            // İstatistikleri hesapla ve güncelle
            const stats = calculateStatistics(earthquakes);
            updateStatistics(stats);
            
            // Bölgesel analiz tablosunu güncelle
            updateRegionTable(earthquakes);
            
            // Grafikleri güncelle
            updateCharts(earthquakes);
        }
    } catch (error) {
        console.error('Veri çekme hatası:', error);
    }
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    fetchAndProcessData();
    // Her 5 dakikada bir verileri güncelle
    setInterval(fetchAndProcessData, 300000);
}); 