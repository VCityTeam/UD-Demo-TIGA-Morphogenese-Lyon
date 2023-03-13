/** @format */

//Components
// import { Window } from '../node_modules/ud-viz/src/Components/GUI/js/Window';
// import { LayerManager } from 'ud-viz/src/Components/LayerManager/LayerManager';
import './temporalExtension.css';
import $ from 'jquery';
import * as udviz from '../../UD-Viz/packages/browser/src';
import { TilesManager } from '@ud-viz/browser/src/Component/Itowns/Itowns';
import { CityObject, CityObjectID } from '@ud-viz/browser/src/Component/Itowns/3DTiles/Model/CityObject';
import { CityObjectStyle } from '@ud-viz/browser/src/Component/Itowns/3DTiles/Model/CityObjectStyle';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { getUriLocalname } from '@ud-viz/browser/src/Component/Widget/Server/SPARQL/Model/URI';
import { SparqlWidgetView } from '@ud-viz/browser/src/Component/Widget/Server/Server';


export class LayerExtension {
  /**
   * Creates the layer choice windows
   *
   * @param {udviz.Frame3DPlanar} view3D
   * @param {Array<TemporalProvider>} listTemporalProvider
   * @param {SparqlWidgetView}  sparqlWidgetView
   */
  constructor(view3D, listTemporalProvider, sparqlWidgetView) {
    this.layerManager = view3D.layerManager;
    this.view3D = view3D;

    this.listElementDot;

    this.temporalDiv;

    this.listTemporalProvider = listTemporalProvider;

    this.listTilesDates = [];
    let date = 2009; // hard coded value should be a parameter
    this.listTemporalProvider.forEach( temporalProvider => {
      this.listTilesDates.push([temporalProvider.tilesManager,date]);
      date+=1;
    });

    this.rangeData = Math.abs(this.listTilesDates[0][1] - this.listTilesDates[this.listTilesDates.length - 1][1]) / 100;
    
    this.windowCreated();
    this.createdDotElementData();

    this.view3D.layerManager.tilesManagers.forEach(element => {
      element.addEventListener(
        TilesManager.EVENT_TILE_LOADED, () => {
          if (this.layerManager.getTotal3DTilesTileCount() == this.layerManager.getLoaded3DTilesTileCount()){
            this.createSpaceTimeCube();

            //EVENT
            const clickListener = (event) => {
              const cityObject = this.layerManager.pickCityObject(event);

              if (cityObject){
                // Get transaction chain
                sparqlWidgetView.window.sparqlProvider.addEventListener(udviz.Widget.Server.SparqlEndpointResponseProvider.EVENT_ENDPOINT_RESPONSE_UPDATED,
                  (response) =>
                    this.selectionCityObjectSTC(this.parseSPARQLrequete(response))
                );
                sparqlWidgetView.window.getTransactionChain(cityObject.props.gml_id);
              }

            };
            const viewerDiv = document.getElementById('viewerDiv');
            viewerDiv.addEventListener('mousedown', clickListener);
            
          }
        }
      );
    });

    //Register Style
    this.unSelectedStyle = new CityObjectStyle({
      materialProps: { opacity: 0.1, color: 0xffffff },
    });

    this.testStyle = new CityObjectStyle({
      materialProps: { opacity: 1, color: 0xffffff },
    });

    this.view3D.layerManager.registerStyle(
      'unSelected',
      this.unSelectedStyle
    );
    
    this.view3D.layerManager.registerStyle(
      'test',
      this.testStyle
    );

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

  /**
   * Create UI
   */
  windowCreated() {
  
    let viewerDiv = this.view3D.rootHtml;
    this.temporalDiv = document.createElement('div');
    this.temporalDiv.id = 'temporal-updated';
    this.temporalDiv.innerHTML = this.innerContentHtml;
    
    viewerDiv.append(this.temporalDiv);

    let olderData = this.listTilesDates[0][1];
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
      let valueOne = parseInt(rangeOne.value * this.rangeData) + this.listTilesDates[0][1];
      let valueTwo = parseInt(rangeTwo.value * this.rangeData) + this.listTilesDates[0][1];
      this.listTilesDates.forEach(element => {
        if (element[1] < valueOne || element[1] > valueTwo){
          element[0].layer.visible = false;
        }else{
          element[0].layer.visible = true;
        }          
        this.layerManager.notifyChange();
      }); 
    };

    rangeTwo.oninput = () => {
      let valueTwo = parseInt(rangeTwo.value * this.rangeData) + this.listTilesDates[0][1];
      let valueOne = parseInt(rangeOne.value * this.rangeData) + this.listTilesDates[0][1];
      this.listTilesDates.forEach(element => {
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

  /**
   * Create DOT in the temporal slider
   */
  createdDotElementData(){

    //Create html element
    this.listTilesDates.forEach(element => {
      let dotElement = document.createElement('span');
      dotElement.className = 'dot';

      //Transform decimal color in hexa
      let c = new udviz.THREE.Color(); 
      c.set(element[0].color);
      dotElement.style.backgroundColor = '#' + c.getHexString();

      dotElement.style.left = (((element[1] - this.listTilesDates[0][1]) * 590) / (this.rangeData * 100) - 5).toString() + 'px' ;
      document.getElementsByClassName('range-slider container')[0].append(dotElement);
    });
  }

  /**
   * Create layer in height
   */
  createSpaceTimeCube(){
    let maxHeightLayers = 0;
    let currentTime = 2009;
    this.listTemporalProvider.forEach(temporalProvider => {
      const layer = temporalProvider.tilesManager.layer;
      layer.root.children.forEach(object => {
        // Height
        object.position.z += maxHeightLayers;
        const centroidBB = new udviz.THREE.Vector3();
        object.boundingVolume.box.getCenter(centroidBB);
        object.updateMatrixWorld();
      });
      const objectLayer = this.layerManager.tilesManagers[0].tiles[0].layer.root.children[0];
      const positionText = new udviz.THREE.Vector3(objectLayer.position.x - 400 , objectLayer.position.y, objectLayer.position.z + maxHeightLayers);
      this.addTextInScene(currentTime.toString(), positionText);
      currentTime += 1;
      maxHeightLayers += 150;
    });
  } 

  /**
   * Add text next to layer in the Space Time Cube
   * @param {string} text 
   * @param {udviz.THREE.Vector3} position 
   */
  addTextInScene(text, position){
    //Text
    let materialText = new udviz.THREE.MeshPhongMaterial( { color: 'red', flatShading: true } );
    const loader = new FontLoader();
    loader.load( './../../assets/font/helvetiker_regular.typeface.json', ( response ) => {
      let textGeo = new TextGeometry( text, {
                 
        font: response,
                 
        size: 20,
        height: 5,
        curveSegments: 1,
                 
        bevelThickness: 2,
        bevelSize: 1.5,
        bevelEnabled: false
                 
      } );
      textGeo.computeBoundingBox();
      // const centerOffset = - 0.5 * ( object.boundingVolume.box.max.x - object.boundingVolume.box.min.x );
      let textMesh = new udviz.THREE.Mesh( textGeo, materialText );
      textMesh.position.set(position.x, position.y, position.z);
      textMesh.rotation.x = 90 * (Math.PI/180);

      textMesh.scale.multiplyScalar(1);
      textMesh.updateMatrixWorld();
      this.view3D.getScene().add(textMesh);
               
    });
  }

  /**
   * Le cityobject doit changer en fonction de son layerTemporel car il change de GMLID
   * @param {Array<CityObject>} listOfCityObjects 
   */
  selectionCityObjectSTC(listOfCityObjects){
    if (!listOfCityObjects)
      return;

    //Create lines
    let height = 0;

    let index = 0;
    this.listTemporalProvider.forEach(temporalProvider => {
      const CO = listOfCityObjects[index];
      if (!CO)
        return;

      this.setStyleSelectionSTC(listOfCityObjects, temporalProvider.tilesManager); //Apply style

      //Here change how to select CO
      const transactionType = temporalProvider.COStyles.get(temporalProvider.currentTime).get(CO.cityObjectId.tileId)[CO.cityObjectId.batchId];
      this.createTransactionLine(transactionType, CO, height);

      index++;
      height += 150;
    });
  }

  /**
   * Display all the transaction lines
   */
  displayAllTransaction(){
    let height = 0;
    this.listTemporalProvider.forEach(temporalProvider => { // Parcours des provider
      const tiles = temporalProvider.COStyles.get(temporalProvider.currentTime);
      for ( let tileId = 0 ; tileId < tiles.size; tileId++) {
        const tileDisplayStates = tiles.get(tileId + 1);
        for (let i = 0; i < tileDisplayStates.length; i++) {
          this.layerManager.tilesManagers.forEach( tileManager => {
            const cityObject = tileManager.getCityObject(new CityObjectID(tileId + 1, i));
            // tileManager.tiles[tileId]
            if (cityObject){
              this.createTransactionLine(tileDisplayStates[i], cityObject, height);   
            }
          });
        }
      }
      height+=150;
    }); 
  }

  /**
   * With the transaction types create the corect line with color
   * @param {string} transactionType 
   * @param {CityObject} cityObject
   * @param {number} height
   */
  createTransactionLine(transactionType, cityObject, height){

    const points = [];
    points.push( new udviz.THREE.Vector3(cityObject.centroid.x, cityObject.centroid.y, cityObject.centroid.z + height) );
    let geometry;
    let material;
    switch (transactionType) {
      case 'creation':
        //Line
        points.push( new udviz.THREE.Vector3( cityObject.centroid.x, cityObject.centroid.y, cityObject.centroid.z + 150 + height) );
        geometry = new udviz.THREE.BufferGeometry().setFromPoints( points );
        material = new udviz.THREE.LineBasicMaterial( { color: 'green' } );
        break;
      case 'demolition':
        //Line
        points.push( new udviz.THREE.Vector3( cityObject.centroid.x, cityObject.centroid.y, cityObject.centroid.z - 150 + height) );
        geometry = new udviz.THREE.BufferGeometry().setFromPoints( points );
        material = new udviz.THREE.LineBasicMaterial( { color: 'red' } );
        break;
      case 'modification':
        //Line
        points.push( new udviz.THREE.Vector3( cityObject.centroid.x, cityObject.centroid.y, cityObject.centroid.z + 150 + height) );
        geometry = new udviz.THREE.BufferGeometry().setFromPoints( points );
        material = new udviz.THREE.LineBasicMaterial( { color: 'yellow' } );
        break;
      case 'noTransaction':
        //Line
        points.push( new udviz.THREE.Vector3( cityObject.centroid.x, cityObject.centroid.y, cityObject.centroid.z + 150 + height) );
        geometry = new udviz.THREE.BufferGeometry().setFromPoints( points );
        material = new udviz.THREE.LineBasicMaterial( { color: 'white' } );
        break;
      case 'union':
        //Line
        points.push( new udviz.THREE.Vector3( cityObject.centroid.x, cityObject.centroid.y, cityObject.centroid.z + 150 + height) );
        geometry = new udviz.THREE.BufferGeometry().setFromPoints( points );
        material = new udviz.THREE.LineBasicMaterial( { color: 'blue' } );
        break;
    
      default:
        break;
    }
    const line = new udviz.THREE.Line( geometry, material ); 
    this.view3D.getScene().add( line );
  }

  /**
   * Set transparent around selected CO
   * @param {Array<CityObject>} COChain
   * @param {TilesManager} tilesManager
   */
  setStyleSelectionSTC(COChain, tilesManager){
    tilesManager.tiles.forEach( tile => {
      if (!tile.cityObjects)
        return;
      if (tile.tileId != COChain[0].cityObjectId.tileId) {
        // tilesManager.setStyle(cityObject.cityObjectId, this.unSelectedStyle);
        tilesManager.setStyleToTile(tile.tileId, this.unSelectedStyle);
        tilesManager.applyStyles(); 

      }
    });
    const tile = tilesManager.tiles[COChain[0].cityObjectId.tileId];
    tile.cityObjects.forEach(CO => {
      COChain.forEach(selectedCO => {
        if (CO.cityObjectId.equal(selectedCO.cityObjectId)){
          tilesManager.setStyle(CO.cityObjectId, this.testStyle);
          tilesManager.applyStyles(); 
        } else {
          tilesManager.setStyleToTile(tile.tileId, this.unSelectedStyle);
          tilesManager.applyStyles(); 
        }
      });

    });
    
  }

  /**
   * @param {CityObject} cityObjectSelected 
   * @returns {Array<CityObject>} cityObjects
   */
  getGmlIdsfromSelectedCO(cityObjectSelected){
    let cityObjects = [];
    this.layerManager.tilesManagers.forEach( tiles => {
      cityObjects = cityObjects.concat(tiles.pickCityObjectsByBatchTable('gml_id', cityObjectSelected.props.gml_id));
      //AMELIORATION
    });

    return cityObjects;
  }

  /**
   * 
   * @param {JSON} query 
   * @returns {Map} Map of transactions chain
   */
  parseSPARQLrequete(query) {
    let transactionsFromGmlId = new Map(); 
    const allgmlID = Object.entries(query.results.bindings[0]);
    let currentTime = 2009;
    allgmlID.forEach( element => {
      const gml_id = getUriLocalname(element[1].value);
      transactionsFromGmlId.set(currentTime, gml_id);
      if (currentTime == 2018) //To-Do hard coded value / need to be a variable
        return;
      transactionsFromGmlId.set(currentTime + 1, gml_id);
      transactionsFromGmlId.set(currentTime + 2, gml_id);
      currentTime += 3;
    });
    console.log(transactionsFromGmlId);
    return this.getCityObjectFromListOfGmlId(transactionsFromGmlId);
  }

  /**
   * Get all CityObject with gml ID
   * @param {Map}
   */
  getCityObjectFromListOfGmlId(listOfGmlId) {
    let listCOTransaction = [];
    listOfGmlId.forEach( gml_id => {
      const CO = this.layerManager.pickCityObjectByBatchTable('gml_id', gml_id);
      if (!CO)
        return;
      listCOTransaction.push(CO);
    });
    console.log(listCOTransaction);
    return listCOTransaction;
  }
}