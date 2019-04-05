// ==UserScript==
// @name         Clean Youtube
// @namespace    http://youtube.com/
// @version      1.0
// @description  Clean Youtube
// @author       ggonmar
// @match        https://www.youtube.com/*
// @grant        GM_addStyle
// @require      http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.5/jquery-ui.min.js// ==/UserScript==
var active=true;

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

function cleanUpYoutube()
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
    }
    catch(e)
    {}
}