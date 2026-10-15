// Small display helpers shared across pages.
// These only affect how values are shown — never how they are calculated.

export const formatPrice = (value) => {
  const amount = Number(value) || 0;

  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// "PENDING_PAYMENT" -> "Pending payment"
export const formatStatus = (status = "") => {
  const text = status.toLowerCase().replace(/_/g, " ");

  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Maps order / payment statuses to a badge colour tone.
export const statusTone = (status = "") => {
  switch (status) {
    case "DELIVERED":
    case "PAID":
      return "success";
    case "PENDING_PAYMENT":
    case "PENDING":
      return "warning";
    case "FAILED":
    case "PAYMENT_FAILED":
      return "danger";
    default:
      return "info";
  }
};

// Resolves accurate display status for orders, ensuring unpaid orders are never shown as placed.
export const getOrderDisplayStatus = (order) => {
  if (!order) {
    return { label: "", tone: "info" };
  }

  if (order.paymentStatus === "PAID") {
    return {
      label: formatStatus(order.status),
      tone: statusTone(order.status),
    };
  }

  if (order.paymentStatus === "FAILED") {
    return {
      label: "Payment failed",
      tone: "danger",
    };
  }

  return {
    label: "Pending payment",
    tone: "warning",
  };
};

// Stock indicator shared by product cards, details and wishlist.
export const LOW_STOCK_LIMIT = 5;

export const stockInfo = (stock) => {
  if (stock <= 0) {
    return { tone: "danger", label: "Out of stock" };
  }

  if (stock <= LOW_STOCK_LIMIT) {
    return { tone: "warning", label: `Only ${stock} left` };
  }

  return { tone: "success", label: `In stock · ${stock} available` };
};
