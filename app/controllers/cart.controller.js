// app/controllers/cart.controller.js
const db = require("../models");
const Cart = db.cart;

const getUserId = (req) => req.userId || req.user?.id || req.userIdFromToken;

exports.getCart = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const cart = await Cart.findOne({ where: { userId } });
    res.json({ items: cart?.items || [] });
  } catch (e) {
    next(e);
  }
};

exports.putCart = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const [cart, created] = await Cart.findOrCreate({
      where: { userId },
      defaults: { items },
    });
    if (!created) {
      cart.items = items;
      await cart.save();
    }
    res.json({ items: cart.items });
  } catch (e) {
    next(e);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const cart = await Cart.findOne({ where: { userId } });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ items: [] });
  } catch (e) {
    next(e);
  }
};
