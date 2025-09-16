import DrawingMode from '@/interface/drawingMode';
import { drawingModes, componentNames as components } from '@/consts';

/**
 * CopyStampMode class
 * @class
 * @ignore
 */
class CopyStampMode extends DrawingMode {
  constructor() {
    super(drawingModes.COPY_STAMP);
  }

  /**
   * start this drawing mode
   * @param {Graphics} graphics - Graphics instance
   * @param {{width: ?number, color: ?string}} [options] - Brush width & color
   * @override
   */
  start(graphics, options) {
    const copyStamp = graphics.getComponent(components.COPY_STAMP);
    copyStamp.start(options);
  }

  /**
   * stop this drawing mode
   * @param {Graphics} graphics - Graphics instance
   * @override
   */
  end(graphics) {
    const copyStamp = graphics.getComponent(components.COPY_STAMP);
    copyStamp.end();
  }
}

export default CopyStampMode;
