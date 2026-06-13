
$(document).ready(function(){


    $('i.change_status').click(function(e){
        e.preventDefault();
		var route 			= 	$(this).attr('data-route');
		var id 			= 	$(this).attr('data-id');
		var confirm_msg 	= 	$(this).attr('confirm_msg');
		var success_msg 	= 	$(this).attr('success_msg');
		var status 		    = 	$(this).attr('data-status');
        var location = 'i#status_'+id;
		

		Swal.fire({
            title: confirm_msg,
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: $(this).attr('yes'),
            cancelButtonText: $(this).attr('no'),
            confirmButtonClass: 'btn btn-primary',
            cancelButtonClass: 'btn btn-danger ml-1',
            buttonsStyling: false,
         
        }).then(function(result) {
            if (result.value) {
                jQuery.ajax( {
                    async :true,
                    type  :"POST",
                    url   :route,
                    data  :  { },
                    headers: {
                        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                    },
                    success : function(data) {
                    if(data == 200)
                    {
                        
                        if(status == '0'){
                            $(location).removeClass('change_status fa fa-toggle-off fa-2x danger');
                            $(location).addClass('change_status fa fa-toggle-on fa-2x success');
                            $(location).attr('data-status',1);
                         }else
                         {
                            $(location).removeClass('change_status fa fa-toggle-on fa-2x success');
                            $(location).addClass('change_status fa fa-toggle-off fa-2x danger');	
                            $(location).attr('data-status',0);
                         }	
                        toastr.success(success_msg, 'Success');

                    }
                    else
                    {
                        toastr.error(data, 'Error');
                    }
                    },
                    error : function() {
                        return true;
                    }
                });
		    }
        });
    });

     $('a.delete').click(function(e){
        e.preventDefault();


		id 				= 	$(this).attr('data-id');
		confirm_msg 	= 	$(this).attr('confirm_msg');
		success_msg 	= 	$(this).attr('success_msg');
		route   		= 	$(this).attr('data-route');

		Swal.fire({
            title: confirm_msg,
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: $(this).attr('yes'),
            cancelButtonText: $(this).attr('no'),
            confirmButtonClass: 'btn btn-primary',
            cancelButtonClass: 'btn btn-danger ml-1',
            buttonsStyling: false,
         
        }).then(function(result) {
            if (result.value) {
			jQuery.ajax( {
				async :true,
				type  : "POST",
				url   : route,
				data  : {id : id},
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                },
                success : function(data) {
					if(data == 200)
					{
						$('#tr_'+id).fadeOut("slow", function(){
					         toastr.success(success_msg, 'Success');
					     });
					}
					else 
					{
						toastr.error(data, 'Error');
					}

				},
				error : function() {
					return true;
				}
			});
            }
        });
    });

        $('button.ViewDelete').click(function(){
            id 				= 	$(this).attr('data-id');
            success_msg 	= 	$(this).attr('success_msg');
            confirm_msg 	= 	$(this).attr('confirm_msg');
            route   		= 	$(this).attr('data-route');
            routeRedirect   = 	$(this).attr('data-routeRedirect');
            Swal.fire({
                title: confirm_msg,
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: $(this).attr('yes'),
                cancelButtonText: $(this).attr('no'),
                confirmButtonClass: 'btn btn-primary',
                cancelButtonClass: 'btn btn-danger ml-1',
                buttonsStyling: false,
             
            }).then(function(result) {
                if (result.value) {
                    jQuery.ajax( {
                        async :true,
                        type  : "DELETE",
                        url   : route,
                        data  : {id : id,from:'show'},
                        headers: {
                            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                        },
                        success : function(data) {
                            if(data == 200)
                            {
                                toastr.success(success_msg, 'Success');
                                setTimeout(redirectNow, 1700);
                            }
                            else 
                            {
                                toastr.error(data, 'Error');
                            }
        
                        },
                        error : function() {
                            return true;
                        }
                    });
                }
            });
                
            });


   
            function redirectNow()
            {
                    window.location= routeRedirect;
            }		
// end function ready
});