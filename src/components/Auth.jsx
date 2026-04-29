import { useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check email to confirm 📩");
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) alert(error.message);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Login / Register</h2>

      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <br /><br />

      <input
        type="password"
        placeholder="Password"
        onChange={e => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={signIn}>Login</button>
      <button onClick={signUp}>Register</button>
    </div>
  );
}