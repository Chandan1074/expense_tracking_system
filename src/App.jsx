import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./utils/supabaseClient";

import Navbar from "./components/Navbar";
import Auth from "./components/Auth";

import Dashboard from "./components/Dashboard";
import TransactionList from "./components/TransactionList";
import TransactionForm from "./components/TransactionForm";
import UploadPDF from "./components/UploadPDF";
import Budget from "./pages/Budget";
import AIChatbot from "./components/AIChatBot";

import UploadPhonePe from "./components/UploadPhonePe";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!user) {
    return <Auth />;
  }

  return (
    <BrowserRouter>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

        {/* Horizontal Navbar at Top */}
        <Navbar />

        {/* Main Content Area */}
        <div style={{ flex: 1, padding: "20px", overflow: "auto" }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<TransactionList />} />
            <Route path="/add-transaction" element={<TransactionForm />} />
            {/* <Route path="/upload" element={<UploadPDF />} /> */}
            <Route path="/upload" element={<UploadPhonePe />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/ai-chat" element={<AIChatbot />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  );
}

export default App;
