import { useEffect, useState, useMemo } from "react";
import { supabase } from "../utils/supabaseClient";
import { ExpensePieChart, TrendBarChart } from "./Charts";
import StatCard from "./StatCard";
import { TrendingUp, TrendingDown, Wallet, Calendar, Download, Search, Filter } from "lucide-react";
import "./Dashboard.css";

function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  // 🔐 Fetch only current user's data
  const fetchData = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      console.log(error);
    } else {
      setTransactions(data || []);
    }

    setLoading(false);
  };

  // 🏷️ Categories
  const categories = [
    { category_id: "food", name: "Food", color: "#FF6B6B" },
    { category_id: "travel", name: "Travel", color: "#4ECDC4" },
    { category_id: "salary", name: "Salary", color: "#4CAF50" },
    { category_id: "general", name: "General", color: "#8884d8" },
    { category_id: "bills", name: "Bills", color: "#FFB347" }
  ];

  // 🗓️ Filter transactions by time period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let filtered = transactions;

    // Time period filter
    if (timePeriod !== "all") {
      const cutoffDate = new Date();

      if (timePeriod === "month") {
        cutoffDate.setMonth(now.getMonth() - 1);
      } else if (timePeriod === "3months") {
        cutoffDate.setMonth(now.getMonth() - 3);
      } else if (timePeriod === "6months") {
        cutoffDate.setMonth(now.getMonth() - 6);
      } else if (timePeriod === "year") {
        cutoffDate.setFullYear(now.getFullYear() - 1);
      }

      filtered = filtered.filter(t => new Date(t.date) >= cutoffDate);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(t => t.category_id === categoryFilter);
    }

    return filtered;
  }, [transactions, timePeriod, searchTerm, categoryFilter]);

  // 📊 Stats
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === "income")
      .reduce((s, t) => s + Number(t.amount), 0);

    const expense = filteredTransactions
      .filter(t => t.type === "expense")
      .reduce((s, t) => s + Number(t.amount), 0);

    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  // 📊 Pie Chart Data
  const expensesByCategory = useMemo(() => {
    const totals = {};

    filteredTransactions
      .filter(t => t.type === "expense")
      .forEach(t => {
        totals[t.category_id] =
          (totals[t.category_id] || 0) + Number(t.amount);
      });

    return Object.keys(totals).map(id => {
      const cat = categories.find(c => c.category_id === id);

      return {
        name: cat?.name || "Other",
        value: totals[id],
        color: cat?.color || "#999"
      };
    });
  }, [filteredTransactions]);

  // 📊 Last 6 Months Trend (sorted properly)
  const last6Months = useMemo(() => {
    const map = {};

    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;

      if (!map[key]) {
        map[key] = {
          month: d.toLocaleString("default", { month: "short" }),
          income: 0,
          expenses: 0,
          sortKey: d
        };
      }

      if (t.type === "income") {
        map[key].income += Number(t.amount);
      } else {
        map[key].expenses += Number(t.amount);
      }
    });

    return Object.values(map)
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(-6);
  }, [transactions]);

  // 📈 Category Breakdown with Percentages
  const categoryBreakdown = useMemo(() => {
    const totalExpense = stats.expense;

    return expensesByCategory
      .map(cat => ({
        ...cat,
        percentage: totalExpense > 0 ? ((cat.value / totalExpense) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [expensesByCategory, stats.expense]);

  // 🔄 Month-over-Month Comparison
  const monthComparison = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const thisYear = now.getFullYear();
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const thisMonthTrans = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const lastMonthTrans = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });

    const thisMonthExpense = thisMonthTrans
      .filter(t => t.type === "expense")
      .reduce((s, t) => s + Number(t.amount), 0);

    const lastMonthExpense = lastMonthTrans
      .filter(t => t.type === "expense")
      .reduce((s, t) => s + Number(t.amount), 0);

    const difference = thisMonthExpense - lastMonthExpense;
    const percentChange = lastMonthExpense > 0
      ? ((difference / lastMonthExpense) * 100).toFixed(1)
      : 0;

    return { difference, percentChange, increased: difference > 0 };
  }, [transactions]);

  // 📥 Export to CSV
  const exportToCSV = () => {
    const headers = ["Date", "Type", "Category", "Description", "Amount"];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.type,
      categories.find(c => c.category_id === t.category_id)?.name || t.category_id,
      t.description || "",
      t.amount
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // ⏳ Loading UI
  if (loading) {
    return <div className="loading-container"><p>Loading dashboard...</p></div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">📊 Dashboard</h2>
        <button className="export-btn" onClick={exportToCSV}>
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* 🔍 Filters Section */}
      <div className="filters-section">
        <div className="filter-group">
          <Calendar size={16} />
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Time</option>
            <option value="month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        <div className="filter-group">
          <Filter size={16} />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="search-group">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* 💰 Stats */}
      <div className="stats-container">
        <StatCard
          title="Income"
          value={stats.income}
          icon={<TrendingUp size={20} />}
          color="green"
          bgColor="#e6f9ec"
        />

        <StatCard
          title="Expenses"
          value={stats.expense}
          icon={<TrendingDown size={20} />}
          color="red"
          bgColor="#fdecea"
        />

        <StatCard
          title="Balance"
          value={stats.balance}
          icon={<Wallet size={20} />}
          color="blue"
          bgColor="#e6f0ff"
        />
      </div>

      {/* 📊 Month Comparison */}
      <div className="month-comparison">
        <p className="comparison-text">
          <span className={monthComparison.increased ? "negative" : "positive"}>
            {monthComparison.increased ? "↑" : "↓"} {Math.abs(monthComparison.percentChange)}%
          </span>
          {" "}vs last month ({monthComparison.increased ? "+" : "-"}₹{Math.abs(monthComparison.difference).toFixed(2)})
        </p>
      </div>

      {/* 📊 Charts */}
      <div className="charts-section">
        <ExpensePieChart data={expensesByCategory} />
        <TrendBarChart data={last6Months} />
      </div>

      {/* 🏷️ Category Breakdown */}
      <div className="category-breakdown">
        <h3 className="section-title">Category Breakdown</h3>
        <div className="category-list">
          {categoryBreakdown.map(cat => (
            <div key={cat.name} className="category-item">
              <div className="category-info">
                <span className="category-dot" style={{ backgroundColor: cat.color }}></span>
                <span className="category-name">{cat.name}</span>
              </div>
              <div className="category-stats">
                <span className="category-amount">₹{cat.value.toFixed(2)}</span>
                <span className="category-percentage">{cat.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 📋 Recent Transactions */}
      <div className="recent-transactions">
        <h3 className="section-title">Recent Transactions</h3>
        <div className="transactions-table">
          {filteredTransactions.slice(0, 10).map((t, idx) => {
            const cat = categories.find(c => c.category_id === t.category_id);
            return (
              <div key={idx} className="transaction-row">
                <div className="transaction-left">
                  <span className="transaction-dot" style={{ backgroundColor: cat?.color || "#999" }}></span>
                  <div className="transaction-details">
                    <p className="transaction-desc">{t.description || "No description"}</p>
                    <p className="transaction-category">{cat?.name || t.category_id}</p>
                  </div>
                </div>
                <div className="transaction-right">
                  <p className={`transaction-amount ${t.type}`}>
                    {t.type === "income" ? "+" : "-"}₹{Number(t.amount).toFixed(2)}
                  </p>
                  <p className="transaction-date">
                    {new Date(t.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
          {filteredTransactions.length === 0 && (
            <p className="no-transactions">No transactions found</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
