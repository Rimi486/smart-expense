# Personal Expense and Budget Management System

An MCA minor project built with the MERN stack: **M**ongoDB, **E**xpress, **R**eact, **N**ode.js.

## Features
| Area | What it does |
|---|---|
| Authentication | Register, log in, log out. Passwords are hashed with bcrypt. Login uses a JWT token. |
| Data privacy | Every record belongs to a user. The API only ever returns the logged-in user's own data. |
| Dashboard | Total income, total expenses, available balance, monthly summary, income-split donut, recent transactions, alerts. |
| Expenses | Add, edit, delete. Title, amount, category, date, description. Search, filter by category and date range, sort, pagination. |
| Income | Add, edit, delete. Source, amount, date, description. Same search, filter and sort tools. |
| Categories | Food, Shopping, Transportation, Education, Entertainment, Healthcare, Bills, Others. Leave blank and the app detects it from the title. |
| Budgets | Total monthly budget and per-category limits, progress bars, remaining amount, warnings at 80% and when exceeded. |
| Reports | Weekly, monthly and yearly. Category donut, income vs expenses bar chart, spending trend line, highest category, daily average, busiest weekday. |
| Profile | Update name, email and currency. Change password. Delete account. |
| Smart extras | Auto-categorisation, unusual-expense detection, month-end spending projection, month-over-month alerts. |

## Folder structure
```
expense-tracker/
├── server/                 Node + Express API
│   ├── index.js            starts the server, mounts routes
│   ├── middleware/auth.js  checks the login token on private routes
│   ├── models/             User, Expense (income/expense/investment), UserBudget
│   ├── routes/             auth, transactions, budgets, dashboard, reports, profile
│   └── utils/              validation, dates, categoriser, statistics helpers
└── client/                 React app (Vite)
    └── src/
        ├── api.js          all calls to the backend
        ├── context/        AuthContext (login state)
        ├── components/     Layout (sidebar), Donut, modals, shared UI
        └── pages/          Auth, Dashboard, Transactions, Budgets, Reports, Profile
```

## How to run

### 1. Install
- **Node.js** (LTS) from nodejs.org
- **MongoDB** Community Server (running locally), or a free MongoDB Atlas connection string

### 2. Start the server
```
cd server
copy .env.example .env        (Mac/Linux: cp .env.example .env)
npm install
```
Open the new `.env` file and set `JWT_SECRET` to any long random text. If you already had a `.env`, add the `JWT_SECRET`, `JWT_EXPIRES_IN` and `CLIENT_URL` lines from `.env.example`.
```
npm run dev
```
You should see `API running on http://localhost:5000`.

### 3. Start the client (second terminal)
```
cd client
npm install
npm run dev
```
Open **http://localhost:5173**, click **Sign up**, and create an account.

## API reference
Public: `POST /api/auth/register`, `POST /api/auth/login`.
Everything else needs the header `Authorization: Bearer <token>`.

| Method | Route | Purpose |
|---|---|---|
| GET | /api/auth/me | Current user |
| GET/POST | /api/transactions | List (with `type`, `search`, `category`, `from`, `to`, `sort`, `order`, `page`, `limit`) / create |
| PUT/DELETE | /api/transactions/:id | Edit / delete |
| GET | /api/categories | Category list |
| GET | /api/budgets?month=YYYY-MM | Budgets with usage |
| PUT/DELETE | /api/budgets/:category | Set or remove a limit (`Overall` = total budget) |
| GET | /api/dashboard?month=YYYY-MM | Dashboard data |
| GET | /api/reports?period=week\|month\|year&date=YYYY-MM-DD | Report data |
| GET/PUT/DELETE | /api/profile, PUT /api/profile/password | Profile and settings |

## Manual test checklist
1. Register, then log out and log in again. A wrong password should show an error.
2. Add **Income** "Salary" 50000 on the dashboard: the donut shows 100% Savings.
3. Add expenses (for example "Swiggy dinner" 640): the donut shifts and the category shows **Food (auto)**.
4. Go to **Expenses**: edit one, delete one, try search, category filter, date range and sorting.
5. Go to **Income**: add, edit and delete a record.
6. Go to **Budgets**: set a total budget and a Food limit lower than your spending. A warning appears.
7. Go to **Reports**: switch Weekly, Monthly and Yearly. Check all three charts.
8. Go to **Profile**: change currency to USD and confirm amounts change. Change your password.
9. Register a second account: it must not see the first account's data.

## Notes
- Records created with the earlier single-user version have no owner and will not appear. Start from an empty database (or drop the `expenses` collection).
- Dates are stored in UTC.
