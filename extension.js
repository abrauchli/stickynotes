
const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const VIEW_TAB_ID = 'stickynotes';

let stickyNotesManager;

function init() {
	stickyNotesManager = new StickyNotesManager();
}

function enable() {
	var a11yIcon = null;
	// new St.Icon({ icon_type: St.IconType.FULLCOLOR, icon_size: pxheight, icon_name: ‘[icon name, without file extension]‘ });
	Main.overview._viewSelector.addViewTab(VIEW_TAB_ID, "Sticky notes", stickyNotesManager.paneActor, a11yIcon);
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
		this.locked = false;
		this.geometry = { x: 0, y: 0, w: 50, h: 50 };
		this.title = null;
		this.content = '';
		this.font = null;
		this.fontColor = null;
		this.color = null;

		let layoutManager = new Clutter.BinLayout({
			x_align: Clutter.BinAlignment.FIXED,
			y_align: Clutter.BinAlignment.FIXED
		});
		this.widget = new Clutter.Actor();
		this.widget.set_layout_manager(layoutManager);
		this.widget.set_opacity(0);
		this._noteFrameActor = new St.Bin({ style_class: 'note' });

		this._noteActor = new St.Entry({
			text: "Foo note\nBar line",
			style_class: 'note-text',
			track_hover: true
		});
		this._noteActor.get_clutter_text().set_single_line_mode(false);

		this._btnClose = new St.Button({
			label: 'X',
			opacity: 20,
			margin_top: 5.0,
			margin_right: 5.0,
			x_expand: true,
			x_align: St.Align.END
		});
		this._btnClose.connect('clicked', Lang.bind(this, this.destroy));
		this._noteActor.connect('notify::hover', Lang.bind(this, this._tweenCloseButton));

		this._noteFrameActor.add_actor(this._noteActor);
		this.widget.add_actor(this._noteFrameActor);
		this.widget.add_actor(this._btnClose);

	},
	_tweenCloseButton: function() {
		Tweener.addTween(this._btnClose,
						 { opacity: (this._noteActor.hover ? 200 : 20),
						   time: 0.1,
						   transition: 'easeOutQuad' });
	},

	setPosition: function(x, y) {
		this.widget.set_position(x, y);
	},
	destroy: function() {
		this.hide();
		// TODO: remove data and inform the manager
	},
	show: function() {
		Tweener.addTween(this.widget,
						 { opacity: 255,
						   time: 0.1,
						   transition: 'easeOutQuad' });
	},
	hide: function(cb) {
		Tweener.addTween(this.widget,
						 { opacity: 0,
						   time: 0.1,
						   transition: 'easeOutQuad',
						   onComplete: cb });
	}
});

const StickyNotesManager = new Lang.Class({
	Name: 'StickyNotesManager',

	_init: function(stickyNotesPaneActor) {
		this.paneActor = new St.Bin();
		this.notes = [];

		this.createNote();
	},

	addNote: function(note) {
		this.paneActor.add_actor(note.widget);
		note.setPosition(300, 300);
		note.show();
	},
	removeNote: function(note) {
		note.hide(
			Lang.bind(this,
				function() { this.paneActor.remove_actor(note.widget); })
		);
	},
	createNote: function() {
		let note = new StickyNote();
		this.notes.push(note);
		this.addNote(note);
	}
});
