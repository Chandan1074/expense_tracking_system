import { useState, useEffect, useMemo } from "react";
import { Trash2, Download, RefreshCw, Search, FileText } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import "./TransactionList.css";

export default function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  const categories = [
    { category_id: "food", name: "Food" },
    { category_id: "travel", name: "Travel" },
    { category_id: "salary", name: "Salary" },
    { category_id: "general", name: "General" }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false });

    if (!error) setTransactions(data || []);
    setLoading(false);
  };

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || t.type === filterType;
      const matchesCategory = filterCategory === "all" || t.category_id === filterCategory;

      const transactionDate = new Date(t.date);
      const matchesStartDate = !startDate || transactionDate >= new Date(startDate);
      const matchesEndDate = !endDate || transactionDate <= new Date(endDate);

      return matchesSearch && matchesType && matchesCategory && matchesStartDate && matchesEndDate;
    });

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "date") {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (sortBy === "amount") {
        comparison = a.amount - b.amount;
      } else if (sortBy === "description") {
        comparison = a.description.localeCompare(b.description);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchTerm, filterType, filterCategory, startDate, endDate, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      balance,
      count: filteredTransactions.length
    };
  }, [filteredTransactions]);

  const handleDelete = async (id) => {
    if (window.confirm("Delete this transaction?")) {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("transaction_id", id);

      if (!error) fetchData();
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterCategory("all");
    setStartDate("");
    setEndDate("");
  };

  const exportToCSV = () => {
    const headers = ["Date", "Description", "Category", "Type", "Amount"];
    const csvData = filteredTransactions.map(t => {
      const category = categories.find(c => c.category_id === t.category_id);
      return [
        t.date,
        t.description,
        category?.name || "",
        t.type,
        t.amount
      ].join(",");
    });

    const csv = [headers.join(","), ...csvData].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    return { day, month };
  };

  if (loading) {
    return (
      <div className="transaction-list-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-list-container">
      <div className="transaction-list-wrapper">

        <div className="page-header">
          <h2>Transactions</h2>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">Total Income</p>
            <h3 className="stat-value income">₹{stats.totalIncome.toFixed(2)}</h3>
          </div>
          <div className="stat-card">
            <p className="stat-label">Total Expenses</p>
            <h3 className="stat-value expense">₹{stats.totalExpenses.toFixed(2)}</h3>
          </div>
          <div className="stat-card">
            <p className="stat-label">Balance</p>
            <h3 className="stat-value balance">₹{stats.balance.toFixed(2)}</h3>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-card">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Search</label>
              <input
                type="text"
                placeholder="Search description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>

          <div className="filter-actions">
            <button onClick={clearFilters} className="btn btn-secondary">
              <RefreshCw size={16} />
              Clear Filters
            </button>
            <button onClick={exportToCSV} className="btn btn-primary">
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Sorting Controls */}
        <div className="sorting-controls">
          <p className="result-count">{stats.count} transactions found</p>

          <div className="sort-group">
            <label className="filter-label">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="description">Description</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="filter-select"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        {/* Transactions List */}
        <div className="transactions-card">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map(t => {
              const category = categories.find(c => c.category_id === t.category_id);
              const { day, month } = formatDate(t.date);

              return (
                <div key={t.transaction_id} className="transaction-item">
                  <div className="transaction-date-badge">
                    <span className="date-day">{day}</span>
                    <span className="date-month">{month}</span>
                  </div>

                  <div className="transaction-details">
                    <p className="transaction-description">{t.description}</p>
                    <div className="transaction-meta">
                      <span className={`category-badge ${t.category_id}`}>
                        {category?.name}
                      </span>
                      <span className="transaction-source">{t.source}</span>
                    </div>
                  </div>

                  <h3 className={`transaction-amount ${t.type}`}>
                    {t.type === "income" ? "+" : "-"}₹{t.amount.toFixed(2)}
                  </h3>

                  <div className="transaction-actions">
                    <button
                      onClick={() => handleDelete(t.transaction_id)}
                      className="btn-icon"
                      title="Delete transaction"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FileText size={32} />
              </div>
              <p>No transactions found</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
