// ==UserScript==
// @name         Gmail show Amazon orders
// @version      1.0
// @description  Isn't it annoying to have to switch context between gmail and amazon every time? This will solve it for you. https://twitter.com/ggonmar/status/1334461580759740416
// @author       Guillermo (ggonmar@gmail.com)
// @include      https://mail.google.com/*
// @grant        GM.xmlHttpRequest
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.deleteValue
// @grant        GM.listValues
// ==/UserScript==

/*
let goodLogo='https://www.flaticon.com/svg/static/icons/svg/281/281769.svg';
let number = findCurrentUnread();

let img = document.createElement("IMG");
img.src=goodLogo;
//document.getElementById('body').appendChild(img);

function findCurrentUnread(){
    var aTags = document.getElementsByTagName("div");
    var found;
    for (var i = 0; i < aTags.length; i++) {
        if (aTags[i].textContent.includes("Inbox") && aTags[i].textContent.match(/^Inbox(\d)*$/g)) {
            found = aTags[i].textContent.replace("Inbox", "");
            break;
        }
    }
    return found;
}
*/
(async function () {

    let refNumberFormat = /\d{3}-\d{7}-\d{7}/g;

    await untilGmailIsFullyLoaded();

    attachPanel();
    setInterval(lookForAmazonReferences, 200);


    function lookForAmazonReferences() {
        let amazonReferences = Array.from(document.querySelectorAll('a,h2')).filter(e => {
            return e.innerText.match(refNumberFormat)
        });
        if (amazonReferences.length) {
            amazonReferences.forEach(e => {
                if (!e.onmouseover)
                    addEventOn(e)
            });
        }
    }

    function addEventOn(element) {

        element.onmouseover = async function () {
            this.style.cursor = "help";
            await populateDivWithCorrectData(this);
        };
        element.onmouseout = function () {
            emptyDivAndHide(this);
        };

    }

    async function findCorrectValueForReference(ref) {
        let html = (await GM.getValue(ref, "")).code;
        if (!html) {
            let webHTML = await GM.xmlHttpRequest({
                method: 'GET',
                url: `https://www.amazon.es/gp/your-account/order-details/ref=ppx_yo_dt_b_order_details_o00?ie=UTF8&orderID=${ref}#orderDetails`
            });

            if (webHTML.status == 200) {
                let parser = new DOMParser();
                webHTML = (parser.parseFromString(webHTML.responseText.trim(), "text/html"))
                    .documentElement;

                ['nav-belt', 'nav-main', 'nav-subnav', 'skiplink', 'recsWidget', 'navFooter']
                    .forEach((e) => webHTML.querySelector(`#${e}`).remove());
                [{nth: 0,  elem: 'breadcrumbs'}].forEach((e) => webHTML.querySelectorAll(`.${e.elem}`)[e.nth].remove());

                webHTML.querySelector('#orderDetails').style.width="90%";
                let now =new Date();
                let expiryDate = new Date(now.setMonth(now.getMonth()+1));

                await GM.setValue(ref, {code: webHTML.outerHTML, expiry: expiryDate});
                html = webHTML.outerHTML;
            }
        }
        return html;
    }

    async function populateDivWithCorrectData(information) {
        let referenceNumber = information.innerText.match(refNumberFormat)[0];
        let div = document.querySelector('#amazon-info');
        div.innerHTML = `<div>${spinner}</div><div style="width:100%;text-align:center">Loading information for ${referenceNumber}</div>`;
//        console.log(information);
        div.style.display = "";
        div.style.top = `${getElemDistanceToTop(information) + information.offsetHeight + 5}px`;
        div.style.left = `${getElemDistanceToLeft(information) + 25}px`;

        while (window.innerWidth - div.getBoundingClientRect().right < 100) {
            div.style.left = `${(parseFloat(div.style.left) - 5)}px`;
        }

        div.innerHTML = await findCorrectValueForReference(referenceNumber);
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
        if (!Array.from(currently).some(e => e.id == "amazon-info")) {
            clearUp();
        }
    }

    function clearUp() {
        let div = document.querySelector('#amazon-info');
        div.style.display = "none";
        div.innerHTML = "";
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
        elem.style.cssText = 'display:none;position:absolute;top:100px;left:10%;width:60%;height:80%;opacity:0.92;border:5px outset grey; z-index:100;background:#fff';
        elem.innerHTML = "Information goes here";
        elem.onmouseout = function () {
            clearUp();
        }
        document.body.appendChild(elem);
        cleanUpExpiredEntriesInStorage().then();
    }

    async function cleanUpExpiredEntriesInStorage(){
        let storedValues= await GM.listValues();

        let now = new Date();
        for (const entry of storedValues) {
            let entryValue = await GM.getValue(entry);
            let expiryDate = new Date(entryValue.expiry);
            if(now < expiryDate)
                GM.deleteValue(entry);
        }
    }

    let spinner = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="margin:auto;background:#fff;display:block;" width="200px" height="200px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
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
