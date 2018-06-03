require('vanilla-ripplejs');
import Ajax from './lib/ajax.js';
import Scopes from './lib/Scopes.js';

const API_ROOT = location.protocol + "//" + location.hostname + "/auth3/src/public/api/";
//const API_ROOT = "api/";
let sessionId = '';

// require that user log in first
var obj = JSON.parse(window.localStorage.getItem('auth3_token'));
if (!obj || !obj.access_token) {
	var loc = document.location;
	var currentUrl = loc.href;
	var newUrl = loc.origin + '/?return=' + encodeURIComponent(currentUrl);
	document.location.replace(newUrl);
}
var token = JSON.parse(localStorage.getItem('auth3_token')).access_token;
var refresh = JSON.parse(localStorage.getItem('auth3_token')).refresh_token;
Ajax.setTokenData({
	access_token: token, 
	refresh_token: refresh,
	refresh_url: API_ROOT + 'token',
});
Ajax.onRefresh(function(data) {
	var json = JSON.parse(data);
	localStorage.setItem('auth3_token', data);
	Ajax.setTokenData({
		access_token: json.access_token,
		refresh_token: json.refresh_token,
	});
})

const btnNext = document.getElementById('btn-next');
const btnDeny = document.getElementById('btn-deny');
const appName = document.getElementById('app-name');
const scopeList = document.getElementById('scope-list');
const message = document.getElementById('message');
const carousel = document.getElementById('carousel');
btnNext.addEventListener('click', acceptAuthorize);
btnDeny.addEventListener('click', denyAuthorize);

function verifyAuthorize() {
	if (!location.search) {
		showErr('missing parameters');
	}
	Ajax.get({
		url: API_ROOT + 'authorize' + location.search,
		success(msg, xhr) {
			let json = JSON.parse(msg);
			sessionId = json.session;
			appName.innerText = json.application;
			for (let scope of json.scopes || []) {
				scopeList.innerHTML += `<li class="scope">${Scopes.getDescription(scope)}</li>`;
			}
			message.innerText = 'will be able to:';
		},
		error(msg, xhr) {
			try {
				let json = JSON.parse(msg);
				if (['invalid_scope', 'unsupported_grant_type', 'invalid_client'].includes(json.error)) {
					document.location.href = json.redirect_uri + "?error=" + (json.error || '') + "&message=" + (json.message || '') + "&hint=" + (json.hint || '');
					return;
				}
			} catch (e) {
				showErr(msg);
			}
		},
	});
}
function denyAuthorize(e) {
	if (e) e.preventDefault();
	document.location.href = API_ROOT + 'authorize/deny?session=' + sessionId;
}
function acceptAuthorize(e) {
	if (e) e.preventDefault();
	document.location.href = API_ROOT + 'authorize/accept?session=' + sessionId;
}
function showErr(msg) {
	carousel.innerHTML = `<h2 class="error">${msg}</h2>`;
}

verifyAuthorize();