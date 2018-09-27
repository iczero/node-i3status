# node-i3status

An i3status implementation in Node.js

```js
const { Block, Status } = require('node-i3status');
/** An example block that shows the date every second */
class ExampleBlock extends Block {
  /** The constructor */
  constructor() {
    super('example');
    this.n = 0;
    // update the block every second
    setInterval(() => this.update(), 1000);
    this.on('mouse-LEFT', ev => {
      // can also use numbers, eg mouse-1
      this.n++;
      this.update();
    });
  }
  /**
   * The render function
   * @return {String}
   */
  render() {
    return {
      full_text: `${(new Date()).toString()} ${this.n}`,
      color: '#ffff00'
    };
  }
}

let status = new Status();

let b = new ExampleBlock();

// add the block to the status
status.addBlock(b);

// bind the status display to stdin/stdout
status.outStream.pipe(process.stdout);
process.stdin.pipe(status.inStream);

// remove it after 10 seconds
setTimeout(() => status.deleteBlock(b), 10000);
```

In `~/.config/i3/status`:

```
bar {
    status_command /path/to/your/script.js
}
```

See examples folder for examples of more complex blocks.

## API Reference

### class: Status

Represents the status display. The `Status` object consists of many different
`Block` objects.

#### update()

Sends the text of the current blocks to i3bar

#### renderBlock(block)

- `block` `<string>` | `<Block>` The block to render

Render a single block

#### renderAll()

Render all the blocks

#### addBlock(block, index)

- `block` `<Block>` The block to add
- `index` `<integer>` Where to add the block

Add a block to the status display. If `index` is not specified, add the block to
the end.

#### deleteBlock(block)

- `block` `<Block>` The block to remove

Remove a block from the status display.

### class: Block

Represents a part of the status display.

#### Constructor: new Block(name)

- `name` `<String>` The name of the block

Create a new block. The name isn't currently used, besides to give to i3bar.

#### Event: 'input'

- `event` `<Object>` A click event from i3

Emitted whenever there is input on the block, for example, if a user clicks it.
See [here](https://i3wm.org/docs/i3bar-protocol.html#_click_events) for more
information on the format which is used.

#### Event: 'mouse-\<button>'

- `event` `<Object>` A click event from i3

Emitted for a specific mouse event on the block. Both button names and button
numbers can be used. See the `input` event for details and
`src/mouse-buttons.json` for the names of the buttons.

#### update()

Tells the status display to update the block. Will call render() to get an
updated display of the contents of the block.

#### render()

- Returns: `<string>`

Update function. Will be called by the `Status` object to obtain the latest
information provided by this block. See
[here](https://i3wm.org/docs/i3bar-protocol.html#_blocks_in_detail) for details
about the format which should be used.

## Does it suck?

Yes.
