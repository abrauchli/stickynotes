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
		this._noteFrameActor = new St.Bin({
			style_class: 'note'
		});

		this._fontDescription = new Pango.FontDescription();
		this._fontDescription.set_family('Sans');
		this._fontDescription.set_size(12 * Pango.SCALE);
		this._fontDescription.set_weight(Pango.Weight.BOLD);
		this._noteActor = new St.Entry({
			text: "Foo note\nBar line"
		});
		let clutter_text = this._noteActor.clutter_text;
		clutter_text.set_single_line_mode(false);
		clutter_text.set_font_description(this._fontDescription);
		/*
		this._noteActor = new Clutter.Text({
			activatable: false,
			cursor_size: 10,
			editable: true,
			font_description: this._fontDescription,
			line_wrap: true,
			single_line_mode: false,
			text: "Foo note\nBar line"
		});
		*/
		// this._noteActor.connect('button-release-event', function(act,evt) {
		// 	act.grab_key_focus();
		// });

		this._btnClose = new St.Button({
			constraints: new Clutter.AlignConstraint(this.widget, Clutter.AlignAxis.X_AXIS, 1.0),
			label: 'X',
			opacity: 20,
			margin_top: 5.0,
			margin_right: 5.0,
			//x_expand: true,
			//x_align: St.Align.END,
			z_position: 1
		});
		this._btnClose.add_constraint(new Clutter.AlignConstraint(this.widget, Clutter.AlignAxis.Y_AXIS, 0.0));
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
		if (enter) {
			global.stage.set_key_focus(null);
		}
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
