<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class SystemJobController extends Controller
{
    public function index()
    {
        $pending = DB::table('jobs')->count();
        $failed = DB::table('failed_jobs')->latest()->take(50)->get();

        return response()->json([
            'pending_count' => $pending,
            'failed_jobs' => $failed,
        ]);
    }

    public function destroy($id)
    {
        DB::table('failed_jobs')->where('id', $id)->delete();
        return response()->json(null, 204);
    }
}
