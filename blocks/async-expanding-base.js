const { Block } = require('node-i3status');

/** A block displaying RAM usage */
class AsyncExpandingBaseBlock extends Block {
  /**
   * The construtor
   * @param {String} name The name for the block
   * @param {Object} [opts]
   * @param {Number} [opts.updateInterval] Amount of time between updates in ms
   * @param {Number} [opts.expandTimeout] Amount of time before collapsing expanded display
   * @param {Object} [opts.blockOptions] Additional options to pass to the block
   */
  constructor(name, opts) {
    super(name);
    if (!opts) opts = {};
    opts = Object.assign({
      updateInterval: 2000,
      expandTimeout: 5000,
      blockOptions: {
        separator_block_width: 15
      }
    }, opts);
    this.opts = opts;

    this.interval = setInterval(() => this.updateStatistics(), this.opts.updateInterval);
    this.expandTimeout = null;
    this.on('mouse-RIGHT', () => this.updateAndResetInterval(true));
    this.on('mouse-LEFT', () => this._setExpanded());
    this._data = null;

    this.updateStatistics();
  }
    /**
   * Update the display and re-set the interval
   * @param {Boolean} recalculate Whether to update data usage
   */
  updateAndResetInterval(recalculate) {
    if (recalculate) this.updateStatistics();
    else this.update();
    clearInterval(this.interval);
    this.interval = setInterval(() => this.updateStatistics(), this.opts.updateInterval);
  }
  /** Open expanded view */
  _setExpanded() {
    this.expandedDisplay = true;
    this.updateAndResetInterval(false);
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
  /** Update usage asynchronously */
  async updateStatistics() {
    this._data ? this._data += this.opts.updateInterval / 1000 : this._data = 1;
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
      text = this._data + ' (expanded)';
    } else {
      text = this._data;
    }
    return this.applyOptions({
      full_text: `${text}`
    });
  }
}

module.exports = AsyncExpandingBaseBlock;
