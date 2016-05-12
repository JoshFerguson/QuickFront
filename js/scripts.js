
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

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
var apply_settings_chache=[];
function apply_settings(pid){
	if(!apply_settings_chache[pid]){
		chrome.storage.sync.get(pid, function(val){
			data = (val[pid]) ? val[pid] : false;
			if(data){
				//Set backgound color
				(data.bgColor) ? $('[data-project="'+pid+'"]').css('background-color', data.bgColor) : false;
			}
		});
	}
}
 

var wf = {
	get: function(api, fn){
		if(!wfgetdatacache(api)){
			var wfdatacacheInt = setInterval(function(){ wfdatacacheTimer++; }, 1000);
			$.getJSON( "https://pcci.attask-ondemand.com/attask/api/v5.0/"+api, function( data ) { 
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

var populate = {
	mywork: function(){
		var wfcontent = $('#wfcontent');
		wfcontent.empty();
		wf.get('work?fields=name,projectID,assignedToID,percentComplete,plannedCompletionDate', function(data){
			for(var i = 0; i<data.data.length; i++){
				var task = data.data[i];
				var dueON = $.format.date(task.plannedCompletionDate, "MMMM d, yyyy");
				var html = '<a class="wf-list-item" target="_blank" href="https://pcci.attask-ondemand.com/task/view?ID='+task.ID+'" data-project="'+task.projectID+'">'+
								'<strong>'+task.name+'</strong><br />'+
								'<span class="wf-list-item-date">Due: '+dueON+'</span>'+
								'<i class="fa fa-cog item-settings"></i>'+
							'</a>';
							apply_settings(task.projectID);
				wfcontent.append(html);
				baCount=i;
			}
		});
	},
	projects: function(){
		var wfcontent = $('#wfcontent');
		wfcontent.empty();
		wf.get('project/search?map=true&id=55bf8a8d002fc00517c9c6f18c1bd353,56abcb65000278b5d860734409f80e2f,55a6b73600c3643fa3ba49aca724b21b,55a6b73600c3643fa3ba49aca724b21b', function(data){
			for(var i = 0; i<data.data.length; i++){
				var task = data.data[i];
				var dueON = $.format.date(task.plannedCompletionDate, "MMMM d, yyyy");
				var html = '<a class="wf-list-item" target="_blank" href="https://pcci.attask-ondemand.com/task/view?ID='+task.ID+'" data-project="'+task.ID+'">'+
								'<strong>'+task.name+'</strong><br />'+
								'<span class="wf-list-item-date">Due: '+dueON+'</span>'+
								'<i class="fa fa-cog item-settings"></i>'+
							'</a>';
							apply_settings(task.ID);
				wfcontent.append(html);
				baCount=i;
			}
		});
	}
}



$(document).ready(function(){
	
	$(document).ajaxStart(function(){
	    $('#pageloading').show();
	}).ajaxStop(function(){
		$('#pageloading').hide();
	});
	
	populate.mywork();
	
	$('[data-load]').on('click', function(){
		$('[data-load]').parent().removeClass('active');
		$(this).parent().addClass('active');
		var apac = $(this).data('load');
		populate[apac]();
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
				"autosignin": form.find('[name="autosignin"]').prop('checked'),
				"sendpushnotify": form.find('[name="sendpushnotify"]').prop('checked'),
				"refreshrate": form.find('[name="refreshrate"]').val()
			});
			swal("Saved", "Your preferences have been saved.", "success");
		});
		var preffForm = $("#prefform");
		chrome.storage.sync.get("fname", function(val){ preffForm.find('[name="fname"]').val(val.fname); }); 
		chrome.storage.sync.get("lname", function(val){ preffForm.find('[name="lname"]').val(val.lname); }); 
		chrome.storage.sync.get("email", function(val){ preffForm.find('[name="email"]').val(val.email); }); 
		chrome.storage.sync.get("password", function(val){ preffForm.find('[name="pass"]').val(val.password); }); 
		chrome.storage.sync.get("autosignin", function(val){ preffForm.find('[name="autosignin"]').prop('checked', val.autosignin); console.log("autosignin", val.autosignin) }); 
		chrome.storage.sync.get("sendpushnotify", function(val){ preffForm.find('[name="sendpushnotify"]').prop('checked', val.sendpushnotify); console.log("sendpushnotify", val.sendpushnotify) }); 
		chrome.storage.sync.get("refreshrate", function(val){ preffForm.find('[name="refreshrate"]').val(val.refreshrate || 20000); }); 
	}
	if(thispage()=="edit.html"){
		var edit_id = getParameterByName('edit')
		chrome.storage.sync.get(edit_id, function(val){
			var optiins = {
				bgColor : '#eeeeee'
			};

			$('#cp3').colorpicker({
	            color: (val[edit_id]) ? val[edit_id].bgColor : optiins.bgColor,
	            format: 'hex'
	        });
	        $('#ptitle').text( edit_id );
	        
	        $( "#editProj" ).submit(function( event ) {
		        event.preventDefault();
		        var form = $(this);
		        chrome.storage.sync.set({
					[edit_id]: {
						bgColor: $('#cp3 input').val()
					},
				});
				swal("Saved", "Your preferences have been saved.", "success");
		    });
			
		});
	}
	
	
	
	$('body').on('click', '.item-settings', function(e){
		e.preventDefault();
		window.location = "edit.html?edit="+$(this).parent().data('project')+"";
	});
	
});