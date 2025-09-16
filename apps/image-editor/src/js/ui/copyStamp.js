import Range from '@/ui/tools/range';
import Submenu from '@/ui/submenuBase';
import templateHtml from '@/ui/template/submenu/copyStamp';
import { assignmentForDestroy } from '@/util';
import { defaultCopyStampRangeValues } from '@/consts';

/**
 * CopyStamp ui class
 * @class
 * @ignore
 */
class CopyStamp extends Submenu {
  constructor(subMenuElement, { locale, makeSvgIcon, menuBarPosition, usageStatistics }) {
    super(subMenuElement, {
      locale,
      name: 'copyStamp',
      makeSvgIcon,
      menuBarPosition,
      templateHtml,
      usageStatistics,
    });

    this._els = {
      copyStampRange: new Range(
        {
          slider: this.selector('.tie-copy-stamp-range'),
          input: this.selector('.tie-copy-stamp-range-value'),
        },
        defaultCopyStampRangeValues
      ),
    };

    this.type = null;
    this.width = this._els.copyStampRange.value;
  }

  /**
   * Destroys the instance.
   */
  destroy() {
    this._removeEvent();
    this._els.copyStampRange.destroy();

    assignmentForDestroy(this);
  }

  /**
   * Add event for copy stamp
   * @param {Object} actions - actions for copy stamp
   *   @param {Function} actions.setDrawMode - set draw mode
   */
  addEvent(actions) {
    this.actions = actions;
    this._els.copyStampRange.on('change', this._changeCopyStampRange.bind(this));
  }

  /**
   * Remove event
   * @private
   */
  _removeEvent() {
    this._els.copyStampRange.off();
  }

  /**
   * set draw mode - action runner
   */
  setDrawMode() {
    this.actions.setDrawMode(this.type, {
      width: this.width,
    });
  }

  /**
   * Returns the menu to its default state.
   */
  changeStandbyMode() {
    this.type = null;
    this.actions.stopDrawingMode();
    this.actions.changeSelectableAll(true);
  }

  /**
   * Executed when the menu starts.
   */
  changeStartMode() {
    this.type = 'free';
    this.setDrawMode();
  }

  /**
   * Change copy stamp Range
   * @param {number} value - select copy stamp range
   * @private
   */
  _changeCopyStampRange(value) {
    this.width = value;
    if (!this.type) {
      this.changeStartMode();
    } else {
      this.actions.setBrush({
        width: this.width,
      });
    }
  }
}

export default CopyStamp;
