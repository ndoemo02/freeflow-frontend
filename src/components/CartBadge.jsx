import React, { useEffect, useState } from 'react';
import { loadCart, updateItem, clearCart } from '../lib/cart';

export default function CartBadge() {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState(loadCart());

  useEffect(() => {
    const onStorage = (e) => { if (e.key === 'ff_cart_v1') setCart(loadCart()); };
    window.addEventListener('storage', onStorage);
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    const id = setInterval(() => setCart(loadCart()), 800);
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('keydown', onKey); clearInterval(id); };
  }, []);

  const totalQty = cart.items.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="ff-cart">
      <button type="button" className="ff-header__btn" aria-label="Koszyk" onClick={() => setOpen(v => !v)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.16 14.26l.03.01 10.59-.01c.83 0 1.55-.5 1.85-1.22l2.95-6.88A1 1 0 0 0 21.66 4H6.21L5.27 2H2v2h2l3.6 7.59-1.35 2.45C5.52 15.37 6.48 17 8 17h12v-2H8.42c-.14 0-.25-.11-.25-.25 0-.04.01-.08.03-.11l.96-1.74z"/></svg>
        {totalQty > 0 && <span className="ff-cart__badge">{totalQty}</span>}
      </button>
      {open && (
        <div className="ff-cart__drawer" role="dialog" aria-label="Koszyk">
          <div className="ff-cart__header">
            <strong>Koszyk</strong>
            <button className="ff-btn" onClick={() => { clearCart(); setCart(loadCart()); }}>Wyczyść</button>
          </div>
          <div className="ff-cart__list">
            {cart.items.length === 0 ? (
              <div className="ff-cart__empty">Pusto</div>
            ) : cart.items.map(it => (
              <div className="ff-cart__row" key={it.id}>
                <span className="ff-cart__name">{it.name}</span>
                <div className="ff-cart__qty">
                  <button className="ff-btn" onClick={() => { updateItem(it.id, it.qty - 1); setCart(loadCart()); }}>−</button>
                  <span>{it.qty}</span>
                  <button className="ff-btn" onClick={() => { updateItem(it.id, it.qty + 1); setCart(loadCart()); }}>+</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


