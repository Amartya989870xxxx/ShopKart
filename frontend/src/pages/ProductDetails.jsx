import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";
import StatePanel from "../components/StatePanel";
import { useCart } from "../context/CartContext";
import { formatPrice, stockInfo } from "../utils/format";

function ProductDetails() {
  const { id } = useParams();

  const { addToCart, actionLoading, cartItems } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionMessage, setActionMessage] = useState(null);
  const [wishlistAdded, setWishlistAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/products/${id}`);

        setProduct(response.data.product);
      } catch (error) {
        console.error("Failed to fetch product:", error);

        if (error.response?.status === 404) {
          setError("Product not found.");
        } else {
          setError("Something went wrong while loading the product.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Same cart behaviour as the product card, using the shared Cart Context.
  const handleAddToCart = async () => {
    try {
      setActionMessage(null);

      await addToCart(product._id);

      setActionMessage({ tone: "success", text: "Added to your cart." });
    } catch (error) {
      setActionMessage({
        tone: "danger",
        text:
          error.response?.data?.message ||
          "Unable to add this product to your cart.",
      });
    }
  };

  // Same wishlist endpoint used on the product listing page.
  const handleAddToWishlist = async () => {
    if (wishlistAdded) {
      return;
    }

    try {
      setActionMessage(null);

      await api.post(`/wishlist/${product._id}`);

      setWishlistAdded(true);
      setActionMessage({ tone: "success", text: "Saved to your wishlist." });
    } catch (error) {
      console.error("Failed to add product to wishlist:", error);

      setActionMessage({
        tone: "danger",
        text:
          error.response?.status === 409
            ? "Product is already in your wishlist."
            : "Unable to add this product to your wishlist.",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <StatePanel variant="loading" message="Loading product..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <StatePanel variant="error" icon="!" title={error}>
          <Link to="/products" className="btn btn-primary">
            Back to products
          </Link>
        </StatePanel>
      </Layout>
    );
  }

  if (!product) {
    return null;
  }

  const cartItem = cartItems.find(
    (item) => item.product?._id === product._id
  );

  const isAddingToCart = actionLoading === `add-${product._id}`;
  const isOutOfStock = product.stock <= 0;
  const isMaxInCart = cartItem && cartItem.quantity >= product.stock;
  const stock = stockInfo(product.stock);

  return (
    <Layout>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/products">Products</Link>
        <span aria-hidden="true">/</span>
        <span>{product.category}</span>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <article className="product-detail">
        <div className="product-detail-media">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="product-detail-info">
          <p className="product-category">{product.category}</p>

          <h1 className="product-detail-title">{product.name}</h1>

          <p className="product-detail-price">
            {formatPrice(product.price)}
          </p>

          <span className={`badge badge-${stock.tone}`}>
            {product.stock > 0
              ? `${product.stock} units available`
              : "Out of stock"}
          </span>

          {cartItem && (
            <p className="product-detail-note">
              You have {cartItem.quantity} in your cart.
            </p>
          )}

          <div className="product-detail-actions">
            <button
              className="btn btn-primary btn-lg"
              type="button"
              onClick={handleAddToCart}
              disabled={isAddingToCart || isOutOfStock || isMaxInCart}
            >
              {isAddingToCart
                ? "Adding..."
                : isOutOfStock
                ? "Out of Stock"
                : isMaxInCart
                ? "Max in Cart"
                : cartItem
                ? "Add Another"
                : "Add to Cart"}
            </button>

            <button
              className={`btn btn-secondary btn-lg wishlist-toggle ${
                wishlistAdded ? "is-saved" : ""
              }`}
              type="button"
              onClick={handleAddToWishlist}
              disabled={wishlistAdded}
            >
              <span aria-hidden="true">{wishlistAdded ? "♥" : "♡"}</span>
              {wishlistAdded ? "Saved to Wishlist" : "Add to Wishlist"}
            </button>
          </div>

          {actionMessage && (
            <p
              className={`inline-message tone-${actionMessage.tone}`}
              role={actionMessage.tone === "danger" ? "alert" : "status"}
            >
              {actionMessage.text}
            </p>
          )}

          {cartItem && (
            <Link to="/cart" className="text-link product-detail-cart-link">
              Go to cart →
            </Link>
          )}

          <section className="product-detail-description">
            <h2>Product description</h2>
            <p>{product.description}</p>
          </section>
        </div>
      </article>
    </Layout>
  );
}

export default ProductDetails;