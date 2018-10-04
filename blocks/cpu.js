const AsyncExpandingBaseBlock = require('./async-expanding-base.js');
const os = require('os');

/** CPU usage display */
class CpuBlock extends AsyncExpandingBaseBlock {
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
    super('cpu', Object.assign({
      label: 'CPU',
      highlightThreshold: 0.9,
      highlightColor: '#ffff00'
    }, opts));
    this._data = [];
    this.samplingTimeout = null;
  }
  /** Update usage statistics */
  updateStatistics() {
    if (this.samplingTimeout) return;
    let first = os.cpus();
    this.samplingTimeout = setTimeout(() => {
      this.samplingTimeout = null;
      let second = os.cpus();
      this._data = this.getUsage(first, second);
      super.update();
    }, 1000);
  }
  /**
   * Render method
   * @return {String}
   */
  render() {
    let usage = this._data;
    let average = this.getAverageUsage(usage);
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
        if (total - prevTotal === 0) result[type] = this.prevResults[i][type];
        else result[type] = (val - prev.times[type]) / (total - prevTotal);
      }
      ret.push(result);
    }
    this.prevResults = ret;
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
    if (n !== n) return ' N/A';
    return Math.round(n * 100).toString().padStart(3, ' ') + '%';
  }
}

module.exports = CpuBlock;
