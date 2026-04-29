import { useEffect, useState, useMemo } from "react";
import { supabase } from "../utils/supabaseClient";
import { Edit2, Check, X, AlertTriangle, Save } from "lucide-react";
import "./Budget.css";

export default function Budget() {
  const [transactions, setTransactions] = useState([]);

  const [budget, setBudget] = useState(5000);
  const [editBudget, setEditBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(0);

  const [days, setDays] = useState(30);
  const [durationType, setDurationType] = useState("30");

  const [startDate, setStartDate] = useState(new Date());

  const [loading, setLoading] = useState(true);

  ////////////////////////////////////////////////////////////
  // 🔥 FETCH ALL
  ////////////////////////////////////////////////////////////

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    await fetchTransactions();
    await fetchBudget();
    setLoading(false);
  };

  ////////////////////////////////////////////////////////////
  // 📥 TRANSACTIONS
  ////////////////////////////////////////////////////////////

  const fetchTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id);

    setTransactions(data || []);
  };

  ////////////////////////////////////////////////////////////
  // 📥 FETCH BUDGET (SAFE)
  ////////////////////////////////////////////////////////////

const fetchBudget = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", user.id);

  if (data && data.length > 0) {
    const b = data[0]; // always take first

    setBudget(b.total_budget);
    setDays(b.duration_days);
    setDurationType(String(b.duration_days));
    setStartDate(new Date(b.start_date));
  }
};

  ////////////////////////////////////////////////////////////
  // 💾 SAVE BUDGET
  ////////////////////////////////////////////////////////////

const saveBudget = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const safeDate =
    startDate && !isNaN(new Date(startDate))
      ? new Date(startDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("budgets")
    .upsert(
      {
        user_id: user.id,
        total_budget: budget,
        duration_days: days,
        start_date: safeDate
      },
      {
        onConflict: "user_id"   // 🔥 THIS IS THE FIX
      }
    );

  if (error) {
    console.log(error);
    alert("Error saving ❌");
  } else {
    alert("Saved ✅");
  }
};

  ////////////////////////////////////////////////////////////
  // 📊 CALCULATIONS
  ////////////////////////////////////////////////////////////

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => new Date(t.date) >= startDate);
  }, [transactions, startDate]);

  const totalSpent = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [filteredTransactions]);

  const today = new Date();

  const daysPassed = Math.min(
    Math.max(Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)), 0),
    days
  );

  const daysLeft = Math.max(days - daysPassed, 0);

  const remaining = budget - totalSpent;

  const isCompleted = daysLeft === 0;

  const perDayAllowed =
    daysLeft > 0 ? remaining / daysLeft : null;

  const currentAvg =
    daysPassed > 0 ? totalSpent / daysPassed : 0;

  let status = "safe";

  if (!isCompleted && perDayAllowed !== null) {
    if (currentAvg > perDayAllowed) status = "danger";
    else if (currentAvg > perDayAllowed * 0.8) status = "warning";
  }

  ////////////////////////////////////////////////////////////
  // ✏️ EDIT
  ////////////////////////////////////////////////////////////

  const handleEdit = () => {
    setEditBudget(true);
    setTempBudget(budget);
  };

  const handleSave = () => {
    setBudget(tempBudget);
    setEditBudget(false);
  };

  ////////////////////////////////////////////////////////////
  // ⏳ LOADING
  ////////////////////////////////////////////////////////////

  if (loading) return <p>Loading...</p>;

  ////////////////////////////////////////////////////////////
  // 🎨 UI
  ////////////////////////////////////////////////////////////

  return (
    <div className="budget-container">

      {/* SETUP */}
      <div className="card">
        <h3>Setup</h3>

        <select
          value={durationType}
          onChange={(e) => {
            const val = e.target.value;
            setDurationType(val);

            if (val !== "custom") {
              setDays(Number(val));
            }
          }}
        >
          <option value="30">30 Days</option>
          <option value="60">60 Days</option>
          <option value="90">90 Days</option>
          <option value="custom">Custom</option>
        </select>

        {durationType === "custom" && (
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          />
        )}

        <br /><br />

        <label>Start Date: </label>
        <input
          type="date"
          value={
            startDate && !isNaN(new Date(startDate))
              ? new Date(startDate).toISOString().split("T")[0]
              : ""
          }
          onChange={(e) => setStartDate(new Date(e.target.value))}
        />
      </div>

      {/* BUDGET */}
      <div className="card">
        <h3>Total Budget</h3>

        {editBudget ? (
          <>
            <input
              value={tempBudget}
              onChange={(e) => setTempBudget(Number(e.target.value))}
            />
            <button onClick={handleSave}><Check /></button>
            <button onClick={() => setEditBudget(false)}><X /></button>
          </>
        ) : (
          <>
            <p>₹{budget}</p>
            <button onClick={handleEdit}><Edit2 /></button>
          </>
        )}

        <p>Spent: ₹{totalSpent}</p>
        <p>
          {remaining >= 0
            ? `Remaining ₹${remaining}`
            : `Over ₹${Math.abs(remaining)}`}
        </p>

        <button onClick={saveBudget} style={{ marginTop: "10px" }}>
          <Save size={16} /> Save Budget
        </button>
      </div>

      {/* PLAN */}
      <div className="card">
        <h3>📅 Smart Daily Plan</h3>

        <p>Days Passed: {daysPassed}</p>
        <p>Days Left: {daysLeft}</p>

        {!isCompleted ? (
          <>
            <p>
              💡 You can spend <b>₹{perDayAllowed?.toFixed(2)}</b> per day
            </p>

            <p>Current Avg: ₹{currentAvg.toFixed(2)}</p>

            {status === "safe" && <p style={{ color: "green" }}>✅ Safe</p>}
            {status === "warning" && <p style={{ color: "orange" }}>⚠️ Warning</p>}
            {status === "danger" && (
              <p style={{ color: "red" }}>
                ❌ Over budget <AlertTriangle size={14} />
              </p>
            )}
          </>
        ) : (
          <>
            <p><b>Plan Completed</b></p>
            <p>Total Budget: ₹{budget}</p>
            <p>Total Spent: ₹{totalSpent}</p>

            {remaining >= 0 ? (
              <p style={{ color: "green" }}>Saved ₹{remaining}</p>
            ) : (
              <p style={{ color: "red" }}>Over ₹{Math.abs(remaining)}</p>
            )}
          </>
        )}
      </div>

    </div>
  );
}