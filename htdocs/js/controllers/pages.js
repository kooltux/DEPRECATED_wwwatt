/**
 * Controller to manage static pages
 */
define([
	'require',
	'jquery',
	'underscore',
	'can',
	'app'
], function(require,$, _, can, App) {
	return can.Control.extend(
		{
			fade: 'slow'
		},
		{
			init: function(element, options) {
			},

			_loadView: function(url, opts, cb) {
				if (typeof opts == 'function') {
					cb=opts;
					opts={};
				}

				opts=_.extend({
					fade: this.constructor.fade,
					data: {}
				},opts||{});

				var frag=can.view('/js/views/'+url,opts.data);
				var el=opts.selector ? this.element.find(opts.selector) : this.element;

				// insert a div containing the whole view
				el.empty();
				var subdiv=$('<div/>').appendTo(el);

				if (opts.fade)
					subdiv.hide().html(frag).fadeIn(opts.fade);
				else
					subdiv.html(frag);

				if (cb) cb(subdiv);
			},


			// actions
			index: function(data) {
				this._loadView('pages/index.html',{ fade: false });
			},
			notfound: function(data) {
				this._loadView('pages/notfound.html',{ fade: false });
			},
			measures: function(data) {
				var self=this;
				this._loadView('pages/measures.html',function(subdiv) {
					require(['views/pages/measures'],function(Measures) {
						new Measures(subdiv);
					});
				});
			},
			config: function(data) {
				this._loadView('pages/config.html');
			},

			help: function(data) {
				this._loadView('pages/help.html');
			},

			about: function(data) {
				this._loadView('pages/about.html');
			}
		}
	);
});
