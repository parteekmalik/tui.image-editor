import * as fabric from 'fabric';

/**
 * Saturation object
 * @class Saturation
 * @extends {fabric.Image.filters.Saturation}
 * @ignore
 */
class Saturation extends fabric.filters.Saturation {
  constructor(options = {}) {
    super(options);
    this.saturation = options.saturation || 0;
  }

  /**
   * Update saturation value
   * @param {Object} options Options object
   */
  setOptions(options) {
    if (options.saturation !== null) {
      this.saturation = options.saturation;
    }
  }
}

Saturation.type = 'Saturation';
fabric.classRegistry.setClass(Saturation);

export default Saturation;
