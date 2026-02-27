let scannerActive = false;
let quaggaInitialized = false;

// --- DYNAMIC SVG ICONS FOR DARK MODE ---
const sunIcon = `<svg class="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 4.22a1 1 0 011.415 0l.708.708a1 1 0 01-1.414 1.414l-.708-.708a1 1 0 010-1.414zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM14.22 15.78a1 1 0 010 1.415l-.708.708a1 1 0 01-1.414-1.414l.708-.708a1 1 0 011.415 0zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.22-1.42a1 1 0 01-1.415 0l-.708-.708a1 1 0 011.414-1.414l.708.708a1 1 0 010 1.414zM4 10a1 1 0 01-1 1H2a1 1 0 110-2h1a1 1 0 011 1zM5.78 5.78a1 1 0 010-1.415l.708-.708a1 1 0 011.414 1.414l-.708.708a1 1 0 01-1.415 0z"/><path fill-rule="evenodd" d="M10 5a5 5 0 100 10 5 5 0 000-10zm0 8a3 3 0 110-6 3 3 0 010 6z" clip-rule="evenodd"/></svg>`;
const moonIcon = `<svg class="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>`;

function toggleTheme() {
    const htmlObj = document.documentElement;
    if (htmlObj.classList.contains('dark')) {
        htmlObj.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        document.getElementById('theme-icon').innerHTML = moonIcon;
    } else {
        htmlObj.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        document.getElementById('theme-icon').innerHTML = sunIcon;
    }
}

window.onload = function() {
    const themeIconElement = document.getElementById('theme-icon');
    
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        if(themeIconElement) themeIconElement.innerHTML = sunIcon;
    } else {
        document.documentElement.classList.remove('dark');
        if(themeIconElement) themeIconElement.innerHTML = moonIcon;
    }

    updateNavVisibility();
    if (sessionStorage.getItem('isAdminLoggedIn') === 'true') { 
        switchView('admin-add'); 
    } else { 
        switchView('home'); 
    }
};

let usersDatabase = JSON.parse(localStorage.getItem('usersDB')) || {
    "admin@mediverify.com": { name: "System Admin", mobile: "0000000000", org: "MediVerify Corp", role: "Manufacturer", license: "SYS-001", password: "admin123" }
};
localStorage.setItem('usersDB', JSON.stringify(usersDatabase));

const defaultDatabase = {
  "8901234567890": { name: "Paracetamol 500mg", manufacturer: "Cipla Ltd", batch: "CIP2024A", expiry: "2026-08-31", status: "authentic", distribution: "India", purpose: "Used to reduce fever and relieve mild to moderate pain.", dosage: "1 tablet every 6 hours after food.", whoCanUse: "Adults and children above 12.", precaution: "Do not exceed the recommended dose.", sideEffects: "Rarely causes nausea.", scans: [] }
};
let medicineDatabase = JSON.parse(localStorage.getItem('medicineDB')) || defaultDatabase;
let reportsDatabase = JSON.parse(localStorage.getItem('reportsDB')) || [];
const userLocation = 'Chennai, Tamil Nadu, India';

function updateNavVisibility() {
    const isLoggedIn = sessionStorage.getItem('isAdminLoggedIn') === 'true';
    document.getElementById('public-auth-btns').classList.toggle('hidden', isLoggedIn);
    document.getElementById('public-auth-btns').classList.toggle('flex', !isLoggedIn);
    document.getElementById('admin-auth-btns').classList.toggle('hidden', !isLoggedIn);
    document.getElementById('admin-auth-btns').classList.toggle('flex', isLoggedIn);
}

function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.getElementById('view-' + viewName).classList.remove('hidden');
    
    // Proper handling to fix the mobile nav bug
    const desktopLinks = document.getElementById('nav-landing-links-desktop');
    const mobileLinks = document.getElementById('nav-landing-links-mobile');
    
    if (viewName === 'home') {
        if(desktopLinks) desktopLinks.style.display = '';
        if(mobileLinks) mobileLinks.style.display = '';
    } else {
        if(desktopLinks) desktopLinks.style.display = 'none';
        if(mobileLinks) mobileLinks.style.display = 'none';
    }

    if (viewName === 'admin-list') renderMedicineList();
    if (viewName !== 'home' && scannerActive) stopScanner();
    window.scrollTo(0,0);
}

