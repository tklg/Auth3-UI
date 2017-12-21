require('vanilla-ripplejs');
const Vue = require('vue');

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

Vue.component('page-header', {
	template: '#template-header'
});
Vue.component('page-body', {
	template: '#template-body'
});
Vue.component('left-nav', {
	template: '#template-left-nav',
	props: [
		'pages',
		'selectPage',
		'activePage',
	],
});
Vue.component('content-account', {
	template: '#template-content-account',
	props: [
		'activePage'
	],
});
Vue.component('content-security', {
	template: '#template-content-security',
	props: [
		'activePage'
	],
});
Vue.component('content-applications', {
	template: '#template-content-applications',
	props: [
		'activePage'
	],
});
var app = new Vue({
  	el: '#app',
  	data: {
	  	pages: [
	  		{
	  			id: 0,
	  			title: 'Account',
	  		},
	  		{
	  			id: 1,
	  			title: 'Security',
	  		},
	  		{
	  			id: 2,
	  			title: 'Applications',
	  		},
	  	],
	  	activePage: 0,
  	},
  	methods: {
  		selectPage: function(id) {
  			this.activePage = id;
  		}
  	}
});