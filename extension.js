
const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const VIEW_TAB_ID = 'stickynotes';

let stickyNotesPaneActor;
/*
let text, button;

function _showHello() {
	if (!text) {
		text = new St.Label({ style_class: 'helloworld-label', text: "Hello, world!" });
		Main.uiGroup.add_actor(text);
	}

	text.opacity = 255;

	let monitor = Main.layoutManager.primaryMonitor;

	text.set_position(Math.floor(monitor.width / 2 - text.width / 2),
					  Math.floor(monitor.height / 2 - text.height / 2));

	Tweener.addTween(text,
					 { opacity: 0,
					   time: 2,
					   transition: 'easeOutQuad',
					   onComplete: _hideHello });
}
*/

function init() {
	stickyNotesPaneActor = new St.Bin();
	/*
	title = new St.Bin({ style_class: 'panel-button',
						  reactive: true,
						  can_focus: true,
						  x_fill: true,
						  y_fill: false,
						  track_hover: true });

	*/
}

function enable() {
	var a11yIcon = null;
	// new St.Icon({ icon_type: St.IconType.FULLCOLOR, icon_size: pxheight, icon_name: ‘[icon name, without file extension]‘ });
	Main.overview._viewSelector.addViewTab(VIEW_TAB_ID, "Sticky notes", stickyNotesPaneActor, a11yIcon);
	var note = new StickyNote();
	note.show();
}

function disable() {
	var i = 0,
		tabs = Main.overview._viewSelector._tabs;

	for (i = 0; i < tabs.length; ++i) {
		if (_tabs[i].id === VIEW_TAB_ID) {
			Main.overview._viewSelector._tabs.splice(i, 1);
			break;
		}
	}
}

const StickyNote = new Lang.Class({
	Name: 'StickyNote',

	_init: function() {
		this.visible = false;
		this.geometry = { x: 0, y: 0, w: 50, h: 50 };
		this.title = null;
		this.content = '';
		this.created = new Date();
		this.modified = new Date();
		this.cursorpos = 0;

		this._note = new St.Entry({
			text: "Foo note\nBar line",
			style_class: 'note-text',
			track_hover: true
		});
		this._btnClose = new St.Button({
			label: 'X',
			opacity: 0
		});
		this._note.connect('enter-event', Lang.bind(this, this._showCloseButton));
		this._note.connect('leave-event', Lang.bind(this, this._hideCloseButton));

		this._noteFrameActor = new St.Bin({ style_class: 'note' });
		this._noteFrameActor.set_opacity(0);

		this._noteFrameActor.add_actor(this._note);
		this._note.add_actor(this._btnClose);
		this._btnClose.set_position(100, 0);

		this._btnClose.connect('clicked', Lang.bind(this, this.destroy));
	},
	_tweenCloseButton: function(hide) {
		Tweener.addTween(this._btnClose,
						 { opacity: (hide ? 0 : 200),
						   time: 0.1,
						   transition: 'easeOutQuad' });
	},
	_showCloseButton: function() {
		this._tweenCloseButton(false);
	},
	_hideCloseButton: function() {
		this._tweenCloseButton(true);
	},

	destroy: function() {
		this.hide();
		// remove data
	},
	show: function() {
		stickyNotesPaneActor.add_actor(this._noteFrameActor);
		this._noteFrameActor.set_position(300, 300);

		this.visible = true;
		Tweener.addTween(this._noteFrameActor,
						 { opacity: 255,
						   time: 0.1,
						   transition: 'easeOutQuad' });
	},
	hide: function() {

		Tweener.addTween(this._noteFrameActor,
						 { opacity: 0,
						   time: 0.1,
						   transition: 'easeOutQuad',
						   onComplete: Lang.bind(this, function() { this.visible = false; }) });
	}
});
