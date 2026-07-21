import * as fabric from 'fabric';

/**
 * Gamma object
 * @class Gamma
 * @extends {fabric.Image.filters.Gamma}
 * @ignore
 */
class Gamma extends fabric.filters.Gamma {
  constructor(options = {}) {
    const gammaR = options.gammaR || 1;
    const gammaG = options.gammaG || 1;
    const gammaB = options.gammaB || 1;

    super({ ...options, gamma: [gammaR, gammaG, gammaB] });
    this.gammaR = gammaR;
    this.gammaG = gammaG;
    this.gammaB = gammaB;
  }

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
  }
}

Gamma.type = 'Gamma';
fabric.classRegistry.setClass(Gamma);

export default Gamma;
