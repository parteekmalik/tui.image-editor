import * as fabric from 'fabric';

/**
 * Blur object
 * @class Blur
 * @extends {fabric.Image.filters.Convolute}
 * @ignore
 */
class Blur extends fabric.filters.Convolute {
  constructor() {
    super({ matrix: [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9] });
  }
}

Blur.type = 'Blur';
fabric.classRegistry.setClass(Blur);

export default Blur;
