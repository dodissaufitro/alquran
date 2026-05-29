<?php
declare(strict_types=1);

// Salin ke api/subscription/config.local.php di server (production).

// putenv('XENDIT_SECRET_KEY=xnd_production_...');
// putenv('XENDIT_WEBHOOK_TOKEN=...');
putenv('SUBSCRIPTION_APP_ORIGIN=https://app.talaqee.com');
putenv('SUBSCRIPTION_REDIRECT_BASE_URL=https://app.talaqee.com');
/** Redirect Xendit setelah bayar di APK (harus HTTPS; halaman ini membuka deep link app) */
putenv('SUBSCRIPTION_APK_RETURN_URL=https://app.talaqee.com/payment-return.html');
// Webhook: https://app.talaqee.com/api/subscription/notification.php
