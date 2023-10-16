// ==UserScript==
// @name         Remove HA Cloud
// @version      0.2
// @author       Guille
// @include       /.*:8123*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=homeassistant.local
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
const interval = setInterval(function() {
    let currentUrl = location.href
    if (currentUrl.endsWith("config/dashboard"))
    {
      let elem=document.querySelector("body > home-assistant")
        .shadowRoot.querySelector("home-assistant-main").shadowRoot
        .querySelector("ha-drawer > partial-panel-resolver > ha-panel-config > ha-config-dashboard")
        .shadowRoot.querySelector("ha-top-app-bar-fixed > ha-config-section > ha-card:nth-child(2) > ha-config-navigation")
        .shadowRoot.querySelector("ha-navigation-list").shadowRoot.querySelector("mwc-list > ha-list-item:nth-child(1)")
      if (elem && elem.innerText == 'Home Assistant Cloud Control home when away and integrate with Alexa and Google Assistant'){
          elem.style.cssText='transition: height 0.15s ease-out; height: 0px'
      }
    }
}, 500);

})();
