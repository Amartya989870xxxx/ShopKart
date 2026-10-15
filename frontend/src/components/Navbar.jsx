import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";

import api from "../services/api";
import { useCart } from "../context/CartContext";

function Navbar() {
  const navigate = useNavigate();

  const { cartCount } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post("/customers/logout");

      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const closeMenu = () => setMenuOpen(false);

  const linkClass = ({ isActive }) =>
    `nav-link ${isActive ? "active" : ""}`;

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link
          to="/products"
          className="brand"
          onClick={closeMenu}
          aria-label="ShopKart home"
        >
          <span className="brand-logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.5L21 8H6.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="20" r="1.4" fill="currentColor" />
              <circle cx="17" cy="20" r="1.4" fill="currentColor" />
            </svg>
          </span>
          <span className="brand-name">ShopKart</span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
        </button>

        <nav
          id="primary-navigation"
          className={`site-nav ${menuOpen ? "open" : ""}`}
          aria-label="Main navigation"
        >
          <ul className="nav-list">
            <li>
              <NavLink to="/products" className={linkClass} onClick={closeMenu}>
                Products
              </NavLink>
            </li>
            <li>
              <NavLink to="/wishlist" className={linkClass} onClick={closeMenu}>
                Wishlist
              </NavLink>
            </li>
            <li>
              <NavLink to="/orders" className={linkClass} onClick={closeMenu}>
                My Orders
              </NavLink>
            </li>
            <li>
              <NavLink to="/home" className={linkClass} onClick={closeMenu}>
                Account
              </NavLink>
            </li>
          </ul>

          <div className="nav-actions">
            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `nav-cart ${isActive ? "active" : ""}`
              }
              onClick={closeMenu}
              aria-label={`Cart, ${cartCount} ${
                cartCount === 1 ? "item" : "items"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden="true"
              >
                <path
                  d="M6 7h12l-1 12.2a1 1 0 0 1-1 .8H8a1 1 0 0 1-1-.8L6 7Zm3 0V6a3 3 0 0 1 6 0v1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Cart</span>
              <span className="cart-badge" aria-hidden="true">
                {cartCount}
              </span>
            </NavLink>

            <button
              type="button"
              className="btn btn-ghost nav-logout"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;