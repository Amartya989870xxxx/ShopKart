import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../services/api";
import { useCart } from "../context/CartContext";
import { formatPrice, stockInfo } from "../utils/format";

function ProductCard({ product }) {
  const navigate = useNavigate();

  const { addToCart, actionLoading, cartItems } =
    useCart();

  const [wishlistAdded, setWishlistAdded] = useState(false);
  const [wishlistError, setWishlistError] = useState("");
  const [cartError, setCartError] = useState("");

  const handleViewDetails = () => {
    navigate(`/products/${product._id}`);
  };

  const handleAddToWishlist = async () => {
    try {
      if (wishlistAdded) {
        return;
      }

      setWishlistError("");

      await api.post(
        `/wishlist/${product._id}`
      );

      setWishlistAdded(true);
    } catch (error) {
      console.error(
        "Failed to add product to wishlist:",
        error
      );

      if (error.response?.status === 409) {
        setWishlistError(
          "Product is already in your wishlist."
        );
      } else {
        setWishlistError(
          "Unable to add this product to your wishlist."
        );
      }
    }
  };

  const handleAddToCart = async () => {
    try {
      setCartError("");

      await addToCart(product._id);
    } catch (error) {
      console.error(
        "Failed to add product to cart:",
        error
      );

      const message =
        error.response?.data?.message ||
        "Unable to add this product to your cart.";

      setCartError(message);
    }
  };

  const isAddingToCart =
    actionLoading === `add-${product._id}`;

  const cartItem = cartItems.find(
    (item) =>
      item.product?._id === product._id
  );

  const isInCart = Boolean(cartItem);

  const isOutOfStock = product.stock <= 0;

  const isMaxInCart =
    cartItem &&
    cartItem.quantity >= product.stock;

  const stock = stockInfo(product.stock);

  return (
    <article className="product-card">
      <Link
        to={`/products/${product._id}`}
        className="product-card-media"
        tabIndex={-1}
        aria-hidden="true"
      >
        <img
          src={product.image}
          alt=""
          loading="lazy"
        />

        {isInCart && (
          <span className="product-card-flag">
            {cartItem.quantity} in cart
          </span>
        )}
      </Link>

      <div className="product-card-body">
        <p className="product-category">
          {product.category}
        </p>

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
            className={`btn btn-primary btn-block ${
              isInCart ? "is-in-cart" : ""
            }`}
            onClick={handleAddToCart}
            disabled={
              isAddingToCart ||
              isOutOfStock ||
              isMaxInCart
            }
          >
            {isAddingToCart
              ? "Adding..."
              : isOutOfStock
              ? "Out of Stock"
              : isMaxInCart
              ? "Max in Cart"
              : isInCart
              ? "Add Another"
              : "Add to Cart"}
          </button>

          <div className="product-card-secondary">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleViewDetails}
            >
              View Details
            </button>

            <button
              type="button"
              className={`btn btn-secondary btn-sm wishlist-toggle ${
                wishlistAdded ? "is-saved" : ""
              }`}
              onClick={handleAddToWishlist}
              disabled={wishlistAdded}
              aria-label={
                wishlistAdded
                  ? `${product.name} added to wishlist`
                  : `Add ${product.name} to wishlist`
              }
            >
              <span aria-hidden="true">
                {wishlistAdded ? "♥" : "♡"}
              </span>
              {wishlistAdded ? "Saved" : "Wishlist"}
            </button>
          </div>
        </div>

        {(wishlistError || cartError) && (
          <p className="inline-message tone-danger" role="alert">
            {cartError || wishlistError}
          </p>
        )}
      </div>
    </article>
  );
}

export default ProductCard;