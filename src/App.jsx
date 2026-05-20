import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/firebase";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import MainContent from "./pages/MainContent";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSignup, setIsSignup] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#080c10",
        fontFamily: "'Syne', sans-serif",
        fontSize: "20px",
        fontWeight: 700,
        color: "#00e5c3",
        letterSpacing: "-0.5px",
      }}>
        Fin<span style={{ color: "#f0f4f8" }}>Track</span>
      </div>
    );
  }

  if (user) return <MainContent />;

  return isSignup
    ? <Signup setIsSignup={setIsSignup} />
    : <Login setIsSignup={setIsSignup} />;
}

export default App;
