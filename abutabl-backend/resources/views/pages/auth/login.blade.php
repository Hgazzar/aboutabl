@extends('layouts/fullLayoutMaster')

@section('title', __('auth.login'))

@section('page-style')
        {{-- Page Css files --}}
        <link rel="stylesheet" href="{{ asset('css/pages/authentication.css') }}">
@endsection
@section('content')
<section class="row flexbox-container">
  <div class="col-xl-8 col-11 d-flex justify-content-center">
      <div class="card bg-authentication rounded-0 mb-0">
          <div class="row m-0">
              <div class="col-lg-6 d-lg-block d-none text-center align-self-center px-1 py-0">
                  <img style="width:70%"  src="{{ asset('images/pages/login.png') }}" alt="branding logo">
              </div>
              <div class="col-lg-6 col-12 p-0">
                  <div class="card rounded-0 mb-0 px-2">
                      <div class="card-header pb-1">
                          <div class="card-title">
                              <h4 class="mb-0">{{__('auth.login')}}</h4>
                          </div>
                      </div>
                      <p class="px-2">{{__('auth.WelcomeMessage')}}</p>
                      <div class="card-content">
                          <div class="card-body pt-1">
                              @if(session('error'))
                                <div class="alert alert-danger mt-1 alert-validation-msg" role="alert">
                                    <i class="feather icon-info mr-1 align-middle"></i>
                                    <span>{!! session('error') !!}</span>
                                </div>
                              @endif
                              <form action="{{ route('login') }}" id="loginForm" method="POST" >
                                  @csrf
                                  <fieldset class="form-label-group form-group position-relative has-icon-left">
                                      <input type="text" class="form-control" name="email" id="user-name" placeholder="{{__('auth.Email')}}" >
                                      <div class="form-control-position">
                                          <i class="feather icon-user"></i>
                                      </div>
                                      <label for="user-name">{{__('auth.Email')}}</label>
                                  </fieldset>
                                  <fieldset class="form-group form-label-group position-relative has-icon-left">
                                      <input type="password" class="form-control" name="password" id="user-password"  placeholder="{{__('auth.Password')}}" >
                                      <div class="form-control-position">
                                          <i class="feather icon-lock"></i>
                                      </div>
                                      <label for="user-password">{{__('auth.Password')}}</label>
                                  </fieldset>
                                  <div class="form-group d-flex justify-content-between align-items-center">
                                      <div class="text-left">
                                          {{-- <fieldset class="checkbox">
                                            <div class="vs-checkbox-con vs-checkbox-primary">
                                              <input type="checkbox">
                                              <span class="vs-checkbox">
                                                <span class="vs-checkbox--check">
                                                  <i class="vs-icon feather icon-check"></i>
                                                </span>
                                              </span>
                                              <span class="">Remember me</span>
                                            </div>
                                          </fieldset> --}}
                                      </div>
                                      {{-- <div class="text-right"><a href="auth-forgot-password" class="card-link">Forgot Password?</a></div> --}}
                                  </div>
                                  {{-- <a href="auth-register" class="btn btn-outline-primary float-left btn-inline">Register</a> --}}
                                  <button type="submit" class="btn btn-primary float-right btn-inline">{{__('auth.login')}}</button>
                              </form>
                          </div>
                      </div>
                      <div class="login-footer">
                        <div class="divider">
                          <div class="divider-text"><p class="text-center">
                            <span style='font-size:20px;font-family:Open Sans, sans-serif;'></span>
                            Copyright &copy;
                            <span id="year" class="mr5">{{ date('Y') }}</span>
                        </p></div>
                        </div>
                        <div class="footer-btn d-inline" style="align-content: center">
                        </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  </div>
</section>
@endsection


@section('page-script')
        <!-- Page js files -->

        <script>
            const form = $('#loginForm');
            $(document).ready(function(){
                form.formValidation({
                    excluded: [':disabled'],
                    fields: {
                        email: {
                            validators: {
                                notEmpty: {
                                    message: "@lang('auth.InsertEmail')"
                                },
                                regexp: {
                                    regexp: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                                    message: "@lang('auth.EmailIsNotCorrect')"
                                },
                                stringLength: {
                                    max: 100,
                                    message: "@lang('auth.StringLength',['lenght' => '100'])"
                                }
                            }
                        },
                        password: {
                            validators: {
                                notEmpty: {
                                    message: "@lang('auth.InsertPassword')"
                                },
                                stringLength: {
                                    min: 8,
                                    message: "@lang('auth.PasswordMinLenght', ['lenght' => '8'])"
                                }
                            }
                        },
                    },
                }); 
            });
        </script>
@endsection
