import { useForm } from "react-hook-form";
import { Save } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import "./TransactionForm.css";

export default function TransactionForm() {
  const navigate = useNavigate();

  const categories = [
    { category_id: "food", name: "Food" },
    { category_id: "travel", name: "Travel" },
    { category_id: "salary", name: "Salary" },
    { category_id: "general", name: "General" }
  ];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      type: "expense",
      date: new Date().toISOString().split("T")[0]
    }
  });

  const transactionType = watch("type");

  const filteredCategories = categories.filter(c =>
    transactionType === "income"
      ? c.category_id === "salary"
      : c.category_id !== "salary"
  );

  const onSubmit = async (data) => {
    try {
      // Get logged-in user
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please login first ❌");
        return;
      }

      // Insert into DB
      const { error } = await supabase.from("transactions").insert([
        {
          amount: Number(data.amount),
          type: data.type,
          category_id: data.category_id,
          description: data.description,
          date: data.date,
          source: "manual",
          user_id: user.id
        }
      ]);

      if (error) {
        console.error(error);
        alert("Error saving ❌");
        return;
      }

      alert("Transaction Saved ✅");

      reset();
      navigate("/transactions");

    } catch (err) {
      console.error(err);
      alert("Something went wrong ❌");
    }
  };

  return (
    <div className="transaction-form-container">
      <div className="transaction-form-wrapper">
        <div className="transaction-form-card">
          <div className="transaction-form-header">
            <h2>Add Transaction</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="transaction-form">

            {/* Transaction Type */}
            <div className="form-group">
              <label className="form-label">Transaction Type</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    value="expense"
                    {...register("type")}
                  />
                  <span>Expense</span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    value="income"
                    {...register("type")}
                  />
                  <span>Income</span>
                </label>
              </div>
            </div>

            {/* Amount */}
            <div className="form-group">
              <label className="form-label">Amount</label>
              <div className="amount-input-wrapper">
                <span className="currency-symbol">₹</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("amount", { required: "Amount required" })}
                  className="form-input amount-input"
                />
              </div>
              {errors.amount && <p className="error-message">{errors.amount.message}</p>}
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                {...register("category_id", { required: "Select category" })}
                className="form-select"
              >
                <option value="">Select Category</option>
                {filteredCategories.map(c => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className="error-message">{errors.category_id.message}</p>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                placeholder="e.g., Lunch at restaurant"
                {...register("description", { required: "Description required" })}
                className="form-input"
              />
              {errors.description && <p className="error-message">{errors.description.message}</p>}
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                {...register("date")}
                className="form-input"
              />
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-button">
              <Save size={18} />
              Save Transaction
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
