import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDxw4nszjHYSWann1cuppWg0EGtaa-sjxs",
    authDomain: "fed-assignment-f1456.firebaseapp.com",
    projectId: "fed-assignment-f1456",
    storageBucket: "fed-assignment-f1456.firebasestorage.app",
    messagingSenderId: "646434763443",
    appId: "1:646434763443:web:40ca6ecd4edd45e2edf6c6",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const urlParams = new URLSearchParams(window.location.search);
const stallId = urlParams.get("id");

// Chart instances
let complaintsTrendChart = null;
let categoriesChart = null;
let ratingChart = null;

// Raw data storage
let allComplaints = [];
let allReviews = [];
function initializeSecondaryNav() {
  // Get stall ID from URL first, then fall back to localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const urlId = urlParams.get("id");
  const storageId = localStorage.getItem("selectedStallId");
  const stallId = urlId || storageId;
  
  console.log("Initializing nav with stall ID:", stallId);
  
  if (!stallId) {
    console.warn("No stall ID found for navigation");
    return;
  }
  
  // Sync to localStorage for consistency
  localStorage.setItem("selectedStallId", stallId);
  
  // Define navigation links
  const navLinks = [
    { id: 'nav-home', url: '../flagged-stalls/flagged_stallinfo.html' },
    { id: 'nav-dashboard', url: 'Stall-Statistics.html' },
    { id: 'nav-grade', url: '../submit-grade/submit_grade.html' },
    { id: 'nav-feedback', url: '../Customer-Feedback/Customer-Feedback.html' }
  ];
  
  const currentPage = window.location.pathname;
  
  navLinks.forEach(link => {
    const element = document.getElementById(link.id);
    if (!element) {
      console.warn("Nav element not found:", link.id);
      return;
    }
    
    // Set the full href with stall ID
    const fullUrl = link.url + '?id=' + encodeURIComponent(stallId);
    element.href = fullUrl;
    console.log(`Set ${link.id} to:`, fullUrl);
    
    // Highlight current page
    if (currentPage.includes(link.url.replace('../', '').split('/').pop())) {
      element.classList.remove('border-transparent');
      element.classList.add('border-slate-400');
    }
  });
}

function initializeOfficerInfo() {
    const officerName = localStorage.getItem("neaOfficerName");
    
    if (officerName) {
        // Set officer name
        const nameEl = document.getElementById("officer-name");
        if (nameEl) {
            nameEl.textContent = officerName;
        }
        
        // Set initials
        const initialsEl = document.getElementById("officer-initials");
        if (initialsEl) {
            const initials = officerName
                .split(" ")
                .map(word => word[0])
                .join("")
                .toUpperCase();
            initialsEl.textContent = initials;
        }
    } else {
        console.warn("No officer name found in localStorage");
        // Set defaults
        const nameEl = document.getElementById("officer-name");
        if (nameEl) nameEl.textContent = "Guest";
        
        const initialsEl = document.getElementById("officer-initials");
        if (initialsEl) initialsEl.textContent = "G";
    }
}

// Initialize page
async function initStatisticsPage() {
    if (!stallId) {
        alert("No stall ID provided");
        return;
    }

    initializeOfficerInfo();

    try {
        // Load stall info
        const stallDoc = await getDoc(doc(db, "hawker-stalls", stallId));
        if (stallDoc.exists()) {
            document.getElementById("stallNameHeader").innerText = stallDoc.data().name;
        }

        initializeSecondaryNav();

        // Load initial data
        await loadData();

        // Set up event listeners
        document.getElementById('timeRangeFilter').addEventListener('change', handleTimeRangeChange);
        document.getElementById('clearFilterBtn').addEventListener('click', clearFilter);

    } catch (error) {
        console.error("Error initializing page:", error);
    }

}

async function loadData() {
    const months = parseInt(document.getElementById('timeRangeFilter').value);
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    try {
        // Fetch complaints
        const complaintsQuery = query(
            collection(db, "complaint_list"),
            where("stallId", "==", stallId)
        );
        const complaintsSnap = await getDocs(complaintsQuery);
        allComplaints = complaintsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: new Date(doc.data().createdAt),
            type: 'complaint'
        })).filter(c => c.date >= cutoffDate);

        // Fetch reviews
        const reviewsQuery = query(
            collection(db, "reviews"),
            where("stallId", "==", stallId)
        );
        const reviewsSnap = await getDocs(reviewsQuery);
        allReviews = reviewsSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
                type: 'review'
            };
        }).filter(r => r.date >= cutoffDate);

        updateDashboard();

    } catch (error) {
        console.error("Error loading data:", error);
    }
}

