import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Layout from "../components/Layout";
import StatePanel from "../components/StatePanel";
import api from "../services/api";
import { useCart } from "../context/CartContext";
import {
  formatDate,
  formatPrice,
  formatStatus,
  statusTone,
  getOrderDisplayStatus,
} from "../utils/format";
import { loadRazorpayScript } from "../utils/razorpay";

function OrderDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { refreshCart } = useCart();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/orders/${id}`);

      setOrder(response.data.order);
    } catch (error) {
      console.error(
        "Failed to fetch order details:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load order details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleRetryPayment = async () => {
    try {
      setRetrying(true);
      setRetryError("");

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        setRetryError(
          "Unable to load Razorpay Checkout. Please check your internet connection and try again."
        );
        setRetrying(false);
        return;
      }

      const response = await api.post(`/orders/${id}/retry-payment`);
      const data = response.data;

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "ShopKart",
        description: `ShopKart Order #${data.shopKartOrderId}`,
        order_id: data.razorpayOrderId,
        handler: async function (paymentResponse) {
          try {
            setRetrying(true);
            setRetryError("");

            const verificationResponse = await api.post(
              "/orders/verify-payment",
              {
                shopKartOrderId: data.shopKartOrderId,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              }
            );

            await refreshCart();

            navigate(
              `/order-success/${verificationResponse.data.order._id}`
            );
          } catch (error) {
            console.error("Payment verification failed:", error);
            setRetryError(
              error.response?.data?.message ||
                "Payment verification failed. Your order remains unpaid."
            );
            await fetchOrder();
          } finally {
            setRetrying(false);
          }
        },
        prefill: {
          name: order?.shippingAddress?.fullName || "",
          contact: order?.shippingAddress?.phone || "",
        },
        modal: {
          ondismiss: function () {
            setRetrying(false);
          },
        },
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on("payment.failed", async function (failureResponse) {
        try {
          await api.post(`/orders/${data.shopKartOrderId}/payment-failed`);
        } catch (err) {
          console.error("Failed to mark order as failed:", err);
        }

        setRetryError(
          failureResponse?.error?.description ||
            "Payment attempt failed. You can try again."
        );

        await fetchOrder();
        setRetrying(false);
      });

      paymentObject.open();
    } catch (error) {
      console.error("Failed to start payment retry:", error);
      setRetryError(
        error.response?.data?.message ||
          "Unable to start payment retry. Please try again."
      );
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <StatePanel variant="loading" message="Loading order details..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <StatePanel variant="error" icon="!" title={error}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/orders")}
          >
            Back to My Orders
          </button>
        </StatePanel>
      </Layout>
    );
  }

  if (!order) {
    return null;
  }

  const isPaid = order.paymentStatus === "PAID";
  const displayStatus = getOrderDisplayStatus(order);
  const isEligibleForRetry = !isPaid && order.status === "PENDING_PAYMENT";

  const itemCount = order.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <Layout>
      <Link to="/orders" className="back-link">
        ← Back to My Orders
      </Link>

      <header className="page-header order-detail-header">
        <div className="order-detail-heading">
          <p className="eyebrow">Order details</p>

          <h1 className="page-title order-detail-title">
            Order <span className="mono">#{order._id}</span>
          </h1>

          <p className="page-subtitle">
            {isPaid ? "Placed on " : "Created on "}
            {formatDate(order.createdAt)}
          </p>
        </div>

        <div className="order-detail-badges">
          <span className={`badge badge-${displayStatus.tone}`}>
            Order: {displayStatus.label}
          </span>

          <span className={`badge badge-${statusTone(order.paymentStatus)}`}>
            Payment: {formatStatus(order.paymentStatus)}
          </span>
        </div>
      </header>

      <div className="split-layout">
        <div className="stack">
          <section className="card" aria-labelledby="order-items-heading">
            <div className="card-header">
              <h2 id="order-items-heading">Products</h2>
              <span className="card-header-meta">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>

            <ul className="order-card-items order-detail-items">
              {order.items.map((item, index) => (
                <li
                  className="order-line"
                  key={`${item.product}-${index}`}
                >
                  <div className="order-line-thumb order-line-thumb-lg">
                    {item.image && <img src={item.image} alt={item.name} />}
                  </div>

                  <div className="order-line-info">
                    <p className="order-line-name">{item.name}</p>

                    <p className="order-line-meta">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>

                  <span className="order-line-price">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card" aria-labelledby="shipping-heading">
            <div className="card-header">
              <h2 id="shipping-heading">Shipping address</h2>
            </div>

            <address className="shipping-address">
              <strong>{order.shippingAddress.fullName}</strong>
              <span>{order.shippingAddress.addressLine1}</span>
              <span>
                {order.shippingAddress.city},{" "}
                {order.shippingAddress.state}
              </span>
              <span>Pincode: {order.shippingAddress.pincode}</span>
              <span>Phone: {order.shippingAddress.phone}</span>
            </address>
          </section>
        </div>

        <aside className="card summary-card" aria-labelledby="order-summary-heading">
          <h2 id="order-summary-heading">Order Summary</h2>

          <div className="summary-row">
            <span>Payment Status</span>
            <span className={`badge badge-${statusTone(order.paymentStatus)}`}>
              {formatStatus(order.paymentStatus)}
            </span>
          </div>

          <div className="summary-row">
            <span>Order Status</span>
            <span className={`badge badge-${displayStatus.tone}`}>
              {displayStatus.label}
            </span>
          </div>

          <div className="summary-row">
            <span>Items</span>
            <span>{itemCount}</span>
          </div>

          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>

          {isEligibleForRetry && (
            <button
              type="button"
              className="btn btn-primary btn-block btn-lg"
              onClick={handleRetryPayment}
              disabled={retrying}
              aria-busy={retrying}
            >
              {retrying && (
                <span className="spinner spinner-sm" aria-hidden="true" />
              )}
              {retrying
                ? "Processing..."
                : `Retry Payment (${formatPrice(order.totalAmount)})`}
            </button>
          )}

          {retryError && (
            <div className="alert alert-error" role="alert">
              {retryError}
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() =>
              navigate("/orders")
            }
          >
            Back to My Orders
          </button>
        </aside>
      </div>
    </Layout>
  );
}

export default OrderDetails;