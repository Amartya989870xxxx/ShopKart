import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import StatePanel from "../components/StatePanel";
import api from "../services/api";
import { useCart } from "../context/CartContext";

function Home() {
  const navigate = useNavigate();

  const { cartCount } = useCart();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentCustomer = async () => {
      try {
        const response = await api.get("/customers/me");

        setCustomer(response.data.customer);
      } catch (error) {
        if (error.response?.status === 401) {
          navigate("/login");
          return;
        }

        console.error("Failed to fetch customer:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentCustomer();
  }, [navigate]);

  if (loading) {
    return (
      <Layout>
        <StatePanel variant="loading" message="Loading your account..." />
      </Layout>
    );
  }

  if (!customer) {
    return null;
  }

  const initials = customer.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <Layout>
      <section className="account-hero">
        <div className="account-avatar" aria-hidden="true">
          {initials}
        </div>

        <div>
          <p className="eyebrow eyebrow-light">ShopKart account</p>

          <h1>Welcome back, {customer.fullName.split(" ")[0]}!</h1>

          <p className="account-hero-text">
            Here's your account information.
          </p>
        </div>

        <Link to="/products" className="btn btn-light">
          Start shopping
        </Link>
      </section>

      <div className="account-layout">
        <section className="card account-profile" aria-labelledby="profile-heading">
          <div className="card-header">
            <h2 id="profile-heading">Customer profile</h2>
          </div>

          <dl className="detail-list">
            <div className="detail-row">
              <dt>Name</dt>
              <dd>{customer.fullName}</dd>
            </div>

            <div className="detail-row">
              <dt>Email</dt>
              <dd>{customer.email}</dd>
            </div>

            <div className="detail-row">
              <dt>Phone</dt>
              <dd>{customer.phone}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="shortcuts-heading">
          <h2 id="shortcuts-heading" className="section-title">
            Quick links
          </h2>

          <div className="shortcut-grid">
            <Link to="/products" className="shortcut-card">
              <span className="shortcut-icon" aria-hidden="true">🛍</span>
              <span className="shortcut-title">Browse products</span>
              <span className="shortcut-text">Explore the catalogue</span>
            </Link>

            <Link to="/wishlist" className="shortcut-card">
              <span className="shortcut-icon" aria-hidden="true">♡</span>
              <span className="shortcut-title">Wishlist</span>
              <span className="shortcut-text">Items saved for later</span>
            </Link>

            <Link to="/cart" className="shortcut-card">
              <span className="shortcut-icon" aria-hidden="true">🛒</span>
              <span className="shortcut-title">Cart</span>
              <span className="shortcut-text">
                {cartCount} {cartCount === 1 ? "item" : "items"} in your cart
              </span>
            </Link>

            <Link to="/orders" className="shortcut-card">
              <span className="shortcut-icon" aria-hidden="true">📦</span>
              <span className="shortcut-title">My orders</span>
              <span className="shortcut-text">Track your purchases</span>
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Home;