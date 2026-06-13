@extends('layouts/contentLayoutMaster')

@section('title', __('lang.log'))

@section('content')
{{-- Data list view starts --}}
<section id="contextual-colors" class="card">

        <div class="card-content">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table  table-bordered table-striped  mb-0">
                        <thead>
                            <tr>
                                <th scope="col">#</th>
                                <th scope="col">الحاله</th>
                                <th scope="col">الوقت</th>
                            </tr>
                            </thead>
                            <tbody>
                                @foreach($logs as $log)
                                  <tr id="tr_{{$log->id}}">
                                      <td>{{$log->id}}</td>
                                      <td>
                                        @if($log->block == 1 )
                                            <span style="color:red">تم الحظر من موقع جوميا</span>
                                            <br/>
                                            <span> ( {{$log->phones}} رقم )</span>
                                        @else
                                            <span>تم فك الحظر من موقع جوميا</span>
                                        @endif
                                      </td>
                                      <td>{{$log->created_at}}</td>
                                        
                                  </tr>
                                @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="d-flex justify-content-center">
              {!! $logs->links('pagination::bootstrap-4') !!}
            </div>
        </div>
</section>
  {{-- Data list view end --}}
@endsection

@section('page-script')
@endsection
