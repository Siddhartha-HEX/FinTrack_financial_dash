import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { toast } from "react-toastify";

function Login({ setIsSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back!");
    } catch (err) {
      toast.error(err.message.replace("Firebase: ", "").replace(/\(.*\)\.?/, "").trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <div className="auth-brand">Fin<span>Track</span></div>
        <h1 className="auth-headline">
          Your money,<br /><em>fully visible.</em>
        </h1>
        <p className="auth-tagline">
          Track income and expenses, visualize spending by category, and stay on top of your financial health — all in one place.
        </p>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-card-title">Sign in</h2>
          <p className="auth-card-sub">Welcome back. Enter your credentials below.</p>

          <form onSubmit={handleLogin}>
            <div className="auth-form-group">
              <div className="auth-input-wrap">
                <label className="auth-input-label">Email</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="auth-input-wrap">
                <label className="auth-input-label">Password</label>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?
            <button onClick={() => setIsSignup(true)}>Create one</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
