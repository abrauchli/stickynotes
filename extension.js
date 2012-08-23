
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
	stickyNotesPaneActor = new St.Bin({ //x_align: St.Align.START,
				 //y_align: St.Align.START,
				 x_fill: true,
				 y_fill: true,
				 style_class: 'view-tab-page' });
	/*
	title = new St.Bin({ style_class: 'panel-button',
						  reactive: true,
						  can_focus: true,
						  x_fill: true,
						  y_fill: false,
						  track_hover: true });

	*/
	//button.set_child(icon);
	//button.connect('button-press-event', _showHello);
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
			text: "Foo note\nBar line"
		});
		this._btnClose = new St.Button({
			label: 'X'
		});
		this._noteActor = new Clutter.Actor();
		this._noteActor.set_opacity(0);

		this._noteActor.add_actor(this._note, {});
		this._noteActor.add_actor(this._btnClose, {});
		this._note.set_position(0, 20);
		this._btnClose.set_position(50, 0);

		this._btnClose.connect('clicked', Lang.bind(this, this.destroy));
	},

	destroy: function() {
		this.hide();
		// remove data
	},
	show: function() {
		stickyNotesPaneActor.add_actor(this._noteActor);
		stickyNotesPaneActor.set_position(300, 300);

		this.visible = true;
		Tweener.addTween(this._noteActor,
						 { opacity: 255,
						   time: 0.1,
						   transition: 'easeOutQuad' });
	},
	hide: function() {

		Tweener.addTween(this._noteActor,
						 { opacity: 0,
						   time: 0.1,
						   transition: 'easeOutQuad',
						   onComplete: Lang.bind(this, function() { this.visible = false; }) });
	}
});
