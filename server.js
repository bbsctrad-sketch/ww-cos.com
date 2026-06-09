require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const nodemailer = require('nodemailer');

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOrderNotification(customer, orderName, orderPrice) {
  if (!process.env.SMTP_HOST) return;
  const adresse = customer
    ? `${customer.adresse || ''}, ${customer.npa || ''} ${customer.ville || ''}, ${customer.pays || ''}`
    : 'Non renseignée';
  await mailer.sendMail({
    from: `"WW Cosmétiques" <${process.env.SMTP_USER}>`,
    to: 'ceo@ww-cos.com',
    subject: `🛒 Nouvelle commande — ${orderName}`,
    html: `
      <h2 style="font-family:sans-serif;">Nouvelle commande reçue</h2>
      <table style="font-family:sans-serif; font-size:14px; border-collapse:collapse;">
        <tr><td style="padding:6px 16px 6px 0; color:#888;">Produit</td><td><strong>${orderName}</strong></td></tr>
        <tr><td style="padding:6px 16px 6px 0; color:#888;">Montant</td><td><strong>CHF ${orderPrice}</strong></td></tr>
        <tr><td style="padding:6px 16px 6px 0; color:#888;">Nom</td><td>${(customer?.prenom || '') + ' ' + (customer?.nom || '')}</td></tr>
        <tr><td style="padding:6px 16px 6px 0; color:#888;">Email</td><td>${customer?.email || '—'}</td></tr>
        <tr><td style="padding:6px 16px 6px 0; color:#888;">Téléphone</td><td>${customer?.phone || '—'}</td></tr>
        <tr><td style="padding:6px 16px 6px 0; color:#888;">Adresse</td><td>${adresse}</td></tr>
      </table>
    `,
  });
}

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors({ origin: process.env.SITE_URL || '*' }));
app.use(express.json());
app.use(express.static('.'));

const PORT = process.env.PORT || 3002;
const SITE_URL = process.env.SITE_URL || `http://localhost:${PORT}`;

// ── Stripe Checkout (carte) ──────────────────────────────────────────────────
app.post('/api/checkout', async (req, res) => {
  const { name, price, image, quantity = 1, customer } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Paramètres manquants : name, price requis.' });
  }

  try {
    const sessionParams = {
      mode: 'payment',
      currency: 'chf',
      payment_method_types: ['card'],
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
      cancel_url: req.headers.referer || `${SITE_URL}/him.html`,
    };

    if (customer?.email) sessionParams.customer_email = customer.email;
    if (customer) {
      sessionParams.metadata = {
        nom: `${customer.prenom || ''} ${customer.nom || ''}`.trim(),
        phone: customer.phone || '',
        adresse: `${customer.adresse || ''}, ${customer.npa || ''} ${customer.ville || ''}, ${customer.pays || ''}`.trim(),
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    sendOrderNotification(customer, name, price).catch(e =>
      console.error('Email error:', e.message)
    );

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
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
