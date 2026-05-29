require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const CoinbaseCommerce = require('coinbase-commerce-node');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Coinbase Commerce
CoinbaseCommerce.Client.init(process.env.COINBASE_COMMERCE_API_KEY);
const { Charge } = CoinbaseCommerce.resources;

app.use(cors({ origin: process.env.SITE_URL || '*' }));
app.use(express.json());
app.use(express.static('.'));

const PORT = process.env.PORT || 3002;
const SITE_URL = process.env.SITE_URL || `http://localhost:${PORT}`;

// ── Stripe Checkout (carte + TWINT) ──────────────────────────────────────────
app.post('/api/checkout', async (req, res) => {
  const { name, price, image, quantity = 1 } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Paramètres manquants : name, price requis.' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'chf',
      payment_method_types: ['card', 'twint'],
      line_items: [
        {
          quantity,
          price_data: {
            currency: 'chf',
            unit_amount: Math.round(price * 100),
            product_data: {
              name,
              ...(image ? { images: [image] } : {}),
            },
          },
        },
      ],
      success_url: `${SITE_URL}/merci.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/him.html`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Coinbase Commerce (crypto) ────────────────────────────────────────────────
app.post('/api/crypto-checkout', async (req, res) => {
  const { name, price } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Paramètres manquants : name, price requis.' });
  }

  try {
    const charge = await Charge.create({
      name,
      description: `Commande WW Cosmétiques — ${name}`,
      local_price: { amount: String(price), currency: 'CHF' },
      pricing_type: 'fixed_price',
      redirect_url: `${SITE_URL}/merci-crypto.html`,
      cancel_url: `${SITE_URL}/him.html`,
    });

    res.json({ url: charge.hosted_url });
  } catch (err) {
    console.error('Coinbase error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Stripe Webhook ────────────────────────────────────────────────────────────
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('✅ Paiement confirmé:', session.id, session.amount_total / 100, 'CHF');
  }

  res.json({ received: true });
});

app.listen(PORT, () => {
  console.log(`🚀 WW Cosmétiques server → http://localhost:${PORT}`);
});
