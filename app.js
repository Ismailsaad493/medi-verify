let scannerActive = false;
let quaggaInitialized = false;

// --- DARK MODE THEME LOGIC ---
function toggleTheme() {
    const htmlObj = document.documentElement;
    if (htmlObj.classList.contains('dark')) {
        htmlObj.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        document.getElementById('theme-icon').innerText = '🌙';
    } else {
        htmlObj.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        document.getElementById('theme-icon').innerText = '☀️';
    }
}

// --- INITIALIZATION ---
window.onload = function() {
    // Theme setup
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        document.getElementById('theme-icon').innerText = '☀️';
    } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('theme-icon').innerText = '🌙';
    }

    // Auth setup
    updateNavVisibility();
    if (sessionStorage.getItem('isAdminLoggedIn') === 'true') { 
        switchView('admin-add'); 
    } else { 
        switchView('user-verify'); 
    }
};

// --- DATABASE SETUP ---
const defaultDatabase = {
  "8901234567890": { name: "Paracetamol 500mg", manufacturer: "Cipla Ltd", batch: "CIP2024A", expiry: "2026-08-31", status: "authentic", distribution: "India", purpose: "Used to reduce fever and relieve mild to moderate pain.", dosage: "1 tablet every 6 hours after food.", whoCanUse: "Adults and children above 12.", precaution: "Do not exceed the recommended dose.", sideEffects: "Rarely causes nausea.", scans: [] }
};
let medicineDatabase = JSON.parse(localStorage.getItem('medicineDB')) || defaultDatabase;
let reportsDatabase = JSON.parse(localStorage.getItem('reportsDB')) || [];
const userLocation = 'Chennai, Tamil Nadu, India';

// --- VIEW NAVIGATION AND AUTHENTICATION ---
function updateNavVisibility() {
    const isLoggedIn = sessionStorage.getItem('isAdminLoggedIn') === 'true';
    document.getElementById('nav-verify').classList.toggle('hidden', isLoggedIn);
    document.getElementById('nav-bot').classList.toggle('hidden', isLoggedIn);
    document.getElementById('nav-report').classList.toggle('hidden', isLoggedIn);
    document.getElementById('nav-admin-login').classList.toggle('hidden', isLoggedIn);
    
    document.getElementById('nav-admin-add').classList.toggle('hidden', !isLoggedIn);
    document.getElementById('nav-admin-list').classList.toggle('hidden', !isLoggedIn);
    document.getElementById('nav-logout').classList.toggle('hidden', !isLoggedIn);
}

function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.getElementById('view-' + viewName).classList.remove('hidden');
    
    if (viewName === 'admin-list') renderMedicineList();
    if (viewName !== 'user-verify' && scannerActive) stopScanner();
}

// --- SECURE EMAIL OTP LOGIN LOGIC ---
let generatedOTP = null;

function requireAdminLogin() {
    // Reset login form back to Email step
    document.getElementById('email-step').classList.remove('hidden');
    document.getElementById('otp-step').classList.add('hidden');
    document.getElementById('btn-login').classList.add('hidden');
    document.getElementById('admin-email').value = '';
    document.getElementById('admin-otp').value = '';
    document.getElementById('login-error').classList.add('hidden');
    document.getElementById('btn-send-otp').innerText = 'Send OTP';
    generatedOTP = null;

    switchView('admin-login');
}

function sendOTP() {
    const emailInput = document.getElementById('admin-email').value.trim();
    if (!emailInput || !emailInput.includes('@')) {
        alert('Please enter a valid email address.');
        return;
    }

    // Generate a secure 6-digit OTP
    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Simulate sending email
    alert(`📧 SECURITY SYSTEM SIMULATION\n\nAn email has been sent to: ${emailInput}\n\nYour Temporary OTP is: ${generatedOTP}`);

    // Update UI to reveal the OTP field
    document.getElementById('otp-step').classList.remove('hidden');
    document.getElementById('btn-login').classList.remove('hidden');
    document.getElementById('btn-send-otp').innerText = 'Resend OTP';
    document.getElementById('login-error').classList.add('hidden');
}

