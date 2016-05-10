
var ba = chrome.browserAction;
var baCount=0;
function setAllRead() {
  ba.setBadgeBackgroundColor({color: [0, 255, 0, 128]});
  ba.setBadgeText({text: ' '});   // <-- set text to '' to remove the badge
}

function setUnread(unreadItemCount) {
  ba.setBadgeBackgroundColor({color: "#f79241"});
  ba.setBadgeText({text: '' + unreadItemCount});
}
 

var wf = {
	get: function(api, fn){
		$.getJSON( "https://pcci.attask-ondemand.com/attask/api/"+api, function( data ) { fn(data); }).error(function(){
			swal({
			  title: "Sync Error",
			  text: "Could not connect to Workfront servers. (make sure you are loggeed in)",
			  type: "warning",
			  showCancelButton: false,
			  confirmButtonClass: "btn-danger swal-red",
			  confirmButtonText: "close",
			  closeOnConfirm: false
			});
		});
	},
	tasks: function(api, fn){
		this.get('task/'+api, function(){
			fn
		});
	}
}


function pop(apac){
	var wfcontent = $('#wfcontent');
	wfcontent.empty();
	wf.get(apac, function(data){
		$.each(data.data, function(key, task){
			//console.log(task)
			var dueON = $.format.date(task.plannedCompletionDate, "MMMM d, yyyy");
			var html = '<a class="wf-list-item" target="_blank" href="https://pcci.attask-ondemand.com/task/view?ID='+task.ID+'">'+
							'<strong>'+task.name+'</strong><br />'+
							'<span class="wf-list-item-date">Due: '+dueON+'</span>'+
						'</a>';
			wfcontent.append(html);
			baCount=key;
		});
	});
}


$(document).ready(function(){
	pop('work');
	
	$('[data-load]').on('click', function(){
		$('[data-load]').parent().removeClass('active');
		$(this).parent().addClass('active');
		var apac = $(this).data('load');
		pop(apac);
	});

	$( "#prefform" ).submit(function( event ) {
		event.preventDefault();
		var form = $(this);
		chrome.storage.sync.set({
			"fname": form.find('[name="fname"]').val(),
			"lname": form.find('[name="lname"]').val(),
			"email": form.find('[name="email"]').val(),
			"password": form.find('[name="pass"]').val(),
			"autosignin": form.find('[name="autosignin"]').val(),
			"sendpushnotify": form.find('[name="sendpushnotify"]').val(),
			"refreshrate": form.find('[name="refreshrate"]').val()
		});
		swal("Saved", "Your preferences have been saved.", "success");
	});
	var preffForm = $("#prefform");
	chrome.storage.sync.get("fname", function(val){ preffForm.find('[name="fname"]').val(val.fname); }); 
	chrome.storage.sync.get("lname", function(val){ preffForm.find('[name="lname"]').val(val.lname); }); 
	chrome.storage.sync.get("email", function(val){ preffForm.find('[name="email"]').val(val.email); }); 
	chrome.storage.sync.get("password", function(val){ preffForm.find('[name="pass"]').val(val.password); }); 
	chrome.storage.sync.get("autosignin", function(val){ preffForm.find('[name="autosignin"]').prop('checked', val.autosignin); console.log(val.autosignin) }); 
	chrome.storage.sync.get("sendpushnotify", function(val){ preffForm.find('[name="sendpushnotify"]').prop('checked', val.sendpushnotify); }); 
	chrome.storage.sync.get("refreshrate", function(val){ preffForm.find('[name="refreshrate"]').val(val.refreshrate || 10000); }); 
	
	
});