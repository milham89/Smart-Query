<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SearchArsipRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'kode_pelaksana' => 'nullable|string|max:255',
            'no_boks'        => 'nullable|string|max:255',
        ];
    }
}
