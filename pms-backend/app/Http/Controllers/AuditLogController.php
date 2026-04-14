<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index()
    {
        return response()->json(AuditLog::with('user')->latest()->paginate(50));
    }

    public function show(AuditLog $auditLog)
    {
        return response()->json($auditLog->load('user'));
    }
}
