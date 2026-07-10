<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\User;
use App\Models\LearningArticle;
use App\Models\Order;
use App\Models\Recording;
use App\Http\Controllers\Api\Cms\CmsAuthController;
use App\Http\Controllers\Api\Cms\CmsContentController;
use App\Http\Controllers\Api\Cms\CmsLearningController;
use App\Http\Controllers\Api\Cms\CmsAdminListController;
use App\Http\Controllers\Api\Cms\CmsPublicController;
use App\Http\Controllers\Api\Cms\CmsYoutubeController;
use App\Http\Controllers\Api\SubscriptionController;

Route::get('/stats', function () {
    return response()->json([
        'ok' => true,
        'framework' => 'Laravel ' . app()->version(),
        'stats' => [
            'users' => User::count(),
            'articles' => LearningArticle::count(),
            'orders' => Order::count(),
            'recordings' => Recording::count(),
        ]
    ]);
});

Route::prefix('cms')->group(function () {
    // Admin routes
    Route::prefix('admin')->group(function () {
        Route::post('/login{ext?}', [CmsAuthController::class, 'login'])->where('ext', '\.php');
        Route::post('/logout{ext?}', [CmsAuthController::class, 'logout'])->where('ext', '\.php');
        Route::get('/me{ext?}', [CmsAuthController::class, 'me'])->where('ext', '\.php');

        Route::match(['get', 'put', 'post'], '/content{ext?}', [CmsContentController::class, 'handle'])->where('ext', '\.php');
        Route::match(['put', 'post', 'delete'], '/learning-article{ext?}', [CmsLearningController::class, 'handle'])->where('ext', '\.php');
        Route::post('/import-default{ext?}', [CmsContentController::class, 'importDefault'])->where('ext', '\.php');
        Route::post('/upload-jurnal-cover{ext?}', [CmsContentController::class, 'uploadJurnalCover'])->where('ext', '\.php');

        Route::match(['get', 'delete'], '/talaqqi-recordings{ext?}', [CmsAdminListController::class, 'talaqqiRecordings'])->where('ext', '\.php');
        Route::get('/users{ext?}', [CmsAdminListController::class, 'users'])->where('ext', '\.php');
        Route::get('/user-coins{ext?}', [CmsAdminListController::class, 'userCoins'])->where('ext', '\.php');
        Route::get('/youtube{ext?}', [CmsYoutubeController::class, 'index'])->where('ext', '\.php');
        Route::post('/youtube{ext?}', [CmsYoutubeController::class, 'store'])->where('ext', '\.php');
        Route::put('/youtube{ext?}/{id}', [CmsYoutubeController::class, 'update'])->where('ext', '\.php');
        Route::delete('/youtube{ext?}/{id}', [CmsYoutubeController::class, 'destroy'])->where('ext', '\.php');
    });

    // Public routes
    Route::prefix('public')->group(function () {
        Route::get('/all{ext?}', [CmsPublicController::class, 'all'])->where('ext', '\.php');
        Route::get('/health{ext?}', [CmsPublicController::class, 'health'])->where('ext', '\.php');
        Route::get('/learning{ext?}', [CmsPublicController::class, 'learning'])->where('ext', '\.php');
        Route::get('/learning-article{ext?}', [CmsPublicController::class, 'learningArticle'])->where('ext', '\.php');
        Route::get('/youtube{ext?}', [CmsYoutubeController::class, 'publicIndex'])->where('ext', '\.php');
    });
});

Route::prefix('subscription')->group(function () {
    Route::get('/status{ext?}', [SubscriptionController::class, 'status'])->where('ext', '\.php');
    Route::post('/checkout{ext?}', [SubscriptionController::class, 'checkout'])->where('ext', '\.php');
    Route::get('/order-status{ext?}', [SubscriptionController::class, 'orderStatus'])->where('ext', '\.php');
    Route::post('/simulate-pay{ext?}', [SubscriptionController::class, 'simulatePay'])->where('ext', '\.php');
});

Route::any('/{any}', function (Request $request, $any) {
    $apiPath = realpath(base_path('../api/' . $any));
    if ($apiPath && str_starts_with($apiPath, realpath(base_path('../api'))) && str_ends_with(strtolower($apiPath), '.php')) {
        $_SERVER['REQUEST_METHOD'] = $request->method();
        $_SERVER['REQUEST_URI'] = $request->getRequestUri();
        $_GET = $request->query();
        $_POST = $request->post();

        require_once base_path('../api/env.php');
        if (function_exists('app_load_config')) {
            app_load_config();
        }
        require $apiPath;
        exit;
    }
    return response()->json(['ok' => false, 'error' => 'API route not found in Laravel or legacy API: ' . $any], 404);
})->where('any', '.*');

