const fs = require('fs').promises;
const filesize = require('filesize');
const parseSize = require('filesize-parser');
const AsyncExpandingBaseBlock = require('./async-expanding-base.js');

/** A block displaying RAM usage */
class RamBlock extends AsyncExpandingBaseBlock {
  /**
   * The construtor
   * @param {Object} [opts]
   * @param {String} [opts.label] Label for the block
   * @param {Number} [opts.updateInterval] Amount of time between updates in ms
   * @param {Number} [opts.expandTimeout] Amount of time before collapsing expanded display
   * @param {Object} [opts.blockOptions] Additional options to pass to the block}
   */
  constructor(opts) {
    super('ram', Object.assign({
      label: 'RAM',
      updateInterval: 2000
    }), opts);
  }
  /** Update statistics */
  async updateStatistics() {
    this._data = (await fs.readFile('/proc/meminfo'))
    .toString()
    .split('\n')
    // get rid of empty lines
    .filter(a => a.length)
    // capture groups:
    // 1: Field name
    // 2: Numeric value
    // 3: Unit
    .map(a => a.match(/^(\S+?): +(\d+) ?(\w+)?$/))
    .reduce((acc, val) => {
      // filesize-parser doesn't like kB, so lowercase it
      acc[val[1]] = parseSize(val[2] + (val[3] ? val[3].toLowerCase() : ''));
      return acc;
    }, {});
    this.update();
  }
  /**
   * Render method
   * @return {Object}
   */
  render() {
    let text = [this.opts.label];
    if (this._data) {
      let available = filesize(this._data.MemAvailable, { unix: !this.expandedDisplay });
      if (this.expandedDisplay) {
        text.push('total ' + filesize(this._data.MemTotal));
        text.push('avail ' + filesize(this._data.MemAvailable));
        text.push('free ' + filesize(this._data.MemFree));
      } else text.push(available.padStart(4, ' '));
    } else text.push('N/A');
    return this.applyOptions({
      full_text: text.join(' ')
    });
  }
}

module.exports = RamBlock;
