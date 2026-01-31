const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Razorpay TEST credentials (APNI SECRET YAHA PASTE KARO)
const razorpay = new Razorpay({
  key_id: "rzp_test_S6ZxzqSocanX62",       // ✅ tumhari test key id
  key_secret: "PASTE_YOUR_NEW_SECRET_HERE" // ❌ yahan apna regenerated secret
});

/**
 * 🔹 Create Order
 * Frontend se amount aayega (INR)
 */
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100, // INR → paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });

    res.json(order);
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

/**
 * 🔹 Verify Payment
 * Razorpay success ke baad ye hit hota hai
 */
app.post("/verify-payment", (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", razorpay.key_secret)
      .update(body)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      res.json({ status: "success" });
    } else {
      res.status(400).json({ status: "failed" });
    }
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ status: "error" });
  }
});

// 🔹 Server start
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
