// เก็บเป็น [{id, name, price, cover, perks[], qty}]
const KEY = "cart";

const read = () => JSON.parse(localStorage.getItem(KEY) || "[]");
const write = (items) => localStorage.setItem(KEY, JSON.stringify(items));

const getItems = () => read();
const getCount = () => read().reduce((s, i) => s + Number(i.qty || 0), 0);
const clear = () => write([]);

const addItem = (room, qty = 1) => {
  const items = read();
  const idx = items.findIndex((i) => i.id === room.id);
  if (idx >= 0) items[idx].qty = Number(items[idx].qty || 0) + Number(qty || 1);
  else
    items.push({
      id: room.id,
      name: room.name,
      price: room.price,
      cover: room.cover,
      perks: room.perks || [],
      qty: Number(qty || 1),
    });
  write(items);
  window.dispatchEvent(new Event("cart:changed"));
  return items;
};

const updateQty = (id, qty) => {
  const items = read().map((i) => (i.id === id ? { ...i, qty: Math.max(1, Number(qty)) } : i));
  write(items);
  window.dispatchEvent(new Event("cart:changed"));
  return items;
};

const removeItem = (id) => {
  write(read().filter((i) => i.id !== id));
  window.dispatchEvent(new Event("cart:changed"));
};

export default { getItems, getCount, addItem, updateQty, removeItem, clear };
