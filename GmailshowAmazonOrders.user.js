// ==UserScript==
// @name         Gmail show Amazon orders
// @version      3.1
// @description  Isn't it annoying to have to switch context between gmail and amazon every time? This will solve it for you. https://twitter.com/ggonmar/status/1334461580759740416
// @updateURL    https://github.com/ggonmar/tampermonkey/raw/master/GmailshowAmazonOrders.user.js
// @downloadURL  https://github.com/ggonmar/tampermonkey/raw/master/GmailshowAmazonOrders.user.js
// @author       Guillermo (ggonmar@gmail.com)
// @include      https://mail.google.com/*
// @grant        GM.xmlHttpRequest
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.deleteValue
// @grant        GM.listValues
// @grant        GM_registerMenuCommand
// ==/UserScript==

(async function () {

    let refNumberFormat = /\d{3}-\d{7}-\d{7}/g;
    let daysToStoreReferences = 7;
    let debug = false;
    let sticky = false;
    let amazonInstance = await GM.getValue('AmazonInstance');
    if (!amazonInstance) amazonInstance = "es";

    await untilGmailIsFullyLoaded();

    attachPanel();
    setInterval(lookForAmazonReferences, 200);
    window.onhashchange = function () {
        clearUp(true);
    }

    function lookForAmazonReferences() {
        if (window.location.href.endsWith("#inbox")) return;

        let amazonReferences = Array.from(document.querySelectorAll('a,h2,span')).filter(e => {
            return e.innerText.match(refNumberFormat)
        });
        if (amazonReferences.length) {
            amazonReferences.forEach(e => {
                if (!e.onmouseover)
                    addEventOn(e);
            });
        }
    }

    function addEventOn(element) {
        element.onmouseover = async function () {
            this.style.cursor = "help";
            await populateDivWithCorrectData(this);
        };
        element.onmouseout = function () {
            if (!sticky)
                emptyDivAndHide(this);
        };
        element.onclick = function () {
            makeSticky(this);
        }
    }

    function makeSticky() {
        let div = document.querySelector('#amazon-info');
        if (div.style.display === "" && sticky === true) {
            sticky = false;
            clearUp(true);
            return;
        }
        if (div.style.display === "")
            sticky = true;
    }

    async function composeContentForReference(ref) {
        let html = (await GM.getValue(ref, "")).code;
        if (!html || debug) {
            let webHTML = await GM.xmlHttpRequest({
                method: 'GET',
                url: `https://www.amazon.${amazonInstance}/gp/your-account/order-details/ref=ppx_yo_dt_b_order_details_o00?ie=UTF8&orderID=${ref}#orderDetails`
            });

            if (webHTML.status === 200) {
                // Starting the process of cleaning up the page to be properly displayed
                let parser = new DOMParser();
                webHTML = (parser.parseFromString(webHTML.responseText.trim(), "text/html"))
                    .documentElement;
                try {
                    ['nav-belt', 'nav-main', 'nav-subnav', 'skiplink', 'recsWidget', 'navFooter', 'orderDetails h1']
                        .forEach((e) => {
                            if (webHTML.querySelector(`#${e}`))
                                webHTML.querySelector(`#${e}`).remove()
                        });
                    [{elem: 'breadcrumbs', nth: 0,}, {elem: 'hide-if-js', nth: 0,}, {elem: 'a-last', nth: 0,}]
                        .forEach((e) => {
                            if (webHTML.querySelectorAll(`.${e.elem}`).length > e.nth)
                                webHTML.querySelectorAll(`.${e.elem}`)[e.nth].remove()
                        });

                    if (webHTML.querySelector(`#a-popover-invoiceLinks`))
                        webHTML.querySelector(`#a-popover-invoiceLinks`).parentNode.remove()

                    webHTML.querySelector('#orderDetails').style.width = "90%";
                    html = webHTML.outerHTML;
                    let now = new Date();
                    let expiryDate = new Date(now.setDate(now.getDate() + daysToStoreReferences));
                    await GM.setValue(ref, {code: html, expiry: expiryDate});
                } catch (e) {
                    html = webHTML.outerHTML;
                }

            }
        }

        let parser = new DOMParser();
        let webHTML = (parser.parseFromString(html, "text/html")).documentElement;
        for (let elem of webHTML.querySelectorAll('[href]')) {
            if (elem.getAttribute('href')[0] === "/")
                elem.setAttribute('href', `https://www.amazon.${amazonInstance}${elem.getAttribute('href')}`);
        }

        return webHTML.outerHTML;
    }

    async function populateDivWithCorrectData(information) {
        let referenceNumber = information.innerText.match(refNumberFormat)[0];
        let div = document.querySelector('#amazon-info');
        let existingContent = document.querySelector('#amazon-info-content');
        if (existingContent) existingContent.remove();

        let content = document.createElement('div');
        content.id = 'amazon-info-content';
        content.style.cssText = "margin-top:-1.5em;";
        content.innerHTML = `<div>${spinner}</div><div style="width:100%;text-align:center">Loading information for ${referenceNumber}</div>`;
//        console.log(information);
        div.appendChild(content);

        div.style.display = "";
        div.style.top = getElemDistanceToTop(information) < window.innerHeight / 2 ?
            `${getElemDistanceToTop(information) + information.offsetHeight + 5}px`
            :
            `${getElemDistanceToTop(information) - div.offsetHeight - information.offsetHeight}px`
        div.style.left = `${getElemDistanceToLeft(information) + 25}px`;
        while (window.innerWidth - div.getBoundingClientRect().right < 100) {
            div.style.left = `${(parseFloat(div.style.left) - 5)}px`;
        }
        content.innerHTML = await composeContentForReference(referenceNumber);

        while (window.innerHeight - div.getBoundingClientRect().bottom < 100) {
            div.style.top = `${(parseFloat(div.style.top) - 5)}px`;
        }

        while (div.scrollHeight >= div.clientHeight+5) {
            if (div.style.zoom === "")
                div.style.zoom = "0.99";
            else {
                let newZoom;
                newZoom = parseFloat(div.style.zoom) - 0.01;
                div.style.zoom = `${newZoom}`;
            }
        }
    }

    let getElemDistanceToTop = function (elem) {
        let location = 0;
        if (elem.offsetParent) {
            do {
                location += elem.offsetTop;
                elem = elem.offsetParent;
            } while (elem);
        }
        return location >= 0 ? location : 0;
    };
    let getElemDistanceToLeft = function (elem) {
        let location = 0;
        if (elem.offsetParent) {
            do {
                location += elem.offsetLeft;
                elem = elem.offsetParent;
            } while (elem);
        }
        return location >= 0 ? location : 0;
    };

    function emptyDivAndHide(elem) {
        let currently = document.querySelectorAll(":hover");
        elem.style.cursor = "auto";
        if (!Array.from(currently).some(e => e.id === "amazon-info")) {
            clearUp();
        }
    }

    function clearUp(force = false) {
        let div = document.querySelector('#amazon-info');
        let content = document.querySelector('#amazon-info-content');
        if (div.style.display === "none") return;
        if ((debug || sticky) && !force) return;
        div.style.display = "none";
        content.remove();
    }

    async function untilGmailIsFullyLoaded() {
        while (!Array.from(document.querySelectorAll('a')).filter(e => {
            return e.innerText.match(/Inbox/g)
        })[0]) {
            await new Promise(r => setTimeout(r, 500));
        }
    }

    function attachPanel() {
        let elem = document.createElement('div');
        elem.id = "amazon-info";
        elem.style.cssText = 'display:none;position:absolute;top:100px;left:10%;width:60%;max-height:65%; overflow-y: auto;opacity:0.92;border:5px outset grey; z-index:100;background:#fff;zoom:1';
        elem.innerHTML = "";
        let close = document.createElement('div');
        close.id = "amazom-info-close";
        close.style.cssText = 'position:absolute;top:10px;right:20px;cursor:pointer';
        close.innerText = 'x';
        close.onclick = function () {
            sticky = false;
            clearUp(true);
        }
        elem.appendChild(close);
        document.body.appendChild(elem);

        cleanUpExpiredEntriesInStorage().then();

        GM_registerMenuCommand("Remove stored reference numbers", cleanUpStorage, "R");
        GM_registerMenuCommand(`Change Amazon Instance (${amazonInstance})`, changeAmazonInstance, "C");

    }

    async function cleanUpExpiredEntriesInStorage() {
        let storedValues = (await GM.listValues()).filter(e => e !== "AmazonInstance");
        let now = new Date();
        for (const entry of storedValues) {
            let entryValue = await GM.getValue(entry);
            let expiryDate = new Date(entryValue.expiry);
            if (now > expiryDate)
                GM.deleteValue(entry);
        }
    }

    async function cleanUpStorage() {
        let storedValues = (await GM.listValues()).filter(e => e !== "AmazonInstance");
        for (const entry of storedValues) {
            GM.deleteValue(entry);
        }
    }

    async function changeAmazonInstance() {
        let option;
        let continueOnLoop = false;
        do {
            let str = "What amazon domain would you like to launch queries against?";
            if (option !== undefined) str += `\nThe domain "amazon.${option}" is invalid.`;
            option = window.prompt(str);
            console.log(option);
            continueOnLoop = !(option === null || option.length === 0 || verifyValidAmazonDomain(option));
        } while (continueOnLoop)
        if (option) {
            await GM.setValue('AmazonInstance', option)
            location.reload()
        }
    }

    function verifyValidAmazonDomain(domain) {
        return domain === "es" || domain === "it";
/*        let webHTML = GM.xmlHttpRequest({
            method: 'GET',
            url: `https://www.amazon.${amazonInstance}/gp/your-account/order-details/ref=ppx_yo_dt_b_order_details_o00?ie=UTF8&orderID=${ref}#orderDetails`
        }).then(e => {
            return e
        });
        return webHTML;
*/
    }

    let spinner = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="margin:auto;margin-top:2em;background:#fff;display:block;" width="100px" height="100px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
<g transform="rotate(0 50 50)">
  <rect x="47" y="24" rx="2.4" ry="2.4" width="6" height="12" fill="#008ce3">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.9166666666666666s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(30 50 50)">
  <rect x="47" y="24" rx="2.4" ry="2.4" width="6" height="12" fill="#008ce3">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.8333333333333334s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(60 50 50)">
  <rect x="47" y="24" rx="2.4" ry="2.4" width="6" height="12" fill="#008ce3">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.75s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(90 50 50)">
  <rect x="47" y="24" rx="2.4" ry="2.4" width="6" height="12" fill="#008ce3">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.6666666666666666s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(120 50 50)">
  <rect x="47" y="24" rx="2.4" ry="2.4" width="6" height="12" fill="#008ce3">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.5833333333333334s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(150 50 50)">
  <rect x="47" y="24" rx="2.4" ry="2.4" width="6" height="12" fill="#008ce3">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.5s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(180 50 50)">
  <rect x="47" y="24" rx="2.4" ry="2.4" width="6" height="12" fill="#008ce3">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.4166666666666667s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(210 50 50)">
  <rect x="47" y="24" rx="2.4" ry="2.4" width="6" height="12" fill="#008ce3">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.3333333333333333s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(240 50 50)">
  <rect x="47" y="24" rx="2.4" ry="2.4" width="6" height="12" fill="#008ce3">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.25s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(270 50 50)">
  <rect x="47" y="24" rx="2.4" ry="2.4" width="6" height="12" fill="#008ce3">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.16666666666666666s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(300 50 50)">
  <rect x="47" y="24" rx="2.4" ry="2.4" width="6" height="12" fill="#008ce3">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.08333333333333333s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(330 50 50)">
  <rect x="47" y="24" rx="2.4" ry="2.4" width="6" height="12" fill="#008ce3">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="0s" repeatCount="indefinite"></animate>
  </rect>
</g>
</svg>`;
})();
