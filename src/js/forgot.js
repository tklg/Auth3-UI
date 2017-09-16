require('vanilla-ripplejs');
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

/*const btnNext = document.getElementById('btn-next');
const btnFinish = document.getElementById('btn-finish');
const btnReset = document.getElementById('btn-reset');*/
//const carousel = document.getElementById('carousel-container');
const modal = document.getElementById('modal');
const errorBox = {
	email: document.getElementById('email-error'),
};
const inputs = {
	email: document.getElementById('email-input'),
};
setTimeout(() => inputs.email.focus(), 100);
function finishRecovery(e) {
	var email = inputs.email.value.trim();
		//grecaptcha.execute();
		modal.classList.add('working');
		errorBox.email.classList.remove('invalid');

		var recaptcha = grecaptcha.getResponse();
		if (!recaptcha) {
			errorBox.email.classList.add('invalid');
			errorBox.email.innerText = "Invalid recaptcha";
			grecaptcha.reset();
			return;
		}

		var fd = new FormData();
		var xhr = new XMLHttpRequest();
		fd.append('email', email);
		fd.append('password', password);
		fd.append('g-recaptcha-response', recaptcha);
		xhr.onload = () => {
			if (xhr.status === 200) {
				var data = xhr.response;
				if (typeof data == 'string') data = JSON.parse(data);
				if (data.status && data.status === 'error') {
					modal.classList.remove('working');
					grecaptcha.reset();
					if (data.message.toLowerCase().indexOf('recaptcha') > -1) { // needs captcha
						
					} else {
						errorBox.email.classList.add('invalid');
						errorBox.email.innerText = data.message;
					}
				} else {
					console.info('Done');
				}
			} else {
				xhr.onerror();
			}
		}
		xhr.onerror = () => {
			var data = xhr.response;
			if (typeof data == 'string') data = JSON.parse(data);
			modal.classList.remove('working');
			if (data.status && data.status === 'error') {
				grecaptcha.reset();
				if (data.message.toLowerCase().indexOf('recaptcha') > -1) { // needs captcha
				} else {
					errorBox.email.classList.add('invalid');
					errorBox.email.innerText = data.message;
				}
				modal.classList.remove('working');
			} else {
				errorBox.email.innerText = `Request failed (${xhr.status})`;
			}	
		}
		xhr.open('POST', 'api/users/recover');
		xhr.send(fd);
		
}
window.finishSignup = finishRecovery;