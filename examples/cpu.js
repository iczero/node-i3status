const { Block } = require('node-i3status');
const os = require('os');

/** CPU usage display */
class CpuBlock extends Block {
  /**
   * The constructor
   * @param {Object} [opts]
   * @param {String} [opts.label] Label for the block
   * @param {Number} [opts.updateInterval] Time (in ms) for each update
   * @param {Number} [opts.expandTimeout] Time (in ms) to keep expanded view open
   * @param {Number} [opts.highlightThreshold] Threshold at which to highlight
   * @param {String} [opts.highlightColor] Color which to highlight high cpu usages
   * @param {Object} [opts.blockOptions] Additional options to pass to the block
   */
  constructor(opts) {
    super('cpu');
    if (!opts) opts = {};
    opts = Object.assign({
      label: 'CPU',
      updateInterval: 2000,
      expandTimeout: 5000,
      highlightThreshold: 0.9,
      highlightColor: '#ffff00',
      blockOptions: {
        separator_block_width: 15
      }
    }, opts);
    this.opts = opts;
    this.expandedDisplay = false;
    this.prevCpus = os.cpus();

    this.interval = setInterval(() => this.update(), this.opts.updateInterval);
    this.expandTimeout = null;
    this.on('mouse-RIGHT', () => this.updateAndResetInterval());
    this.on('mouse-LEFT', () => this._setExpanded());
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
  /**
   * Apply blockOptions to display
   * @param {Object} obj Block display object
   * @return {Object}
   */
  applyOptions(obj) {
    return Object.assign({}, this.opts.blockOptions, obj);
  }
  /**
   * Render method
   * @return {String}
   */
  render() {
    let c = os.cpus();
    let usage = this.getUsage(c, this.prevCpus);
    let average = this.getAverageUsage(usage);
    this.prevCpus = c;
    if (average !== average) average = 0;
    if (this.expandedDisplay) {
      let display = [];
      display.push(this.opts.label);
      for (let i = 0; i < usage.length; i++) {
        display.push(`#${i}: ${this.format(1 - usage[i].idle)}`);
      }
      return this.applyOptions({
        full_text: display.join(' ')
      });
    } else {
      return this.applyOptions({
        full_text: `${this.opts.label} ${this.format(average)}`,
        color: (average > this.opts.highlightThreshold) ? this.opts.highlightColor : '#ffffff'
      });
    }
  }
  /**
   * Get percentages from os.cpus()
   * @param {Object} cpus os.cpus() result
   * @param {Object} prevCpus Previous os.cpus() result
   * @return {Object} Object with percentages for each cpu and each type
   */
  getUsage(cpus, prevCpus) {
    let ret = [];
    for (let i = 0; i < cpus.length; i++) {
      let cpu = cpus[i];
      let prev = prevCpus[i];
      let result = {};
      let total = Object.values(cpu.times).reduce((a, v) => a + v);
      let prevTotal = Object.values(prev.times).reduce((a, v) => a + v);
      for (let [type, val] of Object.entries(cpu.times)) {
        result[type] = (val - prev.times[type]) / (total - prevTotal);
      }
      ret.push(result);
    }
    return ret;
  }
  /**
   * Get average cpu percent from getUsage output
   * @param {Object} n
   * @return {Number}
   */
  getAverageUsage(n) {
    n = n.map(a => 1 - a.idle);
    let total = n.length;
    let sum = 0;
    for (let i of n) sum += i;
    return sum / total;
  }
  /**
   * Format a decimal into a percentage
   * @param {Number} n Number to format
   * @return {String}
   */
  format(n) {
    return Math.round(n * 100).toString().padStart(3, ' ') + '%';
  }
}

module.exports = CpuBlock;
