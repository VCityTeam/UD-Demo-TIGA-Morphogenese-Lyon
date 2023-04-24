/** @format */

import './temporalExtension.css';
import './ui-space-time-cube.css';
import { THREE } from '@ud-viz/browser/src';

import $ from 'jquery';

/* It creates a temporal slider and a legend for the Space Time Cube */

export class SpaceTimeCubeWindow {

  constructor(view3D, spaceTimeCube){
    /* Setting the view3D property of the class to the view3D parameter. */
    this.view3D = view3D;
    this.spaceTimeCube = spaceTimeCube;

    //STC Data FIX ME
    this.olderData = 2009;
    this.rangeData = 0.10;
    this.tilesDates = [2009, 2015];

    this.rangeSliderclass = 'range-slider container';

    this.createHtml();
  }


  /**
 * adds the checkbox and the temporal slider html to the root view
 */
  createHtml(){
    this.addCheckboxTransactionHtml();
    this.addTemporalSliderHtml();
    this.createdDotElementData();
  }


  /**
 * Add the temporal slider to the viewer
 */
  addTemporalSliderHtml(){
  
    const viewerDiv = this.view3D.rootHtml;
    const sliderDiv = document.createElement('div');
    const temporalTitle = document.createElement('h1');
    const temporalUI = document.createElement('div');

    sliderDiv.id = 'temporal-updated';
    sliderDiv.innerHTML = this.temporalSliderHtml;

    temporalTitle.textContent = 'Temporal Slider';

    temporalUI.id = 'temporal-ui';
    // this.temporalSliderDiv.innerHTML = this.innerContentHtml;

    temporalUI.append(temporalTitle);
    temporalUI.append(sliderDiv);
    
    viewerDiv.append(temporalUI);

    let olderData = this.olderData;
    let rangeData = this.rangeData;

    let rangeOne = document.querySelector('input[name="rangeOne"]'),
      rangeTwo = document.querySelector('input[name="rangeTwo"]'),
      outputOne = document.querySelector('.outputOne'),
      outputTwo = document.querySelector('.outputTwo'),
      inclRange = document.querySelector('.incl-range'),
      updateView = function () {

        if (this.getAttribute('name') === 'rangeOne') {
          outputOne.innerHTML =  parseInt(this.value * rangeData) + olderData;
          outputOne.style.left = this.value / this.getAttribute('max') * 95 + '%';
        } else {
          outputTwo.style.left = this.value / this.getAttribute('max') * 95 + '%';
          outputTwo.innerHTML = parseInt(this.value * rangeData) + olderData;
        }
        if (parseInt(rangeOne.value) > parseInt(rangeTwo.value)) {
          inclRange.style.width = (rangeOne.value - rangeTwo.value) / this.getAttribute('max') * 100 + '%';
          inclRange.style.left = rangeTwo.value / this.getAttribute('max') * 100 + '%';
        } else {
          inclRange.style.width = (rangeTwo.value - rangeOne.value) / this.getAttribute('max') * 100 + '%';
          inclRange.style.left = rangeOne.value / this.getAttribute('max') * 100 + '%';
        }
      };

    //Hide or Show data
    rangeOne.oninput = () => {
      let valueOne = parseInt(rangeOne.value * rangeData) + olderData;
      let valueTwo = parseInt(rangeTwo.value * rangeData) + olderData;
    //   this.tilesDates.forEach(element => {
    //     if (element[1] < valueOne || element[1] > valueTwo){
    //       element[0].layer.visible = false;
    //     }else{
    //       element[0].layer.visible = true;
    //     }          
    //     this.layerManager.notifyChange();
    //   }); 
    };

    rangeTwo.oninput = () => {
      let valueTwo = parseInt(rangeTwo.value * rangeData) + olderData;
      let valueOne = parseInt(rangeOne.value * rangeData) + olderData;
    //   this.tilesDates.forEach(element => {
    //     if (element[1] < valueOne || element[1] > valueTwo){
    //       element[0].layer.visible = false;
    //     }else{
    //       element[0].layer.visible = true;
    //     }          
    //     this.layerManager.notifyChange();
    //   }); 
    };

    updateView.call(rangeOne);
    updateView.call(rangeTwo);
    $('input[type="range"]').on('mouseup', function() {
      this.blur();
    }).on('mousedown input', function () {
      updateView.call(this);
    });
  }

  /**
 * Creates legend checkbox
 */
  addCheckboxTransactionHtml(){
    const viewerDiv = this.view3D.rootHtml;
    const legendDiv = document.createElement('div');
    legendDiv.className = 'ui-space-time-cube';

    legendDiv.innerHTML = `
                          <h1 style="color: white">Legend</h1>
                          <div class="legend-item">
                            <input class="legend-checkbox" type="checkbox" style="background-color: #009900;" name="scales" checked>
                            <div class="legend-label">Construction</div>
                          </div>
                          <div class="legend-item">
                            <input class="legend-checkbox" type="checkbox" style="background-color: #ff0000;" name="scales" checked>
                            <div class="legend-label">Demolition</div>
                          </div>
                          <div class="legend-item">
                            <input class="legend-checkbox" type="checkbox" style="background-color: #ffd700;" name="scales" checked>
                            <div class="legend-label">Modify</div>
                          </div>`;
    
    viewerDiv.append(legendDiv);
  }

  /**
   * Create DOT in the temporal slider
   */
  createdDotElementData(){

    //Create html element
    this.tilesDates.forEach(element => {
      let dotElement = document.createElement('span');
      dotElement.className = 'dot';
  
      //Transform decimal color in hexa
      let c = new THREE.Color(); 
      c.set('white');
      dotElement.style.backgroundColor = '#' + c.getHexString();
        
      dotElement.style.left = ((element - this.olderData) * 98) / (this.rangeData * 100).toString() + '%' ;
      document.getElementsByClassName(this.rangeSliderclass)[0].append(dotElement);
    });
  }


  get temporalSliderHtml() {
    return `
        <section class="${this.rangeSliderclass}">
          <span class="output outputOne"></span>
          <span class="output outputTwo"></span>
          <span class="full-range"></span>
          <span class="incl-range"></span>
          <input name="rangeOne" value="0" min="0" max="100" step="1" type="range">
          <input name="rangeTwo" value="100" min="0" max="100" step="1" type="range">
      </section>
        `;
  }

  get transactionChecboxHtml() {
    return `
        <h1 style="color: white">Legend</h1>
        <div class="legend-item">
            <input class="legend-checkbox" type="checkbox" style="background-color: #009900;" name="scales" checked>
            <div class="legend-label">Construction</div>
        </div>
        <div class="legend-item">
            <input class="legend-checkbox" type="checkbox" style="background-color: #ff0000;" name="scales" checked>
            <div class="legend-label">Demolition</div>
        </div>
        <div class="legend-item">
            <input class="legend-checkbox" type="checkbox" style="background-color: #ffd700;" name="scales" checked>
            <div class="legend-label">Modify</div>
        </div>`;
  }
}