function goToSection(sectionId) {
    if (document.getElementById('view-home').classList.contains('hidden')) {
        switchView('home');
        setTimeout(() => {
            document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
            if(sectionId === 'verify-section') document.getElementById('barcode-input').focus();
        }, 100);
    } else {
        document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
        if(sectionId === 'verify-section') document.getElementById('barcode-input').focus();
    }
}

let pendingRegistration = null;
let registrationOTP = null;

function requireAdminLogin(mode = 'register') {
    toggleAuthMode(mode); 
    switchView('admin-login');
}

function toggleAuthMode(mode) {
    document.getElementById('form-login').classList.add('hidden');
    document.getElementById('form-register').classList.add('hidden');
    document.getElementById('form-register-otp').classList.add('hidden');
    
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    
    tabLogin.className = "w-1/2 py-4 sm:py-5 text-center font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition outline-none text-sm sm:text-base";
    tabRegister.className = "w-1/2 py-4 sm:py-5 text-center font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition outline-none text-sm sm:text-base";

    if(mode === 'login') {
        document.getElementById('form-login').classList.remove('hidden');
        tabLogin.className = "w-1/2 py-4 sm:py-5 text-center font-bold bg-white dark:bg-gray-800 text-[#6b21a8] dark:text-[#a855f7] border-b-2 border-[#6b21a8] dark:border-[#a855f7] transition outline-none text-sm sm:text-base";
        document.getElementById('login-error').classList.add('hidden');
        document.getElementById('form-login').reset();
    } else {
        document.getElementById('form-register').classList.remove('hidden');
        tabRegister.className = "w-1/2 py-4 sm:py-5 text-center font-bold bg-white dark:bg-gray-800 text-[#6b21a8] dark:text-[#a855f7] border-b-2 border-[#6b21a8] dark:border-[#a855f7] transition outline-none text-sm sm:text-base";
        document.getElementById('form-register').reset();
        document.getElementById('form-register-otp').reset();
        pendingRegistration = null;
        registrationOTP = null;
    }
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    const errorMsg = document.getElementById('login-error');

    if (usersDatabase[email] && usersDatabase[email].password === pass) {
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        errorMsg.classList.add('hidden');
        document.getElementById('form-login').reset();
        updateNavVisibility();
        switchView('admin-add');
    } else {
        errorMsg.classList.remove('hidden');
    }
}

function handleRegisterSubmit(event) {
    event.preventDefault();
    const pass = document.getElementById('reg-pass').value;
    const cpass = document.getElementById('reg-cpass').value;
    const email = document.getElementById('reg-email').value.trim();
    const mobile = document.getElementById('reg-mobile').value.trim();
    
    if(pass !== cpass) return alert("Passwords do not match!");
    if(usersDatabase[email]) return alert("This Email is already registered!");

    pendingRegistration = {
        name: document.getElementById('reg-name').value.trim(),
        email: email, mobile: mobile,
        org: document.getElementById('reg-org').value.trim(),
        role: document.getElementById('reg-role').value,
        license: document.getElementById('reg-license').value.trim(),
        password: pass 
    };

    registrationOTP = Math.floor(100000 + Math.random() * 900000).toString();
    alert(`📧 SECURITY SYSTEM SIMULATION\n\nRegistration OTP sent to:\nEmail: ${email}\nMobile: ${mobile}\n\nYour Temporary Registration OTP is: ${registrationOTP}`);

    document.getElementById('form-register').classList.add('hidden');
    document.getElementById('form-register-otp').classList.remove('hidden');
}

