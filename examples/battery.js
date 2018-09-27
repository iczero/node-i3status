const { Block } = require('node-i3status');
const { systemBus } = require('./dbus.js');
const { promisify } = require('util');
const chroma = require('chroma-js');

/** A block displaying battery percentages */
class BatteryBlock extends Block {
  /**
   * The construtor
   * @param {Object} [opts]
   * @param {String} [opts.device] The device to report, or first battery if not specified
   * @param {Number} [opts.updateInterval] Amount of time between updates in ms
   * @param {Number} [opts.expandTimeout] Amount of time before collapsing expanded display
   * @param {String[]} [opts.colorScale] Scale of colors from empty to full
   * @param {String} [opts.colorMode] Mode of scaling the colors (see chroma.js docs)
   * @param {Object} [opts.blockOptions] Additional options to pass to the block
   */
  constructor(opts) {
    super('battery');
    if (!opts) opts = {};
    opts = Object.assign({
      device: 'battery_BAT0',
      updateInterval: 30000,
      expandTimeout: 5000,
      colorScale: ['#ff0000', '#ffff00', '#00ff00'],
      colorScaleMode: 'lab',
      blockOptions: {
        separator_block_width: 15
      }
    }, opts);
    this.opts = opts;
    this.iface = null;

    this.interval = setInterval(() => this.update(), this.opts.updateInterval);
    this.expandTimeout = null;
    this.on('mouse-RIGHT', () => this.updateAndResetInterval());
    this.on('mouse-LEFT', () => this._setExpanded());
    this._data = null;
    this.colorScale = chroma
    .scale(this.opts.colorScale)
    .mode(this.opts.colorScaleMode)
    .domain([0, 100]);

    this._initIface();
  }
  /** Update the display and re-set the interval */
  updateAndResetInterval() {
    this.update();
    clearInterval(this.interval);
    this.interval = setInterval(() => this.update(), this.opts.updateInterval);
  }
  /** Open expanded view */
  _setExpanded() {
    this.expandedDisplay = true;
    this.updateAndResetInterval();
    if (this.expandTimeout) clearTimeout(this.expandTimeout);
    this.expandTimeout = setTimeout(() => this._closeExpanded(), this.opts.expandTimeout);
  }
  /** Close expanded view */
  _closeExpanded() {
    this.expandedDisplay = false;
    this.expandTimeout = null;
    this.update();
  }
  /** Initialize the dbus connection */
  _initIface() {
    systemBus
    .getService('org.freedesktop.UPower')
    .getInterface(
      '/org/freedesktop/UPower/devices/' + this.opts.device,
      'org.freedesktop.UPower.Device',
      (err, iface) => {
        if (err) return this.emit('error', err);
        this.iface = iface;
        this.update();
      }
    );
  }
  /**
   * Apply blockOptions to display
   * @param {Object} obj Block display object
   * @return {Object}
   */
  applyOptions(obj) {
    return Object.assign({}, this.opts.blockOptions, obj);
  }
  /**
   * The render function
   * @return {Object}
   */
  render() {
    if (!this._data) {
      return this.applyOptions({
        full_text: 'BAT N/A'
      });
    }
    let display = [];
    switch (this._data.State) {
      case 0: {
        display.push('UNK');
        display.push(this.formatPercentage(this._data.Percentage));
        break;
      }
      case 1: {
        display.push('CHR');
        display.push(this.formatPercentage(this._data.Percentage));
        display.push(this.formatTime(this._data.TimeToFull));
        break;
      }
      case 2: {
        display.push('BAT');
        display.push(this.formatPercentage(this._data.Percentage));
        display.push(this.formatTime(this._data.TimeToEmpty));
        break;
      }
      case 3: {
        display.push('EMPTY');
        display.push(this.formatPercentage(this._data.Percentage));
        break;
      }
      case 4: {
        display.push('FULL');
        display.push(this.formatPercentage(this._data.Percentage));
        break;
      }
    }
    if (this.expandedDisplay) {
      display.push(this._data.Voltage + 'V');
    }
    return this.applyOptions({
      full_text: display.join(' '),
      color: this.colorScale(this._data.Percentage).hex()
    });
  }
  /** Schedule an update */
  async update() {
    this._data = {};
    let promises = [];
    for (let property of ['Percentage', 'TimeToFull', 'TimeToEmpty', 'State', 'Voltage']) {
      promises.push(
        promisify(this.iface[property])()
        .then(a => this._data[property] = a)
        .catch(err => this.emit('error', err))
      );
    }
    await Promise.all(promises);
    super.update();
  }
  /**
   * Format a decimal into a percentage
   * @param {Number} n Number to format
   * @return {String}
   */
  formatPercentage(n) {
    return Math.round(n).toString().padStart(3, ' ') + '%';
  }
  /**
   * Format a time number given from UPower
   * @param {Number} n
   * @return {String}
   */
  formatTime(n) {
    let hours = Math.floor(n / 3600);
    let minutes = Math.floor((n % 3600) / 60);
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0')
    ].join(':');
  }
}

module.exports = BatteryBlock;
