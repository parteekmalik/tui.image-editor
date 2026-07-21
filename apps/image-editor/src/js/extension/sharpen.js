import * as fabric from 'fabric';

/**
 * Sharpen object
 * @class Sharpen
 * @extends {fabric.Image.filters.Convolute}
 * @ignore
 */
class Sharpen extends fabric.filters.Convolute {
  constructor() {
    super({ matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0] });
  }
}

Sharpen.type = 'Sharpen';
fabric.classRegistry.setClass(Sharpen);

export default Sharpen;
