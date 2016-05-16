chrome.storage.sync.get(null, function(storage) {
	
	var ba = chrome.browserAction;
	var baCount=0;
	var storage;
	var apiPath = "https://"+storage.wfdomain+".attask-ondemand.com/attask/api/v5.0/";
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
	var notifys = 0;
	var unseen = 0;
	function getNotifus(){
		wfgetJson(apiPath+'notifications?fields=note,acknowledgementID', function(data){
			for(var i = 0; i<50; i++){
				if(data.data[i].note && !data.data[i].acknowledgementID){
					notifys++;
				}
			}
			if(notifys > unseen){
				pushNotification("You have "+notifys+" new notification(s)");
				setUnread(notifys);
				unseen=notifys;
			}
			notifys=0;
		});
	}
	
	
		if(storage.autosignin){
			$.post( apiPath+"login", { username: storage.username, password: storage.password } ).done(function( data ) {
				
				chrome.storage.sync.set({
					'sessionID': data.data.sessionID,
					'userID': data.data.userID
				});
				
				pushNotification("You have been automatedly logged into workfront.");
				
				(storage.sendpushnotify) ?  getNotifus() : false;
				
				if(storage.refreshrate){
					setInterval(function(){ getNotifus() }, (storage.refreshrate || 60000));
				}
				
			});
		}
	
});