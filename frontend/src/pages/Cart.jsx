import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Layout from "../components/Layout";
import StatePanel from "../components/StatePanel";
import { formatPrice, LOW_STOCK_LIMIT } from "../utils/format";

function Cart() {
  const navigate = useNavigate();

  const {
    cartItems,
    cartLoading,
    cartError,
    actionLoading,
    updateQuantity,
    removeFromCart,
    refreshCart,
    cartCount,
    subtotal,
  } = useCart();

  // Inline feedback (replaces browser alerts) — keyed by product id.
  const [itemMessage, setItemMessage] = useState({ id: "", text: "" });

  const showItemMessage = (id, text) => setItemMessage({ id, text });

  const handleIncrease = async (item) => {
    if (item.quantity >= item.product.stock) {
      showItemMessage(
        item.product._id,
        "You cannot add more than available stock."
      );
      return;
    }

    try {
      showItemMessage("", "");

      await updateQuantity(
        item.product._id,
        item.quantity + 1
      );
    } catch (error) {
      showItemMessage(
        item.product._id,
        error.response?.data?.message ||
          "Unable to update quantity."
      );
    }
  };

  const handleDecrease = async (item) => {
    if (item.quantity <= 1) {
      return;
    }

    try {
      showItemMessage("", "");

      await updateQuantity(
        item.product._id,
        item.quantity - 1
      );
    } catch (error) {
      showItemMessage(
        item.product._id,
        error.response?.data?.message ||
          "Unable to update quantity."
      );
    }
  };

  const handleRemove = async (productId) => {
    try {
      showItemMessage("", "");

      await removeFromCart(productId);
    } catch (error) {
      showItemMessage(
        productId,
        error.response?.data?.message ||
          "Unable to remove product from cart."
      );
    }
  };

  const header = (subtitle) => (
    <header className="page-header">
      <p className="eyebrow">Shopping cart</p>
      <h1 className="page-title">My Cart</h1>
      <p className="page-subtitle">{subtitle}</p>
    </header>
  );

  if (cartLoading && cartItems.length === 0) {
    return (
      <Layout>
        {header("Products you are ready to purchase.")}
        <StatePanel variant="loading" message="Loading your cart..." />
      </Layout>
    );
  }

  if (cartError) {
    return (
      <Layout>
        {header("Products you are ready to purchase.")}
        <StatePanel variant="error" icon="!" title={cartError}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={refreshCart}
          >
            Try Again
          </button>
        </StatePanel>
      </Layout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Layout>
        {header("Products you are ready to purchase.")}
        <StatePanel
          icon="🛒"
          title="Your cart is empty"
          message="Looks like you haven't added anything yet."
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/products")}
          >
            Browse Products
          </button>
        </StatePanel>
      </Layout>
    );
  }

  return (
    <Layout>
      {header(
        `${cartCount} ${cartCount === 1 ? "item" : "items"} in your cart.`
      )}

      <div className="split-layout">
        <section className="card cart-list" aria-label="Cart items">
          {cartItems.map((item) => {
            const product = item.product;

            const isUpdating =
              actionLoading ===
              `update-${product._id}`;

            const isRemoving =
              actionLoading ===
              `remove-${product._id}`;

            const atMax = item.quantity >= product.stock;

            return (
              <div
                className={`cart-item ${
                  isUpdating || isRemoving ? "is-busy" : ""
                }`}
                key={product._id}
              >
                <Link
                  to={`/products/${product._id}`}
                  className="cart-item-thumb"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <img src={product.image} alt="" />
                </Link>

                <div className="cart-item-info">
                  <p className="product-category">{product.category}</p>

                  <h3 className="cart-item-name">
                    <Link to={`/products/${product._id}`}>
                      {product.name}
                    </Link>
                  </h3>

                  <p className="cart-item-unit">
                    {formatPrice(product.price)} each
                  </p>

                  <p
                    className={`cart-item-stock ${
                      product.stock <= 0
                        ? "tone-danger"
                        : product.stock <= LOW_STOCK_LIMIT || atMax
                        ? "tone-warning"
                        : ""
                    }`}
                  >
                    {product.stock > 0
                      ? `${product.stock} units available`
                      : "Out of stock"}
                    {product.stock > 0 && atMax && " · max quantity reached"}
                  </p>
                </div>

                <div className="cart-item-controls">
                  <div
                    className="quantity-control"
                    role="group"
                    aria-label={`Quantity for ${product.name}`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleDecrease(item)
                      }
                      disabled={
                        item.quantity <= 1 ||
                        isUpdating ||
                        isRemoving
                      }
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>

                    <span aria-live="polite">{item.quantity}</span>

                    <button
                      type="button"
                      onClick={() =>
                        handleIncrease(item)
                      }
                      disabled={
                        item.quantity >=
                          product.stock ||
                        isUpdating ||
                        isRemoving
                      }
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <p className="cart-item-total">
                    {formatPrice(product.price * item.quantity)}
                  </p>

                  <button
                    type="button"
                    className="btn btn-danger-ghost btn-sm"
                    onClick={() =>
                      handleRemove(product._id)
                    }
                    disabled={
                      isRemoving ||
                      isUpdating
                    }
                  >
                    {isRemoving
                      ? "Removing..."
                      : "Remove"}
                  </button>
                </div>

                {itemMessage.id === product._id && itemMessage.text && (
                  <p className="inline-message tone-danger cart-item-message" role="alert">
                    {itemMessage.text}
                  </p>
                )}
              </div>
            );
          })}
        </section>

        <aside className="card summary-card" aria-labelledby="cart-summary-heading">
          <h2 id="cart-summary-heading">Order Summary</h2>

          <div className="summary-row">
            <span>Items</span>
            <span>{cartCount}</span>
          </div>

          <div className="summary-row summary-total">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-block btn-lg"
            onClick={() => navigate("/checkout")}
          >
            Proceed to Checkout
          </button>

          <Link to="/products" className="btn btn-ghost btn-block">
            Continue Shopping
          </Link>

          <p className="summary-note">
            Final prices and stock are verified at checkout.
          </p>
        </aside>
      </div>
    </Layout>
  );
}

export default Cart;