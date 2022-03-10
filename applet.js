const {YnabApi} = require('./ynab_api');
const { spawnCommandLine } = imports.misc.util;

const Applet = imports.ui.applet;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Settings = imports.ui.settings;
const UUID = "ynab@kogs";
const APPLET_PATH = imports.ui.appletManager.appletMeta[UUID].path;


function YnabApplet(orientation, panel_height, instance_id) {
    this._init(orientation, panel_height, instance_id);
}

YnabApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(orientation, panel_height, instance_id) {        
        Applet.TextIconApplet.prototype._init.call(this, orientation, panel_height, instance_id);

        this.set_applet_icon_path(APPLET_PATH + "/icon.png");
        this.set_applet_tooltip(_("YNAB"));
        this.set_applet_label('');
        this.connected = false;    
        this.orientation = orientation;
        this.instance_id = instance_id;
        this.preferences = {};
        this.budgets = [];
        
        try {
            this.bindPrefs();
            this.connectToApi();
        } catch(e) {
            global.logError('YNAB failed to load', e);
            this.setErrorState(' Could not connect');
        }
    },

    on_applet_clicked: function() {
        this.menu.toggle();
    },

    bindPrefs: function() {
        this.settings = new Settings.AppletSettings(this.preferences, UUID, this.instance_id);
        this.settings.bindProperty(Settings.BindingDirection.IN, "apiKey", "apiKey", this.onApiKeyChanged.bind(this), null);
        this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "budgetKey", "budgetKey", this.onBudgetChanged.bind(this), null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "updateFrequency", "updateFrequency", this.onUpdateFrequencyChanged.bind(this), null);
    },

    connectToApi: function() {
        if(this.preferences.apiKey) {
            this.api = new YnabApi();
            this.api.connect(this.preferences).then(budgets => {
                this.budgets = budgets;
                
                this.setOkayState();
                this.createPopupMenu();
                this.setAlerts();
                this._update_loop();
            });
        } else {
            this.setErrorState(' API Key Needed');
        }
    },

    setOkayState: function() {
        this.set_applet_icon_path(APPLET_PATH + "/icon.png");
        this.set_applet_label('');
    },

    setAlertState: function(message) {
        this.set_applet_icon_path(APPLET_PATH + "/icon_alert.png");
        this.set_applet_label(message);
    },

    setErrorState: function(message) {
        this.set_applet_icon_path(APPLET_PATH + "/icon_message.png");
        this.set_applet_label(message);
    },

    onApiKeyChanged: function(apiKey) {
        this.connectToApi();
    },

    onBudgetChanged: function() {
        this.setAlerts();
    },

    onUpdateFrequencyChanged: function() {
        // will automatically be picked up by the loop
    },

    createPopupMenu: function() {

        if(!this.menuManager) {
            // Create the popup menu
            this.menuManager = new PopupMenu.PopupMenuManager(this);
            this.menu = new Applet.AppletPopupMenu(this, this.orientation);
            this.menuManager.addMenu(this.menu);

            this._contentSection = new PopupMenu.PopupMenuSection();
            this.menu.addMenuItem(this._contentSection);

            let item = new PopupMenu.PopupIconMenuItem("Refresh", "refresh", St.IconType.FULLCOLOR);
            item.connect('activate', Lang.bind(this, () => {
                this.setAlerts();
            }));
            this.menu.addMenuItem(item);

            let item2 = new PopupMenu.PopupIconMenuItem("Open YNAB", "open", St.IconType.FULLCOLOR);
            item2.connect('activate', Lang.bind(this, () => {
                const command = "xdg-open ";
                spawnCommandLine(command + "https://app.youneedabudget.com");
            }));
            this.menu.addMenuItem(item2);
        }

        if(this.budgets.length && !this.hasSubMenu) {
            this.menu.addMenuItem(this.createBudgetSubmenu());
        }
        
    },

    createBudgetSubmenu: function() {
        this.hasSubMenu = true;
        let submenu = new PopupMenu.PopupSubMenuMenuItem("Select Budget", "icon 1", St.IconType.FULLCOLOR);

        this.budgets.forEach(budget => {
            let item = new PopupMenu.PopupIconMenuItem(budget.name, "icon 1", St.IconType.FULLCOLOR);

            item.connect('activate', Lang.bind(this, () => {
                this.selectBudget(budget.id);
    
            }));
            submenu.menu.addMenuItem(item);
        });

        return submenu;
    },

    selectBudget: function(budgetKey) {
        global.log('selecting budget', budgetKey);
        this.preferences.budgetKey = budgetKey;
    },

    setAlerts: function() {
        global.log('getting alerts', this.preferences.budgetKey);
        if(this.preferences.budgetKey) {
            this.api.getAlerts().then((transactions) => {
                global.log('Got alerts', transactions);
                const numUnapproved = transactions.unapproved?.length;
                if(transactions.unapproved?.length) {
                    this.setAlertState(` ${numUnapproved} to approve`);
                } else {
                    this.setOkayState();
                }
            });
        }
    },

    /************************* LOOP */
    on_applet_removed_from_panel: function () {
        // stop the loop when the applet is removed
        if (this._updateLoopID) {
            Mainloop.source_remove(this._updateLoopID);
        }
    
    },
    
    _update_loop: function () {
        if(this.budgets.length) { this.setAlerts(); }
        this._updateLoopID = Mainloop.timeout_add(this.preferences.updateFrequency * 1000, Lang.bind(this, this._update_loop));
    }
};

function main(metadata, orientation, panel_height, instance_id) {
    return new YnabApplet(orientation, panel_height, instance_id);
}
