// ==UserScript==
// @name         Fintonic To Gmail & GMaps
// @version      1.1
// @description  Dudas de donde viene un gasto? busca información relacionada en Gmail y en GMaps!
// @author       ggonmar@gmail.com
// @match        https://www.fintonic.com/private/transactions
// @grant        GM_addStyle
// @grant       unsafeWindow
// ==/UserScript==


let debug = false;
let fontawesome = false;
let checkevery = 2;
let urlHolder = '%URL%';
let GmailButton, GMapsButton;
if (fontawesome) {
  GmailButton = `<button class='tm-button tm-gmail' title="Searh on GMail"><a href="${urlHolder}" target=_blank><i class="fas fa-envelope-open-text"></i></a></button>`;
  GMapsButton = `<button class='tm-button tm-gmaps' title="Search on Timeline"><a href="${urlHolder}" target=_blank><i class="fas fa-map-marked-alt"></i></a></button>`;
} else {
  GmailButton = `<button class='tm-button tm-gmail' title="Searh on GMail"><a href="${urlHolder}" target=_blank>Gmail</a></button>`;
  GMapsButton = `<button class='tm-button tm-gmaps' title="Search on Timeline"><a href="${urlHolder}" target=_blank>Timeline</a></button>`;
}

let n = 1;

addDependencies();

var intervalID = setInterval(updateLinks, checkevery * 1000);

function updateLinks() {
  log(`\n----#${n}----`);
  let listOfLines = getListOfLines();
  log(`Lines found: ${listOfLines.length}`);
  let k = 1;
  for (let line of listOfLines) {
    try {
      if (fontawesome)
        addFontAwesome();
      log(`\tChecking line ${k}: ${line.getElementsByClassName('name')[0].innerText}`);
      if (!(hasButtons(line))) {
        let date = obtainTxDate(line);
        let value = obtainTxValue(line);
        appendThisTo(GmailButton.replace(urlHolder, generateGmailUrl(date, value)), line);
        appendThisTo(GMapsButton.replace(urlHolder, generateGMapsUrl(date)), line);
      }
    } catch (e) {
      log(`\tLine ${k} has no data`)
    } finally {
      k++;
    }
  }
  n++;
}

function appendThisTo(what, where) {
  let div = document.createElement("div");
  div.innerHTML = what;
  where.appendChild(div);
}

function getListOfLines() {
  return document.getElementsByClassName('movements__entityDetail__movementsList__movement');
}

function hasButtons(line) {
  if (line.getElementsByClassName("tm-button").length === 0)
    return false;
  else
    return true;
}

function generateGmailUrl(date, value) {
  let encodedValue = encodeURIComponent(value);
  let encodedDate = encodeURIComponent(new Date(date).toISOString().split('T')[0].replace(/-/g, '/'));
  encodedDate = encodeURIComponent(new Date(date).toLocaleString().split(", ")[0].replace(/([0-9]{2})\/([0-9]{2})\/([0-9]{4})/g, "$3/$2/$1"));
  let url = `https://mail.google.com/mail/u/0/#advanced-search/subset=all&has=${encodedValue}&within=3d&sizeoperator=s_sl&sizeunit=s_smb&date=${encodedDate}&query=${encodedValue}`
  log(`\t\tGmail Url: ${url}`);
  return url;
}

function generateGMapsUrl(date) {
  //let encodedDate = new Date(date).toISOString().split('T')[0];
  let encodedDate = new Date(date).toLocaleString().split(", ")[0].replace(/([0-9]{2})\/([0-9]{2})\/([0-9]{4})/g, "$3-$2-$1");
  let url = `https://www.google.com/maps/timeline?hl=en&authuser=0&ei=zTL6XJ_KBbTKgwfJuLWAAQ%3A15&ved=1t%3A17706&pb=!1m2!1m1!1s${encodedDate}`;
  log(`\t\tGMaps Url: ${url}`);
  return url;
}

function log(msg) {
  let marker = `[F2G]`;
  if (debug) {
    if (typeof msg === "string")
      console.log(`${marker} ${msg}`);
    else {
      console.log(`${marker}`);
      console.log(`${msg}`);
    }
  }
}

function addDependencies() {
  document.getElementsByTagName('head')[0].append('<link href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.4/themes/base/jquery-ui.css" rel="stylesheet" type="text/css">');
  let css = `
  .tm-button{ font-size:12px;}
  `;
  GM_addStyle(css);
}

function obtainTxDate(line) {
  let dateHolder = line.previousSibling;
  while (dateHolder.getAttribute("class") !== "movements__entityDetail__movementsList__groupTitle") {
    dateHolder = dateHolder.previousSibling;
  }
  return dateHolder.getElementsByClassName("day")[0].innerText;
}

function obtainTxValue(line) {
  return line.getElementsByClassName('amount')[0].innerText.replace(/[-|€]/g, "");
}


function addFontAwesome() {
  let faUrl="https://use.fontawesome.com/releases/v5.8.2/css/all.css";
/*  if(!document.head.innerHTML.includes(faUrl))
  {
    var headHTML = document.head.innerHTML;
    headHTML += `<link rel="stylesheet" href="${faUrl}" integrity="sha384-oS3vJWv+0UjzBfQzYUhtDYW+Pj2yciDJxpsK1OYPAYjqT085Qq/1cq5FLXAZQ7Ay" crossorigin="anonymous">`;
    document.head.innerHTML = headHTML;
  }*/
  GM_addStyle(faUrl);
}
