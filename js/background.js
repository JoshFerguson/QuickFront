var ba = chrome.browserAction;
var baCount=0;
var storage;
var apiPath = "https://pcci.attask-ondemand.com/attask/api/v5.0/":
function setAllRead() {
  ba.setBadgeBackgroundColor({color: [0, 255, 0, 128]});
  ba.setBadgeText({text: ''});
}

function setUnread(unreadItemCount) {
  ba.setBadgeBackgroundColor({color: "#586578"});
  ba.setBadgeText({text: '' + unreadItemCount});
}

function pushNotification(message) {
   var options = {
      icon: "img/logo-pushNotification.png"
  }
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
  }
  else if (Notification.permission === "granted") {
    var notification = new Notification(message, options);
  }
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission(function (permission) {
      if (permission === "granted") {
        var notification = new Notification(message, options);
      }
    });
  }
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
var allNots=[];
function getNotifus(){
	//Check for notifys
	var notifys = 0;
	wfgetJson(apiPath+"notifications?fields=note", function(data){
		var data = data.data;
		for(var i=0; i<data.length; i++){
			if(data[i].note){
				console.log(data[i].note.ID, i)
				allNots.push(data[i].note.ID);
			}
		}
		var allNots = allNots.slice(0, 50);
		var notes = allNots.join();
		wfgetJson(apiPath+"note/"+notes+"?fields=*", function(data){
			var count = (data.data.length-1);
			if(count > notifys){
				pushNotification("You have "+count+" unseen notification.");
				setUnread(count);
				notifys = count;
			}
		});
	});
}

chrome.storage.sync.get(null, function(storage) {

	if(storage.autosignin){
		$.post( apiPath+"login", { username: storage.username, password: storage.password } ).done(function( data ) {
			
			pushNotification("You have been automatedly logged into workfront.");
			
			//(storage.sendpushnotify) ?  getNotifus() : false;
			
			if(storage.refreshrate){
				//setInterval(function(){ getNotifus() }, parseInt(val.refreshrate));
			}
			
		});
	}
	
});



