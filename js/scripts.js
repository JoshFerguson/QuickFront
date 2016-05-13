chrome.storage.sync.get(null, function(storage) {

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
					(data.bgColor) ? $('[data-project="'+pid+'"]').css('border-left-color', data.bgColor) : false;
				}
			});
		}
	}
	
	function progressBar(p){
		var h = p == 0 ? 'hide_opacity' : '';
		return '<div class="progress '+h+'"><div class="progress-bar" role="progressbar" aria-valuenow="'+p+'" aria-valuemin="0" aria-valuemax="100" style="width:'+p+'%">'+p+'%</div></div>';
	}
	 
	var wf = {
		myprojectsarray: [],
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
			wf.get('work?fields=name,projectID,assignedToID,percentComplete,plannedCompletionDate,color', function(data){
				for(var i = 0; i<data.data.length; i++){
					var task = data.data[i];
					var dueON = $.format.date(task.plannedCompletionDate, "MMMM d, yyyy");
					var pbar = progressBar(task.percentComplete);
					var html = '<div class="wf-list-item" data-type="task" data-project="'+task.projectID+'">'+
									'<strong>'+task.name+'</strong><span class="wf-list-item-date">Due: '+dueON+'</span>'+pbar+
									'<div class="wf-item-icons">'+
										'<a href="edit.html?edit='+task.projectID+'"><i class="fa fa-cog item-settings"></i></a>'+
										'<a target="_blank" href="https://pcci.attask-ondemand.com/task/view?ID='+task.ID+'"><i class="fa fa-external-link-square"></i></a>'+
										'<i class="fa fa-clock-o timeKeeper" data-id="'+task.ID+'"></i><span class="timeKeeper-time"></span>'+
									'</div>'+
								'</div>';
								(task.color) ? chrome.storage.sync.set({ [task.projectID]: { bgColor: task.color} }) : false
								apply_settings(task.projectID);
					wfcontent.append(html);
					baCount=i;
					wf.myprojectsarray.push(task.projectID);
				}
			});
		},
		projects: function(){
			var wfcontent = $('#wfcontent');
			wfcontent.empty();
			var projs = (wf.myprojectsarray).join();
			wf.get('project/search?map=true&id='+projs+'&fields=percentComplete,plannedCompletionDate', function(data){
				for(var i = 0; i<data.data.length; i++){
					var task = data.data[i];
					var dueON = $.format.date(task.plannedCompletionDate, "MMMM d, yyyy");
					var pbar = progressBar(task.percentComplete);
					var html = '<div class="wf-list-item" data-type="project" data-project="'+task.ID+'">'+
									'<strong>'+task.name+'</strong><span class="wf-list-item-date">Due: '+dueON+'</span>'+pbar+
									'<div class="wf-item-icons">'+
										'<a href="edit.html?edit='+task.ID+'"><i class="fa fa-cog item-settings"></i></a>'+
										'<a target="_blank" href="https://pcci.attask-ondemand.com/project/view?ID='+task.ID+'"><i class="fa fa-external-link-square"></i></a>'+
										'<i class="fa fa-clock-o timeKeeper" data-timekeeper="'+task.ID+'"></i><span class="timeKeeper-time"></span>'+
									'</div>'+
								'</div>';
								apply_settings(task.ID);
					wfcontent.append(html);
					baCount=i;
				}
			});
		},
		notifications: function(){
			//Check for notifys
			wf.get('notifications?fields=note', function(data){
				var allNots = [];
/*
				var notifys = 0;
				var data = data.data;
				for(var i=0; i<data.length; i++){
					if(data[i].note){ allNots.push(data[i].note.ID); }
				}
				allNots = allNots.slice(0, 50);
				allNots = allNots.join();
*/
				console.log(allNots)
/*
				wf.get('note/'+notes+'?fields=*', function(data){
					var count = (data.data.length-1);
					if(count > notifys){
						alert('')
						setUnread(count);
						notifys = count;
					}
				});
*/
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
					"username": form.find('[name="username"]').val(),
					"password": form.find('[name="pass"]').val(),
					"autosignin": form.find('[name="autosignin"]').prop('checked'),
					"sendpushnotify": form.find('[name="sendpushnotify"]').prop('checked'),
					"refreshrate": form.find('[name="refreshrate"]').val()
				});
				swal("Saved", "Your preferences have been saved.", "success");
			});
			var preffForm = $("#prefform");
			
			preffForm.find('[name="fname"]').val(storage.fname); 
			preffForm.find('[name="lname"]').val(storage.lname); 
			preffForm.find('[name="username"]').val(storage.username); 
			preffForm.find('[name="pass"]').val(storage.password);
			preffForm.find('[name="autosignin"]').prop('checked', storage.autosignin);
			preffForm.find('[name="sendpushnotify"]').prop('checked', storage.sendpushnotify);
			preffForm.find('[name="refreshrate"]').val(storage.refreshrate || 20000); 
			
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
						}
					});
					swal("Saved", "Your preferences have been saved.", "success");
			    });
				
			});
		}

	});


});//end get local storage
