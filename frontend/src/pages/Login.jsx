import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const { email, password } = formData;

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      await api.post("/customers/login", formData);

      navigate("/home");
    } catch (error) {
      setError(
        error.response?.status === 401
          ? "Invalid Credentials"
          : error.response?.data?.message || "Login failed"
      );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <aside className="auth-promo">
          <div className="auth-brand">
            <span className="auth-brand-logo" aria-hidden="true">🛒</span>
            ShopKart
          </div>

          <div className="auth-promo-content">
            <h2>
              Shop smarter
              <br />
              with ShopKart.
            </h2>

            <p>
              Your simple and secure shopping experience starts here.
              Sign in to continue.
            </p>

            <ul className="auth-points">
              <li>Save favourites to your wishlist</li>
              <li>Secure checkout with Razorpay</li>
              <li>Track every order in one place</li>
            </ul>
          </div>

          <div className="auth-promo-art">
            <img
              src="/shopkart-shoppers.png"
              alt="ShopKart shoppers"
            />
          </div>
        </aside>

        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            <div className="auth-mobile-brand" aria-hidden="true">
              <span className="auth-brand-logo">🛒</span>
              ShopKart
            </div>

            <div className="auth-form-header">
              <h1>Welcome back</h1>
              <p>Please log in to your account</p>
            </div>

            {error && (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="field">
                <label className="field-label" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  autoComplete="email"
                  spellCheck="false"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="input"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <button className="btn btn-primary btn-block btn-lg" type="submit">
                Log in
              </button>
            </form>

            <p className="auth-switch">
              Don't have an account?{" "}
              <button
                className="text-link"
                type="button"
                onClick={() => navigate("/register")}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;