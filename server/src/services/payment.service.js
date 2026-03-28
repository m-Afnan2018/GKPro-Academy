const Razorpay = require("razorpay");
const crypto = require("crypto");

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

const createOrder = async (amount) => {
  if (!razorpay) throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  const options = {
    amount, // amount in paise
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };
  return razorpay.orders.create(options);
};

const verifySignature = (orderId, paymentId, signature) => {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
};

module.exports = { createOrder, verifySignature };
