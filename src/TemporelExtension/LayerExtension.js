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

    this.berlietData = [[this.layerManager.tilesManagers[8], 1954],
      [this.layerManager.tilesManagers[9], 1966],
      [this.layerManager.tilesManagers[10], 1978],
      [this.layerManager.tilesManagers[11], 1986],
      [this.layerManager.tilesManagers[12], 1993],
      [this.layerManager.tilesManagers[13], 2021]
    ];

    this.windowCreated();
    this.createdDotElementData();
    this.createBurgerLayer();
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

    let data = this.berlietData;

    //Hide or Show data
    rangeOne.oninput = function(){
      let valueOne = parseInt(this.value * 0.71) + 1950;
      let valueTwo = parseInt(rangeTwo.value * 0.71) + 1950;
      data.forEach(element => {
        if (element[1] < valueOne || element[1] > valueTwo){
          element[0].layer.visible = false;
        }else{
          element[0].layer.visible = true;
        }          
        layerManager.notifyChange();
      }); 
    };

    rangeTwo.oninput = function(){
      let valueTwo = parseInt(this.value * 0.71) + 1950;
      let valueOne = parseInt(rangeOne.value * 0.71) + 1950;
      data.forEach(element => {
        if (element[1] < valueOne || element[1] > valueTwo){
          element[0].layer.visible = false;
        }else{
          element[0].layer.visible = true;
        }          
        layerManager.notifyChange();
      }); 
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

    //Create html element
    this.berlietData.forEach(element => {
      let dotElement = document.createElement('span');
      dotElement.className = 'dot';

      //Transform decimal color in hexa
      let c = new udviz.THREE.Color(); 
      c.set(element[0].color);
      dotElement.style.backgroundColor = '#' + c.getHexString();

      dotElement.style.left = (((element[1] - 1950) * 590) / 71 - 5).toString() + 'px' ;
      document.getElementsByClassName('range-slider container')[0].append(dotElement);
    });
  }

  createBurgerLayer(){
    console.log(this.berlietData[0][0].layer);
    this.berlietData[0][0].layer.onTileContentLoaded = () => {
      // console.log(this.layerManager.tilesManagers[8].layer.object3d.children[0].children.lenght);
      let layer = this.berlietData[0][0].layer;
      if (layer.object3d.children[0].children[0] != undefined){
        console.log(layer.object3d.children[0].children[0]);
        // this.layerManager.tilesManagers[9].layer.object3d.children[0].children[0].translateOnAxis(new udviz.THREE.Vector3(0, 0, 1), 100);
        layer.object3d.children[0].children[0].position.z += 50;
        layer.object3d.children[0].children[0].updateMatrixWorld();
        this.layerManager.notifyChange();
      }
      
    };
  }
}