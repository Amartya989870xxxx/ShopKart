import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        phone: "",
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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
        setSuccess("");

        const { fullName, email, password, phone } = formData;

        if (!fullName || !email || !password || !phone) {
            setError("All fields are required");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        try {
            await api.post("/customers/register", formData);

            setSuccess("Registration successful! Redirecting to login...");

            setTimeout(() => {
                navigate("/login");
            }, 1000);
        } catch (error) {
            setError(
                error.response?.data?.message || "Registration failed"
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
              Create your account and start your shopping journey
              with ShopKart.
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
              <h1>Create account</h1>
              <p>Sign up to get started with ShopKart</p>
            </div>

            {error && (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success" role="status">
                {success}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="field">
                <label className="field-label" htmlFor="fullName">
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className="input"
                  placeholder="John Doe"
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

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

              <div className="field-row">
                <div className="field">
                  <label className="field-label" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="input"
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    aria-describedby="password-hint"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <p id="password-hint" className="field-hint">
                    At least 6 characters.
                  </p>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="phone">
                    Phone number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="input"
                    placeholder="9876543210"
                    autoComplete="tel"
                    inputMode="tel"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button className="btn btn-primary btn-block btn-lg" type="submit">
                Create Account
              </button>
            </form>

            <p className="auth-switch">
              Already have an account?{" "}
              <button
                className="text-link"
                type="button"
                onClick={() => navigate("/login")}
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
);
}

export default Register;