<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Services\OffreCadeauService;
use Illuminate\Http\JsonResponse;

class OffreCadeauController extends Controller
{
    public function index(OffreCadeauService $offreCadeauService): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $offreCadeauService->offresPubliques()]);
    }
}
