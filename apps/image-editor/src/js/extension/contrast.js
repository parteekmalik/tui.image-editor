import * as fabric from 'fabric';

/**
 * Contrast object
 * @class Contrast
 * @extends {fabric.Image.filters.Contrast}
 * @ignore
 */
class Contrast extends fabric.filters.Contrast {
  constructor(options = {}) {
    super(options);
    this.contrast = options.contrast || 0;
  }

  /**
   * Update contrast value
   * @param {Object} options Options object
   */
  setOptions(options) {
    if (options.contrast !== null) {
      this.contrast = options.contrast;
    }
  }
}

Contrast.type = 'Contrast';
fabric.classRegistry.setClass(Contrast);

export default Contrast;
