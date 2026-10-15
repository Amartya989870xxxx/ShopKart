import { Link } from "react-router-dom";

import Navbar from "./Navbar";

// Shared wrapper for every signed-in shopping page:
// header, centred content area and a simple footer.
function Layout({ children, width = "default" }) {
  return (
    <div className="app-shell">
      <Navbar />

      <main className="page-main">
        <div className={`page-container page-container-${width}`}>
          {children}
        </div>
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="footer-brand">
            <strong>ShopKart</strong>
            <p>Simple, secure shopping.</p>
          </div>

          <nav className="footer-links" aria-label="Footer">
            <Link to="/products">Products</Link>
            <Link to="/wishlist">Wishlist</Link>
            <Link to="/cart">Cart</Link>
            <Link to="/orders">My Orders</Link>
            <Link to="/home">Account</Link>
          </nav>

          <p className="footer-copy">
            © {new Date().getFullYear()} ShopKart. Payments secured by
            Razorpay.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
