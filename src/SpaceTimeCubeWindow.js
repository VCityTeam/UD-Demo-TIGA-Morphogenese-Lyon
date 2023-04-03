/** @format */

import './SpaceTimeCube/temporalExtension.css';
import './SpaceTimeCube/ui-space-time-cube.css';

import $ from 'jquery';

export class SpaceTimeCubeWindow {

  constructor(view3D){
    /* Setting the view3D property of the class to the view3D parameter. */
    this.view3D = view3D;

    this.createHtml();
  }


  createHtml(){
    this.addCheckboxTransactionHtml();
    this.addTemporalSliderHtml();
  }


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

    let olderData = this.tilesDates[0][1];
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
      let valueOne = parseInt(rangeOne.value * this.rangeData) + this.tilesDates[0][1];
      let valueTwo = parseInt(rangeTwo.value * this.rangeData) + this.tilesDates[0][1];
      this.tilesDates.forEach(element => {
        if (element[1] < valueOne || element[1] > valueTwo){
          element[0].layer.visible = false;
        }else{
          element[0].layer.visible = true;
        }          
        this.layerManager.notifyChange();
      }); 
    };

    rangeTwo.oninput = () => {
      let valueTwo = parseInt(rangeTwo.value * this.rangeData) + this.tilesDates[0][1];
      let valueOne = parseInt(rangeOne.value * this.rangeData) + this.tilesDates[0][1];
      this.tilesDates.forEach(element => {
        if (element[1] < valueOne || element[1] > valueTwo){
          element[0].layer.visible = false;
        }else{
          element[0].layer.visible = true;
        }          
        this.layerManager.notifyChange();
      }); 
    };

    updateView.call(rangeOne);
    updateView.call(rangeTwo);
    $('input[type="range"]').on('mouseup', function() {
      this.blur();
    }).on('mousedown input', function () {
      updateView.call(this);
    });
  }

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


  get temporalSliderHtml() {
    return `
        <section class="range-slider container">
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