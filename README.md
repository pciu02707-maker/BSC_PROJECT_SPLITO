# 🧳 Splito — Trip Expense Manager

> Real-time collaborative expense splitting for group travel.

---

## 📁 FOLDER STRUCTURE

```
splito/
├── backend/
│   ├── server.js                  ← Entry point
│   ├── .env                       ← Environment variables (never commit this)
│   ├── package.json
│   └── src/
│       ├── config/
│       │   ├── db.js              ← MongoDB connection
│       │   └── passport.js        ← Google OAuth + Local auth strategies
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── trip.controller.js
│       │   ├── expense.controller.js
│       │   └── user.controller.js
│       ├── middleware/
│       │   ├── auth.middleware.js ← JWT protect middleware
│       │   └── error.middleware.js
│       ├── models/
│       │   ├── User.js
│       │   ├── Trip.js
│       │   ├── Expense.js
│       │   └── Activity.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── trip.routes.js
│       │   ├── expense.routes.js
│       │   └── user.routes.js
│       ├── socket/
│       │   └── socket.js          ← Socket.io real-time events
│       └── utils/
│           ├── balanceEngine.js   ← Core debt calculation algorithm
│           └── generateCode.js    ← Invite code generator
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── .env
    └── src/
        ├── App.jsx                ← Routes + providers
        ├── main.jsx
        ├── index.css              ← Tailwind + global styles
        ├── api/
        │   └── axios.js           ← Axios instance with JWT interceptor
        ├── context/
        │   ├── AuthContext.jsx    ← Global auth state
        │   └── SocketContext.jsx  ← Socket.io connection
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── AuthCallback.jsx   ← Google OAuth redirect handler
        │   ├── DashboardPage.jsx
        │   ├── TripPage.jsx
        │   ├── ProfilePage.jsx
        │   └── NotFoundPage.jsx
        └── components/
            ├── common/
            │   └── Modal.jsx
            ├── layout/
            │   └── Navbar.jsx
            ├── trip/
            │   ├── TripCard.jsx
            │   ├── TripHeader.jsx
            │   ├── CreateTripModal.jsx
            │   ├── EditTripModal.jsx
            │   ├── JoinTripModal.jsx
            │   ├── BalancePanel.jsx
            │   ├── MembersPanel.jsx
            │   └── ActivityFeed.jsx
            └── expense/
                ├── ExpenseList.jsx
                ├── AddExpenseModal.jsx
                └── EditExpenseModal.jsx
```

---

## ⚙️ ENVIRONMENT VARIABLES EXPLAINED

### Backend `.env`

| Variable               | What it is                                                |
| ---------------------- | --------------------------------------------------------- |
| `PORT`                 | Port the server runs on (5000)                            |
| `MONGODB_URI`          | Your MongoDB Atlas connection string                      |
| `JWT_SECRET`           | Secret key to sign JWT tokens — change this in production |
| `SESSION_SECRET`       | Secret for express-session — change in production         |
| `GOOGLE_CLIENT_ID`     | From Google Cloud Console                                 |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console                                 |
| `GOOGLE_CALLBACK_URL`  | Must match exactly what you set in Google Cloud Console   |
| `CLIENT_URL`           | The URL of your React frontend                            |

### Frontend `.env`

| Variable          | What it is                                   |
| ----------------- | -------------------------------------------- |
| `VITE_API_URL`    | Your backend API base URL                    |
| `VITE_SOCKET_URL` | Your backend Socket.io URL (same as backend) |

---

## 🚀 HOW TO RUN LOCALLY (Step by Step)

### Prerequisites — install these first if you don't have them:

- Node.js v18+ → https://nodejs.org
- Git → https://git-scm.com

### Step 1 — Open two terminals

---

### Terminal 1 — Start the Backend

```bash
cd splito/backend
npm install
npm run dev
```

You should see:

```
🚀 Splito server running on http://localhost:5000
✅ MongoDB Connected: cluster0.krxpalf.mongodb.net
```

---

### Terminal 2 — Start the Frontend

```bash
cd splito/frontend
npm install
npm run dev
```

You should see:

