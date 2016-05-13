$(document).ready(function(){
	$('body').on('click', '.timeKeeper', function(){
		var item = $(this).closest('.wf-list-item');
		var id = $(this).data('timekeeper');
		var ac = localStorage.getItem("wf_timekeeper_"+id) ? false : true;
		timekeeper(item.data('type'), id, ac, $(this));
	});
});

function tabConfirm(tab, html){
	$(tab).closest('.wf-list-item').addClass('wf-tab-slide-right');
	$(tab).closest('.wf-list-item').find('.tabConfirm').html(html);
}

function timekeeperConfirm(_id, time){
	var tab = $('[data-timekeeper="'+_id+'"]');
	var html = '<span class="tabConfirmTime">'+time+'</span><button type="button" class="btn-close-confirm btn btn-success">Confirm</button><button type="button" class="btn-close-confirm btn btn-default">Discard</button>';
	tabConfirm(tab, html);
	$('body').on('click', '.btn-close-confirm', function(){
		$(this).closest('.wf-list-item').removeClass('wf-tab-slide-right');
	});
}
function timekeeper(_kind, _id, action, that){
	var name = "wf_timekeeper_"+_id;
	if(action){
		localStorage.setItem(name, new Date());
		that.addClass('wf_timekeeper_pulse')
	}else{
		var date1 = new Date(localStorage.getItem(name));
		var date2 = new Date();
		var timeDiff = Math.abs(date2.getTime() - date1.getTime());
		var elapsed = (timeDiff/3600000).toFixed(2);
		that.removeClass('wf_timekeeper_pulse')
		timekeeperConfirm(_id, elapsed);
		localStorage.removeItem(name);
	}
}	