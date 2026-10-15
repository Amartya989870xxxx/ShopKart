import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders");

      setOrders(response.data.orders || []);
    } catch (error) {
      console.error(
        "Failed to fetch orders:",
        error
      );

      setError("Unable to load your orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleViewDetails = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  return (
    <Layout>
      <header className="page-header">
        <p className="eyebrow">Order history</p>

        <h1 className="page-title">My Orders</h1>

        <p className="page-subtitle">
          {!loading && !error && orders.length > 0
            ? `${orders.length} ${
                orders.length === 1 ? "order" : "orders"
              } found.`
            : "View your previous ShopKart purchases."}
        </p>
      </header>

      {loading && (
        <StatePanel variant="loading" message="Loading your orders..." />
      )}

      {!loading && error && (
        <StatePanel variant="error" icon="!" title={error}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={fetchOrders}
          >
            Try Again
          </button>
        </StatePanel>
      )}

      {!loading && !error && orders.length === 0 && (
        <StatePanel
          icon="📦"
          title="You have not placed any orders yet."
          message="Start shopping to see your orders here."
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              navigate("/products")
            }
          >
            Start Shopping
          </button>
        </StatePanel>
      )}

      {!loading && !error && orders.length > 0 && (
        <ul className="orders-list">
          {orders.map((order) => {
            const itemCount = order.items.reduce(
              (total, item) => total + item.quantity,
              0
            );

            const isPaid = order.paymentStatus === "PAID";
            const displayStatus = getOrderDisplayStatus(order);
            const isEligibleForRetry = !isPaid && order.status === "PENDING_PAYMENT";

            return (
              <li className="card order-card" key={order._id}>
                <div className="order-card-head">
                  <div className="order-card-meta">
                    <div>
                      <span className="meta-label">
                        {isPaid ? "Order placed" : "Order created"}
                      </span>
                      <span className="meta-value">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div>
                      <span className="meta-label">Total</span>
                      <span className="meta-value">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>

                    <div className="order-card-id">
                      <span className="meta-label">Order ID</span>
                      <span className="meta-value mono">#{order._id}</span>
                    </div>
                  </div>

                  <span
                    className={`badge badge-${displayStatus.tone} order-status`}
                  >
                    {displayStatus.label}
                  </span>
                </div>

                <ul className="order-card-items">
                  {order.items.map((item, index) => (
                    <li
                      className="order-line"
                      key={`${item.product}-${index}`}
                    >
                      <div className="order-line-thumb">
                        {item.image && <img src={item.image} alt="" />}
                      </div>

                      <div className="order-line-info">
                        <p className="order-line-name">{item.name}</p>
                        <p className="order-line-meta">
                          Qty: {item.quantity}
                        </p>
                      </div>

                      <span className="order-line-price">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="order-card-foot">
                  <span className="order-card-count">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </span>

                  <div className="order-card-actions">
                    {isEligibleForRetry && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          handleViewDetails(
                            order._id
                          )
                        }
                      >
                        Retry Payment
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        handleViewDetails(
                          order._id
                        )
                      }
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Layout>
  );
}

export default Orders;