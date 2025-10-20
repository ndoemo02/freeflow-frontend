import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../components/Toast';

const CartContext = createContext();

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const { push } = useToast();
  const [cart, setCart] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('freeflow_cart');
    const savedRestaurant = localStorage.getItem('freeflow_cart_restaurant');

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart from localStorage', e);
      }
    }

    if (savedRestaurant) {
      try {
        setRestaurant(JSON.parse(savedRestaurant));
      } catch (e) {
        console.error('Failed to parse restaurant from localStorage', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('freeflow_cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('freeflow_cart');
    }
  }, [cart]);

  // Save restaurant to localStorage whenever it changes
  useEffect(() => {
    if (restaurant) {
      localStorage.setItem('freeflow_cart_restaurant', JSON.stringify(restaurant));
    } else {
      localStorage.removeItem('freeflow_cart_restaurant');
    }
  }, [restaurant]);

  // Add item to cart
  const addToCart = (item, restaurantData) => {
    // Check if cart is from different restaurant
    if (restaurant && restaurant.id !== restaurantData.id) {
      const confirm = window.confirm(
        `Masz już pozycje z ${restaurant.name} w koszyku. Czy chcesz wyczyścić koszyk i dodać pozycję z ${restaurantData.name}?`
      );
      if (!confirm) return;
      
      // Clear cart and set new restaurant
      setCart([]);
      setRestaurant(restaurantData);
    } else if (!restaurant) {
      setRestaurant(restaurantData);
    }

    // Check if item already exists in cart
    const existingIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingIndex >= 0) {
      // Update quantity
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
      push(`Zwiększono ilość: ${item.name}`, 'success');
    } else {
      // Add new item
      setCart([...cart, { ...item, quantity: 1 }]);
      push(`Dodano do koszyka: ${item.name}`, 'success');
    }

    console.log('Item added to cart', { item, restaurant: restaurantData });
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    const newCart = cart.filter(item => item.id !== itemId);
    setCart(newCart);
    
    // Clear restaurant if cart is empty
    if (newCart.length === 0) {
      setRestaurant(null);
    }
    
    push('Usunięto z koszyka', 'info');
    console.log('Item removed from cart', { itemId });
  };

  // Update item quantity
  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const newCart = cart.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    setCart(newCart);
    console.log('Cart quantity updated', { itemId, quantity });
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setRestaurant(null);
    push('Koszyk wyczyszczony', 'info');
    console.log('Cart cleared');
  };

  // Calculate total
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Submit order
  const submitOrder = async (deliveryInfo) => {
    console.log('🛒 submitOrder called with user:', user);
    
    // Require login for orders
    if (!user) {
      push('Musisz być zalogowany, aby złożyć zamówienie', 'error');
      return false;
    }

    if (cart.length === 0) {
      push('Koszyk jest pusty', 'error');
      return false;
    }

    if (!restaurant) {
      push('Nie wybrano restauracji', 'error');
      return false;
    }

    setIsSubmitting(true);

    try {
      // Prepare order data
      const orderData = {
        user_id: user?.id || null, // User must be logged in
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        items: cart.map(item => ({
          menu_item_id: item.id, // Use menu_item_id instead of id
          name: item.name,
          unit_price_cents: Math.round(item.price * 100), // Convert to cents
          qty: item.quantity
        })),
        total_price: Math.round(total * 100), // Convert to cents
        status: 'pending',
        customer_name: deliveryInfo.name || user?.user_metadata?.first_name || user?.email || 'Gość',
        customer_phone: deliveryInfo.phone || user?.user_metadata?.phone || '',
        delivery_address: deliveryInfo.address || user?.user_metadata?.address || '',
        notes: deliveryInfo.notes || '',
        created_at: new Date().toISOString()
      };

      console.log('🛒 Submitting order', orderData);
      console.log('🛒 Restaurant ID type:', typeof restaurant.id, 'value:', restaurant.id);
      console.log('🛒 User ID type:', typeof user?.id, 'value:', user?.id);
      console.log('🛒 Items structure:', orderData.items);
      console.log('🛒 Restaurant object:', restaurant);

      // Use backend API instead of direct Supabase access
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      console.log('🛒 Backend API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🛒 Backend API error:', errorData);
        throw new Error(errorData.error || 'Failed to create order');
      }

      const data = await response.json();
      console.log('🛒 Backend API success:', data);

      console.log('Order created successfully', data);
      push('Zamówienie złożone pomyślnie! 🎉', 'success');

      // Clear cart
      clearCart();
      setIsOpen(false);

      return data;
    } catch (error) {
      console.error('Failed to submit order', error);
      push('Błąd podczas składania zamówienia', 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const value = {
    cart,
    restaurant,
    total,
    isOpen,
    isSubmitting,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    submitOrder,
    setIsOpen,
    itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

