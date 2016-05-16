$(document).ready(function(){
	
	$( "form" ).submit(function( event ) {
		event.preventDefault();
		$('#pageloading').show();
		$('#wfcontent').css('opacity', '0');
		var form = $(this);
		chrome.storage.sync.set({
			"wfdomain": form.find('[name="wfdomain"]').val(),
			"username": form.find('[name="username"]').val(),
			"password": form.find('[name="password"]').val(),
			"autosignin": true,
			"sendpushnotify": true,
			"isConfiged": true
		});
		var apiPath = "https://"+form.find('[name="wfdomain"]').val()+".attask-ondemand.com/attask/api/v5.0/";
		$.post( apiPath+"login", { username: form.find('[name="username"]').val(), password: form.find('[name="password"]').val() } ).done(function( data ) {
			chrome.storage.sync.set({
				'sessionID': data.data.sessionID,
				'userID': data.data.userID
			});
			window.location = "popup.html";
		});
	});
	
});