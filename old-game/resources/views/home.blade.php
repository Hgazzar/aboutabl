@extends('layouts.app')

@section('content')
    <div class="container">
        <div class="row">
            @forelse($games as $game)
                @php
                    $url;
                    if(str_contains(session('url.intended'), 'teacher')) {
                        $url = '/teacher/waiting/'.$game->id;
                    } else {
                        if ($game->type == 'hacking') {
                            $url = '/student/choose_password/'.$game->id;
                        } else {
                            $url = '/student/'.$game->id;
                        }
                    }
                @endphp
                <div class="col-md-3" style="margin-bottom: 20px;">
                    <div class="card">
                        <a href="{{ $url }}">
                            <div class="card-body" style="min-height: 186px;">
                                    <img src="/{{ $game->logo }}" style="width: 100%;"
                                         alt="logo"/>
                            </div>
                        </a>
                        <a href="{{ $url }}" style="text-decoration: unset;">
                            <div class="card-footer ">
                                {{ $game->name }}
                            </div>
                        </a>
                    </div>
                </div>
            @empty
                <div class="col-12">
                    <div class="alert alert-info" role="alert">
                        <h5 class="alert-heading">No games yet</h5>
                    </div>
                </div>
            @endforelse
        </div>
    </div>
@endsection
