<?php
declare(strict_types=1);

// Salin ke api/subscription/config.local.php di server (production).

// putenv('XENDIT_SECRET_KEY=xnd_production_...');
// putenv('XENDIT_WEBHOOK_TOKEN=...');
putenv('SUBSCRIPTION_REDIRECT_BASE_URL=https://app.talaqee.com');
// Webhook: https://app.talaqee.com/api/subscription/notification.php
