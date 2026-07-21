import commandFactory from '@/factory/command';
import { componentNames, commandNames } from '@/consts';
import { getFabricObjectType } from '@/util';

const { IMAGE_LOADER } = componentNames;

const command = {
  name: commandNames.LOAD_IMAGE,

  /**
   * Load a background (main) image
   * @param {Graphics} graphics - Graphics instance
   * @param {string} imageName - Image name
   * @param {string} imgUrl - Image Url
   * @returns {Promise}
   */
  execute(graphics, imageName, imgUrl) {
    const loader = graphics.getComponent(IMAGE_LOADER);
    const prevImage = loader.getCanvasImage();
    const prevImageWidth = prevImage ? Number(prevImage.width) || 0 : 0;
    const prevImageHeight = prevImage ? Number(prevImage.height) || 0 : 0;
    const objects = graphics
      .removeAll(true)
      .filter((objectItem) => getFabricObjectType(objectItem) !== 'cropzone');

    objects.forEach((objectItem) => {
      objectItem.evented = true;
    });

    this.undoData = {
      name: loader.getImageName(),
      image: prevImage,
      objects,
    };

    return loader.load(imageName, imgUrl).then((newImage) => ({
      oldWidth: prevImageWidth,
      oldHeight: prevImageHeight,
      newWidth: Number(newImage.width) || 0,
      newHeight: Number(newImage.height) || 0,
    }));
  },

  /**
   * @param {Graphics} graphics - Graphics instance
   * @returns {Promise}
   */
  undo(graphics) {
    const loader = graphics.getComponent(IMAGE_LOADER);
    const { objects, name, image } = this.undoData;

    graphics.removeAll(true);
    graphics.add(objects);

    return loader.load(name, image);
  },
};

commandFactory.register(command);

export default command;
