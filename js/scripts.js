
var ba = chrome.browserAction;
var baCount=0;
var wfdatacacheTimer=0;
function setAllRead() {
  ba.setBadgeBackgroundColor({color: [0, 255, 0, 128]});
  ba.setBadgeText({text: ' '});   // <-- set text to '' to remove the badge
}

function setUnread(unreadItemCount) {
  ba.setBadgeBackgroundColor({color: "#f79241"});
  ba.setBadgeText({text: '' + unreadItemCount});
}

function thispage(){
	return location.pathname.substring(1);
}

function wfgetJson(url, callback){
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open('GET', url, true);
	xmlhttp.onreadystatechange = function() {
	    if (xmlhttp.readyState == 4) {
	        if(xmlhttp.status == 200) {
	            var obj = JSON.parse(xmlhttp.responseText);
	            callback(obj);
	         }
	    }
	};
	xmlhttp.send(null);
}

function wfdatacache(data, name, ticker, time){
	time=time||5000;
	var safeName = name.replace(/[^\w\s]/gi, '');
	var obj = {};
	obj[safeName] = data;
	chrome.storage.sync.set(obj);
	clearInterval(ticker);
	wfdatacacheTimer=0;
} 
function wfgetdatacache(name){
	var safeName = name.replace(/[^\w\s]/gi, '');
	chrome.storage.sync.get(safeName, function(val){ 
		return (typeof val[safeName] !== "undefined") ?  val[safeName] : false;
	}); 
}
 

var wf = {
	get: function(api, fn){
		if(!wfgetdatacache(api)){
			var wfdatacacheInt = setInterval(function(){ wfdatacacheTimer++; }, 1000);
			$.getJSON( "https://pcci.attask-ondemand.com/attask/api/"+api, function( data ) { 
				fn(data); 
				wfdatacache(data, api, wfdatacacheInt);
			}).error(function(){
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
		}else{
			fn(wfgetdatacache(api)); 
		}
	},
	tasks: function(api, fn){
		this.get('task/'+api, function(){
			fn()
		});
	}
}


function pop(apac){
	var wfcontent = $('#wfcontent');
	wfcontent.empty();
	wf.get(apac, function(data){
		console.log(data)
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
	
	$(document).ajaxStart(function(){
	    $('#pageloading').show();
	}).ajaxEnd(function(){
		$('#pageloading').hide();
	});
	
	pop('work');
	
	$('[data-load]').on('click', function(){
		$('[data-load]').parent().removeClass('active');
		$(this).parent().addClass('active');
		var apac = $(this).data('load');
		pop(apac);
	});
	if(thispage()=="preferences.html"){
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
		chrome.storage.sync.get("autosignin", function(val){ preffForm.find('[name="autosignin"]').prop('checked', val.autosignin); }); 
		chrome.storage.sync.get("sendpushnotify", function(val){ preffForm.find('[name="sendpushnotify"]').prop('checked', val.sendpushnotify); }); 
		chrome.storage.sync.get("refreshrate", function(val){ preffForm.find('[name="refreshrate"]').val(val.refreshrate || 10000); }); 
	}
	
	
});