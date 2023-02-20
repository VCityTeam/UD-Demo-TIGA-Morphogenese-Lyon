/** @format */

//Components
// import { Window } from '../node_modules/ud-viz/src/Components/GUI/js/Window';
// import { LayerManager } from 'ud-viz/src/Components/LayerManager/LayerManager';
import './temporalExtension.css';
import $ from 'jquery';
import * as udviz from 'ud-viz';
import { TilesManager } from 'ud-viz/src/Components/Components';
import { CityObjectID } from 'ud-viz/src/Components/3DTiles/Model/CityObject';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

export class LayerExtension {
  /**
   * Creates the layer choice windows
   *
   * @param {udviz.Views} layerManager
   * @param {Array<TemporalProvider>} listTemporalProvider
   */
  constructor(view3D, listTemporalProvider) {

    /**
     * the layerManager
     */
    this.layerManager = view3D.layerManager;
    this.view3D = view3D;

    this.listElementDot;

    this.temporalDiv;

    this.listTemporalProvider = listTemporalProvider;

    
    this.berlietData = [[this.layerManager.tilesManagers[0], 2009],
      [this.layerManager.tilesManagers[1], 2010],
      // [this.layerManager.tilesManagers[2], 2011],
      // [this.layerManager.tilesManagers[3], 2012],
      // [this.layerManager.tilesManagers[4], 1993],
      // [this.layerManager.tilesManagers[5], 2021]
    ];

    this.rangeData = Math.abs(this.berlietData[0][1] - this.berlietData[this.berlietData.length - 1][1]) / 100;
    
    this.windowCreated();
    this.createdDotElementData();

    this.view3D.layerManager.tilesManagers.forEach(element => {
      element.addEventListener(
        TilesManager.EVENT_TILE_LOADED, () => {
          if (this.layerManager.getTotal3DTilesTileCount() == this.layerManager.getLoaded3DTilesTileCount())
            this.createBurgerLayer();
        }
        
      );
    });    
    // this.createBurgerLayer();
  }

