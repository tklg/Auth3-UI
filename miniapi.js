const accounts = {
	'test@test.test': {
		password: 'test',
		image: 'd40a3a1dd1ed2adcba4158fdc0e1cbd0',
		firstname: 'Test',
		lastname: 'Account',
		twofactor: true
	},
	'a@a.a': {
		password: 'test',
		image: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
		firstname: 'A',
		lastname: 'A',
		twofactor: false
	}
}
function parseFormData(_data) {
	var data = {};
	var formString = _data.toString();
	var formData = formString.split(/\-*WebKitFormBoundary.+\-*/i).join('');
	formData = formData.split(/\n/).map(x => x.trim()).filter(x => x.length > 0);
	var data = {};
	for (var i = 0; i < formData.length; i++) {
		if (/name\=\".+\"/.test(formData[i])) {
			data[formData[i].match(/"(.+)"/)[1]] = formData[i + 1];
			i++;
		}
	}
	return data;
}
const miniapi = [
	{
		route: '/signup',
		handle: function(req, res, next) {
            req.url += '.html';
         	next();
		}
	},
	{
		route: '/forgot',
		handle: function(req, res, next) {
            req.url += '.html';
         	next();
		}
	},
	{
		route: '/recover',
		handle: function(req, res, next) {
            req.url += '.html';
         	next();
		}
	},
	{
		route: '/authorize.html?response_type=code&client_id=auth3-c2f0ebded9&scope=user.all',
		handle: function(req, res, next) {
         	next();
		}
	},
	{
		route: '/account',
		handle: function(req, res, next) {
            req.url += '.html';
         	next();
		}
	},
	{
		route: '/api/users/exists',
		handle: function(req, res, next) {
			//console.log(req);
			req.on('data', (_data) => {
				var data = parseFormData(_data);
				//console.log(data);
				//console.log(res);
				var email = data['email'];
				res.setHeader('Content-Type', 'text/json');
	        	res.writeHead(200);
				if (accounts[email]) {
					res.write(JSON.stringify({
						status: 'ok',
						email: email
					}));
				} else {
					res.write(JSON.stringify({
						status: 'error',
						message: 'Account does not exist'
					}));
				}
				res.end();
			})
		}
	},
	{
		route: '/api/users/new',
		handle: function(req, res, next) {
			//console.log(req);
			req.on('data', (_data) => {
				var data = parseFormData(_data);
				//console.log(data);
				//console.log(res);
				var recaptcha = data['g-recaptcha-response'];
				res.setHeader('Content-Type', 'text/json');
	        	res.writeHead(res.statusCode);
				if (recaptcha) {
					res.write(JSON.stringify({
						status: 'ok',
						email: 'ok'
					}));
				} else {
					res.write(JSON.stringify({
						status: 'error',
						message: 'Invalid recaptcha'
					}));
				}
				res.end();
			})
		}
	},
	{
		route: '/api/users',
		handle: function(req, res, next) {
			//console.log(req);
			req.on('data', (_data) => {
				var data = parseFormData(_data);
				//console.log(data);
				//console.log(res);
				var email = data['email'];
				if (accounts[email]) {
					var acct = JSON.parse(JSON.stringify(accounts[email]));
					delete acct.password;

					setTimeout(() => {
						res.setHeader('Content-Type', 'text/json');
	        			res.writeHead(res.statusCode);
						res.write(JSON.stringify(acct));
						res.end();
					}, 1000);
				} else {
					res.setHeader('Content-Type', 'text/json');
        			res.writeHead(404);
					res.write(JSON.stringify({
						status: 'error',
						message: 'Account does not exist'
					}));
					res.end();
				}
			})
		}
	},
	{
		route: '/api/login',
		handle: function(req, res, next) {
			req.on('data', (_data) => {
				var data = parseFormData(_data);
				//console.log(data);
				//console.log(res);
				var email = data['email'];
				var password = data['password'];
				var authcode = data['authcode'];
				res.setHeader('Content-Type', 'text/json');
				if (accounts[email]) {
					if (accounts[email].password == password) {
						setTimeout(() => {
							if (accounts[email].twofactor) {
								if (authcode && authcode.length === 6) {
									res.writeHead(200);
									res.write(JSON.stringify({
										status: 'ok',
										message: 'ok'
									}));
								} else {
					        		res.writeHead(401);
									res.write(JSON.stringify({
										status: 'error',
										message: 'Twofactor code required'
									}));
								}
								res.end();
							} else {
								res.writeHead(200);
								res.write(JSON.stringify({
									status: 'ok',
									message: 'ok'
								}));
								res.end();
							}
						}, 1000);
					} else {
						res.writeHead(401);
						res.write(JSON.stringify({
							status: 'error',
							message: 'Password is incorrect'
						}));
						res.end();
					}
				} else {
        			res.writeHead(404);
					res.write(JSON.stringify({
						status: 'error',
						message: 'Account does not exist'
					}));
					res.end();
				}
			})
		}
	}
];
module.exports = miniapi;