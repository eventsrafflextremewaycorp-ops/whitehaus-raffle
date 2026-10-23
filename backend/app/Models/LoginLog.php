<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoginLog extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'ip_address', 'user_agent', 'logged_in_at', 'logged_out_at'];

    protected function casts(): array
    {
        return ['logged_in_at' => 'datetime', 'logged_out_at' => 'datetime'];
    }
}
