require('vanilla-ripplejs');
const Verimail = require('vendor/verimail.js');
const verimail = new Verimail();

//const API_ROOT = location.protocol + "//" + location.hostname + "/auth3/src/public/api/";
const API_ROOT = "api/";
const API_USER_EXISTS = 'exists/';
const API_TOKEN = 'token';
const OAUTH_TOKEN_REQUEST = {
	grant_type: 'password',
	client_id: 'auth3-c2f0ebded9',
	client_secret: 1,
	scope: 'user.all'
};

const _inputs = document.querySelectorAll('.underlined-input input');
function onInputFocus(e) {
	var parent = e.target.parentElement;
	parent.classList.add('focusing');
}
function onInputBlur(e) {
	var parent = e.target.parentElement;
	parent.classList.add('blurring');
	setTimeout(() => {
		parent.classList.remove('focusing');
		parent.classList.remove('blurring');
	}, 300);
}
function onInputKeyup(e) {
	if (this.value.length) {
		this.classList.add('has-content');
	} else {
		this.classList.remove('has-content');
	}
}
for (var i = 0; i < _inputs.length; i++) {
	_inputs[i].addEventListener('focus', onInputFocus);
	_inputs[i].addEventListener('blur', onInputBlur);
	_inputs[i].addEventListener('keyup', onInputKeyup);
	_inputs[i].addEventListener('change', onInputKeyup);
}

const btnNext = document.getElementById('btn-next');
const btnFinish = document.getElementById('btn-finish');
const btnReset = document.getElementById('btn-reset');
const btn2FA = document.getElementById('btn-authcode');
const carousel = document.getElementById('carousel-container');
const modal = document.getElementById('modal');
const errorBox = {
	email: document.getElementById('email-error'),
	password: document.getElementById('password-error'),
	authcode: document.getElementById('authcode-error')
};
const inputs = {
	email: document.getElementById('email-input'),
	password: document.getElementById('password-input'),
	authcode: document.getElementById('authcode-input')
};
const STEP_EMAIL = 'identifier',
	  STEP_PASSWORD = 'pwd',
	  STEP_AUTHCODE = '2fa'; // shouldnt need
class History {
	static push(id) {
		window.history.pushState({id: id}, 'step: ' + id);
	}
	static replace(id) {
		window.history.replaceState({id: id}, 'step: ' + id, '#' + id);
	}
	static pop() {
		window.history.back();
	}
	static init() {
		if (QueryString.get() == '') {
			QueryString.set(STEP_EMAIL);
			History.push(STEP_EMAIL);
			QueryString.set(STEP_EMAIL);
		} else {
			this.replace(STEP_EMAIL);
		}
		window.addEventListener('popstate', (e) => {
			//console.log(e.state.id);
			//console.log(window.history.state.id);
			if (e.state == null) {
				window.history.back();
			} else if (e.state.id == STEP_EMAIL) {
				reset(e);
			} else if (e.state.id == STEP_PASSWORD) {
				submitEmail(e);
			}
		});
	}
}
class QueryString {
	static set(id) {
		History.replace(id);
	}
	static get() {
		return window.location.hash.substr(1);
	}
}
btnNext.addEventListener('click', submitEmail);
btnFinish.addEventListener('click', login);
btn2FA.addEventListener('click', checkAuthCode);
btnReset.addEventListener('click', reset);
inputs.email.addEventListener('keyup', checkEmailOrSubmit);
inputs.password.addEventListener('keyup', login);
inputs.authcode.addEventListener('keyup', checkAuthCode);
History.init();
setTimeout(() => inputs.email.focus(), 100);

