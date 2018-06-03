require('vanilla-ripplejs');
const _inputs = document.querySelectorAll('.underlined-input input');
//const API_ROOT = location.protocol + "//" + location.hostname + "/auth3/src/public/api/";
const API_ROOT = "api/";
const API_USER_RECOVER = 'user/passwordreset';

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

//const btnNext = document.getElementById('btn-next');
const btnFinish = document.getElementById('btn-finish');
//const btnReset = document.getElementById('btn-reset');
//const carousel = document.getElementById('carousel-container');
const modal = document.getElementById('modal');
const errorBox = {
	password: document.getElementById('password-error'),
	password2: document.getElementById('password2-error'),
};
const inputs = {
	password: document.getElementById('password-input'),
	password2: document.getElementById('password2-input'),
};
btnFinish.addEventListener('click', finishRecovery);
document.addEventListener('keyup', finishRecovery);
setTimeout(() => inputs.password.focus(), 100);
function finishRecovery(e) {
	if (e instanceof KeyboardEvent && e.key != 'Enter') return;
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
		return;
	}

	var fd = new FormData();
	var xhr = new XMLHttpRequest();
	fd.append('password', password);
	fd.append('password_confirm', password2);
	fd.append('key', document.getElementById('key').value);
	fd.append('email', document.getElementById('email').value);
	xhr.onload = () => {
		if (xhr.status === 200) {
			var data = xhr.response;
			if (typeof data == 'string') data = JSON.parse(data);
			inputs.password.removeAttribute('readonly');
			inputs.password2.removeAttribute('readonly');
			if (data.status && data.status === 'error') {
				modal.classList.remove('working');
				errorBox.password.classList.add('invalid');
				errorBox.password.innerText = data.message;
			} else {
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
			errorBox.password.classList.add('invalid');
			errorBox.password.innerText = data.message;
			modal.classList.remove('working');
		} else {
			errorBox.password.innerText = `Password reset failed (${xhr.status})`;
		}
	}
	xhr.open('POST', API_ROOT + API_USER_RECOVER);
	xhr.send(fd);
}

function done() {
	window.location.href = '/';
}