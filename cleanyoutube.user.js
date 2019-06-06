// ==UserScript==
// @name         Clean Youtube
// @namespace    http://youtube.com/
// @version      1.2
// @description  Clean Youtube
// @updateURL    https://github.com/ggonmar/tampermonkey/raw/master/cleanyoutube.user.js
// @downloadURL    https://github.com/ggonmar/tampermonkey/raw/master/cleanyoutube.user.js
// @author       ggonmar@gmail.com
// @match        https://www.youtube.com/*
// @grant        GM_addStyle
// @grant       unsafeWindow
// ==/UserScript==
var active=true;


let collapse_button = '<i class="fas fa-angle-double-up">Collapse</i>';
let expand_button= 'Back!';

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
    setUpButton();
    setInterval(setUpButton, 2000);
}

function setUpButton()
{
    if(document.getElementById('movie-mode')) return;

    try{
        var b = document.createElement("button");
        b.setAttribute('id','movie-mode');
        b.innerHTML=collapse_button;
        b.setAttribute('onclick', 'cleanShitUp()');
        document.getElementById("end").appendChild(b);
    }
    catch(e)
    {}
}

function cleanShitUp()
{
    try{

        document.getElementById("container").remove();
        document.getElementById("page-manager").setAttribute('style','margin-top:0px');
        document.getElementById("primary")
            .setAttribute('style','margin-left:5px; padding-top:5px; padding-right:5px');
        var b = document.createElement("button");
/*        b.setAttribute('id','movie-mode');
        b.innerHTML=expand_button;
        b.setAttribute('onclick', 'reload()');
        document.getElementById("html5-video-container").appendChild(b);
*/    }
    catch(e)
    {}
}

function reload()
{
    location.reload();
}

if(!unsafeWindow.cleanShitUp)
{
    unsafeWindow.cleanShitUp = cleanShitUp;
}

if(!unsafeWindow.reload)
{
    unsafeWindow.reload = reload;
}
