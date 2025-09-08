import { fabric } from 'fabric';

/**
 * Contrast object
 * @class Contrast
 * @extends {fabric.Image.filters.Contrast}
 * @ignore
 */
const Contrast = fabric.util.createClass(
  fabric.Image.filters.Contrast,
  /** @lends fabric.Image.filters.Contrast.prototype */ {
    /**
     * Filter type
     * @param {String} type
     * @default
     */
    type: 'Contrast',

    /**
     * Constructor
     * @member fabric.Image.filters.Contrast.prototype
     * @param {Object} [options] Options object
     * @param {Number} [options.contrast=0] Contrast value (-1...1)
     * @override
     */
    initialize(options) {
      if (!options) {
        options = {};
      }
      this.contrast = options.contrast || 0;

      this.callSuper('initialize', options);
    },

    /**
     * Update contrast value
     * @param {Object} options Options object
     */
    setOptions(options) {
      if (options.contrast !== null) {
        this.contrast = options.contrast;
      }
    },
  }
);

export default Contrast;
