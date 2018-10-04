const AsyncExpandingBlockBase = require('./async-expanding-base.js');
const filesize = require('filesize');
const chroma = require('chroma-js');
const fs = require('fs').promises;
const os = require('os');

/** Block displaying network interface statistics */
class NetworkBlock extends AsyncExpandingBlockBase {
  /**
   * The construtor
   * @param {Object} [opts]
   * @param {String} [opts.label] Label for the block
   * @param {String} [opts.interface] The interface to display
   * @param {Boolean} [opts.ipv4] Whether or not to show ipv4 address
   * @param {Boolean} [opts.ipv6] Whether or not to show ipv6 address
   * @param {String} [opts.ipColor] Color of ip addresses}
   * @param {Boolean} [opts.wireless] Whether or not to show wireless info
   * @param {String[]} [opts.wirelessColorScale] Color scale for wireless (see chroma.js)
   * @param {String} [opts.wirelessColorScaleMode] Color scale mode (see chroma.js)
   * @param {Boolean} [opts.bandwidth] Whether or not to show bandwidth usage
   * @param {String} [opts.bandwidthColor] Color of bandwidth
   * @param {Number} [opts.updateInterval] Amount of time between updates in ms
   * @param {Number} [opts.expandTimeout] Amount of time before collapsing expanded display
   * @param {Object} [opts.blockOptions] Additional options to pass to the block
   */
  constructor(opts) {
    super('network', Object.assign({
      label: 'NET',
      interface: 'eth0',
      ipv4: true,
      ipv6: true,
      ipColor: '#00ffff',
      wireless: false,
      wirelessColorScale: ['#ff0000', '#ffff00', '#00ff00'],
      wirelessColorScaleMode: 'lab',
      bandwidth: true,
      bandwidthColor: '#ffffff',
      updateInterval: 2000,
      blockOptions: {
        separator_block_width: 15,
        markup: 'pango'
      }
    }, opts));
    this._data = {
      up: true, // is the interface up?
      addresses: null, // array of addresses on interface
      wireless: null, // wireless signal strength [link quality, link level, link noise]
      bandwidth: null // bytes/sec [rx, tx]
    };
    this.samplingTimeout = null;
    this.wirelessColorScale = chroma
    .scale(this.opts.wirelessColorScale)
    .mode(this.opts.wirelessColorScaleMode)
    .domain([0, 100]);
    this.updateStatistics();
  }
  /** Update interface information */
  async updateStatistics() {
    if (!this._data) return;
    let addresses = os.networkInterfaces()[this.opts.interface];
    if (!addresses) {
      this._data.up = false;
      this._data.addresses = [];
      return;
    }
    if (!this.opts.ipv4) addresses = addresses.filter(a => a.family !== 'IPv4');
    if (!this.opts.ipv6) addresses = addresses.filter(a => a.family !== 'IPv6');
    this._data.addresses = addresses;
    let promises = [];
    if (this.opts.wireless) promises.push(this.getWirelessInfo());
    if (this.opts.bandwidth) promises.push(this.calculateBandwidth());
    await Promise.all(promises);
    this.update();
  }
  /**
   * Calculate bandwidth usage
   * @return {Number[]}
   */
  async calculateBandwidth() {
    if (this.samplingTimeout) return this._data.bandwidth;
    let prev = await this.getTotalBytes();
    return await new Promise(resolve => {
      this.samplingTimeout = setTimeout(async () => {
        let now = await this.getTotalBytes();
        let bandwidth = [now[0] - prev[0], now[1] - prev[1]];
        this._data.bandwidth = bandwidth;
        resolve(bandwidth);
        this.samplingTimeout = null;
      }, 1000);
    });
  }
  /**
   * Get total tx/rx bytes for the interface
   * @return {Number[]}
   */
  async getTotalBytes() {
    let ifaceDir = `/sys/class/net/${this.opts.interface}/`;
    let promises = [
      fs.readFile(ifaceDir + 'statistics/rx_bytes'),
      fs.readFile(ifaceDir + 'statistics/tx_bytes')
    ];
    let [rx, tx] = await Promise.all(promises);
    return [+rx, +tx];
  }
  /**
   * Get wireless signal strength for the interface
   * @return {Number[]} link quality, link level, link noise
   */
  async getWirelessInfo() {
    return this._data.wireless = (await fs.readFile('/proc/net/wireless'))
    .toString()
    .split('\n')
    .slice(2, -1)
    // iface status link level noise nwid crypt frag retry misc beacon we
    .map(a => a.split(' ').filter(a => a))
    // get only our interface
    .filter(a => a[0] === this.opts.interface + ':')[0]
    // only quality info
    .slice(2, 5)
    .map(a => +a);
  }
  /**
   * Color string with pango
   * @param {String} text Text to format
   * @param {String} color Color code
   * @return {String}
   */
  color(text, color) {
    return `<span color="${color}">${text}</span>`;
  }
  /**
   * Render method
   * @return {Object}
   */
  render() {
    let text = [this.opts.label];
    if (this._data.up) {
      let hasAddrs = this._data.addresses.length > 0;
      let addrs = this._data.addresses;
      let wl = this._data.wireless;
      let bw = this._data.bandwidth;
      if (this.expandedDisplay) {
        if (hasAddrs) text.push(this.color(addrs.map(a => a.address).join(' '), this.opts.ipColor));
        else text.push(this.color('[no addresses]', '#ff0000'));
        if (wl) {
          text.push(`quality ${wl[0]}/70 level ${wl[1]} dBm noise ${wl[2]} dBm`);
        }
      } else {
        if (hasAddrs) {
          let shortAddrs = [];
          let v4 = addrs.filter(a => a.family === 'IPv4')[0];
          if (v4) shortAddrs.push(v4.address);
          let v6 = addrs.filter(a => a.family === 'IPv6')[0];
          if (v6) shortAddrs.push(v6.address);
          text.push(this.color(shortAddrs.join(' '), this.opts.ipColor));
        } else text.push(this.color('[no addresses]', '#ff0000'));
        if (wl) {
          let strength = Math.floor(wl[0] / 70 * 100);
          text.push(this.color(strength + '%', this.wirelessColorScale(strength).hex()));
        }
      }
      if (bw) {
        let opts = { unix: !this.expandedDisplay };
        text.push(`RX ${filesize(bw[0], opts).padStart(4, ' ')} ` +
        `TX ${filesize(bw[1], opts).padStart(4, ' ')}`);
      }
    } else text.push(this.color(this.opts.interface + ' down', '#ff0000'));
    return this.applyOptions({
      full_text: text.join('  ')
    });
  }
}

module.exports = NetworkBlock;
