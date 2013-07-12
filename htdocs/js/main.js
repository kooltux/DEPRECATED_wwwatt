/* compute base url from current path
var scripts = document.getElementsByTagName('script');
var src = scripts[scripts.length - 1].src;
var baseUrl = src.substring(src.indexOf(document.location.pathname), src.lastIndexOf('/'));
*/

// Require.js allows us to configure shortcut alias
var libUrl="/lib/"; // production mode
//var libUrl="/libdbg/"; // development mode

require.config({
	baseUrl: "/js",
	paths: {
		jquery: 		libUrl+"jquery-2.0.3",
		underscore: libUrl+"underscore-1.4.4",
		underscorestring: libUrl+"underscore.string-20130705",
		can: 			libUrl+"can-1.1.6",
		bootstrap: 	libUrl+"bootstrap-2.3.2",
		highstock: 	libUrl+"highstock-1.3.2",
		d3:			libUrl+"d3-3.2.4",

		socketio: '/socket.io/socket.io'
	},

	// The shim config allows us to configure dependencies for
	// scripts that do not call define() to register a module
	shim: {
		underscore: {
			exports: '_'
		},
		underscorestring: ['underscore'],
		can: {
			deps: ['jquery'],
			exports: 'can'
		},
		bootstrap: ['jquery'],
		highstock: ['jquery'],
		d3: {
			exports: 'd3'
		},
		socketio: {
			exports: 'io'
		},

		// app base deps
		app: ['bootstrap']
	}
});

require([
	'app',
	'config',
	'router',
	'underscore',
	'underscorestring'
], function(App, Config, Router,_) {
	// merge _.str into _
	_.mixin(_.str.exports());

	// init app
	App.init(Config);

	// init router
	Router.init();
});


