import * as fabric from 'fabric';

/**
 * Emboss object
 * @class Emboss
 * @extends {fabric.Image.filters.Convolute}
 * @ignore
 */
class Emboss extends fabric.filters.Convolute {
  constructor() {
    super({ matrix: [1, 1, 1, 1, 0.7, -1, -1, -1, -1] });
  }
}

Emboss.type = 'Emboss';
fabric.classRegistry.setClass(Emboss);

export default Emboss;
