$(document).ready(function(){
    //$('#username').focus();
  });
  
  //CATCH THE SUBMIT
  // $('#login').on('submit', function(e){
  //   e.preventDefault();
  //   e.stopPropagation();
    
  //   //CHECK THAT FIELDS ARE FILLED
  //   if ($("#email").val() != '' && $("#password").val() != '' ){
      
  //     //SUBMIT BUTTON ANIMATION HANDLING
  //     $('#submit').addClass('checking');
  //     $('#submit input').attr('disabled','true');
      
  //     //IMITATE LOADING TIME
  //     //This would be replaced with ajax in production.
  //     setTimeout(function(){
  //       $('#submit').removeClass('checking');
  //       clearPassword();
  //       handleMessage();
  //     }, 1000);
      
  //   } else{
      
  //     //SHAKE THE USERNAME AND PW FIELDS IF THEY ARE EMPTY ON SUBMIT
  //     if ($("#email").val() != ''){
        
  //       $("#password").addClass('shake');
  //       $("#password").focus();
  //       setTimeout(function(){
  //         $("#password").removeClass('shake');
  //       },440);
        
  //     } else {
        
  //       $("#email").addClass('shake');
  //       $("#email").focus();
  //       setTimeout(function(){
  //         $("#email").removeClass('shake');
  //       },440);
        
  //     }
  //   }
  // })

  $("#login").validate({
    errorPlacement: function (error, element) {
        if (element.attr("type") == "checkbox") {
            element.parent().append(error);
        } else {
            element.parent().append(error);
        }
    },
    submitHandler: function (form) {
        $("form#login :submit").attr("disabled", true);
        jQuery.ajax({
            type: "POST",
            cache: false,
            dataType: "json",
            contentType: false,
            processData: false,
            data: new FormData(form),
            url: `${ajax_url}/api/login`,
            mimeType: "multipart/form-data",
            success: function (response) {
                if (response?.status) {
                    jQuery.notify({ message: response.message }, { type: "success" });
                    setTimeout(function () {
                        window.location.href = response?.redirect_url;
                    }, 1500);
                } else {
                    $("form#login :submit").attr("disabled", false);
                    jQuery.notify({ message: response.message }, { type: "danger" });
                }
            },
        });
    },
});
  
  //HANDLE ANIMATION AND CLEARING OF INCORRECT PW
  function clearPassword(){
    $("#password").addClass('shake');
    setTimeout(function(){
      $("#password").val('');
      $("#password").focus();
      $("#password").removeClass('shake');
      $('#submit input').removeAttr('disabled');
    },440);
  }
  
  //STORE USERNAMES AND ATTEMPTS REMAINING
  //Purley for display purposes, this would be handled on the server with ajax in production.
  var log = {};
  
  
  //CHECK THE NUMBER OF ATTEMPTS REMANING AND SHOW APPROPRIATE MESSAGE
  function handleMessage(){
    
    var username = $('#email').val();
    
    if(log[username] == undefined){
      log[username] = 3;
    }
    
    var attempts = log[username];
    
    switch(attempts){
      case 3:
        $('.remain').removeClass('hidden finished');
        $('.number').removeClass('two one');
        $('.lockout').addClass('hidden');
        log[username]--
      break;
      case 2:
        $('.remain').removeClass('hidden finished');
        $('.number').addClass('two');
        $('.number').removeClass('one');
        $('.lockout').addClass('hidden');
        log[username]--
      break;
      case 1:
        $('.remain').removeClass('hidden finished');
        $('.number').addClass('two one');
        $('.lockout').addClass('hidden');
        log[username]--
      break;
      case 0:
        $('.remain').removeClass('hidden');
        $('.remain').addClass('finished');
        $('.number').addClass('two one');
        $('.lockout').removeClass('hidden');
      break;
    }
  }
  