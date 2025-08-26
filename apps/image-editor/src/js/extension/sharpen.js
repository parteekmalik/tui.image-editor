import { fabric } from 'fabric';

/**
 * Sharpen object
 * @class Sharpen
 * @extends {fabric.Image.filters.Convolute}
 * @ignore
 */
const Sharpen = fabric.util.createClass(
  fabric.Image.filters.Convolute,
  /** @lends Convolute.prototype */ {
    /**
     * Filter type
     * @param {String} type
     * @default
     */
    type: 'Sharpen',

    /**
     * constructor
     * @override
     */
    initialize() {
      this.matrix = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    },

    /**
     * Set sharpen intensity
     * @param {number} intensity - Sharpen intensity (3-9)
     */
    setSharpenIntensity(intensity) {
      const sideValue = -1;

      this.matrix = [0, sideValue, 0, sideValue, intensity, sideValue, 0, sideValue, 0];
    },
  }
);

export default Sharpen;
