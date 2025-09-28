require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Für lokale Entwicklung
}));
app.use(cors());
app.use(express.json());

// Frontend statisch ausliefern (Root-Verzeichnis)
app.use(express.static(path.join(__dirname, '..')));

// Datatrans Konfiguration
const DATATRANS_CONFIG = {
  merchantId: process.env.DATATRANS_MERCHANT_ID,
  password: process.env.DATATRANS_PASSWORD,
  hmacKey: process.env.DATATRANS_HMAC_KEY,
  endpoint: process.env.DATATRANS_ENDPOINT || 'https://api.sandbox.datatrans.com',
};

// Hilfsfunktion: HMAC-Signatur erstellen
function createHmacSignature(data, key) {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    frontend: 'Available at root',
    backend: 'API at /api/*',
    datatrans: {
      merchantId: DATATRANS_CONFIG.merchantId,
      endpoint: DATATRANS_CONFIG.endpoint,
      configured: !!DATATRANS_CONFIG.password
    }
  });
});

// Route: Payment initialisieren
app.post('/api/payment/init', async (req, res) => {
  try {
    const { amount, currency, orderId, campName, customerEmail, customerName } = req.body;

    console.log('Payment request received:', { amount, currency, orderId, customerEmail });

    // Validierung
    if (!amount || !currency || !orderId || !customerEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!DATATRANS_CONFIG.merchantId || !DATATRANS_CONFIG.password) {
      return res.status(500).json({ error: 'Datatrans not configured properly' });
    }

    // Datatrans Transaction Request
    const transactionData = {
      currency: currency,
      refno: orderId,
      amount: Math.round(amount * 100), // Betrag in Rappen/Cents
      redirect: {
        successUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/payment/success`,
        cancelUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/payment/cancel`,
        errorUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/payment/error`
      },
      option: {
        createAlias: false
      },
      theme: {
        name: "DT2015",
        configuration: {
          brandColor: "#2E7D32",
          logoBorderColor: "#2E7D32",
          brandButton: "#2E7D32"
        }
      }
    };

    console.log('Sending to Datatrans:', DATATRANS_CONFIG.endpoint);
    console.log('Transaction data:', transactionData);

    // API Call zu Datatrans
    const response = await fetch(`${DATATRANS_CONFIG.endpoint}/v1/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${DATATRANS_CONFIG.merchantId}:${DATATRANS_CONFIG.password}`).toString('base64')}`
      },
      body: JSON.stringify(transactionData)
    });

    const result = await response.json();
    console.log('Datatrans response status:', response.status);
    console.log('Datatrans response:', result);

    if (response.ok) {
      res.json({
        success: true,
        transactionId: result.transactionId,
        lightboxUrl: result.redirect.datatransLightbox
      });
    } else {
      console.error('Datatrans Error:', result);
      res.status(400).json({ 
        error: 'Payment initialization failed', 
        details: result,
        status: response.status
      });
    }

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Route: Payment Status überprüfen
app.post('/api/payment/status', async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID required' });
    }

    const response = await fetch(`${DATATRANS_CONFIG.endpoint}/v1/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${DATATRANS_CONFIG.merchantId}:${DATATRANS_CONFIG.password}`).toString('base64')}`
      }
    });

    const result = await response.json();

    if (response.ok) {
      res.json({
        success: true,
        status: result.status,
        transaction: result
      });
    } else {
      res.status(400).json({ error: 'Failed to get transaction status' });
    }

  } catch (error) {
    console.error('Status Check Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook für Datatrans
app.post('/api/webhook/datatrans', (req, res) => {
  try {
    const signature = req.headers['datatrans-signature'];
    const body = JSON.stringify(req.body);
    
    // HMAC Validierung (wenn konfiguriert)
    if (DATATRANS_CONFIG.hmacKey) {
      const expectedSignature = createHmacSignature(body, DATATRANS_CONFIG.hmacKey);
      
      if (signature !== expectedSignature) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { status, transactionId, refno } = req.body;
    console.log(`Payment Update: ${transactionId} - ${status}`);
    
    // Hier würdest du deine Datenbank updaten
    // Beispiel: Booking Status ändern, Email senden, etc.
    
    res.json({ success: true });

  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Success/Error Pages
app.get('/payment/success', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Zahlung erfolgreich - Padelcamp Mallorca</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      </head>
      <body style="background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%); min-height: 100vh; display: flex; align-items: center;">
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-md-6">
              <div class="card shadow-lg">
                <div class="card-body text-center p-5">
                  <i class="fas fa-check-circle text-success mb-4" style="font-size: 4rem;"></i>
                  <h1 class="text-success mb-3">Zahlung erfolgreich!</h1>
                  <p class="lead mb-4">Ihre Buchung für das Padelcamp wurde erfolgreich abgeschlossen.</p>
                  <p class="text-muted mb-4">Sie erhalten in Kürze eine Bestätigung per E-Mail mit allen Details.</p>
                  <a href="/" class="btn btn-success btn-lg">
                    <i class="fas fa-home me-2"></i>Zurück zur Website
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
});

app.get('/payment/cancel', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Zahlung abgebrochen - Padelcamp Mallorca</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      </head>
      <body style="background: linear-gradient(135deg, #f44336 0%, #e57373 100%); min-height: 100vh; display: flex; align-items: center;">
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-md-6">
              <div class="card shadow-lg">
                <div class="card-body text-center p-5">
                  <i class="fas fa-times-circle text-warning mb-4" style="font-size: 4rem;"></i>
                  <h1 class="text-warning mb-3">Zahlung abgebrochen</h1>
                  <p class="lead mb-4">Sie haben die Zahlung abgebrochen.</p>
                  <p class="text-muted mb-4">Keine Sorge - Sie können jederzeit eine neue Buchung starten.</p>
                  <a href="/" class="btn btn-success btn-lg">
                    <i class="fas fa-arrow-left me-2"></i>Zurück zur Website
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
});

app.get('/payment/error', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fehler bei der Zahlung - Padelcamp Mallorca</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      </head>
      <body style="background: linear-gradient(135deg, #f44336 0%, #e57373 100%); min-height: 100vh; display: flex; align-items: center;">
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-md-6">
              <div class="card shadow-lg">
                <div class="card-body text-center p-5">
                  <i class="fas fa-exclamation-triangle text-danger mb-4" style="font-size: 4rem;"></i>
                  <h1 class="text-danger mb-3">Fehler bei der Zahlung</h1>
                  <p class="lead mb-4">Es ist ein Fehler aufgetreten.</p>
                  <p class="text-muted mb-4">Bitte versuchen Sie es erneut oder kontaktieren Sie uns.</p>
                  <div class="d-grid gap-2">
                    <a href="/" class="btn btn-success btn-lg">
                      <i class="fas fa-redo me-2"></i>Erneut versuchen
                    </a>
                    <a href="mailto:info@padelcamp-mallorca.ch" class="btn btn-outline-secondary">
                      <i class="fas fa-envelope me-2"></i>Support kontaktieren
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Alle anderen Routes auf index.html weiterleiten (SPA-Verhalten)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log('\n🚀 Padelcamp Server gestartet!');
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 Backend API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  console.log('\n✨ Alles läuft über einen Server! ✨\n');
  
  // Konfiguration prüfen
  if (!DATATRANS_CONFIG.merchantId) {
    console.log('⚠️  DATATRANS_MERCHANT_ID nicht gesetzt in .env');
  }
  if (!DATATRANS_CONFIG.password) {
    console.log('⚠️  DATATRANS_PASSWORD nicht gesetzt in .env');
  }
});