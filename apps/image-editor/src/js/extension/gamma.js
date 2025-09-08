import { fabric } from 'fabric';

/**
 * Gamma object
 * @class Gamma
 * @extends {fabric.Image.filters.Gamma}
 * @ignore
 */
const Gamma = fabric.util.createClass(
  fabric.Image.filters.Gamma,
  /** @lends fabric.Image.filters.Gamma.prototype */ {
    /**
     * Filter type
     * @param {String} type
     * @default
     */
    type: 'Gamma',

    /**
     * Constructor
     * @member fabric.Image.filters.Gamma.prototype
     * @param {Object} [options] Options object
     * @param {Number} [options.gammaR=1] Red channel gamma value (0.0...2.0)
     * @param {Number} [options.gammaG=1] Green channel gamma value (0.0...2.0)
     * @param {Number} [options.gammaB=1] Blue channel gamma value (0.0...2.0)
     * @override
     */
    initialize(options) {
      if (!options) {
        options = {};
      }
      this.gammaR = options.gammaR || 1;
      this.gammaG = options.gammaG || 1;
      this.gammaB = options.gammaB || 1;

      this.gamma = [this.gammaR, this.gammaG, this.gammaB];

      this.callSuper('initialize', options);
    },

    /**
     * Update gamma values for real-time changes
     * @param {Object} options Options object
     */
    setOptions(options) {
      if (typeof options.gammaR === 'number') {
        this.gammaR = options.gammaR;
      }
      if (typeof options.gammaG === 'number') {
        this.gammaG = options.gammaG;
      }
      if (typeof options.gammaB === 'number') {
        this.gammaB = options.gammaB;
      }

      this.gamma = [this.gammaR, this.gammaG, this.gammaB];
    },
  }
);

export default Gamma;
