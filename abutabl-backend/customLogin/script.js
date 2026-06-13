

$(".menu-icon").click(function(){

    $("nav ul").toggleClass("showing")

});

$(window).scroll(function(){
    if($(window).scrollTop())
    {
        $("nav").addClass("block");
    }
    else
    {
        $("nav").removeClass("block");
    }
})


/* acordion */

$(".sec-ask div").first().css("display","block");

$(".sec-ask h3").click(function(){

    $(this).next().slideToggle(400);
    $(".sec-ask div").not($(this).next()).slideUp(400);

})
/* acordion */


var slideIndex = 1;
showSlides(slideIndex);

var sliderTimer;

// Next/previous controls
function plusSlides(n) {
  clearTimeout(sliderTimer);
    showSlides(slideIndex = slideIndex + n);
}

// Thumbnail image controls
function currentSlide(n) {
    
  clearTimeout(sliderTimer);
    showSlides(slideIndex = n);
    showSlides2(slideIndex = n);
}

function showSlides(n) {
   
    var i;
    var slides = document.getElementsByClassName('slidr');
    var dets = document.getElementsByClassName("dot");
    slideIndex = n;
    if (n > slides.length) {slideIndex = 1} 
    if (n < 1) {slideIndex = slides.length}
    for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none"; 

    }
    for (i = 0; i < dets.length; i++) {
      dets[i].className = dets[i].className.replace("active", "");

    }
      slides[slideIndex-1].style.display = "block"; 
      dets[slideIndex-1].className += " active";
      sliderTimer = setTimeout(function() {
        showSlides(slideIndex+1);
        showSlides2(slideIndex+0);
      }, 2000);

}

function showSlides2(n) {
   
    var i;
    var slides = document.getElementsByClassName('slidr2');
    var dets = document.getElementsByClassName("dot");
    slideIndex = n;
    if (n > slides.length) {slideIndex = 1} 
    if (n < 1) {slideIndex = slides.length}
    for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none"; 
      

    }
    for (i = 0; i < dets.length; i++) {
      dets[i].className = dets[i].className.replace("active", "");


    }
      slides[slideIndex-1].style.display = "block"; 
      dets[slideIndex-1].className += " active";

     
 

}




/*this is the start section ask toggle plus and minus  */


$('.item1').click(function(){


  if($('.item1 i').hasClass('fa-plus'))
  {
      $('.item1 i').addClass('fa-minus');
      $('.item1 i').removeClass('fa-plus');
      $('.plus-seemore1').slideToggle();
      
  }
  else
  {
      $('.item1 i').addClass('fa-plus');
      $('.item1 i').removeClass('fa-minus');
      $('.plus-seemore1 ').slideToggle();

  }


})


$('.item2').click(function(){


  if($('.item2 i').hasClass('fa-plus'))
  {
      $('.item2 i').addClass('fa-minus');
      $('.item2 i').removeClass('fa-plus');
      $('.plus-seemore2').slideToggle();
      
  }
  else
  {
      $('.item2 i').addClass('fa-plus');
      $('.item2 i').removeClass('fa-minus');
      $('.plus-seemore2 ').slideToggle();

  }


})

$('.item3').click(function(){


  if($('.item3 i').hasClass('fa-plus'))
  {
      $('.item3 i').addClass('fa-minus');
      $('.item3 i').removeClass('fa-plus');
      $('.plus-seemore3').slideToggle();
      
  }
  else
  {
      $('.item3 i').addClass('fa-plus');
      $('.item3 i').removeClass('fa-minus');
      $('.plus-seemore3 ').slideToggle();

  }


})


$('.item4').click(function(){


  if($('.item4 i').hasClass('fa-plus'))
  {
      $('.item4 i').addClass('fa-minus');
      $('.item4 i').removeClass('fa-plus');
      $('.plus-seemore4').slideToggle();
      
  }
  else
  {
      $('.item4 i').addClass('fa-plus');
      $('.item4 i').removeClass('fa-minus');
      $('.plus-seemore4 ').slideToggle();

  }


})

$('.item5').click(function(){


  if($('.item5 i').hasClass('fa-plus'))
  {
      $('.item5 i').addClass('fa-minus');
      $('.item5 i').removeClass('fa-plus');
      $('.plus-seemore5').slideToggle();
      
  }
  else
  {
      $('.item5 i').addClass('fa-plus');
      $('.item5 i').removeClass('fa-minus');
      $('.plus-seemore5 ').slideToggle();

  }


})
/*this is the end section ask toggle plus and minus  */
