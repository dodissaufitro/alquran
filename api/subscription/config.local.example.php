<?php
declare(strict_types=1);

// Salin ke config.local.php dan sesuaikan nilainya.
putenv('SUBSCRIPTION_DEMO_SECRET=faithfulpath-jurnal-demo-2026');

// Xendit (disarankan — pengguna diarahkan ke halaman pembayaran Xendit)
// Di dashboard: API Keys → key Anda → centang izin "Invoice" (Write)
// putenv('XENDIT_SECRET_KEY=xnd_development_xxxxxxxx');
// putenv('XENDIT_WEBHOOK_TOKEN=token_dari_dashboard_xendit');
// putenv('SUBSCRIPTION_REDIRECT_BASE_URL=https://localhost'); // APK Capacitor
// Webhook URL di dashboard Xendit: https://domain-anda.com/api/subscription/notification.php

// Midtrans QRIS (opsional, jika Xendit tidak di-set)
// putenv('MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx');
// putenv('MIDTRANS_IS_PRODUCTION=0');
