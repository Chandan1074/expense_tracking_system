import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from "recharts";

import { PieChart as PieChartIcon } from "lucide-react";

// 📊 Expense Pie Chart
export function ExpensePieChart({ data }) {
  return (
    <div style={{ background: "#fff", padding: "20px", borderRadius: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <PieChartIcon size={20} />
        <h3>Expenses by Category</h3>
      </div>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>

            <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p>No expense data</p>
      )}
    </div>
  );
}

// 📊 Bar Chart (Income vs Expense)
export function TrendBarChart({ data }) {
  return (
    <div style={{ background: "#fff", padding: "20px", borderRadius: "10px" }}>
      <h3>Income vs Expenses (Last 6 Months)</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
          <Legend />

          <Bar dataKey="income" fill="#4CAF50" />
          <Bar dataKey="expenses" fill="#F44336" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
