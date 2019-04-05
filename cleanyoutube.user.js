// ==UserScript==
// @name         Clean Youtube
// @namespace    http://youtube.com/
// @version      1.2
// @description  Clean Youtube
// @updateURL    https://github.com/ggonmar/tampermonkey/raw/master/cleanyoutube.user.js
// @author       ggonmar@gmail.com
// @match        https://www.youtube.com/*
// @grant        GM_addStyle
// @require      http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.5/jquery-ui.min.js// ==/UserScript==
var active=false;

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for(var i = this.length - 1; i >= 0; i--) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}
if(active)
{
    cleanUpYoutube();
    setInterval(cleanUpYoutube, 2000);
}

window.cleanUpYoutube = function cleanUpYoutube()
{
    if(document.getElementById('things-cleant')) return;

    try{
        document.getElementById("container").remove();
        document.getElementById("page-manager").setAttribute('style','margin-top:0px');
        document.getElementById("primary")
            .setAttribute('style','margin-left:5px; padding-top:5px; padding-right:5px');

        var control = document.createElement("div");
        control.setAttribute('id','things-cleant');
        document.body.appendChild(control);
        var b = document.createElement("button");
        b.setAttribute('id','movie-mode');
        b.innerHTML='Make Youtube Slim Again';
        b.setAttribute('onclick', '"cleanUpYoutube()"');
        document.getElementById("end").appendChild(b);
    }
    catch(e)
    {}
}

