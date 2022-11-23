/** @format */

//Components
// import { Window } from '../node_modules/ud-viz/src/Components/GUI/js/Window';
// import { LayerManager } from 'ud-viz/src/Components/LayerManager/LayerManager';
import './temporalExtension.css';
import $ from 'jquery';
import * as udviz from 'ud-viz';

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

    this.listElementDot;

    this.temporalDiv;

    this.windowCreated();
    this.createdDotElementData();
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
    this.temporalDiv = document.createElement('div');
    this.temporalDiv.id = 'temporal-updated';
    this.temporalDiv.innerHTML = this.innerContentHtml;
    
    viewerDiv.append(this.temporalDiv);
    let rangeOne = document.querySelector('input[name="rangeOne"]'),
      rangeTwo = document.querySelector('input[name="rangeTwo"]'),
      outputOne = document.querySelector('.outputOne'),
      outputTwo = document.querySelector('.outputTwo'),
      inclRange = document.querySelector('.incl-range'),
      updateView = function () {

        if (this.getAttribute('name') === 'rangeOne') {
          outputOne.innerHTML =  parseInt(this.value * 0.71) + 1950;
          outputOne.style.left = this.value / this.getAttribute('max') * 100 + '%';
        } else {
          outputTwo.style.left = this.value / this.getAttribute('max') * 100 + '%';
          outputTwo.innerHTML = parseInt(this.value * 0.71) + 1950;
        }
        if (parseInt(rangeOne.value) > parseInt(rangeTwo.value)) {
          inclRange.style.width = (rangeOne.value - rangeTwo.value) / this.getAttribute('max') * 100 + '%';
          inclRange.style.left = rangeTwo.value / this.getAttribute('max') * 100 + '%';
        } else {
          inclRange.style.width = (rangeTwo.value - rangeOne.value) / this.getAttribute('max') * 100 + '%';
          inclRange.style.left = rangeOne.value / this.getAttribute('max') * 100 + '%';
        }
      };

    let geometryLayers = this.layerManager.getGeometryLayers();
    let layerManager = this.layerManager;
    console.log(this.layerManager);


    // debugger
    // console.log(geometryLayers[9].object3d.getWorldPosition());
    // debugger
    
    // geometryLayers[9].object3d.position.z += 20;
    // geometryLayers[9].object3d.children[0].children[0].position.z += 20;
    this.layerManager.notifyChange();
    rangeOne.oninput = function(){
      if (parseInt(this.value * 0.71) + 1950 > 2000)
        geometryLayers[9].visible = false;
      layerManager.notifyChange();
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

  createdDotElementData(){
    
    let berlietData = [this.layerManager.tilesManagers[8],
      this.layerManager.tilesManagers[9],
      this.layerManager.tilesManagers[10],
      this.layerManager.tilesManagers[11],
      this.layerManager.tilesManagers[12],
      this.layerManager.tilesManagers[13]
    ];

    let allTime = [1954, 1966, 1978, 1986, 1993, 2021];


    //Create html element
    for (let i = 0 ; i < berlietData.length; i++){

      let dotElement = document.createElement('span');
      dotElement.className = 'dot';

      //Transform decimal color in hexa
      let c = new udviz.THREE.Color(); 
      c.set(berlietData[i].color);
      dotElement.style.backgroundColor = '#' + c.getHexString();

      let time = allTime[i];
      dotElement.style.left = (((time - 1950) * 600) / 71 - 2).toString() + 'px' ;
      document.getElementsByClassName('range-slider container')[0].append(dotElement);
    }
    

    
    
  }
}