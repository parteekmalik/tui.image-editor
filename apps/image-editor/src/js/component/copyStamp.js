import { fabric } from 'fabric';
import Component from '@/interface/component';
import { componentNames } from '@/consts';

/**
 * CopyStamp
 * @class CopyStamp
 * @param {Graphics} graphics - Graphics instance
 * @extends {Component}
 * @ignore
 */
class CopyStamp extends Component {
  constructor(graphics) {
    super(componentNames.COPY_STAMP, graphics);

    /**
     * Brush stroke width
     * @type {number}
     */
    this.brushWidth = 20;

    /**
     * Source point from which pixels are copied (set with Ctrl+click)
     * @type {?fabric.Point}
     * @private
     */
    this._sourcePoint = null;

    /**
     * Point where the current drawing stroke started
     * @type {?fabric.Point}
     * @private
     */
    this._strokeStartPoint = null;

    /**
     * Live preview object showing the cloned area during drawing
     * @type {?fabric.Object}
     * @private
     */
    this._previewObject = null;

    /**
     * Promise tracking the current preview update operation
     * @type {?Promise}
     * @private
     */
    this._previewUpdatePromise = null;

    /**
     * Promise tracking the final image commit operation
     * @type {?Promise}
     * @private
     */
    this._finalizationPromise = null;

    /**
     * Flag indicating if the current stroke is complete
     * @type {boolean}
     * @private
     */
    this._isStrokeComplete = false;

    /**
     * Custom cursor circle object
     * @type {?fabric.Circle}
     * @private
     */
    this._cursorCircle = null;

    /**
     * Cached snapshot of the source area for performance
     * @type {Promise<fabric.Image>|fabric.Image|null}
     * @private
     */
    this._sourceSnapshot = null;
  }

  /**
   * Start copy stamp mode
   * @param {{width: ?number}} [settings] - Brush settings
   */
  start(settings) {
    this._createCursorCircle();
    this.setBrush(settings);
    this._attachEventListeners();
    this._setCursorVisibility(true);
  }

  /**
   * Configure brush properties
   * @param {{width: ?number}} [settings] - Brush settings
   */
  setBrush(settings) {
    const canvas = this.getCanvas();
    const brush = canvas.freeDrawingBrush;

    settings = settings || {};
    this.brushWidth = settings.width || this.brushWidth;

    brush.width = this.brushWidth;
    brush.color = 'transparent';

    this._updateCursorCircle();
  }

  /**
   * Set cursor visibility
   * @param {boolean} hide - true to hide cursor, false to show cursor
   * @private
   */
  _setCursorVisibility(hide) {
    const canvas = this.getCanvas();

    if (hide) {
      canvas.defaultCursor = 'none';
      canvas.hoverCursor = 'none';
      canvas.moveCursor = 'none';
      canvas.freeDrawingCursor = 'none';
      canvas.selection = false;
      canvas.getElement().style.cursor = 'none';
    } else {
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'default';
      canvas.moveCursor = 'default';
      canvas.freeDrawingCursor = 'crosshair';
      canvas.selection = true;
      canvas.getElement().style.cursor = 'default';
    }

    canvas.renderAll();
  }

  /**
   * Create cursor circle for visual feedback
   * @private
   */
  _createCursorCircle() {
    const canvas = this.getCanvas();
    const radius = this.brushWidth / 2;

    const CursorCircle = fabric.util.createClass(fabric.Circle, {
      type: 'copyStampCursor',

      initialize(options) {
        this.callSuper('initialize', options);
        this.hasSource = false;
        this.showImage = true;
      },

      _render(ctx) {
        const { canvas: fabricCanvas } = this;
        const zoom = fabricCanvas ? fabricCanvas.getZoom() : 1;

        const borderWidth = 7 - zoom;

        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);

        if (this.hasSource && this.fillImage && this.showImage) {
          ctx.clip();
          ctx.drawImage(
            this.fillImage,
            -this.radius,
            -this.radius,
            this.radius * 2,
            this.radius * 2
          );
        } else {
          ctx.fillStyle = 'transparent';
          ctx.fill();
        }

        ctx.restore();

        ctx.save();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = borderWidth;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(1, borderWidth - 1);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - borderWidth / 2, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.restore();
      },
    });

