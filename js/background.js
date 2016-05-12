var ba = chrome.browserAction;
var baCount=0;
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

//Check for notifys
var notifys = 0;
wfgetJson("https://pcci.attask-ondemand.com/attask/api/v5.0/work", function(data){
	var count = (data.data.length-1);
	if(count > notifys){
		pushNotification("You have "+count+" unseen notification.");
		setUnread(count);
		notifys = count;
	}
});