function submitEmail(e) {
	if (e) e.preventDefault();
	inputs.email.setAttribute('readonly', true);
	var email = inputs.email.value;

	verimail.verify(email, (status, message, suggestion) => {
		if ([-5, -4, -2, -1].includes(status)) {
			inputs.email.removeAttribute('readonly');
			errorBox.email.classList.add('invalid');
			inputs.email.classList.add('invalid');
			errorBox.email.innerText = message;
			return;
		}
		errorBox.email.classList.remove('invalid');
		inputs.email.classList.remove('invalid');
		modal.classList.add('working');

		//var fd = new FormData();
		var xhr = new XMLHttpRequest();
		//fd.append('email', email);
		xhr.onload = () => {
			if (xhr.status === 200) {
				var data = xhr.response;
				if (typeof data == 'string') data = JSON.parse(data);

				if (data.status && data.status === 'error') {
					errorBox.email.classList.add('invalid');
					errorBox.email.innerText = data.message;
					modal.classList.remove('working');
					inputs.email.removeAttribute('readonly');
				} else {
					document.getElementById('card-name').innerText = data.firstname ? (`${data.firstname} ${data.familyname ? data.familyname : ''}`) : '';
					if (data.firstname == email) document.getElementById('card-name').innerText = '';
					document.getElementById('card-email').innerText = email;
					document.getElementById('card-image').src = data.image;
					carousel.setAttribute('data-offset', 1);
					setTimeout(() => {
						inputs.password.focus();
						modal.classList.remove('working');
						inputs.email.removeAttribute('readonly');
					}, 300);

					if (e instanceof MouseEvent) {
						History.push(STEP_PASSWORD);
						QueryString.set(STEP_PASSWORD);
					}
				}

			} else {
				xhr.onerror();
			}
		}
		xhr.onerror = () => {
			modal.classList.remove('working');
			inputs.email.removeAttribute('readonly');
			var data = xhr.response;
			if (typeof data == 'string') data = JSON.parse(data);
			errorBox.email.classList.add('invalid');
			if (data.status && data.status === 'error') {
				errorBox.email.innerText = data.message;
			} else {
				errorBox.email.innerText = `Email check failed (${xhr.status})`;
			}
		}
		xhr.open('GET', API_ROOT + API_USER_EXISTS + email);
		xhr.send(/*fd*/);
	});
}

