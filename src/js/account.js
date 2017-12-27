require('vanilla-ripplejs');
const Vue = require('vue');
import Vuex from 'vuex';
Vue.use(Vuex);
import Ajax from './lib/ajax.js';
import DateFormat from './lib/DateFormat.js';
const Verimail = require('vendor/verimail.js');
const verimail = new Verimail();

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
		'activePage',
		'user',
		'update',
		'error',
	],
	methods: {
		/*update: function(what) {
			console.log(what);
		},*/
	},
});
Vue.component('content-security', {
	template: '#template-content-security',
	props: [
		'activePage',
		'userSecurity',
		'revokeSession',
	],
});
Vue.component('content-applications', {
	template: '#template-content-applications',
	props: [
		'activePage'
	],
});
Vue.component('underlined-input', {
	template: '#template-underlined-input',
	props: {
		name: String,
		type: {
			type: String,
			default: 'text',
		},
		value: {
			type: null,
			default: ''
		},
	},
	data: function() {
		return {
			//value: '',
			blurState: {
				focusing: false,
				blurring: false,
			},
		};
	},
	methods: {
		updateValue: function(what, val) {
			//this.$emit('input', val);
			store.commit('setUserData', {[what]: val});
		},
  		onInputFocus: function() {
  			this.blurState.focusing = true;
		},
  		onInputBlur: function() {
  			this.blurState.blurring = true;
			setTimeout(() => {
				this.blurState.focusing = false;
				this.blurState.blurring = false;
			}, 300);
		},
	},
});
Vue.component('button-row', {
	template: '#template-button-row',
	props: {
		name: String,
		id: String,
		error: String,
		update: Function,
		click: String,
	},
});
Vue.component('user-panel', {
	template: '#template-user-panel',
	props: {
		user: null,
		logout: null,
	},
});
var store = new Vuex.Store({
	state: {
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
	  	user: {
	  		firstname: 'Loading...',
	  		familyname: '',
	  		email: '',
	  		image: 'https://placehold.it/80x80',
	  		joindate: '',
	  		password_old: '',
	  		password_new: '',
	  		password_confirm: '',
	  	},
	  	activePage: 1,
	  	loading: false,
	  	error: {
	  		name: '',
	  		email: '',
	  		password: '',
	  	},
	  	userSecurity: {
	  		hasTwoFactor: false,
	  		sessions: [],
	  		history: [],
	  	},
	},
	mutations: {
		changeActivePage(state, id) {
			state.activePage = id;
		},
		setUserData(state, data) {
			for (var key in data) {
				if (key === 'joindate') state.user[key] = DateFormat.format(data[key]/*, 'MM d, y at h:m:s'*/);
				else state.user[key] = data[key] || '';
  			}
		},
		setUserSecurity(state, data) {
			for (var key in data) {
  				if (key === 'sessions') state.userSecurity[key] = data[key].map(x => {
  					x.created = DateFormat.format(x.created);
  					return x;
  				});
  				else if (key === 'history') state.userSecurity[key] = data[key].map(x => {
  					x.time = DateFormat.format(x.time, 'j-d-y@h:m');
  					return x;
  				});
  				else state.userSecurity[key] = data[key] || '';
  			}
		},
		setUserApplications(state, data) {
			for (var key in data) {
  				state.userApplications[key] = data[key] || '';
  			}
		},
		setError(state, data) {
			for (var key in data) {
  				state.error[key] = data[key];
  			}
		},
		setLoading(state, data) {
			state.loading = !!data;
		}
	},
});
var app = new Vue({
  	el: '#app',
  	data: store.state,
  	methods: {
  		selectPage: function(id) {
  			//this.activePage = id;
  			store.commit('changeActivePage', id);
  		},
  		update: function(what) {
			var opts = {
				url: 'http://localhost/auth3/src/public/api/user/info',
				method: 'POST',
			};
			switch (what) {
				case 'name':
					var firstname = store.state.user.firstname.trim(),
						familyname = store.state.user.familyname.trim();
					if (!firstname) {
						store.commit('setError', {
							name: 'First name cannot be empty',
						});
						return;
					}
					store.commit('setError', {
						name: '',
					});
					opts = Object.assign(opts, {
						data: {
							firstname: firstname,
							familyname: familyname,
						},
					});
					console.log(opts);
					break;
				case 'email':
					var email = store.state.user.email.trim();
					if (!email) {
						store.commit('setError', {
							email: 'Email cannot be empty',
						});
						return;
					}
					if (!/^.+@\w+\.\w+$/.test(email)) {
						store.commit('setError', {
							email: 'Please enter a valid email address.',
						});
						return;
					}
					store.commit('setError', {
						email: '',
					});
					opts = Object.assign(opts, {
						data: {
							email: email,
						},
					});
					break;
				case 'password':
					var password = store.state.user.password_old.trim();
					var password_new = store.state.user.password_new.trim(),
						password_confirm = store.state.user.password_confirm.trim();
					if (!password) {
						// cant be empty
						store.commit('setError', {
							password: 'Please enter your current password.',
						});
						return;
					}
					if (!password_new || !password_confirm || password_new !== password_confirm) {
						// error
						store.commit('setError', {
							password: 'Passwords must match and cannot be blank.',
						});
						return;
					}
					store.commit('setError', {
						password: ''
					});
					if (password == password_new) return;

					opts = Object.assign(opts, {
						data: {
							password_old: password,
							password_new: password_new,
							password_confirm: password_confirm,
						},
					});
					store.commit('setUserData', {
						password_old: '',
				  		password_new: '',
				  		password_confirm: '',
				  	});
					break;
			}
			opts = Object.assign(opts, {
				success: function(data) {
					console.log(data);
					store.commit('setLoading', false);
				},
				error: function(data) {
					console.log(data);
					store.commit('setLoading', false);
				},
			});
			store.commit('setLoading', true);
			Ajax.ajax(opts);
		},
		revokeSession: function(id) {
			let _this = this;
			store.commit('setLoading', true);
			Ajax.delete({
  				url: 'http://localhost/auth3/src/public/api/token/' + id,
  				success: function(data) {
  					store.commit('setLoading', false);
  					let obj = JSON.parse(data);
  					_this.fetchSecurityData();
  				},
  				error: function(data) {
  					store.commit('setLoading', false);

  				}
  			});
		},
  		fetchAccountData: function(cascade) {
  			let _this = this;
  			store.commit('setLoading', true);
  		  	Ajax.get({
  				url: 'http://localhost/auth3/src/public/api/user/info',
  				success: function(data) {
  					store.commit('setLoading', false);
  					let obj = JSON.parse(data);
  					store.commit('setUserData', obj);
  					if (cascade) _this.fetchSecurityData(cascade);
  				},
  				error: function(data) {
  					store.commit('setLoading', false);

  				}
  			});
  		},
  		fetchSecurityData: function(cascade) {
  			let _this = this;
  			store.commit('setLoading', true);
  			Ajax.get({
  				url: 'http://localhost/auth3/src/public/api/user/security',
  				success: function(data) {
  					store.commit('setLoading', false);
  					let obj = JSON.parse(data);
  					store.commit('setUserSecurity', obj);
  					if (cascade) _this.fetchApplicationData(cascade);
  				},
  				error: function(data) {
  					store.commit('setLoading', false);

  				}
  			});
  		},
  		fetchApplicationData: function(cascade) {
  			store.commit('setLoading', true);
  			Ajax.get({
  				url: 'http://localhost/auth3/src/public/api/user/applications',
  				success: function(data) {
  					store.commit('setLoading', false);
  					var obj = JSON.parse(data);
  					store.commit('setUserApplications', obj);
  				},
  				error: function(data) {
  					store.commit('setLoading', false);

  				}
  			});
  		},
  		logout: function() {
  			store.commit('setLoading', true);
  			Ajax.get({
  				url: 'http://localhost/auth3/src/public/api/logout',
  				success: function(data) {
  					store.commit('setLoading', false);
  					localStorage.removeItem('auth3_token');
  					location.href = '/';
  				},
  				error: function(data) {
  					store.commit('setLoading', false);
  					localStorage.removeItem('auth3_token');
  					location.href = '/';
  				}
  			});
  		},
  	},
  	created: function() {
  		var obj = JSON.parse(window.localStorage.getItem('auth3_token'));
		if (!obj || !obj.access_token) {
			var loc = document.location;
			var currentUrl = loc.pathname;
			var newUrl = loc.origin + '/?return=' + currentUrl;
			document.location.replace(newUrl);
			return;
		}
		var token = JSON.parse(localStorage.getItem('auth3_token')).access_token;
		var refresh = JSON.parse(localStorage.getItem('auth3_token')).refresh_token;
  		Ajax.setTokenData({
  			access_token: token, 
  			refresh_token: refresh,
  			refresh_url: 'http://localhost/auth3/src/public/api/token',
  		});
  		Ajax.onRefresh(function(data) {
  			var json = JSON.parse(data);
  			localStorage.setItem('auth3_token', data);
  			Ajax.setTokenData({
  				access_token: json.access_token,
  				refresh_token: json.refresh_token,
  			});
  		})
  		this.fetchAccountData(true);
  	},
});
