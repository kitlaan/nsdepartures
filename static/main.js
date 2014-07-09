
window.onload = function() {
    registerActors();

    lastUpdate = getData('board');
    if (lastUpdate) {
        if (Date.now() - lastUpdate.updated > 10*60*1000) {
            refreshData();
        }
    } else {
        refreshData();
    }

    updateHeader();
    updateBody();

    setInterval(updateHeader, 30*1000);
}

var lastUpdate;
var fetching = false;

function updateHeader() {
    var thetime = new Date();

    var curdate = document.getElementById('curdate');
    if (curdate) {
        curdate.innerHTML = zeroPad(thetime.getFullYear(), 4) + "-"
                          + zeroPad(thetime.getMonth(), 2) + "-"
                          + zeroPad(thetime.getDate(), 2);
    }

    var curtime = document.getElementById('curtime');
    if (curtime) {
        curtime.innerHTML = zeroPad(thetime.getHours(), 2) + ":"
                          + zeroPad(thetime.getMinutes(), 2);
    }

    var dayofweek = document.getElementById('dayofweek');
    if (dayofweek) {
        var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        dayofweek.innerHTML = days[thetime.getDay()];
    }

    var refreshtime = document.getElementById('refreshtime');
    if (refreshtime) {
        var since = "?";
        if (lastUpdate) {
            since = Math.floor((thetime.getTime() - lastUpdate.updated) / (1000*60));
        }
        refreshtime.innerHTML = "<span>&delta; " + since + " min</span>";
    }
}

function showBusy() {
    var refreshtime = document.getElementById('refreshtime');
    if (refreshtime) {
        refreshtime.innerHTML = "<span>fetching...</span>";
    }
}

function updateBody() {
    if (!lastUpdate) {
        return;
    }

    var data = lastUpdate['data'];

    var board = document.getElementById('tracks');
    if (board) {
        var rows = board.getElementsByTagName('tr');
        while (rows.length > 1) {
            rows[1].parentNode.removeChild(rows[1]);
        }

        data.sort(function(a,b) {
            return a.ScheduledTime - b.ScheduledTime;
        });

        for (var i = 0; i < data.length; i++) {
            addTrack(board, data[i]);
        }
    }
}

function registerActors() {
    var refreshtime = document.getElementById('refreshtime');
    if (refreshtime) {
        refreshtime.onclick = refreshData;
    }
}

function refreshData(e) {
    if (!fetching) {
        fetching = true;
        showBusy();
        sendRequest('board', boardData);
    }
}

function boardData(req) {
    if (req.responseText) {
        lastUpdate = {
            'updated': Date.now(),
            'data': JSON.parse(req.responseText),
        };
        storeData('board', lastUpdate);
    }

    updateHeader();
    updateBody();

    fetching = false;
}

function addTrack(board, row) {
    var tr = document.createElement('tr');

    var epoch = new Date(row['ScheduledTime'] * 1000);
    addChildElement(tr, 'td', zeroPad(epoch.getHours(), 2) + ":" + zeroPad(epoch.getMinutes(), 2));

    addChildElement(tr, 'td', row['Trip']);

    addChildElement(tr, 'td', row['Destination']);

    addChildElement(tr, 'td', row['Track']);

    var status = row['Status'];
    if (row['Lateness']) {
        // assuming it's in seconds
        status += " (" + Math.floor(row['Lateness'] / 60) + " min)";
    }
    addChildElement(tr, 'td', row['Status']);

    board.appendChild(tr);
}

// Helper Routines

function addChildElement(parentElement, tag, value) {
    var elem = document.createElement(tag);
    elem.innerHTML = value;
    parentElement.appendChild(elem);
}

function zeroPad(value, len) {
    var pad = "00000";
    return (pad + value).slice(-len);
}

function storeData(key, value) {
    if (!localStorage) {
        return;
    }
    localStorage[key] = JSON.stringify(value);
}
function getData(key) {
    if (!localStorage || !localStorage[key]) {
        return;
    }
    return JSON.parse(localStorage[key]);
}

function sendRequest(url, callback, postData) {
    var req = new XMLHttpRequest();
    if (!req) {
        return;
    }

    var method = postData ? "POST" : "GET";

    req.open(method, url, true);
    //req.setRequestHeader('User-Agent', 'XMLHTTP/1.0');
    req.page = url;
    if (postData) {
        req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }
    req.onreadystatechange = function() {
        if (req.readyState != 4) {
            return;
        }
        callback(req);
    }

    if (req.readyState == 4) {
        return;
    }

    req.send(postData);
}

