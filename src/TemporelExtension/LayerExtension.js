/** @format */

//Components
// import { Window } from '../node_modules/ud-viz/src/Components/GUI/js/Window';
// import { LayerManager } from 'ud-viz/src/Components/LayerManager/LayerManager';
import * as udviz from 'ud-viz';
import './temporalExtension.css';

export class LayerExtension {
  /**
   * Creates the layer choice windows
   *
   * @param {LayerManager} layerManager
   */
  constructor(layerManager) {

    /**
     * the layerManager
     */
    this.layerManager = layerManager;
  }

  get innerContentHtml() {
    return /*html*/ `
    <section class="range-slider container">
      <span class="output outputOne"></span>
      <span class="output outputTwo"></span>
      <span class="full-range"></span>
      <span class="incl-range"></span>
      <input name="rangeOne" value="10" min="0" max="100" step="1" type="range">
      <input name="rangeTwo" value="90" min="0" max="100" step="1" type="range">
    </section>
    `;
  }

  windowCreated() {
    let viewerDiv = document.getElementById('viewerDiv');
    // viewerDiv.innerHTML += this.innerContentHtml;
    let temporalDiv = document.createElement('div');
    temporalDiv.id = 'temporal-updated';
    temporalDiv.innerHTML = this.innerContentHtml;
    
    viewerDiv.append(temporalDiv);
    // viewerDiv.innerHTML += this.innerContentHtml;
  }
}