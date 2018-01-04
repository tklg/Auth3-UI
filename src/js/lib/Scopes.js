// should fetch scope descriptions from server instead

export default class Scopes {
	static getDescription(scope) {
		switch (scope) {
			case 'user.all': return 'Access your full account';
			case 'user.name': return 'View your name';
			case 'user.email': return 'View your email address';
			default: return 'Unknown scope: ' + scope;
		}
	}
}