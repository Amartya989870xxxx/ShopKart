import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../services/api";

const CartContext = createContext();

function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const refreshCart = async () => {
    try {
      setCartLoading(true);
      setCartError("");

      const response = await api.get("/cart");

      setCartItems(response.data.cart || []);
    } catch (error) {
      console.error("Failed to fetch cart:", error);

      setCartError("Unable to load your cart.");
    } finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addToCart = async (productId) => {
    try {
      setActionLoading(`add-${productId}`);
      setCartError("");

      const response = await api.post(
        `/cart/${productId}`
      );

      await refreshCart();

      return response.data;
    } catch (error) {
      console.error("Failed to add product to cart:", error);

      throw error;
    } finally {
      setActionLoading("");
    }
  };

  const updateQuantity = async (
    productId,
    quantity
  ) => {
    try {
      setActionLoading(`update-${productId}`);
      setCartError("");

      const response = await api.patch(
        `/cart/${productId}`,
        {
          quantity,
        }
      );

      await refreshCart();

      return response.data;
    } catch (error) {
      console.error(
        "Failed to update cart quantity:",
        error
      );

      throw error;
    } finally {
      setActionLoading("");
    }
  };

  const removeFromCart = async (productId) => {
    try {
      setActionLoading(`remove-${productId}`);
      setCartError("");

      const response = await api.delete(
        `/cart/${productId}`
      );

      await refreshCart();

      return response.data;
    } catch (error) {
      console.error(
        "Failed to remove product from cart:",
        error
      );

      throw error;
    } finally {
      setActionLoading("");
    }
  };

  const cartCount = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      return (
        total +
        item.product.price * item.quantity
      );
    }, 0);
  }, [cartItems]);

  const value = {
    cartItems,
    cartLoading,
    cartError,
    actionLoading,
    cartCount,
    subtotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  return useContext(CartContext);
};

export default CartProvider;