function handleAdminLogin(event) {
    event.preventDefault();
    const enteredOTP = document.getElementById('admin-otp').value.trim();
    const errorMsg = document.getElementById('login-error');

    if (!generatedOTP) {
        alert('Please request an OTP first by entering your email.');
        return;
    }

    // Verify OTP
    if (enteredOTP === generatedOTP) {
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        errorMsg.classList.add('hidden');
        document.getElementById('admin-login-form').reset();
        generatedOTP = null; // Clear OTP after success
        
        updateNavVisibility();
        switchView('admin-add'); // redirect to dashboard successfully
    } else {
        errorMsg.classList.remove('hidden');
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('isAdminLoggedIn');
    alert("Admin logged out successfully.");
    updateNavVisibility();
    switchView('user-verify');
}

// --- ADMIN CRUD FUNCTIONS ---
function addMedicine(event) {
    event.preventDefault();
    const barcode = document.getElementById('new-barcode').value.trim();
    medicineDatabase[barcode] = {
        name: document.getElementById('new-name').value.trim(), manufacturer: document.getElementById('new-manufacturer').value.trim(),
        batch: document.getElementById('new-batch').value.trim(), expiry: document.getElementById('new-expiry').value,
        status: document.getElementById('new-status').value, distribution: "India", purpose: document.getElementById('new-purpose').value.trim(),
        dosage: document.getElementById('new-dosage').value.trim(), whoCanUse: document.getElementById('new-who').value.trim(),
        precaution: document.getElementById('new-precaution').value.trim(), sideEffects: document.getElementById('new-sideeffects').value.trim(), scans: []
    };
    localStorage.setItem('medicineDB', JSON.stringify(medicineDatabase));
    alert(`Success! Added securely to the database.`);
    document.getElementById('add-medicine-form').reset();
}

function renderMedicineList() {
    const tbody = document.getElementById('medicine-table-body');
    tbody.innerHTML = '';
    for (const [barcode, med] of Object.entries(medicineDatabase)) {
        const row = document.createElement('tr');
        let statusColor = med.status === 'authentic' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">${barcode}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${med.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm"><span class="px-2 inline-flex text-xs font-semibold rounded-full ${statusColor}">${med.status.toUpperCase()}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editMedicine('${barcode}')" class="text-blue-600 hover:text-blue-900 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-md transition border border-blue-200 dark:border-blue-800">Edit</button>
            </td>`;
        tbody.appendChild(row);
    }
}

function editMedicine(barcode) {
    const med = medicineDatabase[barcode];
    document.getElementById('edit-barcode').value = barcode;
    document.getElementById('edit-name').value = med.name;
    document.getElementById('edit-manufacturer').value = med.manufacturer;
    document.getElementById('edit-batch').value = med.batch;
    document.getElementById('edit-expiry').value = med.expiry;
    document.getElementById('edit-purpose').value = med.purpose;
    document.getElementById('edit-dosage').value = med.dosage;
    document.getElementById('edit-who').value = med.whoCanUse;
    document.getElementById('edit-precaution').value = med.precaution;
    document.getElementById('edit-sideeffects').value = med.sideEffects;
    document.getElementById('edit-status').value = med.status;
    switchView('admin-edit');
}

function updateMedicine(event) {
    event.preventDefault();
    const barcode = document.getElementById('edit-barcode').value;
    const existingScans = medicineDatabase[barcode].scans || [];
    medicineDatabase[barcode] = {
        name: document.getElementById('edit-name').value, manufacturer: document.getElementById('edit-manufacturer').value,
        batch: document.getElementById('edit-batch').value, expiry: document.getElementById('edit-expiry').value,
        status: document.getElementById('edit-status').value, distribution: "India", purpose: document.getElementById('edit-purpose').value,
        dosage: document.getElementById('edit-dosage').value, whoCanUse: document.getElementById('edit-who').value,
        precaution: document.getElementById('edit-precaution').value, sideEffects: document.getElementById('edit-sideeffects').value, scans: existingScans
    };
    localStorage.setItem('medicineDB', JSON.stringify(medicineDatabase));
    alert('Medicine updated successfully!');
    switchView('admin-list');
}

function deleteMedicine(barcode) {
    if (confirm('Are you sure you want to completely remove this record?')) {
        delete medicineDatabase[barcode];
        localStorage.setItem('medicineDB', JSON.stringify(medicineDatabase));
        switchView('admin-list');
    }
}

function viewScanHistory(barcode) {
    const med = medicineDatabase[barcode];
    document.getElementById('history-subtitle').innerText = `Viewing history for ${med.name} (Barcode: ${barcode})`;
    const tbody = document.getElementById('scan-history-body');
    tbody.innerHTML = '';
    if (!med.scans || med.scans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="px-6 py-4 text-center text-sm text-gray-500">No scans recorded yet.</td></tr>';
    } else {
        med.scans.forEach(scan => {
            tbody.innerHTML += `<tr><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">${new Date(scan.timestamp).toLocaleString()}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${scan.location}</td></tr>`;
        });
    }
    switchView('admin-history');
}

