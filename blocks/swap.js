const fs = require('fs').promises;
const filesize = require('filesize');
const AsyncExpandingBaseBlock = require('./async-expanding-base.js');

/** A block displaying RAM usage */
class SwapBlock extends AsyncExpandingBaseBlock {
  /**
   * The construtor
   * @param {Object} [opts]
   * @param {String} [opts.label] Label for the block
   * @param {Number} [opts.updateInterval] Amount of time between updates in ms
   * @param {Number} [opts.expandTimeout] Amount of time before collapsing expanded display
   * @param {Object} [opts.blockOptions] Additional options to pass to the block}
   */
  constructor(opts) {
    super('swap', Object.assign({
      label: 'SWAP',
      updateInterval: 2000
    }), opts);
  }
  /** Update statistics */
  async updateStatistics() {
    this._data = {};
    this._data.files = (await fs.readFile('/proc/swaps'))
    .toString()
    .split('\n')
    // get rid of first row (table headings)
    .slice(1)
    // get rid of empty lines
    .filter(a => a.length)
    // capture groups:
    // 1: swap file name
    // 2: swap file type (file/partition)
    // 3: swap file total size
    // 4: swap file used size
    // 5: swap file priority
    .map(a => a.match(/^(\S+) +(file|partition)\t+(\d+)\t+(\d+)\t+(-?\d+)$/))
    .map(a => [a[1], a[2], a[3] * 1024, a[4] * 1024, a[5]]);
    this._data.totalSize = this._data.files.reduce((acc, val) => acc + val[2], 0);
    this._data.totalUsed = this._data.files.reduce((acc, val) => acc + val[3], 0);
    this.update();
  }
  /**
   * Render method
   * @return {Object}
   */
  render() {
    let text = [];
    if (this._data.files) {
      let used = filesize(this._data.totalUsed, { unix: !this.expandedDisplay });
      if (this.expandedDisplay) {
        for (let file of this._data.files) {
          text.push(`${file[0]}: ${filesize(file[3])} / ${filesize(file[2])}`);
        }
      } else text.push(used);
    } else text.push('N/A');
    return this.applyOptions({
      full_text: `${this.opts.label} ${text.join(' ')}`
    });
  }
}

module.exports = SwapBlock;
