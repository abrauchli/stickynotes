const Lang = imports.lang;

const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Pango = imports.gi.Pango;

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
		this.size = {width: 300, height: 300};
		this.title = null;
		this.content = '';
		this.font = null;
		this.fontColor = null;
		this.color = null;

		this.widget = new Clutter.Actor({
			layout_manager: new Clutter.BinLayout({
				x_align: Clutter.BinAlignment.START,
				y_align: Clutter.BinAlignment.START
			}),
			opacity: 0,
			reactive: true,
			width: this.size.width,
			height: this.size.height
		});
		if (this.position) {
			this.widget.position = position;
		}

		let titleFontDescription = new Pango.FontDescription();
		titleFontDescription.set_family('Sans');
		titleFontDescription.set_size(16 * Pango.SCALE);
		titleFontDescription.set_weight(Pango.Weight.ULTRABOLD);
		this._titleActor = new St.Entry({
			text: "2012-08-28",
			x_align: Clutter.ActorAlign.CENTER
		});
		let title_text = this._titleActor.clutter_text;
		title_text.set_font_description(titleFontDescription);

		this._fontDescription = new Pango.FontDescription();
		this._fontDescription.set_family('Sans');
		this._fontDescription.set_size(12 * Pango.SCALE);
		this._fontDescription.set_weight(Pango.Weight.BOLD);
		this._noteActor = new St.Entry({
			stylable: false,
			text: "Foo note\nBar line",
			x_expand: true,
			y_expand: true
		});
		let note_text = this._noteActor.clutter_text;
		// note_text.set_background_color(new Clutter.Color({ red: 236, green: 248, blue: 51, alpha: 230 }));
		note_text.set_color(new Clutter.Color({ red: 0, green: 0, blue: 0, alpha: 255 }));
		note_text.set_single_line_mode(false);
		note_text.set_line_wrap(true);
		note_text.set_font_description(this._fontDescription);
		note_text.set_margin(new Clutter.Margin({ left: 5, right: 5, top: 5, bottom: 5 }));
		note_text.set_x_expand(true);
		note_text.set_y_expand(true);
		note_text.connect('key-press-event', Lang.bind(this, this._noteKeyPress));

		this._noteFrameActor = new St.BoxLayout({
			//style_class: 'note',
			vertical: true,
			x_expand: true,
			y_expand: true
		});
		this._noteFrameActor.set_background_color(new Clutter.Color({ red: 236, green: 248, blue: 51, alpha: 230 }));
		this._noteFrameActor.add_actor(this._titleActor);
		this._noteFrameActor.add_actor(this._noteActor);
		this._btnClose = new St.Button({
			margin_top: 5.0,
			margin_right: 5.0,
			opacity: 20,
			style_class: 'window-close'
		});
		this._btnClose.add_constraint(new Clutter.AlignConstraint({
			factor: 1.0,
			source: this._noteFrameActor
		}));
		this._btnClose.connect('clicked', Lang.bind(this, this.destroy));

		// Moving the note

		// This doesn't work unfortunately
		// let dragAction = new Clutter.DragAction();
		// this.widget.add_action(dragAction);

		this.widget.connect('button-press-event', Lang.bind(this, this._startDrag));
		this.widget.connect('button-release-event', Lang.bind(this, this._endDrag));

		// Resizing the note

		let resizeHandleActor = new Clutter.Actor({
			background_color: new Clutter.Color({ red: 0, green: 0, blue: 0, alpha: 230 }),
			height: 20,
			width: 20
		});
		let resizeDragAction = new Clutter.DragAction();
		resizeHandleActor.add_action(resizeDragAction);
		resizeHandleActor.add_constraint(new Clutter.AlignConstraint({
			align_axis: Clutter.AlignAxis.BOTH,
			factor: 1.0,
			source: this._noteFrameActor
		}));

		this.widget.add_actor(this._noteFrameActor);
		this.widget.add_actor(this._btnClose);
		this.widget.add_actor(resizeHandleActor);

		// Highlight the close button

		this.widget.connect('enter-event', Lang.bind(this, this._enterLeaveEvent));
		this.widget.connect('leave-event', Lang.bind(this, this._enterLeaveEvent));

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
	_enterLeaveEvent: function(act, evt, data) {
		let enter = evt.type() === Clutter.EventType.ENTER;
		Tweener.addTween(this._btnClose,
						 { opacity: (enter ? 200 : 20),
						   time: 0.1,
						   transition: 'easeOutQuad' });
		if (!enter) {
			global.stage.set_key_focus(null);
		}
	},
	_noteKeyPress: function(act, evt, data) {
		let sym = evt.get_key_symbol();
		if (sym == Clutter.Return || sym == Clutter.KP_Enter) {
			act.insert_unichar('\n');
			return true;
		}
		return false;
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

	_init: function() {
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
		this.pos_x += 340;
		this.notes.push(note);
		this.addNote(note);
	}
});