```
  VITE v4.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

---

### Step 3 — Open in Browser

👉 Go to: **http://localhost:5173**

---

## 🔌 API ROUTES REFERENCE

### Auth

| Method | Route                       | Description                  |
| ------ | --------------------------- | ---------------------------- |
| POST   | `/api/auth/register`        | Register with email/password |
| POST   | `/api/auth/login`           | Login with email/password    |
| GET    | `/api/auth/google`          | Start Google OAuth           |
| GET    | `/api/auth/google/callback` | Google OAuth callback        |
| GET    | `/api/auth/me`              | Get current user (protected) |
| POST   | `/api/auth/logout`          | Logout (protected)           |

### Trips

| Method | Route                          | Description                 |
| ------ | ------------------------------ | --------------------------- |
| GET    | `/api/trips`                   | Get my trips                |
| POST   | `/api/trips`                   | Create a trip               |
| POST   | `/api/trips/join`              | Join via invite code        |
| GET    | `/api/trips/:id`               | Get trip by ID              |
| PUT    | `/api/trips/:id`               | Update trip                 |
| DELETE | `/api/trips/:id`               | Delete trip                 |
| POST   | `/api/trips/:id/leave`         | Leave trip                  |
| POST   | `/api/trips/:id/remove-member` | Remove a member (host only) |
| PATCH  | `/api/trips/:id/status`        | Lock / close trip           |
| GET    | `/api/trips/:id/balances`      | Get balances + settlements  |
| GET    | `/api/trips/:id/activities`    | Get activity feed           |

### Expenses

| Method | Route                        | Description                 |
| ------ | ---------------------------- | --------------------------- |
| GET    | `/api/expenses/trip/:tripId` | Get all expenses for a trip |
| GET    | `/api/expenses/:id`          | Get single expense          |
| POST   | `/api/expenses`              | Create expense              |
| PUT    | `/api/expenses/:id`          | Update expense              |
| DELETE | `/api/expenses/:id`          | Delete expense              |

### Users

| Method | Route                        | Description        |
| ------ | ---------------------------- | ------------------ |
| GET    | `/api/users/profile`         | Get profile        |
| PUT    | `/api/users/profile`         | Update name/avatar |
| PUT    | `/api/users/change-password` | Change password    |
| GET    | `/api/users/search?q=name`   | Search users       |

---

## 🔴 Socket.io Events

### Client → Server

| Event        | Payload  | When                         |
| ------------ | -------- | ---------------------------- |
| `join:trip`  | `tripId` | When user enters a trip page |
| `leave:trip` | `tripId` | When user leaves a trip page |

### Server → Client

| Event             | Payload          | When                 |
| ----------------- | ---------------- | -------------------- |
| `expense:added`   | `{ expense }`    | New expense created  |
| `expense:updated` | `{ expense }`    | Expense edited       |
| `expense:deleted` | `{ expenseId }`  | Expense removed      |
| `balance:updated` | `{ tripId }`     | Any balance change   |
| `member:joined`   | `{ user, trip }` | Someone joined       |
| `member:left`     | `{ userId }`     | Someone left         |
| `trip:updated`    | `{ trip }`       | Trip details changed |
| `trip:locked`     | `{ tripId }`     | Trip locked          |
| `trip:closed`     | `{ tripId }`     | Trip closed          |

---

## 🌍 DEPLOYMENT GUIDE

---

### STEP 1 — Deploy Backend to Render

1. Push your code to GitHub:

   ```bash
   cd splito
   git init
   git add .
   git commit -m "Initial Splito commit"
   # Create a new repo on github.com, then:
   git remote add origin https://github.com/YOUR_USERNAME/splito.git
   git push -u origin main
   ```

2. Go to **https://render.com** → Sign up → **New Web Service**

3. Connect your GitHub repo

4. Configure:
   | Field | Value |
   |---|---|
   | Root Directory | `backend` |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Node Version | 18 |

5. Add Environment Variables (click "Environment"):

   ```
   MONGODB_URI=mongodb+srv://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_CLUSTER.mongodb.net/splito
   JWT_SECRET=your_strong_secret_here_change_this
   SESSION_SECRET=your_session_secret_change_this
   GOOGLE_CALLBACK_URL=https://YOUR_RENDER_URL.onrender.com/api/auth/google/callback
   CLIENT_URL=https://YOUR_VERCEL_URL.vercel.app
   PORT=5000
   ```

6. Click **Deploy** — wait ~3 minutes

7. Your backend URL will be: `https://splito-api.onrender.com` (or similar)

---

### STEP 2 — Deploy Frontend to Vercel

1. Go to **https://vercel.com** → Sign up → **New Project**

2. Import your GitHub repo

3. Configure:
   | Field | Value |
   |---|---|
   | Root Directory | `frontend` |
   | Framework Preset | Vite |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |

4. Add Environment Variables:

   ```
   VITE_API_URL=https://YOUR_RENDER_URL.onrender.com/api
   VITE_SOCKET_URL=https://YOUR_RENDER_URL.onrender.com
   ```

5. Click **Deploy** — takes ~1 minute

6. Your frontend URL will be: `https://splito.vercel.app` (or similar)

---

### STEP 3 — Update Google OAuth for Production

1. Go back to **https://console.cloud.google.com**
2. APIs & Services → Credentials → your OAuth client
3. Add to **Authorized JavaScript origins**:
   ```
   https://splito.vercel.app
   ```
4. Add to **Authorized redirect URIs**:
   ```
   https://splito-api.onrender.com/api/auth/google/callback
   ```
5. Click **Save**

6. Go back to Render → update:
   ```
   GOOGLE_CALLBACK_URL=https://splito-api.onrender.com/api/auth/google/callback
   CLIENT_URL=https://splito.vercel.app
   ```

---

### STEP 4 — Verify MongoDB Atlas allows Render IPs

1. Go to **https://cloud.mongodb.com**
2. Your cluster → **Network Access**
3. Click **Add IP Address**
4. Choose **Allow Access from Anywhere** (0.0.0.0/0) for deployment
5. Click **Confirm**

---

## ✅ EVERYTHING THAT'S BUILT

- [x] User registration + login (email/password)
- [x] Google OAuth login
- [x] JWT authentication on all protected routes
- [x] Create, edit, delete, view trips
- [x] Join trips via invite code (TRP-XXXX)
- [x] Add expenses (equal + custom split)
- [x] Edit + delete expenses
- [x] Balance engine (who owes whom)
- [x] Debt optimizer (minimize transactions)
- [x] Real-time updates via Socket.io
- [x] Activity feed (full history log)
- [x] Lock + close trips
- [x] Remove members (host only)
- [x] Profile page + password change
- [x] Full CRUD REST API
- [x] MongoDB Atlas database
- [x] Tailwind CSS responsive UI
- [x] Toast notifications
- [x] 404 page
