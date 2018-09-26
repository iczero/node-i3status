const EventEmitter = require('events');
const JSONStream = require('JSONStream');
const stream = require('stream');

const VERSION = 1;

/** Represents a status display on i3 */
class Status extends EventEmitter {
  /** The constructor */
  constructor() {
    super();
    /** Stream for i3bar input (click events) */
    this.inStream = JSONStream.parse('*');
    /** Stream for output to i3bar */
    this.outStream = new stream.PassThrough();
    /** List of blocks */
    this.blocks = [];
    /** Blocks by id */
    this.blocksById = new Map();
    this._listeners = new Map();

    /** Currently displayed blocks */
    this.display = [];
    this.jsonOut = JSONStream.stringify();
    this.outStream.write(JSON.stringify({
      version: VERSION,
      click_events: true
    }) + '\n');
    this.jsonOut.pipe(this.outStream);
    this.inStream.on('data', this.inputHandler.bind(this));

    this._willUpdate = false;
  }
  /** Send the current status to i3bar */
  update() {
    if (this._willUpdate) return;
    this._willUpdate = true;
    setImmediate(() => {
      this.jsonOut.write(this.display);
      this._willUpdate = false;
    });
  }
  /** Render all blocks */
  renderAll() {
    for (let block of this.blocks) this.renderBlock(block);
  }
  /**
   * Render a block by id
   * @param {String|Block} block The id of the block
   */
  renderBlock(block) {
    if (typeof block === 'string') block = this.blocksById.get(block);
    let display = Object.assign(this._getDefault(block), block.render());
    this.display[this.blocks.indexOf(block)] = display;
    this.update();
  }
  /**
   * Handles input from i3bar
   * @param {Object} event The event
   */
  inputHandler(event) {
    let id = event.instance;
    let block = this.blocksById.get(id);
    block.emit('input', event);
  }
  /**
   * Add a block to the status
   * @param {Block} block The block to add
   * @param {Number} [index] The index to add it at, or the end
   */
  addBlock(block, index) {
    if (this.blocksById.has(block.id)) throw new Error('Block already exists');
    if (typeof index === 'undefined') index = this.blocks.length;
    this.blocks.splice(index, 0, block);
    this.display.splice(index, 0, this._getDefault(block));
    this.blocksById.set(block.id, block);
    let listener = () => this.renderBlock(block);
    this._listeners.set(block, listener);
    block.on('update', listener);
    this.renderBlock(block);
  }
  /**
   * Delete a block from the status
   * @param {Block} block
   */
  deleteBlock(block) {
    if (!this.blocksById.has(block.id)) throw new Error('No such block');
    let listener = this._listeners.get(block);
    block.removeListener('update', listener);
    this._listeners.delete(block);
    this.blocksById.delete(block.id);
    let index = this.blocks.indexOf(block);
    this.blocks.splice(index, 1);
    this.display.splice(index, 1);
    this.update();
  }
  /**
   * Get the default render output for a block
   * @param {Block} block
   * @return {Object}
   */
  _getDefault(block) {
    return {
      name: block.name,
      instance: block.id,
      full_text: ''
    };
  }
}

module.exports = Status;