    this._cursorCircle = new CursorCircle({
      radius,
      left: 0,
      top: 0,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
      excludeFromExport: true,
      hoverCursor: 'none',
      moveCursor: 'none',
      visible: false,
    });

    canvas.add(this._cursorCircle);
    canvas._copyStampCursorCircle = this._cursorCircle;

    if (!canvas._originalFindTarget) {
      canvas._originalFindTarget = canvas.findTarget;
    }
    canvas.findTarget = function (e, skipGroup) {
      const target = canvas._originalFindTarget.call(this, e, skipGroup);

      if (target === canvas._copyStampCursorCircle) {
        return null;
      }

      return target;
    };
  }

  /**
   * Updates the cursor circle's radius and position.
   * @param {Object} ctx - Context object for updating the cursor circle.
   * @param {fabric.Point|undefined} ctx.position - Optional mouse position {x, y}.
   * @param {boolean|undefined} ctx.showImage - Optional flag to show the image inside the cursor circle.
   * @private
   */
  _updateCursorCircle(ctx = {}) {
    const { position, showImage } = ctx;
    if (this._cursorCircle) {
      const updates = {
        radius: this.brushWidth / 2,
        hasSource: !!this._sourcePoint,
      };

      if (typeof position !== 'undefined') {
        updates.left = position.x;
        updates.top = position.y;
        updates.visible = true;
      }
      if (typeof showImage !== 'undefined') {
        updates.showImage = showImage;
      }

      this._cursorCircle.set(updates);
      this._cursorCircle.dirty = true;
      this._cursorCircle.setCoords();

      const canvas = this.getCanvas();
      canvas.bringToFront(this._cursorCircle);
    }
  }

  /**
   * Update cursor circle fill with source image
   * @private
   */
  async _updateCursorFill() {
    if (!this._sourcePoint || !this._cursorCircle) return;

    const canvas = this.getCanvas();
    const radius = this.brushWidth / 2;
    const sourceX = this._sourcePoint.x;
    const sourceY = this._sourcePoint.y;

    const canvasZoom = canvas.getZoom();
    const { viewportTransform } = canvas;

    const cropX = sourceX * canvasZoom + viewportTransform[4];
    const cropY = sourceY * canvasZoom + viewportTransform[5];
    const cropSize = radius * 2 * canvasZoom;

    const croppedImageDataURL = canvas.toDataURL({
      left: cropX - radius * canvasZoom,
      top: cropY - radius * canvasZoom,
      width: cropSize,
      height: cropSize,
    });

    const imageElement = new Image();
    imageElement.src = croppedImageDataURL;

    await new Promise((resolve, reject) => {
      imageElement.onload = resolve;
      imageElement.onerror = reject;
    });

    this._cursorCircle.fillImage = imageElement;
    this._cursorCircle.dirty = true;
  }

  async _captureSourceSnapshot() {
    if (!this._sourcePoint) return;

    const canvas = this.getCanvas();

    if (this._cursorCircle) {
      this._cursorCircle.set('visible', false);
    }

    const fullImageDataURL = canvas.toDataURL();

    this._sourceSnapshot = new Promise((resolve, reject) => {
      fabric.Image.fromURL(fullImageDataURL, (img) => {
        if (img) {
          resolve(img);
        } else {
          reject(new Error('Failed to create fabric image'));
        }
      });
    });
    await this._sourceSnapshot;

    if (this._cursorCircle) {
      this._cursorCircle.set('visible', true);
    }
  }

  /**
   * Attach event listeners to canvas
   * @private
   */
  _attachEventListeners() {
    const canvas = this.getCanvas();

    canvas.on('path:created', this._handlePathCreated.bind(this));
    canvas.on('mouse:down', this._handleMouseDown.bind(this));
    canvas.on('mouse:move', this._handleMouseMove.bind(this));
    canvas.on('mouse:move', this._handleCursorMove.bind(this));
  }

  /**
   * Detach event listeners from canvas
   * @private
   */
  _detachEventListeners() {
    const canvas = this.getCanvas();

    canvas.off('path:created', this._handlePathCreated);
    canvas.off('mouse:down', this._handleMouseDown);
    canvas.off('mouse:move', this._handleMouseMove);
    canvas.off('mouse:move', this._handleCursorMove);
  }

  /**
   * Handle cursor movement for visual feedback
   * @param {{target: fabric.Object, e: MouseEvent}} fabricEvent - Fabric event object
   * @private
   */
  _handleCursorMove(fabricEvent) {
    const canvas = this.getCanvas();
    const mousePosition = canvas.getPointer(fabricEvent.e);

    this._updateCursorCircle({ position: mousePosition });
  }

  /**
   * Handle mouse down events for source point selection and stroke initiation
   * @param {{target: fabric.Object, e: MouseEvent}} fabricEvent - Fabric event object
   * @private
   */
  async _handleMouseDown(fabricEvent) {
    const canvas = this.getCanvas();
    const mousePosition = canvas.getPointer(fabricEvent.e);

    if (fabricEvent.e.ctrlKey || fabricEvent.e.metaKey) {
      this._sourcePoint = mousePosition;
      this._isStrokeComplete = false;
      this._strokeStartPoint = null;
      canvas.isDrawingMode = true;
      this._updateCursorFill();
      this._updateCursorCircle({ showImage: true });
    } else if (this._sourcePoint) {
      if (this._finalizationPromise) {
        await this._finalizationPromise;
      }

      this._strokeStartPoint = mousePosition;
      this._isStrokeComplete = false;
      this._previewUpdatePromise = null;

      this._captureSourceSnapshot();
      this._updateCursorCircle({ showImage: false });
    }
  }

  /**
   * Handle mouse move events for live preview updates
   * @param {{target: fabric.Object, e: MouseEvent}} fabricEvent - Fabric event object
   * @private
   */
  // eslint-disable-next-line complexity
  async _handleMouseMove(fabricEvent) {
    if (
      fabricEvent.e.ctrlKey ||
      fabricEvent.e.metaKey ||
      !this._sourcePoint ||
      !this._strokeStartPoint ||
      this._previewUpdatePromise ||
      this._isStrokeComplete
    ) {
      return;
    }
    this._previewUpdatePromise = this._updateLivePreview()['finally'](() => {
      this._previewUpdatePromise = null;
    });
    await this._previewUpdatePromise;
  }

  /**
   * Handle path created events and finalize the stroke
   * @private
   */
  async _handlePathCreated() {
    if (this.graphics.getDrawingMode() !== 'COPY_STAMP') return;

    if (this._previewUpdatePromise) {
      await this._previewUpdatePromise;
    }

    this._finalizationPromise = this._finalizeStroke()['finally'](() => {
      this._finalizationPromise = null;
    });
    await this._finalizationPromise;
    this._updateCursorCircle({ showImage: false });
  }

  /**
   * Update the live preview during drawing
   * @private
   */
  async _updateLivePreview() {
    const canvas = this.getCanvas();
    const brush = canvas.freeDrawingBrush;
    const currentPath = brush.createPath(brush.convertPointsToSVGPath(brush._points));

    if (this._previewObject) {
      canvas.remove(this._previewObject);
    }
    const previewImage = await this._createClonedImage(canvas, currentPath);
    canvas.add(previewImage);
    this._previewObject = previewImage;
  }

  /**
   * Finalize the current stroke and commit to history
   * @private
   */
  async _finalizeStroke() {
    const canvas = this.getCanvas();
    if (this._previewObject) {
      canvas.remove(this._previewObject);
    }
    this._cursorCircle.visible = false;
    const brush = canvas.freeDrawingBrush;
    const finalPath = brush.createPath(brush.convertPointsToSVGPath(brush._points));
    canvas.remove(finalPath);

    const clonedImage = await this._createClonedImage(canvas, finalPath);
    canvas.add(clonedImage);

    const objectProperties = this.graphics.createObjectProperties(clonedImage);
    this.fire('addObject', objectProperties);

    this._previewObject = null;
    this._strokeStartPoint = null;
    this._isStrokeComplete = true;
    this._cursorCircle.visible = true;
  }

  /**
   * Create cloned image from the current canvas state using the specified path
   * @param {fabric.Canvas} canvas - The canvas instance
   * @param {fabric.Path} drawingPath - The path defining the area to clone
   * @returns {Promise<fabric.Image>} Promise that resolves with the cloned image
   * @private
   */
  _createClonedImage(canvas, drawingPath) {
    return new Promise((resolve, reject) => {
      if (!drawingPath || !this._sourcePoint || !this._strokeStartPoint) {
        reject(new Error('Failed to load image for cloning'));

        return;
      }

      const sourceX = this._sourcePoint.x;
      const sourceY = this._sourcePoint.y;
      const pathBounds = drawingPath.getBoundingRect();
      const { left: pathLeft, top: pathTop, width: pathWidth, height: pathHeight } = pathBounds;
      const offsetX = pathLeft - this._strokeStartPoint.x;
      const offsetY = pathTop - this._strokeStartPoint.y;

      if (!this._sourceSnapshot) {
        reject(new Error('Source snapshot not available'));

        return;
      }

      this._sourceSnapshot
        .then((snapshot) => {
          const canvasZoom = canvas.getZoom();
          const { viewportTransform } = canvas;

          const snapshotX = (sourceX + offsetX) * canvasZoom + viewportTransform[4];
          const snapshotY = (sourceY + offsetY) * canvasZoom + viewportTransform[5];
          const snapshotWidth = pathWidth * canvasZoom;
          const snapshotHeight = pathHeight * canvasZoom;

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = pathWidth;
          tempCanvas.height = pathHeight;
          const tempContext = tempCanvas.getContext('2d');

          tempContext.drawImage(
            snapshot.getElement(),
            snapshotX,
            snapshotY,
            snapshotWidth,
            snapshotHeight,
            0,
            0,
            pathWidth,
            pathHeight
          );

          const img = new fabric.Image(tempCanvas);
          if (!img) {
            reject(new Error('Failed to create fabric image from cropped data'));

            return;
          }

          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = pathWidth;
          maskCanvas.height = pathHeight;
          const maskContext = maskCanvas.getContext('2d');

          maskContext.save();
          maskContext.translate(-pathLeft, -pathTop);

          maskContext.fillStyle = 'transparent';
          maskContext.strokeStyle = 'black';
          maskContext.lineWidth = drawingPath.strokeWidth || this.brushWidth;
          maskContext.lineCap = drawingPath.strokeLineCap || 'round';
          maskContext.lineJoin = drawingPath.strokeLineJoin || 'round';

          const originalStroke = drawingPath.stroke;
          const originalFill = drawingPath.fill;

          drawingPath.set('stroke', 'black');
          drawingPath.set('fill', '');

          drawingPath.render(maskContext);

          drawingPath.set('stroke', originalStroke);
          drawingPath.set('fill', originalFill);

          maskContext.restore();

          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = pathWidth;
          finalCanvas.height = pathHeight;
          const finalContext = finalCanvas.getContext('2d');

          finalContext.drawImage(img.getElement(), 0, 0, pathWidth, pathHeight);

          finalContext.save();
          finalContext.globalCompositeOperation = 'destination-in';
          finalContext.drawImage(maskCanvas, 0, 0);
          finalContext.restore();

          const clonedImage = new fabric.Image(finalCanvas, {
            left: pathLeft,
            top: pathTop,
            selectable: false,
            evented: false,
            lockMovementX: true,
            lockMovementY: true,
            name: 'copyStampClonedImage',
          });

          resolve(clonedImage);
        })
        ['catch']((error) => {
          reject(error);
        });
    });
  }

  /**
   * End copy stamp mode and clean up resources
   */
  end() {
    const canvas = this.getCanvas();

    canvas.isDrawingMode = false;
    this._detachEventListeners();

    if (this._previewObject) {
      canvas.remove(this._previewObject);
      this._previewObject = null;
    }

    if (this._cursorCircle) {
      canvas.remove(this._cursorCircle);
      this._cursorCircle = null;
    }

    this._sourcePoint = null;
    this._strokeStartPoint = null;
    this._previewUpdatePromise = null;
    this._finalizationPromise = null;
    this._isStrokeComplete = false;
    this._sourceSnapshot = null;

    this._setCursorVisibility(false);
  }
}

export default CopyStamp;
