# MediVerify — MERN Stack

A medicine authenticity verification system. Converted from vanilla HTML/CSS/JS to a full **MERN** stack (MongoDB, Express, React, Node.js). **Zero UI or feature changes.**

---

## 📁 Project Structure

```
mca final sem project/
├── server/              ← Node.js + Express backend
│   ├── models/
│   │   ├── User.js
│   │   ├── Medicine.js
│   │   └── Report.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── medicines.js
│   │   └── reports.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── seed.js
│   └── .env             ← fill in your MONGO_URI
├── client/              ← React + Vite frontend
│   └── src/
│       ├── views/       ← All page views
│       ├── components/  ← NavBar
│       ├── api.js       ← Axios instance
│       └── App.jsx      ← Root component
└── index.html           ← Original files (keep for reference)
```

---

## 🚀 Setup & Run

### Prerequisites
- Node.js (v18+)
- MongoDB (local on port `27017` OR MongoDB Atlas URI)

### 1. Configure Backend

Edit `server/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/mediverify
JWT_SECRET=mediverify_super_secret_jwt_key_2026
```

### 2. Install & Seed Backend

```bash
cd server
npm install
node seed.js       # Creates default admin + sample medicine
npm run dev        # Starts backend on http://localhost:5000
```

### 3. Install & Start Frontend

```bash
cd client
npm install
npm run dev        # Starts frontend on http://localhost:5173
```

### 4. Open App

Go to: **http://localhost:5173**

---

## 🔑 Default Credentials

| Email                     | Password  |
|---------------------------|-----------|
| admin@mediverify.com      | admin123  |

---

## 🧪 Test the App

| Flow | Steps |
|------|-------|
| Barcode Verify | Enter `8901234567890` → Paracetamol result |
| Unknown Barcode | Enter `0000000000001` → Unknown warning |
| AI Bot | Type "fever" in chat → bot suggests medicines |
| Report | Fill report form → Success alert |
| Register | Sign up for free → 3-step OTP flow |
| Login | Login → Dashboard with KPIs & chart |
| Add Medicine | Admin → Register New Tablet → form |
| Edit/Delete | Admin → Database → Edit button |
| Scan Logs | Admin → Database → Logs button |
| Dark Mode | Click sun/moon icon in navbar |

---

## 🛠 Tech Stack

| Layer    | Tech |
|----------|------|
| Database | MongoDB + Mongoose |
| Backend  | Node.js + Express + JWT + bcryptjs |
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| HTTP     | Axios |
| Scanner  | QuaggaJS (CDN) |
| Charts   | Chart.js (CDN) |
