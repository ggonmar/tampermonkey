// ==UserScript==
// @name         AntiPopup
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Quita el panel de antipopup de 20m, elpais, elmundo...
// @updateURL	 https://github.com/ggonmar/tampermonkey/raw/master/antipopup.user.js
// @downloadURL	 https://github.com/ggonmar/tampermonkey/raw/master/antipopup.user.js
// @author       ggonmar@gmail.com
// @include      *20minutos.es/*
// @include      *elmundo.com/*
// @include      *elmundo.es/*
// @include      *elpais.com/*
// @include      *abc.es/*
// @require https://code.jquery.com/jquery-2.1.4.min.js
// @grant        none
// ==/UserScript==

function removeLayer(){
//        console.log('Removing layers...');
        jQuery('.fc-ab-root').remove();
        jQuery('body').css('overflow','')
    }


async function checkForPanel(){
    while(!document.querySelector(".fc-ab-root")) {
        await new Promise(r => setTimeout(r, 500));
    }
    jQuery('.fc-ab-root').remove();
    jQuery('body').css('overflow','')
}

checkForPanel();


window.removeLayer = removeLayer