function handleTimeRangeChange() {
    loadData();
}

function updateDashboard() {
    updateSummaryCards();
    updateComplaintsTrendChart();
    updateCategoriesChart();
    updateRatingChart();
    updateActivityTable();
}

function updateSummaryCards() {
    // Total complaints
    document.getElementById('totalComplaints').innerText = allComplaints.length;
    
    // Calculate trend (compare first half vs second half of period)
    const midPoint = new Date();
    midPoint.setDate(midPoint.getDate() - (parseInt(document.getElementById('timeRangeFilter').value) * 15));
    const firstHalf = allComplaints.filter(c => c.date >= midPoint).length;
    const secondHalf = allComplaints.filter(c => c.date < midPoint).length;
    const trend = secondHalf === 0 ? 0 : ((firstHalf - secondHalf) / secondHalf * 100).toFixed(1);
    const trendEl = document.getElementById('complaintsTrend');
    if (trend > 0) {
        trendEl.innerHTML = `<span class="text-red-500">↑ ${trend}%</span> increase`;
    } else if (trend < 0) {
        trendEl.innerHTML = `<span class="text-green-500">↓ ${Math.abs(trend)}%</span> decrease`;
    } else {
        trendEl.innerText = 'No change';
    }

    // Average rating
    const totalRating = allReviews.reduce((sum, r) => sum + Number(r.rating), 0);
    const avgRating = allReviews.length > 0 ? (totalRating / allReviews.length).toFixed(1) : '0.0';
    document.getElementById('avgRating').innerText = avgRating;
    document.getElementById('totalReviews').innerText = `${allReviews.length} reviews`;
    
    // Star display
    const stars = Array(5).fill(0).map((_, i) => 
        `<i class="${i < Math.round(avgRating) ? 'text-yellow-400' : 'text-slate-200'}">★</i>`
    ).join('');
    document.getElementById('starDisplay').innerHTML = stars;

    // Top complaint category
    const categories = {};
    allComplaints.forEach(c => {
        const cat = c.category || 'General';
        categories[cat] = (categories[cat] || 0) + 1;
    });
    const topCategory = Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b, 'None');
    document.getElementById('topComplaintCategory').innerText = topCategory;
    document.getElementById('topComplaintCount').innerText = topCategory !== 'None' ? `${categories[topCategory]} complaints` : 'No complaints';

    // Overall trend direction
    const trendEl2 = document.getElementById('trendDirection');
    if (trend < -10) {
        trendEl2.innerHTML = '<span class="text-green-500">Improving</span>';
    } else if (trend > 10) {
        trendEl2.innerHTML = '<span class="text-red-500">Declining</span>';
    } else {
        trendEl2.innerHTML = '<span class="text-slate-500">Stable</span>';
    }
}

function updateComplaintsTrendChart() {
    const ctx = document.getElementById('complaintsTrendChart').getContext('2d');
    
    // Group by month
    const months = parseInt(document.getElementById('timeRangeFilter').value);
    const labels = [];
    const data = [];
    
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = d.toLocaleDateString('en-SG', { month: 'short', year: '2-digit' });
        labels.push(monthKey);
        
        const count = allComplaints.filter(c => {
            const cDate = c.date;
            return cDate.getMonth() === d.getMonth() && cDate.getFullYear() === d.getFullYear();
        }).length;
        data.push(count);
    }

    if (complaintsTrendChart) {
        complaintsTrendChart.destroy();
    }

    complaintsTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Complaints',
                data: data,
                borderColor: '#009481',
                backgroundColor: 'rgba(0, 148, 129, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#009481',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: { size: 13 },
                    bodyFont: { size: 13 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, font: { size: 11 } },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: {
                    ticks: { font: { size: 11 } },
                    grid: { display: false }
                }
            },
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const monthLabel = labels[index];
                    filterByMonth(monthLabel);
                }
            }
        }
    });
}

function updateCategoriesChart() {
    const ctx = document.getElementById('categoriesChart').getContext('2d');
    
    // Group by category
    const categories = {};
    allComplaints.forEach(c => {
        const cat = c.category || 'General';
        categories[cat] = (categories[cat] || 0) + 1;
    });

    const labels = Object.keys(categories);
    const data = Object.values(categories);
    const colors = ['#009481', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

    if (categoriesChart) {
        categoriesChart.destroy();
    }

    categoriesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Complaints',
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, font: { size: 11 } },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: {
                    ticks: { font: { size: 10 } },
                    grid: { display: false }
                }
            },
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const category = labels[index];
                    filterByCategory(category);
                }
            }
        }
    });
}

