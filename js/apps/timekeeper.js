$(document).ready(function(){
	$('body').on('click', '.timeKeeper', function(){
		var item = $(this).closest('.wf-list-item');
		var id = $(this).data('timekeeper');
		var ac = localStorage.getItem("wf_timekeeper_"+id) ? false : true;
		timekeeper(item.data('type'), id, ac, $(this));
	});
});

var timers = [];
String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}
function timekeeper(_kind, _id, action, that){
	var name = "wf_timekeeper_"+_id;
	if(action){
		$.inArray(name,timers) ? timers.push(name) : false;
		var ticker = 0;
		localStorage.setItem(name, ticker);
		timers[name] = setInterval(function(){
			ticker++
			that.toggleClass('wf_timekeeper_pulse')
			localStorage.setItem(name, ticker);
		}, 1000);
	}else{
		clearInterval(timers[name]);
		that.removeClass('wf_timekeeper_pulse')
		var time = localStorage.getItem(name);
		localStorage.removeItem(name);
		console.log(name, time.toHHMMSS())
		//that.next('.timeKeeper-time').text( time.toHHMMSS() );
	}
}