<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index()
    {
        return response()->json(Notification::orderBy('created_at', 'desc')->paginate(20));
    }

    public function markAsRead(Notification $notification)
    {
        $notification->update(['status' => 'read']);
        return response()->json(['message' => 'Notification marked as read', 'data' => $notification]);
    }
}
