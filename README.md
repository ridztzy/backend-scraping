# Scraping Backend API

Backend untuk scraping Play Store reviews yang **100% match** dengan frontend Next.js.

## 🎯 Features

- ✅ **Play Store Scraping** - Reviews scraping dengan filter lengkap
- ✅ **Appwrite Upload (Opsional)** - Upload CSV ke Appwrite Storage
- ✅ **Stats Calculation** - Average rating & rating distribution
- ✅ **Preview Data** - 10 rows pertama untuk preview di frontend
- ✅ **CORS Ready** - Siap diintegrasikan dengan frontend

## 📡 API Endpoint

### POST /api/scrape-playstore

**Request Body** (Match dengan frontend):

```json
{
  "appId": "com.whatsapp",
  "limit": 100,
  "sort": "newest", // "newest" | "rating" | "helpful"
  "rating": "all", // "all" | "1" | "2" | "3" | "4" | "5"
  "lang": "id" // "id" | "en" | etc
}
```

**Response** (Match dengan frontend):

```json
{
  "ok": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "count": 150,
  "appwriteFileId": "abc123", // null jika Appwrite disabled
  "appwriteUrl": "https://...", // null jika Appwrite disabled
  "preview": [
    // 10 rows pertama
    {
      "id": "review-123",
      "userName": "John Doe",
      "userImage": "https://...",
      "date": "2024-01-06T...",
      "rating": 5,
      "reviewText": "Great app!",
      "replyDate": "",
      "replyText": "",
      "thumbsUp": 10,
      "version": "2.24.1"
    }
  ],
  "stats": {
    "avgRating": 4.52,
    "ratingDistribution": {
      "1": 5,
      "2": 3,
      "3": 10,
      "4": 32,
      "5": 100
    }
  }
}
```

**Error Response**:

```json
{
  "ok": false,
  "error": "Failed to scrape Play Store",
  "message": "Error details..."
}
```

## 🚀 Quick Start

### 1. Install

```bash
npm install
```

### 2. Setup .env

```env
PORT=5000
FRONTEND_URL=https://your-app.vercel.app

# Appwrite (OPTIONAL)
ENABLE_APPWRITE=false
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_BUCKET_ID=your_bucket_id
```

### 3. Run

```bash
# Development
npm run dev

# Production
npm start
```

Server: `http://localhost:5000`

## 🔧 Environment Variables

| Variable              | Required   | Default | Description            |
| --------------------- | ---------- | ------- | ---------------------- |
| `PORT`                | No         | 5000    | Server port            |
| `FRONTEND_URL`        | Yes        | \*      | Frontend URL for CORS  |
| `ENABLE_APPWRITE`     | No         | false   | Enable Appwrite upload |
| `APPWRITE_ENDPOINT`   | If enabled | -       | Appwrite endpoint      |
| `APPWRITE_PROJECT_ID` | If enabled | -       | Project ID             |
| `APPWRITE_API_KEY`    | If enabled | -       | API key                |
| `APPWRITE_BUCKET_ID`  | If enabled | -       | Bucket ID              |

## 💡 Key Differences from Initial Request

### ✅ Fixed Issues:

1. **Request Parameters** - Now matches frontend exactly:

   - ✅ `limit` (bukan `numReviews`)
   - ✅ `sort` as string (bukan angka)
   - ✅ `rating` (bukan `stars`)
   - ✅ `lang` parameter included

2. **Response Structure** - Now matches frontend expectations:

   - ✅ `ok` (bukan `success`)
   - ✅ `jobId` included (UUID)
   - ✅ `count` (bukan `totalReviews`)
   - ✅ `preview` only (10 rows, bukan full data)
   - ✅ `stats` with `avgRating` & `ratingDistribution`
   - ✅ `appwriteFileId` & `appwriteUrl` (bukan nested `csv` object)

3. **No Full CSV in Response** - Solves performance issue:

   - ❌ TIDAK return full CSV content di response
   - ✅ Return preview (10 rows) saja
   - ✅ Full CSV di-upload ke Appwrite (jika enabled)
   - ✅ Frontend bisa download dari `appwriteUrl`

4. **Focus on Play Store** - Twitter endpoint disabled:
   - ✅ Hanya Play Store endpoint (match frontend)
   - ⏸️ Twitter endpoint di-comment (belum ada di frontend)

## 🌐 Deploy to Render

1. Push to GitHub
2. Create Web Service di Render
3. Connect repository
4. Set environment variables
5. Deploy!

Render akan auto-detect `render.yaml`.

## 🤝 Frontend Integration

```javascript
const response = await fetch(
  "https://your-backend.onrender.com/api/scrape-playstore",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appId: "com.whatsapp",
      limit: 100,
      sort: "newest",
      rating: "all",
      lang: "id",
    }),
  }
);

const data = await response.json();

if (data.ok) {
  console.log("JobID:", data.jobId);
  console.log("Count:", data.count);
  console.log("Preview:", data.preview); // 10 rows
  console.log("Stats:", data.stats);

  if (data.appwriteUrl) {
    // Download CSV dari Appwrite
    window.open(data.appwriteUrl);
  }
}
```

## 📝 Notes

- **Backend HANYA scraping** - Tidak handle auth
- **Preview only** - Response hanya 10 rows untuk performa
- **Stats included** - avgRating & distribution sudah di-calculate
- **Appwrite optional** - Bisa disabled, tapi lebih baik enabled untuk production
- **Match 100% dengan frontend** - Tested dengan Next.js frontend yang sudah ada

## 📄 License

ISC
