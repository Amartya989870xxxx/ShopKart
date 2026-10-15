import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import StatePanel from "../components/StatePanel";
import api from "../services/api";
import {
  formatDate,
  formatPrice,
  formatStatus,
  statusTone,
  getOrderDisplayStatus,
} from "../utils/format";

function OrderSuccess() {
  const navigate = useNavigate();
  const { id } = useParams();

  // This page is only reached after /orders/verify-payment succeeds.
  // We load the saved order so the real total and status are shown.
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const response = await api.get(`/orders/${id}`);

        setOrder(response.data.order);
      } catch (error) {
        console.error("Failed to fetch order:", error);

        setLoadError(
          error.response?.data?.message ||
            "We couldn't load the order details right now."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const actions = (
    <div className="success-actions">
      <button
        type="button"
        className="btn btn-primary btn-lg"
        onClick={() => navigate("/orders")}
      >
        View My Orders
      </button>

      <button
        type="button"
        className="btn btn-secondary btn-lg"
        onClick={() => navigate("/products")}
      >
        Continue Shopping
      </button>
    </div>
  );

  if (loading) {
    return (
      <Layout width="narrow">
        <StatePanel variant="loading" message="Confirming your order..." />
      </Layout>
    );
  }

  if (loadError || !order) {
    return (
      <Layout width="narrow">
        <StatePanel
          variant="error"
          icon="!"
          title="Order details unavailable"
          message={loadError}
        >
          {actions}
        </StatePanel>
      </Layout>
    );
  }

  const isPaid = order.paymentStatus === "PAID";
  const displayStatus = getOrderDisplayStatus(order);
  const itemCount = order.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <Layout width="narrow">
      <section className={`card success-card ${isPaid ? "" : "is-pending"}`}>
        <div className="success-icon" aria-hidden="true">
          {isPaid ? "✓" : "!"}
        </div>

        <p className="eyebrow">
          {isPaid ? "Order confirmed" : "Order status"}
        </p>

        <h1 className="success-title">
          {isPaid ? "Order Placed Successfully" : "Payment not confirmed"}
        </h1>

        <p className="success-message">
          {isPaid
            ? "Your payment was verified and your order has been placed successfully."
            : "We haven't received a verified payment for this order yet. Check My Orders for the latest status or retry payment."}
        </p>

        <dl className="detail-list success-details">
          <div className="detail-row">
            <dt>Order ID</dt>
            <dd className="mono">#{order._id}</dd>
          </div>

          <div className="detail-row">
            <dt>{isPaid ? "Placed on" : "Created on"}</dt>
            <dd>{formatDate(order.createdAt)}</dd>
          </div>

          <div className="detail-row">
            <dt>Items</dt>
            <dd>{itemCount}</dd>
          </div>

          <div className="detail-row">
            <dt>Status</dt>
            <dd>
              <span className={`badge badge-${displayStatus.tone}`}>
                {displayStatus.label}
              </span>
            </dd>
          </div>

          <div className="detail-row">
            <dt>Payment</dt>
            <dd>
              <span className={`badge badge-${statusTone(order.paymentStatus)}`}>
                {formatStatus(order.paymentStatus)}
              </span>
            </dd>
          </div>

          <div className="detail-row detail-row-total">
            <dt>{isPaid ? "Total paid" : "Total amount"}</dt>
            <dd>{formatPrice(order.totalAmount)}</dd>
          </div>
        </dl>

        <div className="success-actions">
          {!isPaid && order.status === "PENDING_PAYMENT" ? (
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => navigate(`/orders/${order._id}`)}
            >
              Retry Payment
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => navigate("/orders")}
            >
              View My Orders
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-lg"
            onClick={() => navigate("/products")}
          >
            Continue Shopping
          </button>
        </div>
      </section>
    </Layout>
  );
}

export default OrderSuccess;