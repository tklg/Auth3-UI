require('vanilla-ripplejs');

// require that user log in first
var obj = window.localStorage.getItem('auth3_token');
if (!obj || !obj.token) {
	var loc = document.location;
	var currentUrl = loc.pathname;
	var newUrl = loc.origin + '/?return=' + currentUrl;
	document.location.replace(newUrl);
}

const btnNext = document.getElementById('btn-next');
btnNext.addEventListener('click', acceptAuthorize);

function acceptAuthorize(e) {
	if (e) e.preventDefault();
	document.location = './authorize/accept';
}