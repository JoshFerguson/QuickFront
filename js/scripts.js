var searchVar = {
    time: "$time",
    complete: "$done",
    duePast: "$past"
}
var apiVersion = "5.0";
chrome.storage.sync.get(null, function(storage) {

    var ba = chrome.browserAction;
    var baCount = 0;
    var wfdatacacheTimer = 0;
    var hiddenTaskItems = (storage.hiddenItems) ? storage.hiddenItems : [];
    var apply_settings_chache = [];

    function setAllRead() {
        ba.setBadgeBackgroundColor({
            color: [0, 255, 0, 128]
        });
        ba.setBadgeText({
            text: ''
        });
        chrome.storage.sync.set({
            'BadgeText': 0
        });
    }

    function setUnread(unreadItemCount) {
        ba.setBadgeBackgroundColor({
            color: "#586578"
        });
        ba.setBadgeText({
            text: '' + unreadItemCount
        });
        chrome.storage.sync.set({
            'BadgeText': unreadItemCount
        });
    }

    function thispage() {
        return location.pathname.substring(1);
    }

    function wfgetJson(url, callback) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('GET', url, true);
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200) {
                    var obj = JSON.parse(xmlhttp.responseText);
                    callback(obj);
                }
            }
        };
        xmlhttp.send(null);
    }

    function wfdatacache(data, name, ticker, time) {
        time = time || 5000;
        var safeName = name.replace(/[^\w\s]/gi, '');
        var obj = {};
        obj[safeName] = data;
        chrome.storage.sync.set(obj);
        clearInterval(ticker);
        wfdatacacheTimer = 0;
    }

    function wfgetdatacache(name) {
        var safeName = name.replace(/[^\w\s]/gi, '');
        chrome.storage.sync.get(safeName, function(val) {
            return (typeof val[safeName] !== "undefined") ? val[safeName] : false;
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

    function apply_settings(pid) {
        if (!apply_settings_chache[pid]) {
            chrome.storage.sync.get(pid, function(val) {
                data = (val[pid]) ? val[pid] : false;
                if (data) {
                    var that = $('[data-project="' + pid + '"]');
                    (data.bgColor) ? that.css('border-left-color', data.bgColor): false;
                    (data.bgColor) ? that.find('.item-bgColor').css('background-color', data.bgColor): false;
                }
            });
        }
    }

    function progressBar(p) {
	    if(typeof p !== "undefined"){
		 	return '<div class="wf-progress"><div class="wf-progress-bar"><div class="wf-progress-indicator item-bgColor" style="width:' + p + '%"></div></div><div class="wf-progress-info">' + p + '%</div></div>';   
	    }else{
		    return '<div class="wf-progress" style="opacity:0"></div>';
	    }
    }

    function msToTime(s) {

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

    function srt(on, descending) {
        on = on && on.constructor === Object ? on : {};
        return function(a, b) {
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
            return descending ? ~~(on.string ? b.localeCompare(a) : a < b) :
                ~~(on.string ? a.localeCompare(b) : a > b);
        };
    }

    function checkTimeInProgress() {
        $.each(localStorage, function(key, val) {
            if (key.indexOf('wf_timekeeper_') > -1) {
                var key_id = key.replace('wf_timekeeper_', '');
                var bool = (new Date().toDateString() === new Date(val).toDateString());
                if (bool) {
                    var that = $('[data-timekeeper="' + key_id + '"]').addClass('wf_timekeeper_pulse').html('<span class="hide">' + searchVar.time + '</span>');;
                    chrome.browserAction.setIcon({
                        path: 'img/icon48-time.png'
                    });
                    $('.timeKeeper').not(that).hide();
                    if ($('#wf_timekeeper_header').length == 0) {
                        $('#picons').prepend('<span id="wf_timekeeper_header"><i class="zmdi zmdi-time wf_timekeeper_pulse"></i></span>');
                    }
                } else {
                    localStorage.removeItem(key);
                }
            }
        });
        timeInProgressTicker();
        $('body').on('click', '.timeKeeper', function() {
            timeInProgressTicker();
        });
    }

    function timeInProgressTicker() {
        var updater = function() {
            $.each(localStorage, function(key, val) {
                if (key.indexOf('wf_timekeeper_') > -1) {
                    var date1 = new Date(localStorage.getItem(key)),
                        date2 = new Date();
                    var timeDiff = Math.abs(date2.getTime() - date1.getTime());
                    $('[data-timekeeper="' + key.replace('wf_timekeeper_', '') + '"]').next('.timeKeeper-time').text(msToTime(timeDiff))
                }
            });
        }
        updater();
        setInterval(function() {
            updater();
        }, 1000);
    }

    function ia(arr, ent) {
        return jQuery.inArray(ent, arr);
    }

    function reorderMenu(orderedArray) {
        var items = [];
        $('#custmenu li').each(function() {
            var t = $(this);
            var it = {
                name: t.data('mo'),
                html: '<li data-mo="' + t.data('mo') + '">' + t.html() + '</li>'
            }
            items.push(it)
        });
        $('#custmenu').empty();
        $.each(orderedArray, function(key, val) {
            var result = $.grep(items, function(e) {
                return e.name == val.name;
            });
            $('#custmenu').append(result[0].html);
            $('#custmenu').find('li:first').addClass('active')
        });
    }

    function isPast(date, output) {
        if (date != null && date.length) {
            var selectedDate = new Date(date.replace('T', ' '));
            var now = new Date();
            if (selectedDate < now) {
                return output[0] || true;
            } else {
                return output[1];
            }
        } else {
            return date;
        }
    }

    $.fn.focusToEnd = function() {
        return this.each(function() {
            var v = $(this).val();
            $(this).focus().val("").val(v);
        });
    };

    var wf = {
            myprojectsarray: [],
            get: function(api, fn) {
                if (!wfgetdatacache(api)) {
                    var wfdatacacheInt = setInterval(function() {
                        wfdatacacheTimer++;
                    }, 1000);
                    $.getJSON("https://" + storage.wfdomain + ".attask-ondemand.com/attask/api/v" + apiVersion + "/" + api, function(data) {
                        jQuery.isFunction(fn) ? fn(data) : false
                        wfdatacache(data, api, wfdatacacheInt);
                    }).error(function() {
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
                } else {
                    jQuery.isFunction(fn) ? fn(wfgetdatacache(api)) : false
                }
            },
            tasks: function(api, fn) {
                this.get('task/' + api, function() {
                    fn()
                });
            },
            time: function(taskID, time, kind) {
                if (kind == "task") {
                    kind == 'taskID';
                }
                if (kind == "project") {
                    kind == 'projectID';
                }
                if (kind == "Issue") {
                    kind == 'opTaskID';
                }
                wf.get('hour/?updates={"' + kind + '":"' + taskID + '","hours":"' + time + '","status":"SUB"}&sessionID=' + storage.sessionID + '&method=post', function() {
                    swal("Done", "Your time has been logged", "success");
                });
            },
            actionBar: function(act) {
                var bar = "";
                bar += (ia(act, 'link')) ? "" : "";
                return bar;
            },
            remove: function(that, id, fn) {
                that.animate({
                    left: -500
                }, 500, function() {
                    setTimeout(function() {
                        fn(that, id, function() {
                            that.remove();
                        });
                    }, 500);
                });
            }
        }
        //https://pcci.attask-ondemand.com/attask/api/v5.0/task/5720c4e6001455d0cf63cd8256a9e048?fields=*
    var populate = {
        mywork: function(fn, print) {
            var wfcontent = $('#wfcontent');
            wfcontent.empty();
            wf.get('work?fields=name,projectID,assignedToID,percentComplete,plannedCompletionDate,color,objCode,assignmentsListString', function(data) {
                var sorted = data.data.sort(srt({
                    key: 'projectID',
                    string: true
                }, true));
                for (var i = 0; i < sorted.length - 1; i++) {
                    if (!print) {
                        var task = sorted[i];
                        var datClass = isPast(task.plannedCompletionDate, ['date-pasted', 'date-good', 'date-faraway']);
                        var dueON = $.format.date(task.plannedCompletionDate, "MMMM d, yyyy");
                        var pbar = progressBar(task.percentComplete);
                        var doneTip = (task.hasOwnProperty('assignmentsListString') && task.assignmentsListString.indexOf(",") > -1) ? 'data-toggle="popover" data-content=""' : '';
                        var bgColor = (storage.hasOwnProperty(task.projectID)) ? storage[task.projectID].bgColor : "#eeeeee";
                        var html = '<div class="wf-list-item ' + datClass + '" data-obj-code="' + task.objCode + '" data-type="task" data-project="' + task.projectID + '" data-task="' + task.ID + '">' +
                            '<strong>' + task.name + '</strong><span class="wf-list-item-date">Due: ' + dueON + '</span>' + pbar +
                            '<button class="wf-btn wf-btn-done item-bgColor" ' + doneTip + '><i class="zmdi zmdi-square-o"></i> Done</button>' +
                            '<div class="wf-item-icons">' +
                            '<a target="_blank" href="https://' + storage.wfdomain + '.attask-ondemand.com/task/view?ID=' + task.ID + '"><i class="zmdi zmdi-open-in-browser"></i></a>' +
                            '<i class="zmdi zmdi-format-color-fill PJColorPicker" data-color="' + bgColor + '"></i>' +
                            '<i class="zmdi zmdi-time timeKeeper" data-timekeeper="' + task.ID + '"></i><span class="timeKeeper-time"></span>' +
                            '<div class="tabConfirm"></div>' +
                            '<span class="wf-list-item-details-btn"><i class="zmdi zmdi-more" aria-hidden="true"></i></span>' +
                            '</div>' +
                            '</div>';
                        (task.color) ? chrome.storage.sync.set({
                            [task.projectID]: {
                                bgColor: task.color
                            }
                        }): false
                        apply_settings(task.projectID);
                        wfcontent.append(html);
                        baCount = i;
                    }
                    wf.myprojectsarray.push(task.projectID);
                }
                jQuery.isFunction(fn) ? fn(data) : false
            });
        },
        projects: function(fn) {
            var wfcontent = $('#wfcontent');
            wfcontent.empty();
            wf.get('project/search?projectUserIDs=' + storage.userID + '&status=CUR&fields=percentComplete,plannedCompletionDate', function(data) {
                var sorted = data.data.sort(srt({
                    key: 'plannedCompletionDate',
                    string: true
                }, false));
                for (var i = 0; i < sorted.length; i++) {
                    var task = sorted[i];
                    var datClass = isPast(task.plannedCompletionDate, ['date-pasted', 'date-good', 'date-faraway']);
                    var dueON = $.format.date(task.plannedCompletionDate, "MMMM d, yyyy");
                    var pbar = progressBar(task.percentComplete);
                    var bgColor = (storage.hasOwnProperty(task.ID)) ? storage[task.ID].bgColor : "#eeeeee";
                    var html = '<div class="wf-list-item ' + datClass + '" data-type="project" data-project="' + task.ID + '">' +
                        '<strong>' + task.name + '</strong><span class="wf-list-item-date">Due: ' + dueON + '</span>' + pbar +
                        '<br /><div class="wf-item-icons">' +
                        '<a target="_blank" href="https://' + storage.wfdomain + '.attask-ondemand.com/project/view?ID=' + task.ID + '"><i class="zmdi zmdi-open-in-browser"></i></a>' +
                        '<i class="zmdi zmdi-format-color-fill PJColorPicker" data-color="' + bgColor + '"></i>' +
                        '<i class="zmdi zmdi-time timeKeeper" data-timekeeper="' + task.ID + '"></i><span class="timeKeeper-time"></span>' +
                        '<div class="tabConfirm"></div>' +
                        '<span class="wf-list-item-details-btn"><i class="zmdi zmdi-more" aria-hidden="true"></i></span>' +
                        '</div>' +
                        '</div>';
                    apply_settings(task.ID);
                    wfcontent.append(html);
                    baCount = i;
                }
                jQuery.isFunction(fn) ? fn(data) : false
            });
        },
        approvals: function(fn) {
            var wfcontent = $('#wfcontent');
            wfcontent.empty();
            var projs = (wf.myprojectsarray).join();
            wf.get('AWAPVL/search?fields=*&submittedByID=' + storage.userID, function(data) {
                for (var i = 0; i < data.data.length; i++) {
                    var task = data.data[i];
                    var dueON = $.format.date(task.entryDate, "MMMM d, yyyy");
                    var html = '<div class="wf-list-item" data-type="approval" data-project="' + task.projectID + '">' +
                        '<strong>' + task.ID + '</strong><span class="wf-list-item-date">Opened: ' + dueON + '</span>' +
                        '<div class="wf-item-icons">' +
                        '<div class="tabConfirm"></div>' +
                        '</div>' +
                        '</div>';
                    apply_settings(task.projectID);
                    wfcontent.append(html);
                    baCount = i;
                }
                jQuery.isFunction(fn) ? fn(data) : false
            });
        },
        notifications: function(fn) {
            var wfcontent = $('#wfcontent');
            wfcontent.empty();
            wf.get('notifications?fields=note,acknowledgementID', function(data) {
                var allNots = [];
                for (var i = 0; i < 50; i++) {
                    if (data.data[i].note && !data.data[i].acknowledgementID) {
                        allNots.push(data.data[i].note.ID);
                    }
                }
                var ids = allNots.join();
                if (allNots.length > 0) {
                    setUnread(allNots.length);
                    wf.get('note/?fields=*&id=' + ids, function(data) {
                        for (var i = 0; i < data.data.length; i++) {
                            var note = data.data[i];
                            if (note.topNoteObjCode == "PROJ") {
                                type = 'project';
                            }
                            var date = $.format.date(note.entryDate, "MMMM d, yyyy");
                            var html = '<a target="_blank" href="https://' + storage.wfdomain + '.attask-ondemand.com/project/view?ID=' + note.projectID + '" class="wf-list-item wf-notes" data-type="note" data-project="' + note.ID + '">' +
                                '<p>' + note.noteText + '</p><span class="wf-list-item-date">' + date + '</span>' +
                                '</a>';
                            wfcontent.append(html);
                            baCount = i;
                        }
                    });
                } else {
                    setAllRead();
                    wfcontent.append("<p class='noContentText'>Nothing to see here.</p>");
                }
                jQuery.isFunction(fn) ? fn(data) : false
            });
        }
    }

    function pageActions() {
        if (thispage() == "preferences.html") {
            $("#prefform").submit(function(event) {
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
                //swal("Saved", "Your preferences have been saved.", "success");
                window.location = "popup.html";
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

            $('#resetConfig').on('click', function() {
                var toRemove = [];
                chrome.storage.sync.get(function(Items) {
                    $.each(Items, function(index, value) {
                        toRemove.push(index);
                    });
                    chrome.storage.sync.remove(toRemove, function(Items) {
                        window.location = "welcome.html";
                    });
                });
            });

            $("input[type='checkbox']").bootstrapSwitch({
                size: 'mini'
            });

			$.getJSON( "../manifest.json", function( json ) {
				$('#version b').text(json.version);
			});

            if (storage.MenuOrder) {
                $("ol.MenuOrder").empty();
                $.each(storage.MenuOrder, function(key, val) {
                    $("ol.MenuOrder").append('<li data-name="' + val.name + '">' + val.name + '</li>');
                });
            }

            var group = $("ol.MenuOrder").sortable({
                group: 'serialization',
                onDrop: function($item, container, _super) {
                    var data = group.sortable("serialize").get();
                    chrome.storage.sync.set({
                        'MenuOrder': data[0]
                    });
                    console.log(data[0])
                    _super($item, container);
                }
            });
        }
        if (thispage() == "do.html") {
            $('textarea').focusToEnd()
        }

    }

    function hasToReload() {
        //Color Pickers
        $('.PJColorPicker').each(function() {
            var that = $(this);
            var id = that.closest('.wf-list-item').data('project');
            var color = that.data('color') || "#eeeeee";
            that.colorpicker({
                color: color
            }).on('changeColor', function(e) {
                chrome.storage.sync.set({
                    [id]: {
                        bgColor: e.color.toHex()
                    }
                });
                apply_settings(id);
            });
        });
        checkTimeInProgress();
        $('.wf-btn-done[data-toggle="popover"]').popover({
            html: true,
            content: function() {
                return $('#wfdonePopover').html();
            }
        });
        $('body').on('click', function(e) {
            $('[data-toggle="popover"]').each(function() {
                if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
                    $(this).popover('hide');
                }
            });
        });
    }

    function extendedItem(parnet) {
        var this_id = parnet.find('.timeKeeper').attr('data-timekeeper');
        console.log(this_id)
        parnet.append('<div class="wf-item-extended-content"></div>');
        var ext = parnet.find('.wf-item-extended-content');
        var form = '<ul class="wf-item-extended-menu"><li data-un="0%" data-pos="0" class="active">Updates</li><li data-un="-100%" data-pos="1">Documents</li><li data-un="-200%" data-pos="2">Details</li></ul>';
        var extention = form + '<div class="wf-extended-slider"><ul>';

        extention += '<li data-pos="0"><div class="wf-item-extended-form">' +
            '<textarea name="wf-update-text"></textarea>' +
            '<select name="wf-update-status">' +
            '<option>Going Smoothly</option>' +
            '<option>Some Concerns</option>' +
            '<option>Major Roadblocks</option>' +
            '</select>' +
            '<select name="wf-update-state">' +
            '<option>New</option>' +
            '<option>In Progress</option>' +
            '<option>Checking</option>' +
            '<option>Pending IT Support</option>' +
            '<option>Waiting For</option>' +
            '<option>Complete Pending Approval</option>' +
            '</select>' +
            '<button name="update-txt" class="wf-btn wf-btn-blue wf-btn-tad-bigger">Update</button><br />' +
            '</div></li>';

        extention += '<li data-pos="1"><div class="wf-item-extended-form wf-item-extended-overflow">' +
            '<div class="wf-item-extended-document">Document Name</div>' +
            '<div class="wf-item-extended-document">Document Name</div>' +
            '</div></li>';

        extention += '<li data-pos="2"><div class="wf-item-extended-form wf-item-extended-overflow">' +
            '<div class="wf-item-extended-para">Blah Blah Blah, Blah Blah, Blah Blah Blah Blah Blah</div>' +
            '</div></li>';

        extention += '</ul></div>';

        ext.append(extention);
        jQuery(document).ready(function($) {
            $('.wf-extended-slider').unslider({
                nav: false,
                arrows: false
            });
            $('body').on('click', '.wf-item-extended-menu li', function() {
                var move = $(this).data('un');
                var pos = $(this).data('pos');
                $('.wf-item-extended-menu li').removeClass('active');
                $(this).addClass('active');
                $('.unslider-carousel').find('.unslider-active').removeClass('unslider-active');
                $('.unslider-carousel').find('li[data-pos="' + pos + '"]').addClass('unslider-active');
                $('.unslider-carousel').animate({
                    left: move
                }, 300);
            });
        });
    }

    $(document).ready(function() {
        if (!storage.isConfiged) {
            window.location = "welcome.html";
        } else {
            var ajaxStartLoader;
            $(document).ajaxStart(function() {
                $('#pageloading').show();
                ajaxStartLoader = setTimeout(function() {
                    $('#pageloading').hide();
                    window.location = "err.html?e=ajaxTimeout";
                }, storage.timeout || 10000);
            }).ajaxStop(function() {
                clearTimeout(ajaxStartLoader)
                $('#pageloading').hide();
            });

            if (thispage() == "popup.html") {
                var dft = $('#custmenu').find('.active > a').data('load');
                populate[dft](function() {
                    hasToReload();
                });
                storage.MenuOrder = (storage.MenuOrder) ? storage.MenuOrder : [{
                    name: "Projects",
                    html: '<li data-mo="Projects"><a href="#"data-load="projects"><span>Projects</span></a></li>'
                }, {
                    name: "My Work",
                    html: '<li data-mo="My Work"><a href="#"data-load="mywork"><span>MyWork</span></a></li>'
                }, {
                    name: "Approvals",
                    html: '<li data-mo="Approvals"><a href="#"data-load="approvals"><span>Approvals</span></a></li>'
                }, {
                    name: "Notifications",
                    html: '<li data-mo="Notifications"><a href="#"data-load="notifications"><iclass="zmdi zmdi-notifications"></i></a></li>'
                }];
                reorderMenu(storage.MenuOrder);

                $('body').on('click', '[data-done]', function() {
                    wf.remove($(this).closest('.wf-list-item'), $(this).data('done'), function(that, ac, remove) {
                        remove();
                    });
                });

                $('body').on('click', '.wf-list-item-details-btn', function() {
                    var parnet = $(this).closest('.wf-list-item');
                    parnet.toggleClass('wf-list-item-extended');
                    if (parnet.find('.wf-item-extended-content').length > 0) {
                        parnet.find('.wf-item-extended-content').remove();
                    } else {
                        extendedItem(parnet);
                        $('select').selectpicker();
                    }
                });

            }

            $('[data-load]').on('click', function() {
                $('#wfcontent').empty();
                $('[data-load]').parent().removeClass('active');
                $(this).parent().addClass('active');
                var apac = $(this).data('load');
                populate[apac](function() {
                    hasToReload();
                });
            });

            $('#finder').keyup(function(e) {
                var query = $.trim($(this).val()).toLowerCase();
                if (query == "do()") {
                    window.location = "do.html";
                }
                $('.wf-list-item').each(function() {
                    var $this = $(this);
                    var con = $this.text().toLowerCase();
                    if (con.match("^$")) {
                        shortCodeSearch(con)
                    }
                    if (con.indexOf(query) === -1)
                        $this.fadeOut();
                    else $this.fadeIn();
                });
            }).on('focus', function() {
                $('#wfsearch-add').show();
            }).on('blur', function() {
                if (this.value.length === 0) {
                    $('#wfsearch-add').hide();
                }
            });

            var searchMarks = (localStorage.getItem('searchMarks')) ? localStorage.getItem('searchMarks').split(',') : [];
            $('#wfsearch-favs').on('click', function(event) {
                var btn = $(this);
                btn.find('ul').toggle();
                btn.toggleClass('focus');
                var deletethis = function() {
                        if (event.target.nodeName == "EM") {
                            var t = $(event.target).parent().text();
                            $(event.target).parent().remove()
                            searchMarks = jQuery.grep(searchMarks, function(value) {
                                return value != t;
                            });
                            localStorage.setItem('searchMarks', searchMarks);
                        }
                    }
                    (event.target.nodeName == "EM") ? deletethis() : false;
                $('#finder').val((event.target.nodeName == "LI") ? $(event.target).text() : "").trigger('keyup')
            });

            function searchMarksPrep() {
                if (searchMarks.length > 0) {
                    searchMarks = searchMarks.sort();
                    $('#wfsearch-favs').find('ul').empty();
                    $.each(searchMarks, function(key, val) {
                        $('#wfsearch-favs').find('ul').append('<li>' + val + '<em class="zmdi zmdi-close"></em></li>');
                    });
                }
            }
            searchMarksPrep()
            $('#wfsearch-add').on('click', function(event) {
                searchMarks.push($('#finder').val());
                localStorage.setItem('searchMarks', searchMarks);
                searchMarksPrep()
                $(this).hide();
            });

        } //Is isConfiged
        pageActions();
        $('.navbar').dblclick(function() {
            swal({
                title: "New Window?",
                text: "Do you want to open this in a new window?",
                type: "info",
                showCancelButton: true,
                confirmButtonText: "Yes",
                cancelButtonText: "Cancel",
                closeOnConfirm: true,
                closeOnCancel: true
            }, function(isConfirm) {
                if (isConfirm) {
                    var sw = screen.width - 530;
                    window.open('popup.html', 'Quick Front', 'width=500, height=601, top=75, left=' + sw);
                }
            });
            return false;
        });
    });

}); //end get local storage