/** @format */

//Components
// import { Window } from '../node_modules/ud-viz/src/Components/GUI/js/Window';
// import { LayerManager } from 'ud-viz/src/Components/LayerManager/LayerManager';
import * as udviz from 'ud-viz';

export class LayerExtension extends Window {
  /**
   * Creates the layer choice windows
   *
   * @param {LayerManager} layerManager
   */
  constructor(layerManager) {
    super('layer_legende', 'LayerLegend', false);

    /**
     * the layerManager
     */
    this.layerManager = layerManager;
  }

  get innerContentHtml() {
    return /*html*/ `
    <div id="layerLegend">
        <div class="box-section" id="colorLayer"> 
        <input type="checkbox" class="spoiler-check" id="color-layers-spoiler">
        <label for="color-layers-spoiler" class="section-title">Color Layers</Label>
          <div class="spoiler-box" id="color-layer-spoiler">
          </div>
        </div>
    </div>
    `;
  }

  windowCreated() {
    
  }
}