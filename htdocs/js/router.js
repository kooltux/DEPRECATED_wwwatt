define([
	'jquery',
	'can',
	'underscore',
	'app',
	'controllers/pages',
], function($, can, _, App, Pages) {

	var Router = can.Control({
		init: function() {
			this.pages=new Pages('#pages');
		},

		// routes
		'route': 'index',
		':pageid route': 'dispatch',

		// actions
		index: function() {
			this.pages.index({
				fade: false
			});
		},

		dispatch: function(data) {
			if (this.pages[data.pageid]) {
				this.pages[data.pageid]();
			}
			else {
				this.pages.notfound();
			}
		}
	});

	return {
		init: function() {
			// route on document ready
			$(function() {
				// pause routing until instantiated
				// otherwise, router must be instantiated before domready
				can.route.ready(false);

				// init router
				new Router(document);

				can.route.bind('change',function(ev, attr, how, newVal, oldVal) {
					if (how === 'set') App.updateMenu();
				});

				// activate routing
				can.route.ready(true);
			});
		}
	};
});
