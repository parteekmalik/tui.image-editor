import { fabric } from 'fabric';

/**
 * Saturation object
 * @class Saturation
 * @extends {fabric.Image.filters.Saturation}
 * @ignore
 */
const Saturation = fabric.util.createClass(
  fabric.Image.filters.Saturation,
  /** @lends fabric.Image.filters.Saturation.prototype */ {
    /**
     * Filter type
     * @param {String} type
     * @default
     */
    type: 'Saturation',

    /**
     * Constructor
     * @member fabric.Image.filters.Saturation.prototype
     * @param {Object} [options] Options object
     * @param {Number} [options.saturation=0] Saturation value (-1...1)
     * @override
     */
    initialize(options) {
      if (!options) {
        options = {};
      }
      this.saturation = options.saturation || 0;

      this.callSuper('initialize', options);
    },

    /**
     * Update saturation value
     * @param {Object} options Options object
     */
    setOptions(options) {
      if (options.saturation !== null) {
        this.saturation = options.saturation;
      }
    },
  }
);

export default Saturation;
