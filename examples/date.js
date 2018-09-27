const { Block } = require('node-i3status');

/** An example block that shows the date every second */
class DateBlock extends Block {
  /**
   * The constructor
   * @param {Object} opts
   * @param {String} [opts.locale] Locale for the date
   * @param {Object} [opts.format] The date format
   * @param {Object} [opts.blockOptions] Additional options to pass to the block
   */
  constructor(opts) {
    super('date');
    if (!opts) opts = {};
    opts = Object.assign({
      locale: 'en-US',
      format: {},
      blockOptions: {
        separator_block_width: 15
      }
    }, opts);
    this.opts = opts;
    this.locale = opts.locale;
    this.format = opts.format;
    this.updateTimeout();
  }
  /** Update the timeout */
  updateTimeout() {
    setTimeout(() => {
      this.update();
      this.updateTimeout();
    }, 1000 - (Date.now() % 1000));
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
   * @return {String}
   */
  render() {
    return this.applyOptions({
      full_text: `${(new Date())
        .toLocaleDateString(this.locale, this.format)}`
    });
  }
}

module.exports = DateBlock;
