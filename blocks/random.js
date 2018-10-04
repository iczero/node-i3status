const AsyncExpandingBaseBlock = require('./async-expanding-base.js');
const util = require('util');
const crypto = require('crypto');
const randomBytes = util.promisify(crypto.randomBytes);

/** A block displaying random stuff */
class RandomBlock extends AsyncExpandingBaseBlock {
  /**
   * The construtor
   * @param {Object} [opts]
   * @param {String} [label] Label of the block
   * @param {Number} [opts.updateInterval] Amount of time between updates in ms
   * @param {Number} [opts.expandTimeout] Amount of time before collapsing expanded display
   * @param {Object} [opts.blockOptions] Additional options to pass to the block
   */
  constructor(opts) {
    super('random', Object.assign({
      label: 'RAND',
      updateInterval: 60000,
      expandTimeout: 5000,
      blockOptions: {
        separator_block_width: 15
      }
    }, opts));
  }
  /** Update usage asynchronously */
  async updateStatistics() {
    this._data = await randomBytes(16);
    this.update();
  }
  /**
   * Render function
   * @return {Object}
   */
  render() {
    let text;
    if (!this._data) text = 'N/A';
    else if (this.expandedDisplay) {
      text = this._data.toString('hex').match(/.{2}/g).join(' ');
    } else {
      text = this._data.toString('hex').slice(0, 8);
    }
    return this.applyOptions({
      full_text: `${this.opts.label} ${text}`
    });
  }
}

module.exports = RandomBlock;