function updateRatingChart() {
    const ctx = document.getElementById('ratingChart').getContext('2d');
    
    // Group by rating
    const ratings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allReviews.forEach(r => {
        ratings[r.rating] = (ratings[r.rating] || 0) + 1;
    });

    const data = [ratings[1], ratings[2], ratings[3], ratings[4], ratings[5]];
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#009481'];

    if (ratingChart) {
        ratingChart.destroy();
    }

    ratingChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: (context) => {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                    }
                }
            },
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const rating = index + 1;
                    filterByRating(rating);
                }
            }
        }
    });
}

function updateActivityTable(filteredData = null) {
    const tbody = document.getElementById('activityTableBody');
    const noDataMsg = document.getElementById('noDataMessage');
    const data = filteredData || [...allComplaints, ...allReviews].sort((a, b) => b.date - a.date);

    if (data.length === 0) {
        tbody.innerHTML = '';
        noDataMsg.classList.remove('hidden');
        return;
    }

    noDataMsg.classList.add('hidden');
    tbody.innerHTML = data.slice(0, 50).map(item => {
        const isComplaint = item.type === 'complaint';
        const dateStr = item.date.toLocaleDateString('en-SG', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        if (isComplaint) {
            return `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 sm:px-6 py-3 sm:py-4">
                        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                            <i data-lucide="alert-circle" class="w-3 h-3"></i>
                            Complaint
                        </span>
                    </td>
                    <td class="px-4 sm:px-6 py-3 sm:py-4 text-slate-600">${dateStr}</td>
                    <td class="px-4 sm:px-6 py-3 sm:py-4">
                        <span class="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                            ${item.category || 'General'}
                        </span>
                    </td>
                    <td class="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 max-w-xs truncate">${item.message || 'No details'}</td>
                </tr>
            `;
        } else {
            const stars = '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating);
            return `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 sm:px-6 py-3 sm:py-4">
                        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                            <i data-lucide="star" class="w-3 h-3"></i>
                            Review
                        </span>
                    </td>
                    <td class="px-4 sm:px-6 py-3 sm:py-4 text-slate-600">${dateStr}</td>
                    <td class="px-4 sm:px-6 py-3 sm:py-4">
                        <span class="text-yellow-500 text-sm tracking-widest">${stars}</span>
                    </td>
                    <td class="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 max-w-xs truncate">${item.comment || 'No comment'}</td>
                </tr>
            `;
        }
    }).join('');

    lucide.createIcons();
}

// Filter functions
function filterByMonth(monthLabel) {
    const [month, year] = monthLabel.split(' ');
    const monthIndex = new Date(`${month} 1, 20${year}`).getMonth();
    const fullYear = 2000 + parseInt(year);
    
    const filtered = allComplaints.filter(c => 
        c.date.getMonth() === monthIndex && c.date.getFullYear() === fullYear
    );
    
    currentFilter = { type: 'month', value: monthLabel };
    document.getElementById('tableTitle').innerText = `Activity: ${monthLabel}`;
    document.getElementById('clearFilterBtn').classList.remove('hidden');
    updateActivityTable(filtered);
}

function filterByCategory(category) {
    const filtered = allComplaints.filter(c => (c.category || 'General') === category);
    
    currentFilter = { type: 'category', value: category };
    document.getElementById('tableTitle').innerText = `Category: ${category}`;
    document.getElementById('clearFilterBtn').classList.remove('hidden');
    updateActivityTable(filtered);
}

function filterByRating(rating) {
    const filtered = allReviews.filter(r => r.rating === rating);
    
    currentFilter = { type: 'rating', value: `${rating} Stars` };
    document.getElementById('tableTitle').innerText = `Rating: ${rating} Stars`;
    document.getElementById('clearFilterBtn').classList.remove('hidden');
    updateActivityTable(filtered);
}

function clearFilter() {
    currentFilter = null;
    document.getElementById('tableTitle').innerText = 'Recent Activity';
    document.getElementById('clearFilterBtn').classList.add('hidden');
    updateActivityTable();
}

// Initialize
initStatisticsPage();