function checkEmailOrSubmit(e) {
	if (e) e.preventDefault();

	if (e.key === 'Enter') {
		submitEmail(e);
		return;
	}

	var email = inputs.email.value;

	verimail.verify(email, (status, message, suggestion) => {
		if (status == -3) {
			if(suggestion){
				// But we're guessing that you misspelled something
				//console.log("2 Did you mean " + suggestion + "?");
				errorBox.email.classList.add('invalid');
				errorBox.email.innerText = `Did you mean ${suggestion}?`;
			}
		} else {
			errorBox.email.classList.remove('invalid');
		}

	});

}
function login(e) {
	e.preventDefault();
	if (e instanceof KeyboardEvent && e.key !== 'Enter') return;

	modal.classList.add('working');
	inputs.password.setAttribute('readonly', true);

	var password = inputs.password.value;
	var email = inputs.email.value;

	if (password.length === 0) {
		errorBox.password.classList.add('invalid');
		errorBox.password.innerText = "Password cannot be empty";
		modal.classList.remove('working');
		inputs.password.removeAttribute('readonly');
		return;
	}

	var fd = new FormData();
	var xhr = new XMLHttpRequest();
	for (var key in OAUTH_TOKEN_REQUEST) {
		fd.append(key, OAUTH_TOKEN_REQUEST[key]);
	}
	fd.append('username', email);
	fd.append('password', password);
	fd.append('authcode', '');
	xhr.onload = () => {
		if (xhr.status === 200) {
			var data = xhr.response;
			if (typeof data == 'string') data = JSON.parse(data);
			if (xhr.status === 401 || data.status && data.status === 'error') {
				if (data.message.toLowerCase().indexOf('factor') > -1) { // one more step
					carousel.setAttribute('data-offset', 2);
					setTimeout(() => {
						inputs.authcode.focus();
						modal.classList.remove('working');
						inputs.password.removeAttribute('readonly');
					}, 300);
				} else {
					errorBox.password.classList.add('invalid');
					errorBox.password.innerText = data.message;
					modal.classList.remove('working');
					inputs.password.removeAttribute('readonly');
				}
			} else {
				signInOrReturn(data);
				console.info('Done');
			}
		} else {
			xhr.onerror();
		}
	}
	xhr.onerror = () => {
		modal.classList.remove('working');
		inputs.password.removeAttribute('readonly');
		errorBox.password.classList.add('invalid');
		var data = xhr.response;
		if (typeof data == 'string') data = JSON.parse(data);
		if (xhr.status === 401 || data.status && data.status === 'error') {
			if (data.message.toLowerCase().indexOf('factor') > -1) { // one more step
				carousel.setAttribute('data-offset', 2);
				setTimeout(() => {
					inputs.authcode.focus();
					modal.classList.remove('working');
					inputs.password.removeAttribute('readonly');
				}, 300);
			} else {
				errorBox.password.classList.add('invalid');
				errorBox.password.innerText = data.message;
				modal.classList.remove('working');
				inputs.password.removeAttribute('readonly');
			}
		} else {
			errorBox.password.innerText = `Sign in failed (${xhr.status})`;
		}	
	}
	xhr.open('POST', API_ROOT + API_TOKEN);
	xhr.send(fd);

}
function checkAuthCode(e) {
	e.preventDefault();
	if (e instanceof KeyboardEvent && e.key !== 'Enter') return;

	modal.classList.add('working');

	var email = inputs.email.value;
	var password = inputs.password.value;
	var authcode = inputs.authcode.value.replace(/[- ]/g, '');

	if (authcode.length === 0 || !/^\d{6}$/.test(authcode)) { // not a 6-digit code
		if (!/^[a-z0-9]{10}$/i.test(authcode)) { // also not a recovery code
			errorBox.authcode.classList.add('invalid');
			errorBox.authcode.innerText = "Please enter a valid code";
			modal.classList.remove('working');
			inputs.authcode.removeAttribute('readonly');
			return;
		}
	}

	var fd = new FormData();
	var xhr = new XMLHttpRequest();
	for (var key in OAUTH_TOKEN_REQUEST) {
		fd.append(key, OAUTH_TOKEN_REQUEST[key]);
	}
	fd.append('username', email);
	fd.append('password', password);
	fd.append('authcode', authcode);
	xhr.onload = () => {
		if (xhr.status === 200) {
			var data = xhr.response;
			if (typeof data == 'string') data = JSON.parse(data);
			if (xhr.status === 401 || data.status && data.status === 'error') {
				errorBox.authcode.classList.add('invalid');
				errorBox.authcode.innerText = data.message;
				modal.classList.remove('working');
			} else {
				// all done, sign in
				signInOrReturn(data);
				console.info('Done');
			}
		} else {
			xhr.onerror();
		}
	}
	xhr.onerror = () => {
		modal.classList.remove('working');
		errorBox.authcode.classList.add('invalid');
		var data = xhr.response;
		if (typeof data == 'string') data = JSON.parse(data);
		if (xhr.status === 401 || data.status && data.status === 'error') {
			errorBox.authcode.innerText = data.message;
		} else {
			errorBox.authcode.innerText = `Sign in failed (${xhr.status})`;
		}	
	}
	xhr.open('POST', API_ROOT + API_TOKEN);
	xhr.send(fd);
}
function reset(e) {
	if (e) e.preventDefault();
	carousel.setAttribute('data-offset', 0);
	inputs.password.value = "";
	inputs.authcode.value = "";
	modal.classList.remove('working');
	errorBox.email.classList.remove('invalid');
	errorBox.password.classList.remove('invalid');
	errorBox.authcode.classList.remove('invalid');
	setTimeout(() => inputs.email.focus(), 300);
	if (e instanceof MouseEvent) {
		History.pop();
	}
}
function signInOrReturn(data) {

	if (!data) {
		console.error('Token data cannot be empty.');
		return;
	}

	window.localStorage.setItem('auth3_token', JSON.stringify(data));

	var s = location.search.substr(1).split('&');
	var items = {};
	s.map(x => {
		var c = x.split('=');
		items[c[0]] = c[1];
	});
	if (items && items.return) {
		location.href = decodeURIComponent(items.return);
	} else {
		location.href = location.origin + "/account";
	}
}