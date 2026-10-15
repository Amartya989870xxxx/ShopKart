import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";
import StatePanel from "../components/StatePanel";
import { formatPrice, stockInfo } from "../utils/format";

function Wishlist() {
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingProductId, setRemovingProductId] = useState("");
  const [removeError, setRemoveError] = useState("");

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/wishlist");

      setWishlist(response.data.wishlist);
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);

      setError("Unable to load wishlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleViewDetails = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handleRemove = async (productId) => {
    try {
      setRemovingProductId(productId);
      setRemoveError("");

      await api.delete(`/wishlist/${productId}`);

      setWishlist((currentWishlist) =>
        currentWishlist.filter(
          (product) => product._id !== productId
        )
      );
    } catch (error) {
      console.error(
        "Failed to remove product from wishlist:",
        error
      );

      setRemoveError("Unable to remove this product from your wishlist.");
    } finally {
      setRemovingProductId("");
    }
  };

  return (
    <Layout width="wide">
      <header className="page-header">
        <p className="eyebrow">Saved products</p>

        <h1 className="page-title">
          My Wishlist
          {!loading && !error && wishlist.length > 0 && (
            <span className="count-pill">{wishlist.length}</span>
          )}
        </h1>

        <p className="page-subtitle">
          {loading || wishlist.length === 0
            ? "Products you have saved for later."
            : `${wishlist.length} ${
                wishlist.length === 1 ? "product" : "products"
              } saved for later.`}
        </p>
      </header>

      {removeError && (
        <div className="alert alert-error" role="alert">
          {removeError}
        </div>
      )}

      {loading && (
        <StatePanel variant="loading" message="Loading your wishlist..." />
      )}

      {!loading && error && (
        <StatePanel variant="error" icon="!" title={error}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={fetchWishlist}
          >
            Try Again
          </button>
        </StatePanel>
      )}

      {!loading && !error && wishlist.length === 0 && (
        <StatePanel
          icon="♡"
          title="Your wishlist is empty"
          message="Start saving products you love and they'll appear here."
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/products")}
          >
            Continue Shopping
          </button>
        </StatePanel>
      )}

      {!loading && !error && wishlist.length > 0 && (
        <div className="products-grid">
          {wishlist.map((product) => {
            const stock = stockInfo(product.stock);
            const isRemoving = removingProductId === product._id;

            return (
              <article className="product-card" key={product._id}>
                <Link
                  to={`/products/${product._id}`}
                  className="product-card-media"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <img src={product.image} alt="" loading="lazy" />
                </Link>

                <div className="product-card-body">
                  <p className="product-category">{product.category}</p>

                  <h3 className="product-name">
                    <Link to={`/products/${product._id}`}>
                      {product.name}
                    </Link>
                  </h3>

                  <div className="product-card-meta">
                    <p className="product-price">
                      {formatPrice(product.price)}
                    </p>

                    <span className={`stock-text tone-${stock.tone}`}>
                      <span className="stock-dot" aria-hidden="true" />
                      {stock.label}
                    </span>
                  </div>

                  <div className="product-card-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-block"
                      onClick={() => handleViewDetails(product._id)}
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger-ghost btn-block btn-sm"
                      onClick={() => handleRemove(product._id)}
                      disabled={isRemoving}
                    >
                      {isRemoving ? "Removing..." : "Remove from Wishlist"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

export default Wishlist;