// --- USER REPORTS ---
function openReportForm(barcode = '', batch = '') {
    document.getElementById('report-barcode').value = barcode;
    document.getElementById('report-batch').value = batch;
    document.getElementById('report-city').value = '';
    document.getElementById('report-reason').value = '';
    
    // Ensure the file input is cleared every time the form is opened
    const photoInput = document.getElementById('report-photo');
    if(photoInput) photoInput.value = '';
    
    switchView('user-report');
}

function submitReport(event) {
    event.preventDefault();
    
    // In a real full-stack app, this is where you would upload the photo file to a server
    // const photoFile = document.getElementById('report-photo').files[0];
    
    reportsDatabase.push({
        barcode: document.getElementById('report-barcode').value.trim(), 
        batch: document.getElementById('report-batch').value.trim(),
        city: document.getElementById('report-city').value.trim(), 
        reason: document.getElementById('report-reason').value.trim(), 
        timestamp: new Date()
    });
    
    localStorage.setItem('reportsDB', JSON.stringify(reportsDatabase));
    alert("Thank you! Your report has been submitted.");
    switchView('user-verify');
}

// --- CHATBOT MODULE ---
function handleChatKeyPress(event) { if (event.key === 'Enter') sendChatMessage(); }

function sendChatMessage() {
    const inputField = document.getElementById('chat-input');
    const message = inputField.value.trim();
    if (!message) return;
    addMessageToChat('user', message);
    inputField.value = '';
    setTimeout(() => {
        const keywords = message.toLowerCase().split(/[\s,]+/); let matches = [];
        for (const [b, med] of Object.entries(medicineDatabase)) { if (med.purpose && med.status !== 'recalled' && keywords.some(k => k.length > 3 && med.purpose.toLowerCase().includes(k))) matches.push(med); }
        let response = matches.length > 0 ? "<p class='mb-2'>Matches:</p>" + Array.from(new Set(matches.map(m => m.name))).map(n => matches.find(m => m.name === n)).map(med => `<div class="bg-white dark:bg-gray-700 rounded p-3 mt-2"><strong>💊 ${med.name}</strong><br><span class="text-sm"><em>Purpose:</em> ${med.purpose}</span></div>`).join('') : "No medicines found for those symptoms.";
        addMessageToChat('bot', response);
    }, 800);
}

function addMessageToChat(sender, text) {
    const chatWindow = document.getElementById('chat-window'); const messageDiv = document.createElement('div');
    messageDiv.className = sender === 'user' ? 'flex items-end justify-end' : 'flex items-start';
    messageDiv.innerHTML = `<div class="${sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100'} rounded-lg p-3 max-w-[85%] shadow-sm">${text}</div>`;
    chatWindow.appendChild(messageDiv); chatWindow.scrollTop = chatWindow.scrollHeight;
}

// --- SCANNER AND VERIFICATION MODULE ---
function initScanner() {
    if (scannerActive) { stopScanner(); return; }
    const video = document.getElementById('video');
    const placeholder = document.getElementById('scanner-placeholder');
    placeholder.classList.add('hidden');
    scannerActive = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
        video.srcObject = stream; video.play();
        if (!quaggaInitialized) {
            Quagga.init({ inputStream: { name: "Live", type: "LiveStream", target: video }, decoder: { readers: ["ean_reader", "ean_8_reader", "code_128_reader"] } }, function(err) { if (err) return; quaggaInitialized = true; Quagga.start(); });
            Quagga.onDetected(function(result) { verifyBarcode(result.codeResult.code); stopScanner(); });
        }
    }).catch(function() { alert("Camera access denied. HTTPS is required."); placeholder.classList.remove('hidden'); scannerActive = false; });
}

function stopScanner() {
    const video = document.getElementById('video');
    if (video.srcObject) { video.srcObject.getTracks().forEach(track => track.stop()); video.srcObject = null; }
    if (quaggaInitialized) Quagga.stop();
    document.getElementById('scanner-placeholder').classList.remove('hidden'); scannerActive = false;
}

function verifyManualInput() {
    verifyBarcode(document.getElementById('barcode-input').value.trim(), document.getElementById('medicine-name').value.trim());
}

