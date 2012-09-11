const Lang = imports.lang;

const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Pango = imports.gi.Pango;

const Main = imports.ui.main;
const Lightbox = imports.ui.lightbox;
const Tweener = imports.ui.tweener;

const VIEW_TAB_ID = 'stickynotes';
const ANIMATION_TIME = 0.2; // sec

let stickyNotesManager;

function init() {
	stickyNotesManager = new StickyNotesManager();
}

function enable() {

	stickyNotesManager._noteIcon = new St.Icon({icon_size: /*Main.panel._rightBox.get_height() - 2*/ 16,
												icon_name: 'view-refresh-symbolic',
												reactive: true,
												/*style_class: 'note-icon'*/ });
	stickyNotesManager._noteIcon.connect('button-press-event', Lang.bind(stickyNotesManager, stickyNotesManager.toggleShowNotes));

	Main.panel._rightBox.add(stickyNotesManager._noteIcon, { y_fill: true });
}

function disable() {
	Main.panel._rightBox.remove_actor(stickyNotesManager._noteIcon);
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
		this.actor = null;
		this._btnClose = null;
		this._fontDescription = null;
		this._titleActor = null;
		this._noteActor = null;
		this._noteFrameActor = null;

		this.actor = new Clutter.Actor({
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
			this.actor.position = position;
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
		// this.actor.add_action(dragAction);

		this.actor.connect('button-press-event', Lang.bind(this, this._startDrag));
		this.actor.connect('button-release-event', Lang.bind(this, this._endDrag));

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

		this.actor.add_actor(this._noteFrameActor);
		this.actor.add_actor(this._btnClose);
		this.actor.add_actor(resizeHandleActor);

		// Highlight the close button

		this.actor.connect('enter-event', Lang.bind(this, this._enterLeaveEvent));
		this.actor.connect('leave-event', Lang.bind(this, this._enterLeaveEvent));

	},
	_startDrag: function(actor, evt) {
		let [x, y] = evt.get_coords();
		let [res, nx, ny] = this.actor.transform_stage_point(x, y);
		this._drag_orig = {x: nx, y: ny };
		this._handlerId = this.actor.connect('motion-event', Lang.bind(this, this._drag));
		return true;
	},
	_drag: function(actor, evt) {
		let [x, y] = evt.get_coords();
		let [res, nx, ny] = this.actor.transform_stage_point(x, y);
		if (!this._drag_orig) {
			return false;
		}
		this.actor.move_by(nx - this._drag_orig.x, ny - this._drag_orig.y);
		return true;
	},
	_endDrag: function(actor, evt) {
		if (!this._drag_orig) {
			return false;
		}
		this.actor.disconnect(this._handlerId);
		delete this._handlerId;
		delete this._drag_orig;
		return true;
	},
	_enterLeaveEvent: function(act, evt, data) {
		let enter = evt.type() === Clutter.EventType.ENTER;
		Tweener.addTween(this._btnClose,
						 { opacity: (enter ? 200 : 20),
						   time: ANIMATION_TIME,
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
		this.actor.set_position(x, y);
	},
	destroy: function() {
		this.hide();
		// TODO: remove data and inform the manager
	},
	show: function() {
		Tweener.addTween(this.actor,
						 { opacity: 255,
						   time: ANIMATION_TIME,
						   transition: 'easeOutQuad' });
	},
	hide: function(cb) {
		Tweener.addTween(this.actor,
						 { opacity: 0,
						   time: ANIMATION_TIME,
						   transition: 'easeOutQuad',
						   onComplete: cb });
	}
});

const StickyNotesManager = new Lang.Class({
	Name: 'StickyNotesManager',

	_init: function() {
		this._lightbox = null;
		this._noteIcon = null;
		this.notes = [];
		this.notesHidden = true;
		this.actor = null;
		this.pos_x = 20;

		this._lightbox = new Lightbox.Lightbox(global.window_group,
											   { inhibitEvents: true,
												 fadeInTime: ANIMATION_TIME,
												 fadeOutTime: ANIMATION_TIME,
												 fadeFactor: 0.2
											   });

		let layoutManager = new Clutter.BinLayout({
			x_align: Clutter.BinAlignment.FIXED,
			y_align: Clutter.BinAlignment.FIXED
		});
		this.actor = new Clutter.Actor({
			//layout_manager: layoutManager,
			//reactive: true,
			opacity: 0
		});

		// TODO: remove and always have one empty note (like GS default virtual desktop configuration)
		let btnAdd = new St.Button({
			label: '+',
			z_position: 1,
			x: 10,
			y: 10
		});
		btnAdd.connect('clicked', Lang.bind(this, this.createNote));
		this.actor.add_actor(btnAdd);

		this.createNote();

		Main.uiGroup.add_actor(this.actor);
	},

	toggleShowNotes: function() {
		Tweener.addTween(this.actor,
						 { opacity: (this.notesHidden ? 255 : 0),
						   time: ANIMATION_TIME,
						   transition: 'easeOutQuad' });
		if (this.notesHidden) {
			this._lightbox.show();
		} else {
			this._lightbox.hide();
		}
		this.notesHidden = !this.notesHidden;
	},
	addNote: function(note) {
		this.actor.add_actor(note.actor);
		note.show();
	},
	removeNote: function(note) {
		note.hide(Lang.bind(this, function() {
			this.actor.remove_actor(note.actor);
			this._grabHelper.removeActor(note.actor);
		}));
	},
	createNote: function() {
		let note = new StickyNote();
		note.setPosition(this.pos_x, 0);
		this.pos_x += 340;
		this.notes.push(note);
		this.addNote(note);
	}
});
