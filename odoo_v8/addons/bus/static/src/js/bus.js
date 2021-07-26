document.addEventListener('DOMContentLoaded', function () {
    if (Notification.permission !== "granted")
        Notification.requestPermission();
});

function notificar(user_id, tittle, notification, url) {
    if (!Notification) {
        alert('Las notificaciones de escritorio no estan disponibles para su navegador.');
        return;
    }

    if (Notification.permission !== "granted")
        Notification.requestPermission();
    else {
        var notification = new Notification(tittle, {
            icon: 'http://www.avancys.com/web/binary/company_logo?db=avancys&company=1',
            body: notification,
            requireInteraction: 1,
        });
        notification.onclick = function () {
        window.open(url);
        notification.close();
        };
    }
}

var instance = openerp;

(function() {
    var bus = openerp.bus = {};

    bus.ERROR_DELAY = 10000;

    bus.Bus = openerp.Widget.extend({
        init: function(){
            this._super();
            this.options = {};
            this.activated = false;
            this.channels = [];
            this.last = 0;
            this.stop = false;
        },
        start_polling: function(){
            if(!this.activated){
                this.poll();
                this.stop = false;
            }
        },
        stop_polling: function(){
            this.activated = false;
            this.stop = true;
            this.channels = [];
        },
        poll: function() {
            var self = this;
            self.activated = true;
            var data = {'channels': self.channels, 'last': self.last, 'options' : self.options};


            openerp.session.rpc('/longpolling/poll', data, {shadow : true}).then(function(result) {

//              Desktop notifications Avancys

                new instance.web.Model("avancys.notification")
                .call("get_notifications").then(function (result) {

                    for (i=0; i < result.length; i++){
                        var msj = 'Hay un mensaje pendiente desde: ' + result[i]["date"] + '\n para el usuario ' + result[i]["user_id"]
                        var user_id = result[i]["user_id"];
                        var notification = result[i]["notification"];
                        var url = result[i]["url"]
                        var tittle = result[i]["tittle"]
                        notificar(user_id, tittle, notification, url);
                    };
                });

                _.each(result, _.bind(self.on_notification, self));
                if(!self.stop){
                    self.poll();
                }
            }, function(unused, e) {
                // no error popup if request is interrupted or fails for any reason
                e.preventDefault();
                // random delay to avoid massive longpolling
                setTimeout(_.bind(self.poll, self), bus.ERROR_DELAY + (Math.floor((Math.random()*20)+1)*1000));
            });
        },
        on_notification: function(notification) {
            if (notification.id > this.last) {
                this.last = notification.id;
            }
            this.trigger("notification", [notification.channel, notification.message]);
        },
        add_channel: function(channel){
            if(!_.contains(this.channels, channel)){
                this.channels.push(channel);
            }
        },
        delete_channel: function(channel){
            this.channels = _.without(this.channels, channel);
        },
    });

    // singleton
    bus.bus = new bus.Bus();
    return bus;
})();