function verifyBarcode(barcode, medicineName = '') {
    if (!barcode) return alert('Please enter a barcode');
    
    const instSection = document.getElementById('instructions-section');
    if(instSection) instSection.classList.add('hidden');
    
    document.getElementById('results-section').classList.remove('hidden');
    const resultCard = document.getElementById('result-card');
    resultCard.classList.add('show');
    
    resultCard.innerHTML = `<div class="text-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div><p class="text-gray-600 dark:text-gray-300 font-medium">Querying Pharmaceutical Database...</p></div>`;
    
    setTimeout(() => {
        const result = medicineDatabase[barcode] || { name: medicineName || 'Unknown Medicine', manufacturer: 'Unknown', batch: 'N/A', expiry: 'N/A', status: 'unknown', distribution: 'Unknown', purpose: 'Not specified', dosage: 'Consult doctor', whoCanUse: 'Consult doctor', precaution: 'Consult doctor', sideEffects: 'None', scans: [] };
        if (!result.scans) result.scans = [];
        result.scans.push({ location: userLocation, timestamp: new Date() });
        displayResults(result, barcode);
    }, 1500);
}

function calculateAuthenticityScore(result) {
    let score = 'F'; let statusMessage = 'Unknown'; let issues = [];
    const batchReports = reportsDatabase.filter(r => r.batch === result.batch && result.batch !== 'N/A');
    if (batchReports.length >= 2) { score = 'D'; statusMessage = 'Suspicious Product'; issues.push(`⚠️ COMMUNITY ALERT: This batch (${result.batch}) has multiple complaints.`); }
    if (result.status === 'authentic' && score !== 'D') { score = 'A'; statusMessage = 'Authentic'; } else if (result.status === 'recalled') { score = 'C'; statusMessage = 'Recalled'; issues.push('⚠️ Recalled product.'); }
    return { score, statusMessage, issues };
}

function displayResults(result, barcode) {
    const resultCard = document.getElementById('result-card');
    const { score, statusMessage, issues } = calculateAuthenticityScore(result);

    let statusColor = score === 'A' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    let borderClass = score === 'A' ? 'border-green-500' : 'border-red-500';

    const issuesHtml = issues.length > 0 ? `
        <div class="mt-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
            <h5 class="font-semibold text-red-800 dark:text-red-300 mb-2">Issues Detected:</h5>
            <ul class="list-disc list-inside text-sm text-red-700 dark:text-red-400 space-y-1">${issues.map(i => `<li>${i}</li>`).join('')}</ul>
        </div>` : '';

    resultCard.innerHTML = `
        <div class="p-8 border-l-4 ${borderClass} rounded-r-xl bg-white dark:bg-gray-800">
            <div class="mb-6">
                <h4 class="text-xl font-bold ${statusColor} mb-2">${score === 'A' ? '✅' : '❌'} Authenticity Score: ${score} - ${statusMessage}</h4>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">${result.name}</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">Barcode: ${barcode}</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border-b border-gray-100 dark:border-gray-700 pb-6 text-gray-900 dark:text-white">
                <div><p class="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Manufacturer</p><p class="text-lg font-medium">${result.manufacturer}</p></div>
                <div><p class="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Batch Number</p><p class="text-lg font-medium">${result.batch}</p></div>
                <div><p class="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Expiry Date</p><p class="text-lg font-medium">${result.expiry}</p></div>
            </div>
            
            <div class="space-y-4">
                <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"><p class="font-bold text-green-900 dark:text-green-300">Purpose:</p><p class="text-green-800 dark:text-green-400 text-sm">${result.purpose}</p></div>
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"><p class="font-bold text-blue-900 dark:text-blue-300">Dosage:</p><p class="text-blue-800 dark:text-blue-400 text-sm">${result.dosage}</p></div>
                <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"><p class="font-bold text-yellow-900 dark:text-yellow-300">Who Can Use:</p><p class="text-yellow-800 dark:text-yellow-400 text-sm">${result.whoCanUse}</p></div>
                <div class="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4"><p class="font-bold text-teal-900 dark:text-teal-300">Precaution:</p><p class="text-teal-800 dark:text-teal-400 text-sm">${result.precaution}</p></div>
                <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4"><p class="font-bold text-orange-900 dark:text-orange-300">Side Effects:</p><p class="text-orange-800 dark:text-orange-400 text-sm">${result.sideEffects}</p></div>
            </div>
            ${issuesHtml}
            <div class="mt-8 flex flex-col md:flex-row justify-center gap-4">
                <button onclick="verifyAnother()" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg shadow-md transition">Verify Another Medicine</button>
                <button onclick="openReportForm('${barcode}', '${result.batch}')" class="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 font-medium py-3 px-8 rounded-lg transition">Report as Fake</button>
            </div>
        </div>`;
}

function verifyAnother() {
    document.getElementById('barcode-input').value = '';
    document.getElementById('result-card').classList.remove('show');
    document.getElementById('results-section').classList.add('hidden');
    
    const instSection = document.getElementById('instructions-section');
    if(instSection) instSection.classList.remove('hidden');
    
    if (scannerActive) stopScanner();
}