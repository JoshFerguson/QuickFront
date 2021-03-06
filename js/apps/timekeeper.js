chrome.storage.sync.get(null, function(storage) {
	var apiPath = "https://"+storage.wfdomain+".attask-ondemand.com/attask/api/v5.0/";
	$(document).ready(function(){
		$('body').on('click', '.timeKeeper', function(){
			var item = $(this).closest('.wf-list-item');
			var id = $(this).data('timekeeper');
			var ac = localStorage.getItem("wf_timekeeper_"+id) ? false : true;
			timekeeper(item.data('type'), id, ac, $(this));
		});
	});
	
	function wfTime(name, humanTime){
		var msToTime = function(s) {

	        function addZ(n) {
	            return (n < 10 ? '0' : '') + n;
	        }
	
	        var ms = s % 1000;
	        s = (s - ms) / 1000;
	        var secs = s % 60;
	        s = (s - secs) / 60;
	        var mins = s % 60;
	        var hrs = (s - mins) / 60;
	
	        return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs);
	    }
		var date1 = new Date(localStorage.getItem(name));
		var date2 = new Date();
		var timeDiff = Math.abs(date2.getTime() - date1.getTime());
		return (humanTime) ? msToTime(timeDiff) : (timeDiff/3600000).toFixed(2);
	}
	
	function tabConfirm(tab, html){
		$(tab).closest('.wf-list-item').addClass('wf-tab-slide-right');
		$(tab).closest('.wf-list-item').find('.tabConfirm').html(html);
	}
	
	function timekeeperConfirm(_id, kind, time, name){
		var tab = $('[data-timekeeper="'+_id+'"]');
		var html = '<input class="tabConfirmTime" data-ht="'+wfTime(name, true)+'" value="'+time+'"><button type="button" class="btn-close-confirm saveTime btn btn-success">Confirm</button><button type="button" class="btn-close-confirm btn btn-default">Discard</button>';
		tabConfirm(tab, html);
		$('body').on('click', '.saveTime', function(){
			if(kind=="task"){ kind = 'taskID'; }
			if(kind=="project"){ kind = 'projectID'; }
			if(kind=="issue"){ kind = 'opTaskID'; }
			time = tab.closest('.wf-list-item').find('.tabConfirmTime').val();
			var url = apiPath+'hour/?updates={"'+kind+'":"'+_id+'","hours":"'+time+'","status":"SUB"}&sessionID='+storage.sessionID+'&method=post';
			$.post(url).done(function(data){
				swal("Done", "Your time has been logged", "success");
			});
		});
		$('body').on('click', '.btn-close-confirm', function(){
			$(this).closest('.wf-list-item').removeClass('wf-tab-slide-right');
		});
	}
	
	function timekeeper(_kind, _id, action, that){
		var name = "wf_timekeeper_"+_id;
		if(action){
			localStorage.setItem(name, new Date());
			that.addClass('wf_timekeeper_pulse');
			that.html('<span class="hide">'+searchVar.time+'</span>');
			$('.timeKeeper').not(that).hide();
			chrome.browserAction.setIcon({path: 'img/icon48-time.png'});
			$('#picons').prepend('<span id="wf_timekeeper_header"><i class="fa fa-clock-o wf_timekeeper_pulse"></i></span>');
		}else{
			var elapsed = wfTime(name);
			that.removeClass('wf_timekeeper_pulse');
			that.next('.timeKeeper-time').text('');
			that.empty();
			timekeeperConfirm(_id, _kind, elapsed, name);
			localStorage.removeItem(name);
			$('#picons').find('#wf_timekeeper_header').remove();
			$('.timeKeeper').show();
			chrome.browserAction.setIcon({path: 'img/icon48.png'});
		}
		that.on('mouseover', function(){
			$(this).attr('title', wfTime(name, true));
		});
	}	

});