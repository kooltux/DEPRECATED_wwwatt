define([
	'jquery',
	'can',
	'underscore'
], function($, can, _) {
	return {
		init: function(options) {
			options = options || {};
			
			this.initOverrides(options);
			this.initErrorHandler(options);
		},

		initOverrides: function(options) {
			$.ajaxSetup({ cache: false });

			var self=this;
			$(function() { self.updateMenu(); });
		},

		initErrorHandler: function(options) {
			window.onerror = function(msg, url, line) {
				console.error(msg, url, line);
				return false;
			};
		},

		updateMenu: function() {
			this._updateMenu('#menu ul.nav li');
			//this._updateMenu('section.sidebar ul.nav li');
		},
        _updateMenu: function(selector) {
		  	var activated = false;
			var el = selector instanceof $ ? selector : $(selector);
			var hash = _.ltrim(window.location.hash, '#!');
			el.removeClass('active');
			el.each(function() {
				var url = _.ltrim($('a', this).attr('href'), '#!');
				if (hash === url) {
					$(this).addClass('active'); //.siblings().removeClass('active');
					activated = true;
					return false;
				}
			});
		}
	};
});
