chrome.storage.sync.get(null, function(storage) {

	var ba = chrome.browserAction;
	var baCount=0;
	var wfdatacacheTimer=0;
	
	function setAllRead() {
	  ba.setBadgeBackgroundColor({color: [0, 255, 0, 128]});
	  ba.setBadgeText({text: ''});
	  chrome.storage.sync.set({ 'BadgeText': 0 });
	}
	
	function setUnread(unreadItemCount) {
		ba.setBadgeBackgroundColor({color: "#586578"});
		ba.setBadgeText({text: '' + unreadItemCount});
		chrome.storage.sync.set({ 'BadgeText': unreadItemCount });
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
					var that = $('[data-project="'+pid+'"]');
					(data.bgColor) ? that.css('border-left-color', data.bgColor) : false;
					(data.bgColor) ? that.find('.progress-bar').css('background-color', data.bgColor) : false;
				}
			});
		}
	}
	
	function progressBar(p){
		var h = p == 0 ? 'hide_opacity' : '';
		return '<div class="progress '+h+'"><span>'+p+'%</span><div class="progress-bar" role="progressbar" aria-valuenow="'+p+'" aria-valuemin="0" aria-valuemax="100" style="width:'+p+'%"></div></div>';
	}
	
	
	function msToTime(s) {
	
	  function addZ(n) {
	    return (n<10? '0':'') + n;
	  }
	
	  var ms = s % 1000;
	  s = (s - ms) / 1000;
	  var secs = s % 60;
	  s = (s - secs) / 60;
	  var mins = s % 60;
	  var hrs = (s - mins) / 60;
	
	  return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs);
	}
	
	function srt(on,descending) {
	 on = on && on.constructor === Object ? on : {};
	 return function(a,b){
	   if (on.string || on.key) {
	     a = on.key ? a[on.key] : a;
	     a = on.string ? String(a).toLowerCase() : a;
	     b = on.key ? b[on.key] : b;
	     b = on.string ? String(b).toLowerCase() : b;
	     // if key is not present, move to the end 
	     if (on.key && (!b || !a)) {
	      return !a && !b ? 1 : !a ? 1 : -1;
	     }
	   }
	   return descending ? ~~(on.string ? b.localeCompare(a) : a < b)
	                     : ~~(on.string ? a.localeCompare(b) : a > b);
	  };
	}
	
	function checkTimeInProgress(){
		$.each(localStorage, function(key, val){
			if( key.indexOf('wf_timekeeper_') > -1 ){
				$('[data-timekeeper="'+key.replace('wf_timekeeper_','')+'"]').addClass('wf_timekeeper_pulse');
				if($('#wf_timekeeper_header').length==0){ 
					$('#picons').prepend('<span id="wf_timekeeper_header"><i class="zmdi zmdi-time wf_timekeeper_pulse"></i></span>'); 
				}
				
			}
		});
		timeInProgressTicker();
		$('body').on('click', '.timeKeeper', function(){ timeInProgressTicker(); });
	}
	function timeInProgressTicker(){
		setInterval(function(){
			$.each(localStorage, function(key, val){
				if( key.indexOf('wf_timekeeper_') > -1 ){
					var date1 = new Date(localStorage.getItem(key)), date2 = new Date();
					var timeDiff = Math.abs(date2.getTime() - date1.getTime());
					$('[data-timekeeper="'+key.replace('wf_timekeeper_','')+'"]').next('.timeKeeper-time').text( msToTime(timeDiff) )
				}
			});
		}, 1000)
	}
	
	function ia(arr,ent){ return jQuery.inArray(ent, arr ); }
	 
	var wf = {
		myprojectsarray: [],
		get: function(api, fn){
			if(!wfgetdatacache(api)){
				var wfdatacacheInt = setInterval(function(){ wfdatacacheTimer++; }, 1000);
				$.getJSON( "https://"+storage.wfdomain+".attask-ondemand.com/attask/api/v5.0/"+api, function( data ) { 
					jQuery.isFunction(fn) ? fn(data) : false
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
				jQuery.isFunction(fn) ? fn(wfgetdatacache(api)) : false
			}
		},
		tasks: function(api, fn){
			this.get('task/'+api, function(){
				fn()
			});
		},
		time: function(taskID, time, kind){
			if(kind=="task"){ kind == 'taskID'; }
			if(kind=="project"){ kind == 'projectID'; }
			if(kind=="Issue"){ kind == 'opTaskID'; }
			wf.get('hour/?updates={"'+kind+'":"'+taskID+'","hours":"'+time+'","status":"SUB"}&sessionID='+storage.sessionID+'&method=post', function(){
				swal("Done", "Your time has been logged", "success");
			});
		},
		actionBar: function(act){
			var bar = "";
			bar += (ia(act,'link')) ? "" : "";
			return bar;
		}
	}
	
	var populate = {
		mywork: function(fn, print){
			var wfcontent = $('#wfcontent');
			wfcontent.empty();
			wf.get('work?fields=name,projectID,assignedToID,percentComplete,dueDate,color', function(data){
				var sorted = data.data.sort( srt({key:'projectID',string:true}, true) ); 
				for(var i = 0; i<sorted.length; i++){
					if(!print){
						var task = sorted[i];
						var dueON = $.format.date(task.dueDate, "MMMM d, yyyy");
						var pbar = progressBar(task.percentComplete);
						var html = '<div class="wf-list-item" data-type="task" data-project="'+task.projectID+'">'+
										'<strong>'+task.name+'</strong><span class="wf-list-item-date">Due: '+dueON+'</span>'+pbar+
										'<div class="wf-item-icons">'+
											'<a target="_blank" href="https://'+storage.wfdomain+'.attask-ondemand.com/task/view?ID='+task.ID+'"><i class="zmdi zmdi-open-in-browser"></i></a>'+
											'<a href="edit.html?edit='+task.projectID+'"><i class="zmdi zmdi-settings item-settings"></i></a>'+
											'<a href="upload.html?edit='+task.projectID+'"><i class="zmdi zmdi-cloud-upload"></i></a>'+
											'<i class="zmdi zmdi-time timeKeeper" data-timekeeper="'+task.ID+'"></i><span class="timeKeeper-time"></span>'+
											'<div class="tabConfirm"></div>'+
											'<span class="wf-list-item-details-btn"><i class="zmdi zmdi-more" aria-hidden="true"></i></span>'+
										'</div>'+
									'</div>';
									(task.color) ? chrome.storage.sync.set({ [task.projectID]: { bgColor: task.color} }) : false
									apply_settings(task.projectID);
						wfcontent.append(html);
						baCount=i;
					}
					wf.myprojectsarray.push(task.projectID);
				}
				jQuery.isFunction(fn) ? fn(data) : false
			});
		},
		projects: function(fn){
			this.mywork(function(){
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
											'<a target="_blank" href="https://'+storage.wfdomain+'.attask-ondemand.com/project/view?ID='+task.ID+'"><i class="zmdi zmdi-open-in-browser"></i></a>'+
											'<a href="edit.html?edit='+task.ID+'"><i class="zmdi zmdi-settings item-settings"></i></a>'+
											'<a href="upload.html?edit='+task.projectID+'"><i class="zmdi zmdi-cloud-upload"></i></a>'+
											'<i class="zmdi zmdi-time timeKeeper" data-timekeeper="'+task.ID+'"></i><span class="timeKeeper-time"></span>'+
											'<div class="tabConfirm"></div>'+
											'<span class="wf-list-item-details-btn"><i class="zmdi zmdi-more" aria-hidden="true"></i></span>'+
										'</div>'+
									'</div>';
									apply_settings(task.ID);
						wfcontent.append(html);
						baCount=i;
					}
					jQuery.isFunction(fn) ? fn(data) : false
				});
			}, false);
		},
		approvals: function(fn){
			var wfcontent = $('#wfcontent');
			wfcontent.empty();
			var projs = (wf.myprojectsarray).join();
			wf.get('AWAPVL/search?fields=*&submittedByID='+storage.userID, function(data){
				for(var i = 0; i<data.data.length; i++){
					var task = data.data[i];
					var dueON = $.format.date(task.entryDate, "MMMM d, yyyy");
					var html = '<div class="wf-list-item" data-type="approval" data-project="'+task.projectID+'">'+
									'<strong>'+task.ID+'</strong><span class="wf-list-item-date">Opened: '+dueON+'</span>'+
									'<div class="wf-item-icons">'+
										'<div class="tabConfirm"></div>'+
									'</div>'+
								'</div>';
								apply_settings(task.projectID);
					wfcontent.append(html);
					baCount=i;
				}
				jQuery.isFunction(fn) ? fn(data) : false
			});
		},
		notifications: function(fn){
			var wfcontent = $('#wfcontent');
			wfcontent.empty();
			wf.get('notifications?fields=note,acknowledgementID', function(data){
				var allNots = [];
				for(var i = 0; i<50; i++){
					if(data.data[i].note && !data.data[i].acknowledgementID){
						allNots.push(data.data[i].note.ID);
					}
				}
				var ids=allNots.join();
				if(allNots.length>0){
					setUnread(allNots.length);
					wf.get('note/?fields=*&id='+ids, function(data){
						console.log(data)
						for(var i = 0; i<data.data.length; i++){
							var note = data.data[i];
							if(note.topNoteObjCode=="PROJ"){ type='project'; }
							var date = $.format.date(note.entryDate, "MMMM d, yyyy");
							var html = '<a target="_blank" href="https://'+storage.wfdomain+'.attask-ondemand.com/project/view?ID='+note.projectID+'" class="wf-list-item wf-notes" data-type="note" data-project="'+note.ID+'">'+
											'<p>'+note.noteText+'</p><span class="wf-list-item-date">'+date+'</span>'+
										'</a>';
							wfcontent.append(html);
							baCount=i;
						}
					});
				}else{ 
					setAllRead();
					wfcontent.append("<p class='noContentText'>Nothing to see here.</p>"); 
				}
				jQuery.isFunction(fn) ? fn(data) : false
			});
		}
	}
	
	function pageActions(){
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
					"wfdomain": form.find('[name="wfdomain"]').val(),
					"refreshrate": form.find('[name="refreshrate"]').val()
				});
				swal("Saved", "Your preferences have been saved.", "success");
			});
			var preffForm = $("#prefform");
			
			preffForm.find('[name="fname"]').val(storage.fname); 
			preffForm.find('[name="lname"]').val(storage.lname); 
			preffForm.find('[name="username"]').val(storage.username); 
			preffForm.find('[name="pass"]').val(storage.password);
			preffForm.find('[name="wfdomain"]').val(storage.wfdomain);
			preffForm.find('[name="autosignin"]').prop('checked', storage.autosignin);
			preffForm.find('[name="sendpushnotify"]').prop('checked', storage.sendpushnotify);
			preffForm.find('[name="refreshrate"]').val(storage.refreshrate || 60000); 
			
			$('#resetConfig').on('click', function(){
				chrome.storage.sync.set({"fname": null,"lname": null,"username": null,"password": null,"wfdomain": null,"refreshrate": null,"isConfiged": null});
				window.location="welcome.html";
			});
			
			$("input[type='checkbox']").bootstrapSwitch({
				size: 'mini'
			});
			
			if(storage.MenuOrder){
				$("ol.MenuOrder").empty();
				$.each(storage.MenuOrder, function(key, val){
					$("ol.MenuOrder").append('<li data-name="'+val.name+'">'+val.name+'</li>');
				});
			}
			
			var group = $("ol.MenuOrder").sortable({
			  group: 'serialization',
			  onDrop: function ($item, container, _super) {
			    var data = group.sortable("serialize").get();
				chrome.storage.sync.set({'MenuOrder': data[0]});
				console.log(data[0])
			    _super($item, container);
			  }
			});
			
		}
		if(thispage()=="edit.html"){
			var edit_id = getParameterByName('edit')
			chrome.storage.sync.get(edit_id, function(val){
				wf.get('project/'+edit_id+'?fields=*', function(data){
					console.log(data)
					var project = data.data;
					var optiins = {
						bgColor : '#eeeeee'
					};
					
					$('.progress').find('span').text(project.percentComplete+"%");
					$('.progress-bar').attr('aria-valuenow', project.percentComplete).css('width', project.percentComplete+"%")
		
					$('#cp3').colorpicker({
			            color: (val[edit_id]) ? val[edit_id].bgColor : optiins.bgColor,
			            format: 'hex'
			        });
			        $('#ptitle').text( project.name );
			        
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
			});
		}
	}
	
	
	$(document).ready(function(){
		
		if(!storage.isConfiged){
			window.location = "welcome.html";
		}else{
			$(document).ajaxStart(function(){
			    $('#pageloading').show();
			}).ajaxStop(function(){
				$('#pageloading').hide();
			});
			
			if(thispage()=="popup.html"){
				populate.notifications(function(){
					checkTimeInProgress();
				});
			}
			
			$('[data-load]').on('click', function(){
				$('[data-load]').parent().removeClass('active');
				$(this).parent().addClass('active');
				var apac = $(this).data('load');
				populate[apac](function(){
					checkTimeInProgress();
				});
			});
		}//Is isConfiged
		pageActions();
		$('.navbar').dblclick(function(){
			var w=$(document).width(),h=$(document).height();
			var sw = screen.width - 530;
			window.open('chrome-extension://nfinbnedefiaammkllfcmcecjbhjobii/popup.html','Quick Front', 'width='+w+', height='+h+' top=75, left='+sw);
			return false;
		});
	});

});//end get local storage