  get innerContentHtml() {
    return /*html*/ `
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

  windowCreated() {
  
    let viewerDiv = document.getElementById('root_View3D');
    this.temporalDiv = document.createElement('div');
    this.temporalDiv.id = 'temporal-updated';
    this.temporalDiv.innerHTML = this.innerContentHtml;
    
    viewerDiv.append(this.temporalDiv);

    let olderData = this.berlietData[0][1];
    let rangeData = this.rangeData;

    let rangeOne = document.querySelector('input[name="rangeOne"]'),
      rangeTwo = document.querySelector('input[name="rangeTwo"]'),
      outputOne = document.querySelector('.outputOne'),
      outputTwo = document.querySelector('.outputTwo'),
      inclRange = document.querySelector('.incl-range'),
      updateView = function () {

        if (this.getAttribute('name') === 'rangeOne') {
          outputOne.innerHTML =  parseInt(this.value * rangeData) + olderData;
          outputOne.style.left = this.value / this.getAttribute('max') * 100 + '%';
        } else {
          outputTwo.style.left = this.value / this.getAttribute('max') * 100 + '%';
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
      let valueOne = parseInt(this.value * this.rangeData) + this.berlietData[0][1];
      let valueTwo = parseInt(rangeTwo.value * this.rangeData) + this.berlietData[0][1];
      this.berlietData.forEach(element => {
        if (element[1] < valueOne || element[1] > valueTwo){
          element[0].layer.visible = false;
        }else{
          element[0].layer.visible = true;
        }          
        this.layerManager.notifyChange();
      }); 
    };

    rangeTwo.oninput = () => {
      let valueTwo = parseInt(this.value * this.rangeData) + this.berlietData[0][1];
      let valueOne = parseInt(rangeOne.value * this.rangeData) + this.berlietData[0][1];
      this.berlietData.forEach(element => {
        if (element[1] < valueOne || element[1] > valueTwo){
          element[0].layer.visible = false;
        }else{
          element[0].layer.visible = true;
        }          
        this.layerManager.notifyChange();
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

      dotElement.style.left = (((element[1] - this.berlietData[0][1]) * 590) / (this.rangeData * 100) - 5).toString() + 'px' ;
      document.getElementsByClassName('range-slider container')[0].append(dotElement);
    });
  }

  createBurgerLayer(){

    let maxHeightLayers = 0;
    this.layerManager.tilesManagers.forEach(element => {
      const layer = element.layer;
      layer.root.children.forEach(object => {
        object.position.z += maxHeightLayers;
        object.updateMatrixWorld();
      });
      maxHeightLayers += 150;
    });

    // let materialText = new udviz.THREE.MeshPhongMaterial( { color: 'red', flatShading: true } );
    
    //Create lines
    let height = 0;
    let materialText;
    this.listTemporalProvider.forEach(temporalProvider => { // Parcours des provider
      const tiles = temporalProvider.COStyles.get(temporalProvider.currentTime);
      for ( let tileId = 0 ; tileId < tiles.size; tileId++) {
        const tileDisplayStates = tiles.get(tileId + 1);
        for (let i = 0; i < tileDisplayStates.length; i++) {
          this.layerManager.tilesManagers.forEach( tileManager => {
            const cityObject = tileManager.getCityObject(new CityObjectID(tileId + 1, i));
            // tileManager.tiles[tileId]
            if (cityObject){
              let material;
              const COCentroid = cityObject.centroid;
              const points = [];
              points.push( new udviz.THREE.Vector3(COCentroid.x, COCentroid.y, COCentroid.z + height) );
              points.push( new udviz.THREE.Vector3( COCentroid.x, COCentroid.y, COCentroid.z + 150 + height) );
              
              const geometry = new udviz.THREE.BufferGeometry().setFromPoints( points );
              let text = '';
              
              if (tileDisplayStates[i] == 'creation'){
                text = 'creation';
                //create a blue LineBasicMaterial
                material = new udviz.THREE.LineBasicMaterial( { color: 'green' } );
                // materialText = new udviz.THREE.MeshPhongMaterial( { color: 'green', flatShading: true } );
                const line = new udviz.THREE.Line( geometry, material );
                // this.view3D.getScene().add( line );
                
              } else if (tileDisplayStates[i] == 'demolition') {
                
                //Text
                text = 'demolition';
                material = new udviz.THREE.LineBasicMaterial( { color: 'red' } );
                materialText = new udviz.THREE.MeshPhongMaterial( { color: 'red', flatShading: true } );
                const line = new udviz.THREE.Line( geometry, material );
                this.view3D.getScene().add( line );
                //LOAD FONT
                const loader = new FontLoader();
                loader.load( './../../assets/font/helvetiker_regular.typeface.json', ( response ) => {
                  let textGeo = new TextGeometry( text, {
      
                    font: response,
                    
                    size: 20,
                    height: 20,
                    curveSegments: 4,
                    
                    bevelThickness: 2,
                    bevelSize: 1.5,
                    bevelEnabled: true
                    
                  } );
                  textGeo.computeBoundingBox();
                  const centerOffset = - 0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );
                  let textMesh = new udviz.THREE.Mesh( textGeo, materialText );
                  textMesh.position.set(COCentroid.x + centerOffset, COCentroid.y, COCentroid.z + 300);
                  textMesh.rotation.x = 90 * (Math.PI/180);
                  // textMesh.rotation.z = 90;
                  textMesh.scale.multiplyScalar(1);
                  textMesh.updateMatrixWorld();
                  // console.log(textMesh);
                  this.view3D.getScene().add(textMesh);
                 
                } );
                // this.view3D.getScene().add( line );
              // } else if ( tileDisplayStates[i] == 'modification' ){
              //   //create a red LineBasicMaterial
              //   material = new udviz.THREE.LineBasicMaterial( { color: 'yellow' } );
              //   const line = new udviz.THREE.Line( geometry, material );
              //   this.view3D.getScene().add( line );
              }

              
            }
            // if (cityObject)
          });
          // this.setCityObjectStyle(tileId, i, tileDisplayStates[i]);
        }
      }
      height+=150;
    });

        
  } 
}