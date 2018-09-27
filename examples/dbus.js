const dbus = require('dbus-native');

exports.systemBus = dbus.systemBus();
exports.sessionBus = dbus.sessionBus();
