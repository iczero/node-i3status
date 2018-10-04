const AsyncExpandingBaseBlock = require('./async-expanding-base.js');
const diskUsage = require('diskusage');
const filesize = require('filesize');
const util = require('util');
const checkUsage = util.promisify(diskUsage.check);

/** Block displaying disk usage */
class DiskBlock extends AsyncExpandingBaseBlock {
  /**
   * The construtor
   * @param {Object} [opts]
   * @param {String} [opts.label] Label for the block
   * @param {String} [opts.path] Path of disk
   * @param {Number} [opts.updateInterval] Amount of time between updates in ms
   * @param {Number} [opts.expandTimeout] Amount of time before collapsing expanded display
   * @param {Object} [opts.blockOptions] Additional options to pass to the block}
   */
  constructor(opts) {
    super('disk', Object.assign({
      label: 'DISK',
      path: '/',
      updateInterval: 60000
    }, opts));
    this.updateStatistics();
  }
  /** Update usage statistics */
  async updateStatistics() {
    this._data = await checkUsage(this.opts.path);
    this.update();
  }
  /**
   * Render function
   * @return {Object}
   */
  render() {
    let text = [this.opts.label];
    if (this._data) {
      if (this.expandedDisplay) {
        text.push(`${this.opts.path}:`);
        text.push(`${filesize(this._data.total - this._data.available)} / ${filesize(this._data.total)}`);
      } else text.push(filesize(this._data.available, { unix: true }));
    } else text.push('N/A');
    return this.applyOptions({
      full_text: text.join(' ')
    });
  }
}

module.exports = DiskBlock;
