/** @format */

//Components
// import { Window } from '../node_modules/ud-viz/src/Components/GUI/js/Window';
// import { LayerManager } from 'ud-viz/src/Components/LayerManager/LayerManager';
import * as udviz from 'ud-viz';
import './temporalExtension.css';
import $ from 'jquery';

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
    let viewerDiv = document.getElementById('root_View3D');
    // viewerDiv.innerHTML += this.innerContentHtml;
    let temporalDiv = document.createElement('div');
    temporalDiv.id = 'temporal-updated';
    temporalDiv.innerHTML = this.innerContentHtml;
    
    viewerDiv.append(temporalDiv);
    // viewerDiv.innerHTML += this.innerContentHtml;
    var rangeOne = document.querySelector('input[name="rangeOne"]'),
      rangeTwo = document.querySelector('input[name="rangeTwo"]'),
      outputOne = document.querySelector('.outputOne'),
      outputTwo = document.querySelector('.outputTwo'),
      inclRange = document.querySelector('.incl-range'),
      updateView = function () {
        if (this.getAttribute('name') === 'rangeOne') {
          outputOne.innerHTML =  parseInt(this.value * 0.38) + 1980;
          outputOne.style.left = this.value / this.getAttribute('max') * 100 + '%';
        } else {
          outputTwo.style.left = this.value / this.getAttribute('max') * 100 + '%';
          outputTwo.innerHTML = parseInt(this.value * 0.38) + 1980;
        }
        if (parseInt(rangeOne.value) > parseInt(rangeTwo.value)) {
          inclRange.style.width = (rangeOne.value - rangeTwo.value) / this.getAttribute('max') * 100 + '%';
          inclRange.style.left = rangeTwo.value / this.getAttribute('max') * 100 + '%';
        } else {
          inclRange.style.width = (rangeTwo.value - rangeOne.value) / this.getAttribute('max') * 100 + '%';
          inclRange.style.left = rangeOne.value / this.getAttribute('max') * 100 + '%';
        }
      };

    document.addEventListener('DOMContentLoaded', function () {
      updateView.call(rangeOne);
      updateView.call(rangeTwo);
      $('input[type="range"]').on('mouseup', function() {
        this.blur();
      }).on('mousedown input', function () {
        updateView.call(this);
      });
    });
  }
}