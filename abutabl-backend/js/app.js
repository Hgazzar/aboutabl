
$(document).ready(function(){


    $('i.change_status').click(function(e){
        e.preventDefault();

		page 			= 	$(this).attr('page');
		confirm_msg 	= 	$(this).attr('confirm_msg');
		success_msg 	= 	$(this).attr('success_msg');
		id 				= 	$(this).attr('id');
		status 			= 	id+'_status';

		if($('#'+status).val() == '0')
		{
		   $(this).removeClass('fa-toggle-off');
		   $(this).addClass('fa-toggle-on');
		}
		else
		{
		   $(this).removeClass('fa-toggle-on');
		   $(this).addClass('fa-toggle-off');	
		}	

		if (confirm(confirm_msg))
		{
			jQuery.ajax( {
				async :true,
				type  :"POST",
				url   :"/admin/"+page+"/status/"+id,
				data  :  { },
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                },
                success : function(data) {
				if(data == 200)
				{
					if($('#'+status).val() == '0')
					{
						$('#'+status).val('1');
					}
					else
					{
						$('#'+status).val('0');
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

     $('a.delete').click(function(e){
        e.preventDefault();


		id 				= 	$(this).attr('data-id');
		confirm_msg 	= 	$(this).attr('confirm_msg');
		success_msg 	= 	$(this).attr('success_msg');
		route   		= 	$(this).attr('data-route');
		from   		    = 	$(this).attr('data-from');
        routeRedirect   = 	$(this).attr('data-routeRedirect');

		if (confirm(confirm_msg))
		{
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
						if(from == 'links')
						{
							 toastr.success(success_msg, 'Success');
					          window.location= routeRedirect;
						}
						$('#'+id+'_tr').fadeOut("slow", function(){
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
                        type  : "POST",
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