function verifyRegisterOTP(event) {
    event.preventDefault();
    const enteredOTP = document.getElementById('reg-otp-input').value.trim();
    
    if(enteredOTP === registrationOTP) {
        usersDatabase[pendingRegistration.email] = pendingRegistration;
        localStorage.setItem('usersDB', JSON.stringify(usersDatabase));
        alert("✅ Registration Successful! You can now log in securely with your Email and Password.");
        toggleAuthMode('login');
    } else {
        alert("❌ Invalid OTP! Please try again.");
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('isAdminLoggedIn');
    alert("Admin logged out successfully.");
    updateNavVisibility();
    switchView('home');
}

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
        row.className = "hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150"; 
        let statusColor = med.status === 'authentic' ? 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' : 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
        const scanCount = med.scans ? med.scans.length : 0;

        row.innerHTML = `
            <td class="px-4 sm:px-5 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">${barcode}</td>
            <td class="px-4 sm:px-5 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate max-w-[120px] sm:max-w-none">${med.name}</td>
            <td class="px-4 sm:px-5 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                <span class="px-2 sm:px-2.5 py-0.5 sm:py-1 inline-flex text-[8px] sm:text-[10px] font-extrabold rounded-full tracking-wide ${statusColor}">
                    ${med.status.toUpperCase()}
                </span>
            </td>
            <td class="px-4 sm:px-5 py-3 sm:py-4 whitespace-nowrap text-center text-xs sm:text-sm">
                <button onclick="viewScanHistory('${barcode}')" class="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition font-bold text-[10px] sm:text-xs">
                    Logs (${scanCount})
                </button>
            </td>
            <td class="px-4 sm:px-5 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                <button onclick="editMedicine('${barcode}')" class="text-[#6b21a8] hover:text-[#581c87] bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-[#a855f7] dark:hover:bg-purple-900/50 px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg transition font-bold text-[10px] sm:text-xs shadow-sm">
                    Edit
                </button>
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
        tbody.innerHTML = '<tr><td colspan="2" class="px-4 sm:px-8 py-3 sm:py-5 text-center text-xs sm:text-sm font-medium text-gray-500">No scans recorded yet.</td></tr>';
    } else {
        med.scans.forEach(scan => {
            tbody.innerHTML += `<tr><td class="px-4 sm:px-8 py-3 sm:py-5 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">${new Date(scan.timestamp).toLocaleString()}</td><td class="px-4 sm:px-8 py-3 sm:py-5 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400">${scan.location}</td></tr>`;
        });
    }
    switchView('admin-history');
}

function openReportForm(barcode = '', batch = '') {
    if (!document.getElementById('view-home').classList.contains('hidden')) {
        document.getElementById('report-barcode').value = barcode;
        document.getElementById('report-batch').value = batch;
        goToSection('report-section');
    } else {
        switchView('home');
        setTimeout(() => {
            document.getElementById('report-barcode').value = barcode;
            document.getElementById('report-batch').value = batch;
            goToSection('report-section');
        }, 100);
    }
}

function submitReport(event) {
    event.preventDefault();
    reportsDatabase.push({
        barcode: document.getElementById('report-barcode').value.trim(), batch: document.getElementById('report-batch').value.trim(),
        city: document.getElementById('report-city').value.trim(), reason: document.getElementById('report-reason').value.trim(), timestamp: new Date()
    });
    localStorage.setItem('reportsDB', JSON.stringify(reportsDatabase));
    alert("Thank you! Your report has been submitted.");
    document.getElementById('report-form').reset();
    goToSection('home');
}

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
        let response = matches.length > 0 ? "<p class='mb-2'>Matches:</p>" + Array.from(new Set(matches.map(m => m.name))).map(n => matches.find(m => m.name === n)).map(med => `<div class="bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 p-3 mt-2"><strong>💊 ${med.name}</strong><br><span class="text-xs sm:text-sm text-gray-600 dark:text-gray-300"><em>Purpose:</em> ${med.purpose}</span></div>`).join('') : "No medicines found for those symptoms.";
        addMessageToChat('bot', response);
    }, 800);
}

function addMessageToChat(sender, text) {
    const chatWindow = document.getElementById('chat-window'); const messageDiv = document.createElement('div');
    messageDiv.className = sender === 'user' ? 'flex items-end justify-end' : 'flex items-start';
    messageDiv.innerHTML = `<div class="${sender === 'user' ? 'bg-[#6b21a8] text-white rounded-tr-none' : 'bg-[#f3e8ff] dark:bg-purple-900/40 text-[#6b21a8] dark:text-purple-100 rounded-tl-none border border-purple-100 dark:border-purple-800'} rounded-2xl p-3 sm:p-4 max-w-[90%] sm:max-w-[85%] shadow-sm font-medium text-sm sm:text-base">${text}</div>`;
    chatWindow.appendChild(messageDiv); chatWindow.scrollTop = chatWindow.scrollHeight;
}

function initScanner() {
    document.getElementById('instructions-section').classList.add('hidden');
    document.getElementById('results-section').classList.add('hidden');
    const scannerContainer = document.getElementById('scanner-container');
    
    scannerContainer.classList.remove('hidden');
    if (scannerActive) return;
    
    const video = document.getElementById('video');
    scannerActive = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
        video.srcObject = stream; video.play();
        if (!quaggaInitialized) {
            Quagga.init({ inputStream: { name: "Live", type: "LiveStream", target: video }, decoder: { readers: ["ean_reader", "ean_8_reader", "code_128_reader"] } }, function(err) { if (err) return; quaggaInitialized = true; Quagga.start(); });
            Quagga.onDetected(function(result) { verifyBarcode(result.codeResult.code); stopScanner(); });
        }
    }).catch(function() { alert("Camera access denied. HTTPS is required."); scannerContainer.classList.add('hidden'); document.getElementById('instructions-section').classList.remove('hidden'); scannerActive = false; });
}

function stopScanner() {
    const video = document.getElementById('video');
    if (video.srcObject) { video.srcObject.getTracks().forEach(track => track.stop()); video.srcObject = null; }
    if (quaggaInitialized) Quagga.stop();
    document.getElementById('scanner-container').classList.add('hidden'); 
    scannerActive = false;
    
    if(document.getElementById('results-section').classList.contains('hidden')) {
        document.getElementById('instructions-section').classList.remove('hidden');
    }
}

function verifyManualInput() { verifyBarcode(document.getElementById('barcode-input').value.trim()); }

function verifyBarcode(barcode) {
    if (!barcode) return alert('Please enter a barcode');
    
    if (scannerActive) stopScanner();
    document.getElementById('instructions-section').classList.add('hidden');
    document.getElementById('results-section').classList.remove('hidden');
    const resultCard = document.getElementById('result-card');
    resultCard.classList.add('show');
    
    resultCard.innerHTML = `<div class="text-center py-10 sm:py-16"><div class="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-4 border-[#6b21a8] mx-auto mb-4"></div><p class="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-bold">Querying Authentic Databases...</p></div>`;
    
    setTimeout(() => {
        const result = medicineDatabase[barcode];
        if (result && result.status !== 'unknown') {
            if (!result.scans) result.scans = [];
            result.scans.push({ location: userLocation, timestamp: new Date() });
            displayResults(result, barcode);
        } else {
            displayUnknownResult(barcode);
        }
    }, 1500);
}

function displayUnknownResult(barcode) {
    const resultCard = document.getElementById('result-card');
    resultCard.innerHTML = `
        <div class="p-5 sm:p-8 border-l-4 sm:border-l-8 border-red-500 bg-white dark:bg-gray-800 rounded-r-xl">
            <div class="flex items-start justify-between">
                <div>
                    <h4 class="text-xl sm:text-2xl font-extrabold text-red-600 dark:text-red-400 mb-1.5 sm:mb-2 tracking-wide">❌ UNKNOWN BARCODE</h4>
                    <p class="text-gray-600 dark:text-gray-300 font-medium text-sm sm:text-lg break-all">Barcode <span class="font-bold text-gray-900 dark:text-white">${barcode}</span> is not registered.</p>
                </div>
                <button onclick="verifyAnother()" class="text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                    <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="mt-6 sm:mt-8 p-4 sm:p-5 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                <h5 class="font-bold text-red-800 dark:text-red-300 mb-1.5 sm:mb-2 text-sm sm:text-base">⚠️ Warning</h5>
                <p class="text-xs sm:text-sm text-red-700 dark:text-red-400 font-medium">This product could be counterfeit. Do not consume it. Please report it to help protect the community.</p>
            </div>
            <div class="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-start gap-3 sm:gap-4">
                <button onclick="verifyAnother()" class="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl shadow-lg hover:shadow-xl transition text-sm sm:text-base">Try Another</button>
                <button onclick="openReportForm('${barcode}', '')" class="bg-red-500 text-white font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl shadow-lg hover:bg-red-600 transition text-sm sm:text-base">Report as Fake</button>
            </div>
        </div>`;
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
        <div class="mt-6 sm:mt-8 p-4 sm:p-5 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
            <h5 class="font-bold text-red-800 dark:text-red-300 mb-1.5 sm:mb-2 text-sm sm:text-base">Security Issues Detected:</h5>
            <ul class="list-disc list-inside text-xs sm:text-sm text-red-700 dark:text-red-400 space-y-1.5 sm:space-y-2 font-medium">${issues.map(i => `<li>${i}</li>`).join('')}</ul>
        </div>` : '';

    resultCard.innerHTML = `
        <div class="p-5 sm:p-8 border-l-4 sm:border-l-8 ${borderClass} bg-white dark:bg-gray-800 rounded-r-xl">
            <div class="mb-6 sm:mb-8 border-b border-gray-100 dark:border-gray-700 pb-4 sm:pb-6 flex justify-between items-start">
                <div>
                    <h4 class="text-lg sm:text-xl font-extrabold ${statusColor} mb-1 sm:mb-2 uppercase tracking-wide">${score === 'A' ? '✅' : '❌'} Score: ${score} - ${statusMessage}</h4>
                    <h2 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1">${result.name}</h2>
                    <p class="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 break-all">Barcode: ${barcode}</p>
                </div>
                <button onclick="verifyAnother()" class="text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                    <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8 text-gray-900 dark:text-white">
                <div class="bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 rounded-xl border border-gray-100 dark:border-gray-700"><p class="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Manufacturer</p><p class="text-sm sm:text-lg font-bold truncate">${result.manufacturer}</p></div>
                <div class="bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 rounded-xl border border-gray-100 dark:border-gray-700"><p class="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Batch</p><p class="text-sm sm:text-lg font-bold truncate">${result.batch}</p></div>
                <div class="col-span-2 sm:col-span-1 bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 rounded-xl border border-gray-100 dark:border-gray-700"><p class="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Expiry Date</p><p class="text-sm sm:text-lg font-bold ${result.status==='expired'?'text-red-500':''} truncate">${result.expiry}</p></div>
            </div>
            
            <div class="space-y-3 sm:space-y-4">
                <div class="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-xl"><p class="font-bold text-blue-900 dark:text-blue-300 mb-0.5 sm:mb-1 text-xs sm:text-base">Purpose:</p><p class="text-blue-800 dark:text-blue-400 text-xs sm:text-sm font-medium">${result.purpose}</p></div>
                <div class="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-xl"><p class="font-bold text-green-900 dark:text-green-300 mb-0.5 sm:mb-1 text-xs sm:text-base">Dosage:</p><p class="text-green-800 dark:text-green-400 text-xs sm:text-sm font-medium">${result.dosage}</p></div>
                <div class="bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-xl"><p class="font-bold text-purple-900 dark:text-purple-300 mb-0.5 sm:mb-1 text-xs sm:text-base">Who Can Use:</p><p class="text-purple-800 dark:text-purple-400 text-xs sm:text-sm font-medium">${result.whoCanUse}</p></div>
                <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 sm:p-4 rounded-xl"><p class="font-bold text-yellow-900 dark:text-yellow-300 mb-0.5 sm:mb-1 text-xs sm:text-base">Precaution:</p><p class="text-yellow-800 dark:text-yellow-400 text-xs sm:text-sm font-medium">${result.precaution}</p></div>
                <div class="bg-orange-50 dark:bg-orange-900/20 p-3 sm:p-4 rounded-xl"><p class="font-bold text-orange-900 dark:text-orange-300 mb-0.5 sm:mb-1 text-xs sm:text-base">Side Effects:</p><p class="text-orange-800 dark:text-orange-400 text-xs sm:text-sm font-medium">${result.sideEffects}</p></div>
            </div>

            ${issuesHtml}

            <div class="mt-6 sm:mt-10 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                <button onclick="verifyAnother()" class="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl shadow-lg hover:shadow-xl transition text-sm sm:text-base">Verify Another</button>
                <button onclick="openReportForm('${barcode}', '${result.batch}')" class="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl transition hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 text-sm sm:text-base">Report as Fake</button>
            </div>
        </div>`;
}

function verifyAnother() {
    document.getElementById('barcode-input').value = '';
    document.getElementById('result-card').classList.remove('show');
    document.getElementById('results-section').classList.add('hidden');
    document.getElementById('instructions-section').classList.remove('hidden');
    if (scannerActive) stopScanner();
}