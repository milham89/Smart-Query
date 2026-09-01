<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransactionArsipRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'kode_pelaksana' => 'required|string|max:255',
            'nama_peminjam'  => 'required|string|max:255',
        ];
    }
}
