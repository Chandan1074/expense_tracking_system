# Expense Tracker App

A React-based expense tracking application built with Vite. This app allows users to manage their income and expenses, categorize transactions, and view financial summaries.

## Features

- Track income and expenses
- Categorize transactions
- View dashboard with stats and charts
- Upload PDF receipts for parsing
- Responsive design

## Project Structure

```
expense-tracker/
├── public/
├── src/
│   ├── assets/                 # images, icons
│   ├── components/             # reusable UI components
│   │   ├── Navbar.jsx
│   │   ├── Dashboard.jsx
│   │   ├── StatCard.jsx
│   │   ├── TransactionForm.jsx
│   │   ├── TransactionList.jsx
│   │   ├── UploadPDF.jsx
│   │   └── Charts.jsx
│   ├── pages/                  # main pages
│   │   ├── Home.jsx
│   │   ├── Transactions.jsx
│   │   └── Upload.jsx
│   ├── utils/                  # logic
│   │   ├── storage.js
│   │   ├── pdfParser.js
│   │   └── helpers.js
│   ├── data/                   # static data
│   │   └── categories.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── package.json
└── README.md
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Technologies Used

- React 19
- Vite
- ESLint
