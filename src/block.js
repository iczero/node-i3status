const EventEmitter = require('events');
const uuidv4 = require('uuid/v4');
const mouseButtons = require('./mouse-buttons.json');
let reverseMouseButtons = {};
for (let [key, value] of Object.entries(mouseButtons)) reverseMouseButtons[value] = key;

/** Represents one block in the status bar */
class Block extends EventEmitter {
  /**
   * The constructor
   * @param {String} name The name of the block
   */
  constructor(name) {
    super();
    this.name = name;
    this.id = uuidv4();
    this._init();
  }
  /** Initialize events */
  _init() {
    this.on('input', ev => {
      let buttonName = reverseMouseButtons[ev.button];
      if (buttonName) {
        this.emit('mouse-' + buttonName, ev);
      }
      this.emit('mouse-' + ev.button, ev);
    });
  }
  /**
   * Returns what should be rendered onto the status
   * @return {Object}
   */
  render() {
    return { full_text: '' };
  }
  /** Called to inform the status display of changes in this block */
  update() {
    this.emit('update');
  }
}

module.exports = Block;
