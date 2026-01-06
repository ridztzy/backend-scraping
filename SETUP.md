# 🚀 Quick Setup Guide

## Backend Scraping - Setup dalam 3 Langkah

### 1️⃣ Install Dependencies

```bash
cd backend-scraping
npm install
```

### 2️⃣ Setup Environment Variables

Buat file `.env` di root folder:

```env
PORT=5000

# CORS - URL Frontend Anda
FRONTEND_URL=https://your-app.vercel.app

# Appwrite Upload (OPSIONAL)
ENABLE_APPWRITE=false

# Jika ENABLE_APPWRITE=true, isi yang di bawah:
# APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
# APPWRITE_PROJECT_ID=your_project_id
# APPWRITE_API_KEY=your_api_key
# APPWRITE_BUCKET_ID=your_bucket_id
```

### 3️⃣ Run Server

```bash
# Development
npm run dev

# Production
npm start
```

Server akan berjalan di: `http://localhost:5000`

---

## ✅ Testing Endpoints

### Health Check

```bash
curl http://localhost:5000/api/health
```

### Test Scraping Play Store

```bash
curl -X POST http://localhost:5000/api/scrape-playstore \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "com.whatsapp",
    "numReviews": 10,
    "sort": 1,
    "stars": 0
  }'
```

### Test Scraping Twitter

```bash
curl -X POST http://localhost:5000/api/scrape-twitter \
  -H "Content-Type: application/json" \
  -d '{
    "query": "javascript",
    "count": 10,
    "type": "search"
  }'
```

---

## 🌐 Deploy ke Render

1. **Push ke GitHub**

   ```bash
   git init
   git add .
   git commit -m "Initial commit: Scraping backend"
   git remote add origin https://github.com/your-username/backend-scraping.git
   git push -u origin main
   ```

2. **Buat Web Service di Render.com**

   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render akan auto-detect `render.yaml`

3. **Set Environment Variables di Render Dashboard**

   - `PORT` = 5000
   - `FRONTEND_URL` = URL frontend Anda
   - `ENABLE_APPWRITE` = false (atau true jika mau aktifkan)
   - Jika Appwrite enabled, tambahkan:
     - `APPWRITE_ENDPOINT`
     - `APPWRITE_PROJECT_ID`
     - `APPWRITE_API_KEY`
     - `APPWRITE_BUCKET_ID`

4. **Deploy!**
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Click "Create Web Service"

---

## 💡 Important Notes

### ⚠️ Backend INI HANYA Untuk Scraping

- ❌ **Tidak** handle authentication
- ❌ **Tidak** handle authorization
- ❌ **Tidak** perlu Twitter API tokens
- ✅ **Hanya** scraping data publik
- ✅ **Hanya** generate & return CSV

### 🔐 Twitter Authentication

Jika frontend Anda memerlukan user login ke Twitter:

- Handle di **FRONTEND** saja
- Backend hanya scraping data yang sudah public
- Tidak perlu pass token ke backend

### 📁 Appwrite Upload

**Default: DISABLED**

```env
ENABLE_APPWRITE=false
```

→ CSV dikembalikan di response sebagai string

**Jika perlu enable:**

```env
ENABLE_APPWRITE=true
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_id
APPWRITE_API_KEY=your_key
APPWRITE_BUCKET_ID=your_bucket
```

→ CSV di-upload ke Appwrite Storage

---

## 🤝 Integration dengan Frontend

```javascript
// Example: Fetch dari Next.js
const scrapPlayStore = async () => {
  const response = await fetch(
    "https://your-backend.onrender.com/api/scrape-playstore",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appId: "com.whatsapp",
        numReviews: 100,
      }),
    }
  );

  const data = await response.json();

  if (data.csv.uploaded) {
    // Appwrite enabled - ada download URL
    window.open(data.csv.downloadUrl);
  } else {
    // Appwrite disabled - CSV ada di response
    downloadCSV(data.csv.content, "reviews.csv");
  }
};

function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
```

---

## 📞 Support

Jika ada masalah:

1. Cek server logs
2. Pastikan `.env` sudah benar
3. Pastikan dependencies sudah terinstall
4. Cek CORS setting (`FRONTEND_URL`)

---

## ✨ That's It!

Backend scraping sudah siap dipakai. Simple, fokus, dan production-ready! 🎉
