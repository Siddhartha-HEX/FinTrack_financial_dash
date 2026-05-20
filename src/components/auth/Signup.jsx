import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { toast } from "react-toastify";
import { Eye, EyeOff, User, Mail, Lock, TrendingUp, Shield, Zap } from "lucide-react";

const PERKS = [
  { icon: TrendingUp, title: "Smart Analytics",  desc: "Visualize spending patterns with beautiful charts." },
  { icon: Shield,     title: "Secure & Private", desc: "Your data is encrypted and never shared." },
  { icon: Zap,        title: "Real-time Sync",   desc: "Transactions update instantly across devices." },
];

function StrengthBar({ password }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/]
    .filter((r) => r.test(password)).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#ff4d6d", "#f5a623", "#7c9cff", "#00e5c3"];
  if (!password) return null;
  return (
    <div className="strength-wrap">
      <div className="strength-bars">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="strength-seg"
            style={{ background: i <= score ? colors[score] : "var(--bg-hover)" }}
          />
        ))}
      </div>
      <span className="strength-label" style={{ color: colors[score] }}>{labels[score]}</span>
    </div>
  );
}

function Signup({ setIsSignup }) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [showCfm, setShowCfm]   = useState(false);
  const [agreed, setAgreed]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [step, setStep]         = useState(1); // 1 = form, 2 = success

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords don't match."); return; }
    if (password.length < 6)  { toast.error("Password must be at least 6 characters."); return; }
    if (!agreed) { toast.error("Please accept the terms to continue."); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(cred.user, { displayName: name });
      setStep(2);
    } catch (err) {
      toast.error(err.message.replace("Firebase: ", "").replace(/\(.*\)\.?/, "").trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      {/* Left panel */}
      <div className="signup-left">
        <div className="signup-brand">Fin<span>Track</span></div>

        <div className="signup-left-body">
          <div className="signup-headline-wrap">
            <p className="signup-eyebrow">Start for free</p>
            <h1 className="signup-headline">
              Your finances,<br />finally <em>clear.</em>
            </h1>
            <p className="signup-sub">
              Join thousands who track every rupee, understand their habits, and save more every month.
            </p>
          </div>

          <div className="signup-perks">
            {PERKS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="signup-perk">
                <div className="signup-perk-icon"><Icon size={16} /></div>
                <div>
                  <div className="signup-perk-title">{title}</div>
                  <div className="signup-perk-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="signup-left-footer">
          Already have an account?{" "}
          <button className="signup-link-btn" onClick={() => setIsSignup(false)}>Sign in →</button>
        </div>
      </div>

      {/* Right panel */}
      <div className="signup-right">
        {step === 2 ? (
          /* ── Success state ── */
          <div className="signup-success">
            <div className="success-ring">
              <svg viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="25" stroke="var(--accent)" strokeWidth="2" />
                <path d="M14 26l8 8 16-16" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="success-title">Account created!</h2>
            <p className="success-sub">Welcome to FinTrack, {name || email.split("@")[0]}. You're all set.</p>
          </div>
        ) : (
          /* ── Form ── */
          <div className="signup-form-wrap">
            <div className="signup-form-header">
              <h2 className="signup-form-title">Create your account</h2>
              <p className="signup-form-sub">Takes less than a minute.</p>
            </div>

            <form className="signup-form" onSubmit={handleSignup}>

              {/* Name */}
              <div className="sf-field">
                <label className="sf-label">Full name</label>
                <div className="sf-input-wrap">
                  <User size={15} className="sf-icon" />
                  <input
                    type="text"
                    className="sf-input"
                    placeholder="Ravi Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="sf-field">
                <label className="sf-label">Email address</label>
                <div className="sf-input-wrap">
                  <Mail size={15} className="sf-icon" />
                  <input
                    type="email"
                    className="sf-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="sf-field">
                <label className="sf-label">Password</label>
                <div className="sf-input-wrap">
                  <Lock size={15} className="sf-icon" />
                  <input
                    type={showPwd ? "text" : "password"}
                    className="sf-input sf-input-pwd"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="sf-eye" onClick={() => setShowPwd(!showPwd)}>
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <StrengthBar password={password} />
              </div>

              {/* Confirm password */}
              <div className="sf-field">
                <label className="sf-label">Confirm password</label>
                <div className="sf-input-wrap">
                  <Lock size={15} className="sf-icon" />
                  <input
                    type={showCfm ? "text" : "password"}
                    className={`sf-input sf-input-pwd ${confirm && confirm !== password ? "sf-input-error" : confirm && confirm === password ? "sf-input-ok" : ""}`}
                    placeholder="Re-enter your password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                  <button type="button" className="sf-eye" onClick={() => setShowCfm(!showCfm)}>
                    {showCfm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirm && confirm !== password && (
                  <p className="sf-error-msg">Passwords don't match</p>
                )}
              </div>

              {/* Terms */}
              <label className="sf-terms">
                <input
                  type="checkbox"
                  className="sf-checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span>I agree to the <span className="sf-link">Terms of Service</span> and <span className="sf-link">Privacy Policy</span></span>
              </label>

              <button
                type="submit"
                className="sf-submit"
                disabled={loading || !agreed}
              >
                {loading ? (
                  <span className="sf-spinner" />
                ) : (
                  "Create account →"
                )}
              </button>

            </form>

            <p className="signup-mobile-switch">
              Already have an account?{" "}
              <button className="signup-link-btn" onClick={() => setIsSignup(false)}>Sign in</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Signup;
