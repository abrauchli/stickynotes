
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
		this.position = null;
		this.size = {width: 100, height: 100};
		this.title = null;
		this.content = '';
		this.font = null;
		this.fontColor = null;
		this.color = null;

		this.widget = new Clutter.Actor({
			opacity: 0,
			reactive: true,
			width: this.size.width,
			height: this.size.height
		});
		if (this.position) {
			this.widget.position = position;
		}
		this._noteFrameActor = new St.Bin({ style_class: 'note' });

		this._noteActor = new St.Entry({
			text: "Foo note\nBar line",
			style_class: 'note-text'
		});
		this._noteActor.get_clutter_text().set_single_line_mode(false);

		this._btnClose = new St.Button({
			label: 'X',
			opacity: 20,
			margin_top: 5.0,
			margin_right: 5.0,
			//x_expand: true,
			x_align: St.Align.END,
			z_position: 1
		});
		this._btnClose.connect('clicked', Lang.bind(this, this.destroy));

		this._noteFrameActor.add_actor(this._noteActor);
		this.widget.add_actor(this._noteFrameActor);
		this.widget.add_actor(this._btnClose);

		// Moving the note

		// This doesn't work unfortunately
		// let dragAction = new Clutter.DragAction();
		// this.widget.add_action(dragAction);

		this.widget.connect('button-press-event', Lang.bind(this, this._startDrag));
		this.widget.connect('button-release-event', Lang.bind(this, this._endDrag));
		this.widget.connect('enter-event', Lang.bind(this, this._tweenCloseButton));
		this.widget.connect('leave-event', Lang.bind(this, this._tweenCloseButton));

	},
	_startDrag: function(actor, evt) {
		let [x, y] = evt.get_coords();
		let [res, nx, ny] = this.widget.transform_stage_point(x, y);
		this._drag_orig = {x: nx, y: ny };
		this._handlerId = this.widget.connect('motion-event', Lang.bind(this, this._drag));
		return true;
	},
	_drag: function(actor, evt) {
		let [x, y] = evt.get_coords();
		let [res, nx, ny] = this.widget.transform_stage_point(x, y);
		if (!this._drag_orig) {
			return false;
		}
		this.widget.move_by(nx - this._drag_orig.x, ny - this._drag_orig.y);
		return true;
	},
	_endDrag: function(actor, evt) {
		if (!this._drag_orig) {
			return false;
		}
		this.widget.disconnect(this._handlerId);
		delete this._handlerId;
		delete this._drag_orig;
		return true;
	},
	_tweenCloseButton: function(act, evt, data) {
		Tweener.addTween(this._btnClose,
						 { opacity: (evt.type() === Clutter.EventType.ENTER ? 200 : 20),
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
		let layoutManager = new Clutter.BinLayout({
			x_align: Clutter.BinAlignment.FIXED,
			y_align: Clutter.BinAlignment.FIXED
		});
		this.paneActor = new Clutter.Actor({
			//layout_manager: layoutManager,
			//reactive: true
		});

		this.notes = [];
		this.pos_x = 20;

		let btnAdd = new St.Button({
			label: '+',
			z_position: 1,
			x: 10,
			y: 10
		});
		btnAdd.connect('clicked', Lang.bind(this, this.createNote));
		this.paneActor.add_actor(btnAdd);

		this.createNote();
	},

	addNote: function(note) {
		//Main.uiGroup.add_actor(note.widget); // add directly to screen
		this.paneActor.add_actor(note.widget);
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
		note.setPosition(this.pos_x, 0);
		this.pos_x += 140;
		this.notes.push(note);
		this.addNote(note);
	}
});
