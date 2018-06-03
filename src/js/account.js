require('vanilla-ripplejs');
const Vue = require('vue');
import Vuex from 'vuex';
Vue.use(Vuex);
import Ajax from './lib/ajax.js';
import DateFormat from './lib/DateFormat.js';
import Scopes from './lib/Scopes.js';
const Verimail = require('vendor/verimail.js');
const verimail = new Verimail();

//const API_ROOT = location.protocol + "//" + location.hostname + "/auth3/src/public/api/";
const API_ROOT = "api/";

Vue.component('page-header', {
	template: '#template-header',
	props: [
		'mobileMenuActive',
		'toggleMobileMenu',
	],
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
		'mobileMenuActive',
	],
});
Vue.component('content-account', {
	template: '#template-content-account',
	props: [
		'activePage',
		'user',
		'update',
		'error',
		'sendVerificationEmail',
	],
});
Vue.component('content-security', {
	template: '#template-content-security',
	props: [
		'activePage',
		'update',
		'userSecurity',
		'revokeSession',
		'tfaEditing',
		'tfaEditorContent',
		'toggleTfaEditing',
		'enableTfa',
		'disableTfa',
		'regenerateTfa',
	],
});
Vue.component('content-applications', {
	template: '#template-content-applications',
	props: [
		'activePage',
		'userApplications',
		'revokeClient',
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
			default: '',
		},
		placeholder: {
			type: String,
			default: '',
		},
		autofocus: null,
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
			if (['authcode', 'qr-secret', 'qr-image', 'tfa_password'].includes(what)) {
				store.commit('setTFAData', {[what]: val});
			} else {
				store.commit('setUserData', {[what]: val});
			}
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
Vue.component('tfa-qr-editor', {
	template: '#template-tfa-qr',
	props: {
		tfaEditorContent: null,
		tfaEnabled: null,
		enableTfa: null,
		disableTfa: null,
	},
});
Vue.component('tfa-recovery', {
	template: '#template-tfa-recovery',
	props: {
		tfaEditorContent: null,
		regenerateTfa: null,
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
	  		verified: 'false',
	  		password_old: '',
	  		password_new: '',
	  		password_confirm: '',
	  	},
	  	activePage: 0,
	  	loading: false,
	  	scrollPos: 0,
	  	mobileMenuActive: false,
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
	  	userApplications: {
	  		applications: [],
	  	},
	  	tfaEditing: 0,
	  	tfaEditorContent: {
	  		error: '',
	  		authcode: '',
	  		tfa_password: '',
	  		qr_image: 'https://placehold.it/180x180',
	  		qr_secret: 'Generating secret...',
	  		recovery_codes: [],
	  	},
	},
	mutations: {
		changeActivePage(state, id) {
			state.activePage = id;
		},
		setMobileMenu(state, active) {
			state.mobileMenuActive = active;
		},
		setUserData(state, data) {
			for (var key in data) {
				if (key === 'joindate') state.user[key] = DateFormat.format(data[key]/*, 'MM d, yy at h:m:s'*/);
				else state.user[key] = data[key] || '';
  			}
		},
		setTFAData(state, data) {
			for (var key in data) {
				state.tfaEditorContent[key] = data[key];
			}
		},
		setUserSecurity(state, data) {
			for (var key in data) {
  				if (key === 'sessions') state.userSecurity[key] = data[key].map(x => {
  					x.created = DateFormat.format(x.created);
  					return x;
  				});
  				else if (key === 'history') state.userSecurity[key] = data[key].map(x => {
  					x.time = DateFormat.format(x.time, 'j-d-y at h:m', true);
  					return x;
  				});
  				else state.userSecurity[key] = data[key] || '';
  			}
		},
		setUserApplications(state, data) {
			for (var key in data) {
				if (key === 'applications') {
					state.userApplications[key] = data[key].map(x => {
						x.date = DateFormat.format(x.date, 'MM d, yy');
						return x;
					});
				} else state.userApplications[key] = data[key] || '';
  			}
		},
		setError(state, data) {
			for (var key in data) {
  				state.error[key] = data[key];
  			}
		},
		setLoading(state, data) {
			state.loading = !!data;
		},
		setTfaEditing(state, data) {
			state.tfaEditing = data;
		},
		setScrollPos(state, data) {
			state.scrollPos = data;
		}
	},
});
var app = new Vue({
  	el: '#app',
  	data: store.state,
  	methods: {
  		selectPage: function(id) {
  			store.commit('changeActivePage', id);
  			if (store.state.mobileMenuActive) {
  				this.toggleMobileMenu();
  			}
  		},
  		toggleMobileMenu: function() {
  			store.commit('setMobileMenu', !store.state.mobileMenuActive);
  		},
  		update: function(what) {
  			let _this = this;
			var opts = {
				url: API_ROOT + 'user/info',
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
					_this.fetchAccountData();

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
  				url: API_ROOT + 'token/' + id,
  				success: function(data) {
  					store.commit('setLoading', false);
  					let obj = JSON.parse(data);
  					_this.fetchSecurityData();
  					_this.fetchApplicationData();
  				},
  				error: function(data) {
  					store.commit('setLoading', false);

  				}
  			});
		},
		revokeClient: function(id) {
			let _this = this;
			store.commit('setLoading', true);
			Ajax.delete({
  				url: API_ROOT + 'client_token/' + id,
  				success: function(data) {
  					store.commit('setLoading', false);
  					let obj = JSON.parse(data);
  					_this.fetchSecurityData();
  					_this.fetchApplicationData();
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
  				url: API_ROOT + 'user/info',
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
  				url: API_ROOT + 'user/security',
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
  				url: API_ROOT + 'user/applications',
  				success: function(data) {
  					store.commit('setLoading', false);
  					var obj = JSON.parse(data);
  					obj.applications = obj.applications.map(app => {
  						app.scopes = app.scopes.split(',').map(scope => {
  							return Scopes.getDescription(scope);
  						});
  						return app;
  					});
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
  				url: API_ROOT + 'logout',
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
  		toggleTfaEditing: function(gen) {
  			if (store.state.tfaEditing) {
  				if (gen) {
  					store.commit('setTfaEditing', 0);
  					store.commit('setTFAData', {
	  					error: '',
				  		authcode: '',
				  		'qr_image': 'https://placehold.it/180x180',
				  		'qr_secret': 'Generating secret...',
	  				});
  				} else {
  					this.showTfaCodes();
  				}
  			} else {
  				if (gen) {
		  			store.commit('setLoading', true);
		  			Ajax.get({
		  				url: API_ROOT + 'user/security/twofactor?size=180',
		  				success: function(data) {
		  					store.commit('setLoading', false);
		  					var obj = JSON.parse(data);
  							store.commit('setTfaEditing', 1);
  							if (obj.error && obj.error.includes('already')) {
  								store.commit('setUserSecurity', {
  									hasTwoFactor: true,
  								});
  							} else {
  								obj.qr_secret = obj.qr_secret.replace(/(.{4})(.{4})(.{4})(.{4})/, '$1 $2 $3 $4');
		  						store.commit('setTFAData', obj);
  							}
		  				},
		  				error: function(data) {
		  					store.commit('setLoading', false);
		  				}
		  			});
  				} else {
  					this.showTfaCodes();
  				}			
  			}
  		},
  		enableTfa: function() {
  			let _this = this;
		  	store.commit('setLoading', true);
  			Ajax.post({
		  		url: API_ROOT + 'user/security/twofactor/enable',
		  		data: {
		  			authcode: store.state.tfaEditorContent.authcode,
		  		},
		  		success: function(data) {
		  			store.commit('setLoading', false);
  					//_this.showTfaCodes();
		  			var obj = JSON.parse(data);
		  			obj.recovery_codes = obj.recovery_codes.map(x => {
		  				x = x.replace(/(.{5})(.{5})/, '$1-$2');
		  				return x;
		  			});
		  			obj.error = '';
		  			store.commit('setTFAData', obj);
		  			store.commit('setUserSecurity', {
		  				hasTwoFactor: true,
		  			});
		  			store.commit('setTfaEditing', 3);
		  			_this.fetchSecurityData();
		  		},
		  		error: function(data) {
		  			store.commit('setLoading', false);
		  			store.commit('setTFAData', {
		  				error: JSON.parse(data).error
		  			});
		  		}
		  	});
  		},
  		disableTfa: function() {
  			let _this = this;
  			let password = store.state.tfaEditorContent.tfa_password;
		  	store.commit('setLoading', true);
  			Ajax.post({
		  		url: API_ROOT + 'user/security/twofactor/disable',
		  		data: {
		  			password: password,
		  		},
		  		success: function(data) {
		  			store.commit('setLoading', false);
		  			var obj = JSON.parse(data);
		  			store.commit('setTFAData', {
	  					error: null,
				  		authcode: '',
				  		'qr_image': 'https://placehold.it/180x180',
				  		'qr_secret': 'Generating secret...',
	  				});
		  			store.commit('setUserSecurity', {
		  				hasTwoFactor: false,
		  			});
		  			store.commit('setTfaEditing', 0);
		  			_this.fetchSecurityData();
		  		},
		  		error: function(data) {
		  			store.commit('setLoading', false);
		  			let error = JSON.parse(data).error.toString() || 'Unknown error';
		  			store.commit('setTFAData', {
		  				error: error
		  			});
		  		}
		  	});
  		},
  		regenerateTfa: function() {
  			let password = store.state.tfaEditorContent.tfa_password;
  			if (!password) {
  				store.commit('setTfaEditing', 2);
  				return;
  			}
  			store.commit('setLoading', true);
  			Ajax.post({
		  		url: API_ROOT + 'user/security/twofactor/codes/regen',
		  		data: {
		  			password: password,
		  		},
		  		success: function(data) {
		  			store.commit('setLoading', false);
		  			var obj = JSON.parse(data);
		  			obj.recovery_codes = obj.recovery_codes.map(x => {
		  				x = x.replace(/(.{5})(.{5})/, '$1-$2');
		  				return x;
		  			})
		  			store.commit('setTFAData', obj);
		  		},
		  		error: function(data) {
		  			store.commit('setLoading', false);
		  			store.commit('setTfaEditing', 2);
		  		}
		  	});
  		},
  		showTfaCodes: function(obj) {
		  	store.commit('setTfaEditing', !store.state.tfaEditorContent.tfa_password.length ? 2 : 3);
  		},
  		fetchTfaCodes: function() {
  			let password = store.state.tfaEditorContent.tfa_password;
  			// post because password
  			Ajax.post({
		  		url: API_ROOT + 'user/security/twofactor/codes',
		  		data: {
		  			password: password,
		  		},
		  		success: function(data) {
		  			store.commit('setLoading', false);
		  			var obj = JSON.parse(data);
		  			obj.recovery_codes = obj.recovery_codes.map(x => {
		  				console.log(x);
		  				x = x.replace(/(.{5})(.{5})/, '$1-$2');
		  				return x;
		  			})
		  			obj.error = '';
		  			store.commit('setTFAData', obj);
		  			store.commit('setTfaEditing', 3);
		  		},
		  		error: function(data) {
		  			let error = JSON.parse(data).error.toString() || 'Unknown error';
		  			store.commit('setTfaEditing', 2);
		  			store.commit('setLoading', false);
		  			store.commit('setTFAData', {
		  				error: error
		  			});
		  		}
		  	});
  		},
  		sendVerificationEmail: function() {
  			store.commit('setLoading', true);
  			Ajax.post({
		  		url: API_ROOT + 'sendverification',
		  		success: function(data) {
		  			store.commit('setLoading', false);
		  			var obj = JSON.parse(data);
		  			store.commit('setError', {
		  				email: 'Email sent',
		  			});
		  		},
		  		error: function(data) {
		  			store.commit('setLoading', false);
		  			var obj = JSON.parse(data);
		  			store.commit('setError', {
		  				email: obj.error,
		  			});
		  		}
		  	});
  		},
  		handleScroll: function(e) {
  			let pos = window.scrollY;
  			store.commit('setScrollPos', pos);
  		},
  	},
  	created: function() {
  		var obj = JSON.parse(window.localStorage.getItem('auth3_token'));
		if (!obj || !obj.access_token) {
			var loc = document.location;
			var currentUrl = loc.pathname;
			var newUrl = loc.origin + '/?return=' + encodeURIComponent(currentUrl);
			document.location.replace(newUrl);
			return;
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
  		});
  		Ajax.onRevoked(function(data) {
			var newUrl = location.origin + '/?return=' + encodeURIComponent(location.pathname);
			document.location.replace(newUrl);
			return;
  		});
  		this.fetchAccountData(true);
  		window.addEventListener('scroll', this.handleScroll);
  	},
  	destroyed: function() {
  		window.removeEventListener('scroll', this.handleScroll);
  	}
});
