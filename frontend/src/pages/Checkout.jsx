import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../components/Layout";
import StatePanel from "../components/StatePanel";
import { formatPrice } from "../utils/format";
import { useCart } from "../context/CartContext";
import api from "../services/api";
import { loadRazorpayScript } from "../utils/razorpay";

function Checkout() {
  const navigate = useNavigate();

  const {
    cartItems,
    cartLoading,
    cartCount,
    subtotal,
    refreshCart,
  } = useCart();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [errors, setErrors] = useState({});
  const [placingOrder, setPlacingOrder] =
    useState(false);
  const [paymentError, setPaymentError] =
    useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
    }));

    setPaymentError("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName =
        "Full name is required.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone =
        "Phone number is required.";
    } else if (
      !/^\d{10}$/.test(formData.phone.trim())
    ) {
      newErrors.phone =
        "Phone number must contain 10 digits.";
    }

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 =
        "Address is required.";
    }

    if (!formData.city.trim()) {
      newErrors.city =
        "City is required.";
    }

    if (!formData.state.trim()) {
      newErrors.state =
        "State is required.";
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode =
        "Pincode is required.";
    } else if (
      !/^\d{6}$/.test(formData.pincode.trim())
    ) {
      newErrors.pincode =
        "Pincode must contain 6 digits.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async (event) => {
    event.preventDefault();

    setPaymentError("");

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    try {
      setPlacingOrder(true);

      const scriptLoaded =
        await loadRazorpayScript();

      if (!scriptLoaded) {
        setPaymentError(
          "Unable to load Razorpay Checkout. Please try again."
        );

        return;
      }

      const response = await api.post(
        "/orders/create-payment-order",
        {
          shippingAddress: formData,
        }
      );

      const data = response.data;

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,

        name: "ShopKart",
        description: "ShopKart Order",

        order_id: data.razorpayOrderId,

        handler: async function (
          paymentResponse
        ) {
          try {
            setPlacingOrder(true);
            setPaymentError("");

            const verificationResponse =
              await api.post(
                "/orders/verify-payment",
                {
                  shopKartOrderId:
                    data.shopKartOrderId,

                  razorpay_order_id:
                    paymentResponse.razorpay_order_id,

                  razorpay_payment_id:
                    paymentResponse.razorpay_payment_id,

                  razorpay_signature:
                    paymentResponse.razorpay_signature,
                }
              );

            await refreshCart();

            navigate(
              `/order-success/${verificationResponse.data.order._id}`
            );
          } catch (error) {
            console.error(
              "Payment verification failed:",
              error
            );

            setPaymentError(
              error.response?.data?.message ||
                "Payment verification failed. Your cart has not been cleared."
            );
          } finally {
            setPlacingOrder(false);
          }
        },

        prefill: {
          name: formData.fullName,
          contact: formData.phone,
        },
      };

      const paymentObject =
        new window.Razorpay(options);

      paymentObject.on(
        "payment.failed",
        async function (response) {
          try {
            await api.post(
              `/orders/${data.shopKartOrderId}/payment-failed`
            );
          } catch (err) {
            console.error("Failed to mark payment as failed:", err);
          }

          setPaymentError(
            response?.error?.description ||
              "Payment failed. Your cart has not been cleared. Please try again."
          );

          setPlacingOrder(false);
        }
      );

      paymentObject.open();
    } catch (error) {
      console.error(
        "Failed to start payment:",
        error
      );

      setPaymentError(
        error.response?.data?.message ||
          "Unable to start payment. Please try again."
      );

      setPlacingOrder(false);
    }
  };

  const renderField = (name, label, inputProps = {}) => {
    const errorId = `${name}-error`;
    const Element = inputProps.as === "textarea" ? "textarea" : "input";
    const { as, ...rest } = inputProps;

    return (
      <div className="field">
        <label className="field-label" htmlFor={name}>
          {label}
        </label>

        <Element
          id={name}
          name={name}
          className={`input ${errors[name] ? "has-error" : ""}`}
          value={formData[name]}
          onChange={handleChange}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? errorId : undefined}
          {...rest}
        />

        {errors[name] && (
          <p id={errorId} className="field-error">
            {errors[name]}
          </p>
        )}
      </div>
    );
  };

  const steps = (
    <ol className="checkout-steps" aria-label="Checkout progress">
      <li className="is-done">
        <span className="step-dot" aria-hidden="true">✓</span>
        Cart
      </li>
      <li className="is-current" aria-current="step">
        <span className="step-dot" aria-hidden="true">2</span>
        Shipping &amp; payment
      </li>
      <li>
        <span className="step-dot" aria-hidden="true">3</span>
        Confirmation
      </li>
    </ol>
  );

  if (cartLoading && cartItems.length === 0) {
    return (
      <Layout>
        <StatePanel variant="loading" message="Loading checkout..." />
      </Layout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Layout>
        <header className="page-header">
          <p className="eyebrow">Checkout</p>
          <h1 className="page-title">Checkout</h1>
          <p className="page-subtitle">
            Your cart is empty. Add products before
            continuing.
          </p>
        </header>

        <StatePanel
          icon="🛒"
          title="No items to checkout"
          message="Add products to your cart and come back here."
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              navigate("/products")
            }
          >
            Browse Products
          </button>
        </StatePanel>
      </Layout>
    );
  }

  return (
    <Layout>
      <header className="page-header checkout-header">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1 className="page-title">Checkout</h1>
          <p className="page-subtitle">
            Enter your shipping details and review
            your order.
          </p>
        </div>

        {steps}
      </header>

      <div className="split-layout">
        <form
          className="checkout-form"
          onSubmit={handleContinue}
          noValidate
        >
          <fieldset className="card checkout-section">
            <legend className="checkout-legend">
              <span className="checkout-legend-number" aria-hidden="true">1</span>
              Shipping details
            </legend>

            {renderField("fullName", "Full name", {
              type: "text",
              placeholder: "Enter your full name",
              autoComplete: "name",
            })}

            {renderField("phone", "Phone number", {
              type: "text",
              placeholder: "Enter 10-digit phone number",
              maxLength: "10",
              inputMode: "numeric",
              autoComplete: "tel-national",
            })}

            {renderField("addressLine1", "Address", {
              as: "textarea",
              placeholder: "House no., street, area",
              rows: "3",
              autoComplete: "street-address",
            })}

            <div className="field-row">
              {renderField("city", "City", {
                type: "text",
                placeholder: "City",
                autoComplete: "address-level2",
              })}

              {renderField("state", "State", {
                type: "text",
                placeholder: "State",
                autoComplete: "address-level1",
              })}
            </div>

            <div className="field-row">
              {renderField("pincode", "Pincode", {
                type: "text",
                placeholder: "6-digit pincode",
                maxLength: "6",
                inputMode: "numeric",
                autoComplete: "postal-code",
              })}
            </div>
          </fieldset>

          <section className="card checkout-section checkout-payment">
            <h2 className="checkout-legend">
              <span className="checkout-legend-number" aria-hidden="true">2</span>
              Payment
            </h2>

            <p className="checkout-payment-text">
              You'll complete payment securely in the Razorpay window.
              Your order is confirmed only after the payment is verified.
            </p>

            {paymentError && (
              <div className="alert alert-error" role="alert">
                {paymentError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={placingOrder}
              aria-busy={placingOrder}
            >
              {placingOrder && (
                <span className="spinner spinner-sm" aria-hidden="true" />
              )}
              {placingOrder
                ? "Processing..."
                : "Pay with Razorpay"}
            </button>

            <p className="secure-note">
              <span aria-hidden="true">🔒</span> Secured by Razorpay
            </p>
          </section>
        </form>

        <aside className="card summary-card" aria-labelledby="checkout-summary-heading">
          <h2 id="checkout-summary-heading">Order Summary</h2>

          <ul className="summary-items">
            {cartItems.map((item) => (
              <li
                className="summary-item"
                key={item.product._id}
              >
                <div className="summary-item-thumb">
                  <img src={item.product.image} alt="" />
                  <span className="summary-item-qty" aria-hidden="true">
                    {item.quantity}
                  </span>
                </div>

                <div className="summary-item-info">
                  <p className="summary-item-name">
                    {item.product.name}
                  </p>

                  <p className="summary-item-meta">
                    Qty: {item.quantity} × {formatPrice(item.product.price)}
                  </p>
                </div>

                <span className="summary-item-price">
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="summary-row">
            <span>Items</span>
            <span>{cartCount}</span>
          </div>

          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <p className="summary-note">
            The final amount is confirmed by our server before payment.
          </p>
        </aside>
      </div>
    </Layout>
  );
}

export default Checkout;
