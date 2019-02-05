var objRecordTypes = {
        A:1,
        AAAA:28,
        CNAME:5,
        HINFO:13,
        MX:15,
        NS:2,
        PTR:12,
        SOA:6,
        SRV:33,
        TXT:16,
        ANY:255,
      };
function getElement(id) { try { return document.getElementById(id); } catch(err) { throw err; } };
function setElementAttributes(theElement, theAttributes) {
	if (Object.prototype.toString.call(theAttributes)=="[object Object]") {
		for (var theName in theAttributes) { theElement.setAttribute(theName, theAttributes[theName]); }
	}
}
function addChildElement(eParent, childType, childContent, childAttributes) {
	var eChild = document.createElement(childType);
	eParent.appendChild(eChild);
	if (typeof childContent == "string") eChild.innerHTML = childContent;
	if (Object.prototype.toString.call(childAttributes)=="[object Object]") setElementAttributes(eChild, childAttributes);
	return eChild;
}
function escapeHTML(html) {
	var eTmp = document.createElement('textarea');
	eTmp.textContent = html;
	return eTmp.innerHTML;
}
/* ------------------------------------------------------------------------------- */
// https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
/* ------------------------------------------------------------------------------- */
function makeApiXhr(method, url, data, postProcessFunction) {
	var xhr = new XMLHttpRequest();
	xhr.open(method, url, true);
	if (method == "POST") xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onreadystatechange = function() { if (xhr.readyState === 4) postProcessFunction(xhr); };
	if (method == "POST") { xhr.send(data); } else { xhr.send(); }
}
function setUI(e,t) {
  e.parentNode.style.display = (typeof t == "string") ? "" : "none";
  e.innerHTML = (typeof t == "string") ? t : "";
}
function resolveDomainName() {
  const apiUrl = "https://dns.google.com/resolve",
        webUrl = "https://dns.google.com/query",
        urlTemplate = "<a class='url' target='_blank' href='URL'>URL</a>";
  var domainName = getElement("name").value,
      recordType = getElement("type").value,
	    urlParams = "?name="+domainName+"&type="+recordType;
	makeApiXhr("GET", apiUrl+urlParams, null, function(xhr) {
		if (xhr.status === 200) {
			var objTemp = JSON.parse(xhr.responseText);
			console.log(JSON.stringify(objTemp));
      setUI(getElement("webUrl"),urlTemplate.replace(/URL/g,webUrl+urlParams));
      setUI(getElement("apiUrl"),urlTemplate.replace(/URL/g,apiUrl+urlParams));
      setUI(getElement("xhrOutput"),"<pre>"+escapeHTML(JSON.stringify(objTemp,null,"  "))+"</pre>");
      setUI(getElement("xhrError"));
		} else {
      setUI(getElement("webUrl"));
      setUI(getElement("apiUrl"));
      setUI(getElement("xhrOutput"));
      setUI(getElement("xhrError"),"HTTP Error (Status = " + xhr.status + ")");
    }
	});
}
function getInvAddr() {
  var e = getElement("name"), dn = e.value, a = dn.replace(/\.$/,"").match(/^(\d+\.\d+\.\d+\.\d+)(\.in-addr\.arpa)?$/);
  if (a == null) {
    alert("Inverse Address Conversion Failed");
    return;
  }
  var ip = a[1].split(".").reverse();
  e.value = ip.join(".") + ((a[0]==a[1])?".in-addr\.arpa":"") + ((dn.endsWith("."))?".":"");
}
function checkDomainName(domainName) {
  getElement("askButton").disabled = /^\s*$/.test(domainName);
  getElement("invAddrButton").disabled = !(/^\d+\.\d+\.\d+\.\d+\.?$/.test(domainName) || /^\d+\.\d+\.\d+\.\d+\.in-addr\.arpa\.?$/.test(domainName.toLowerCase()));
  return !(/^\s*$/.test(domainName));
}
function populateRecordTypes() {
  var eSelect = getElement("type");
  for (var recordType in objRecordTypes) {
    addChildElement(eSelect,"option",recordType+" ("+objRecordTypes[recordType]+")",{value:recordType});
  }
}
function changeHelpLink() {
  var svgCode = "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path style='fill:#373fff' d='M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 18.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25c.691 0 1.25.56 1.25 1.25s-.559 1.25-1.25 1.25zm1.961-5.928c-.904.975-.947 1.514-.935 2.178h-2.005c-.007-1.475.02-2.125 1.431-3.468.573-.544 1.025-.975.962-1.821-.058-.805-.73-1.226-1.365-1.226-.709 0-1.538.527-1.538 2.013h-2.01c0-2.4 1.409-3.95 3.59-3.95 1.036 0 1.942.339 2.55.955.57.578.865 1.372.854 2.298-.016 1.383-.857 2.291-1.534 3.021z'/></svg>";
  getElement("helpLink").innerHTML = svgCode;
}
/*
  Here there be main code...
*/
function prepPage() {
  populateRecordTypes();
  changeHelpLink();
  var domainName = getParameterByName("name"), recordType = getParameterByName("type");
  if (recordType) {
    recordType = recordType.toUpperCase();
    if (!(recordType in objRecordTypes)) {
      alert("Unknown Record Type: \""+recordType+"\"");
    } else {
      for (var e=getElement("type"),i=0; i<e.options.length; i++) {
        if (e.options[i].value != recordType) continue;
        e.selectedIndex = i;
        break;
      }
    }
  }
  if (domainName) {
    getElement("name").value = domainName;
    if (checkDomainName(domainName)) resolveDomainName();
  }
}