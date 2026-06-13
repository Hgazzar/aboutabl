@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header">{{ __('Login') }}</div>

                <div class="card-body">
                    <form method="POST" action="{{ route('login') }}">
                        @csrf

{{--                        <div class="row mb-3">--}}
{{--                            <label for="type" class="col-md-4 col-form-label text-md-end">Type</label>--}}

{{--                            <div class="col-md-6">--}}
{{--                                <select class="form-control" for="type" name="type">--}}
{{--                                    <option value="user">User</option>--}}
{{--                                    <option value="teacher">Teacher</option>--}}
{{--                                    <option value="student">Student</option>--}}
{{--                                </select>--}}
{{--                                @error('email')--}}
{{--                                <span class="invalid-feedback" role="alert">--}}
{{--                                        <strong>{{ $message }}</strong>--}}
{{--                                    </span>--}}
{{--                                @enderror--}}
{{--                            </div>--}}
{{--                        </div>--}}

                        @php
                        $url = explode('/',session('url.intended'));
                        $game_id = $url[count($url) - 1];
                        @endphp
                        <input value="{{ $game_id }}" name="game_id" hidden>
                        @if(str_contains(session('url.intended'), 'teacher'))
                            <input value="teacher" name="type" hidden>
                        @else
{{--                        @if(str_contains(session('url.intended'), 'student/'))--}}
                            <input value="student" name="type" hidden>
                        @endif
{{--                        <div class="row mb-3">--}}
{{--                            <label for="game_id" class="col-md-4 col-form-label text-md-end">Game</label>--}}

{{--                            <div class="col-md-6">--}}
{{--                                <select class="form-control" for="game_id" name="game_id">--}}
{{--                                    --}}{{--                                    <option value="user">User</option>--}}
{{--                                    <option value="1">Game 1</option>--}}
{{--                                    <option value="2">Game 2</option>--}}
{{--                                </select>--}}
{{--                                @error('email')--}}
{{--                                <span class="invalid-feedback" role="alert">--}}
{{--                                        <strong>{{ $message }}</strong>--}}
{{--                                    </span>--}}
{{--                                @enderror--}}
{{--                            </div>--}}
{{--                        </div>--}}

                        <div class="row mb-3">
                            <label for="email" class="col-md-4 col-form-label text-md-end">{{ __('Email Address') }}</label>

                            <div class="col-md-6">
                                <input id="email" class="form-control @error('email') is-invalid @enderror" name="email" value="{{ old('email') }}" required autocomplete="email" autofocus>

                                @error('email')
                                    <span class="invalid-feedback" role="alert">
                                        <strong>{{ $message }}</strong>
                                    </span>
                                @enderror
                            </div>
                        </div>

                        <div class="row mb-3">
                            <label for="password" class="col-md-4 col-form-label text-md-end">{{ __('Password') }}</label>

                            <div class="col-md-6">
                                <input id="password" type="password" class="form-control @error('password') is-invalid @enderror" name="password" required autocomplete="current-password">

                                @error('password')
                                    <span class="invalid-feedback" role="alert">
                                        <strong>{{ $message }}</strong>
                                    </span>
                                @enderror
                            </div>
                        </div>

{{--                        <div class="row mb-3">--}}
{{--                            <div class="col-md-6 offset-md-4">--}}
{{--                                <div class="form-check">--}}
{{--                                    <input class="form-check-input" type="checkbox" name="remember" id="remember" {{ old('remember') ? 'checked' : '' }}>--}}

{{--                                    <label class="form-check-label" for="remember">--}}
{{--                                        {{ __('Remember Me') }}--}}
{{--                                    </label>--}}
{{--                                </div>--}}
{{--                            </div>--}}
{{--                        </div>--}}

                        <div class="row mb-0">
                            <div class="col-md-8 offset-md-4">
                                <button type="submit" class="btn btn-primary">
                                    {{ __('Login') }}
                                </button>

                                @if (Route::has('password.request'))
                                    <a class="btn btn-link" href="{{ route('password.request') }}">
                                        {{ __('Forgot Your Password?') }}
                                    </a>
                                @endif
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
