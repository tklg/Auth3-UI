require('vanilla-ripplejs');
const Verimail = require('vendor/verimail.js');
const verimail = new Verimail();
const commonPasswords = require('vendor/rockyou-75.js');

//const API_ROOT = location.protocol + "//" + location.hostname + "/auth3/src/public/api/";
const API_ROOT = "api/";
const API_USER_EXISTS = 'exists/';
const API_NEW_USER = 'user/new';

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
const carousel = document.getElementById('carousel-container');
const modal = document.getElementById('modal');
const errorBox = {
	email: document.getElementById('email-error'),
	password: document.getElementById('password-error'),
	password2: document.getElementById('password2-error')
};
const inputs = {
	email: document.getElementById('email-input'),
	password: document.getElementById('password-input'),
	password2: document.getElementById('password2-input')
};
const STEP_EMAIL = 'identifier',
	  STEP_PASSWORD = 'pwd',
	  PASS_1 = 0,
	  PASS_2 = 1;

document.getElementById('btn-next').addEventListener('click', submitEmail);
//document.getElementById('btn-finish').addEventListener('click', finish); // taken care of by grecaptcha
inputs.email.addEventListener('keyup', checkEmailOrSubmit);
inputs.password.addEventListener('keyup', (e) => finish(e, PASS_1));
inputs.password.addEventListener('change', checkCommonPasswords);
inputs.password2.addEventListener('keyup', (e) => finish(e, PASS_2));

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

History.init();
setTimeout(() => inputs.email.focus(), 100);

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

		/*var fd = new FormData();*/
		var xhr = new XMLHttpRequest();
		xhr.onload = () => {
			if (xhr.status === 200) {
				var data = xhr.response;
				if (typeof data == 'string') data = JSON.parse(data);

				if (data.email) {
					errorBox.email.classList.add('invalid');
					errorBox.email.innerText = "An account with that email already exists";
					modal.classList.remove('working');
					inputs.email.removeAttribute('readonly');
				} else {
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
			var data = xhr.response;
			if (typeof data == 'string') data = JSON.parse(data);
			modal.classList.remove('working');
			inputs.email.removeAttribute('readonly');
			errorBox.email.classList.add('invalid');
			errorBox.email.innerText = data.message;
		}
		xhr.open('GET', API_ROOT + API_USER_EXISTS + email);
		xhr.send(/*fd*/);
	});
}
function checkCommonPasswords(e) {
	var pass = inputs.password.value.trim();
	if (!pass.length) return;
	if (commonPasswords.includes(pass)) {
		errorBox.password.classList.add('invalid');
		errorBox.password.innerText = `Your password is on the list of common passwords`;
	} else {
		errorBox.password.classList.remove('invalid');
	}
}
function finish(e, which) {
	var email = inputs.email.value.trim();
	var password = inputs.password.value.trim();
	var password2 = inputs.password2.value.trim();
	if (password2.length > 0 && password != password2) {
		errorBox.password2.classList.add('invalid');
		errorBox.password2.innerText = "Passwords must match";
		return;
	} else {
		errorBox.password.classList.remove('invalid');
		errorBox.password2.classList.remove('invalid');
	}
	if (which != undefined) {
		e.preventDefault();
	} else {
		//grecaptcha.execute();
		modal.classList.add('working');
		inputs.password.setAttribute('readonly', true);
		inputs.password2.setAttribute('readonly', true);
		errorBox.password.classList.remove('invalid');

		if (password.length === 0 || password2.length === 0) {
			errorBox.password.classList.add('invalid');
			errorBox.password.innerText = "Password cannot be empty";
			modal.classList.remove('working');
			inputs.password.removeAttribute('readonly');
			inputs.password2.removeAttribute('readonly');
			grecaptcha.reset();
			return;
		}

		var recaptcha = grecaptcha.getResponse();
		if (!recaptcha) {
			errorBox.password2.classList.add('invalid');
			errorBox.password2.innerText = "Invalid recaptcha";
			grecaptcha.reset();
			return;
		}

		var fd = new FormData();
		var xhr = new XMLHttpRequest();
		fd.append('email', email);
		fd.append('password', password);
		fd.append('password_confirm', password2);
		fd.append('g-recaptcha-response', recaptcha);
		xhr.onload = () => {
			if (xhr.status === 200) {
				var data = xhr.response;
				if (typeof data == 'string') data = JSON.parse(data);
				inputs.password.removeAttribute('readonly');
				inputs.password2.removeAttribute('readonly');
				if (data.status && data.status === 'error') {
					modal.classList.remove('working');
					grecaptcha.reset();
					if (data.message.toLowerCase().indexOf('recaptcha') > -1) { // one more step
					} else {
						errorBox.password.classList.add('invalid');
						errorBox.password.innerText = data.message;
					}
				} else {
					console.info('Done');
					done();
				}
			} else {
				xhr.onerror();
			}
		}
		xhr.onerror = () => {
			var data = xhr.response;
			if (typeof data == 'string') data = JSON.parse(data);
			modal.classList.remove('working');
			inputs.password.removeAttribute('readonly');
			inputs.password2.removeAttribute('readonly');
			if (data.status && data.status === 'error') {
				grecaptcha.reset();
				if (data.message.toLowerCase().indexOf('recaptcha') > -1) { // needs captcha
				} else {
					errorBox.password.classList.add('invalid');
					errorBox.password.innerText = data.message;
				}
				modal.classList.remove('working');
			} else {
				errorBox.password.innerText = `Account creation failed (${xhr.status})`;
			}	
		}
		xhr.open('POST', API_ROOT + API_NEW_USER);
		xhr.send(fd);
		
	}
	//if (e instanceof KeyboardEvent && e.key !== 'Enter') return;


	//modal.classList.add('working');
	
}
window.finishSignup = finish;

function reset(e) {
	if (e) e.preventDefault();
	carousel.setAttribute('data-offset', 0);
	inputs.password.value = "";
	inputs.password2.value = "";
	modal.classList.remove('working');
	errorBox.email.classList.remove('invalid');
	errorBox.password.classList.remove('invalid');
	errorBox.password2.classList.remove('invalid');
	setTimeout(() => inputs.email.focus(), 300);
	if (e instanceof MouseEvent) {
		History.pop();
	}
}

function done() {
	window.location = '/login';
}