// ==UserScript==
// @name         ElPais AntiAdblocker
// @version      0.1
// @description  Go Matthew!
// @author       ggonmar
// @match        https://elpais.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

setInterval(processPage, 1000);

    function processPage()
    {
        var a= document.querySelector('.fc-ab-root');
        a.style.display ="none"
        var b = document.querySelector('#salida_articulo')
        b.style.overflow = "auto"
    }
})();
