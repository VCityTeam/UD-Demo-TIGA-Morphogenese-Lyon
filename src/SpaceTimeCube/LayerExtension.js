/** @format */

import './temporalExtension.css';
import './ui-space-time-cube.css';
import $ from 'jquery';
import * as udviz from '@ud-viz/browser/src';
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
   * @param {Array<TemporalProvider>} temporalProviders
   * @param {SparqlWidgetView}  sparqlWidgetView
   */
  constructor(view3D, temporalProviders, sparqlWidgetView) {
    this.layerManager = view3D.layerManager;
    this.view3D = view3D;

    this.listElementDot;

    this.temporalDiv;

    this.temporalProviders = temporalProviders;

    this.transactionsCylinders = [];
    this.constructionTransactionsCylinders = [];
    this.modificationTransactionsCylinders = [];
    this.destructionTransactionsCylinders = [];

    this.tilesManagersSTC = [];

    this.delta = 300;

    this.tilesDates = [];

    this.checkConstruction = false;
    this.checkDestruction = false;
    this.checkModification = false;


    let date = 2009; // hard coded value should be a parameter



    this.tilesDates.push([temporalProviders[0].tilesManager, date]);
    this.tilesManagersSTC.push(temporalProviders[0].tilesManager);

    date += 3;

    for(let i = 1; i < this.temporalProviders.length - 1; i+=3){
      this.tilesDates.push([temporalProviders[i].tilesManager, date]);
      this.tilesManagersSTC.push(temporalProviders[i].tilesManager);

      this.tilesDates.push([temporalProviders[i + 1].tilesManager, date]);
      this.tilesManagersSTC.push(temporalProviders[i + 1].tilesManager);

      date+=3;
    }


    this.rangeData = Math.abs(this.tilesDates[0][1] - this.tilesDates[this.tilesDates.length - 1][1]) / 100;
    
    this.windowCreated();
    this.createdDotElementData();

    this.view3D.layerManager.tilesManagers.forEach(element => {
      element.addEventListener(
        TilesManager.EVENT_TILE_LOADED, () => {
          if (this.layerManager.getTotal3DTilesTileCount() == this.layerManager.getLoaded3DTilesTileCount()){
            this.createSpaceTimeCube();
            // this.displayAllTransaction();

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

    // //Register Style
    // this.unSelectedStyle = new CityObjectStyle({
    //   materialProps: { opacity: 0.2, color: 0xffffff },
    // });

    // this.view3D.layerManager.registerStyle(
    //   'unSelected',
    //   this.unSelectedStyle
    // );
    

    //Ground layer
    this.whiteStyle = new CityObjectStyle({
      materialProps: { opacity: 1, color: 0xffffff },
    });

    this.view3D.layerManager.registerStyle(
      'whiteGround',
      this.whiteStyle
    );

    //Fill style
    this.redFill = new CityObjectStyle({
      materialProps: { opacity: 1, color: 0xff0000 },
    });

    this.view3D.layerManager.registerStyle(
      'redFill',
      this.redFill
    );

    this.modifyFill = new CityObjectStyle({
      materialProps: { opacity: 1, color: 0xffd700 },
    });

    this.view3D.layerManager.registerStyle(
      'modifyFill',
      this.modifyFill
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

    this.createUiSTC();
  
    let viewerDiv = this.view3D.rootHtml;
    this.temporalDiv = document.createElement('div');
    this.temporalDiv.id = 'temporal-updated';
    this.temporalDiv.innerHTML = this.innerContentHtml;

    const temporalTitle = document.createElement('h1');
    temporalTitle.textContent = 'Temporal Slider';

    const temporalUI = document.createElement('div');
    temporalUI.id = 'temporal-ui';
    // this.temporalDiv.innerHTML = this.innerContentHtml;

    temporalUI.append(temporalTitle);
    temporalUI.append(this.temporalDiv);
    
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

  createUiSTC(){
    let viewerDiv = this.view3D.rootHtml;
    const legendDiv = document.createElement('div');
    legendDiv.className = 'ui-space-time-cube';

    legendDiv.innerHTML = `
                          <h1 style="color: white">Legend</h1>
                          <div class="legend-item">
                            <input class="legend-checkbox" type="checkbox" style="background-color: #009900;" name="construction" >
                            <div class="legend-label">Construction</div>
                          </div>
                          <div class="legend-item">
                            <input class="legend-checkbox" type="checkbox" style="background-color: #ff0000;" name="demolition" >
                            <div class="legend-label">Demolition</div>
                          </div>
                          <div class="legend-item">
                            <input class="legend-checkbox" type="checkbox" style="background-color: #ffd700;" name="modify" >
                            <div class="legend-label">Modify</div>
                          </div>`;
    
    viewerDiv.append(legendDiv);

    let checkboxs = document.getElementsByClassName('legend-checkbox');
    checkboxs[0].addEventListener('change', () => { 
      if (checkboxs[0].checked){
        this.checkConstruction = true;
        this.displayAllTransaction();
      } else {
        this.checkConstruction = false;
        this.removeAllConstructionTransactionsCylinders();
      }
    });

    checkboxs[1].addEventListener('change', () => { 
      if (checkboxs[1].checked){
        this.checkDestruction = true;
        this.displayAllTransaction();
      } else {
        this.checkDestruction = false;
        this.removeAllDestructionTransactionsCylinders();
      }
    });

    checkboxs[2].addEventListener('change', () => { 
      if (checkboxs[2].checked){
        this.checkModification = true;
        this.displayAllTransaction();
      } else {
        this.checkModification = false;
        this.removeAllModificationTransactionsCylinders();
      }
    });


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
      let c = new udviz.THREE.Color(); 
      c.set(element[0].color);
      dotElement.style.backgroundColor = '#' + c.getHexString();
      
      dotElement.style.left = ((element[1] - this.tilesDates[0][1]) * 98) / (this.rangeData * 100).toString() + '%' ;
      document.getElementsByClassName('range-slider container')[0].append(dotElement);
    });
  }

  /**
   * Create layer in height
   */
  createSpaceTimeCube(){
    let maxHeightLayers = this.delta;
    let currentTime = 2009;

    //Set style layer 0
    this.tilesManagersSTC[0].tiles.forEach( tile => {
      this.tilesManagersSTC[0].setStyleToTile(tile.tileId, this.whiteStyle);
      this.tilesManagersSTC[0].applyStyles(); 
    });

    const objectLayer = this.layerManager.tilesManagers[0].tiles[0].layer.root.children[0];
    let positionText = new udviz.THREE.Vector3(objectLayer.position.x - 600 , objectLayer.position.y, objectLayer.position.z);
    this.addTextInScene(currentTime.toString(), positionText);
    currentTime += 3;

    for(let i = 3; i < this.temporalProviders.length; i+=3){

      let layer = this.temporalProviders[i].tilesManager.layer;
      this.setPositionLayer(layer, maxHeightLayers);

      layer = this.temporalProviders[i - 1].tilesManager.layer;
      this.setPositionLayer(layer, maxHeightLayers);

      layer = this.temporalProviders[i - 2].tilesManager.layer;
      this.setPositionLayer(layer, maxHeightLayers);
      
      positionText = new udviz.THREE.Vector3(objectLayer.position.x - 600 , objectLayer.position.y, objectLayer.position.z + maxHeightLayers);
      this.addTextInScene(currentTime.toString(), positionText);
      currentTime += 3;
      maxHeightLayers += this.delta;
    }

    // this.temporalProviders.forEach(temporalProvider => {
    //   const layer = temporalProvider.tilesManager.layer;
    //   layer.root.children.forEach(object => {
    //     // Height
    //     object.position.z += maxHeightLayers;
    //     const centroidBB = new udviz.THREE.Vector3();
    //     object.boundingVolume.box.getCenter(centroidBB);
    //     object.updateMatrixWorld();
    //   });
    //   const objectLayer = this.layerManager.tilesManagers[0].tiles[0].layer.root.children[0];
    //   const positionText = new udviz.THREE.Vector3(objectLayer.position.x - 600 , objectLayer.position.y, objectLayer.position.z + maxHeightLayers);
    //   this.addTextInScene(currentTime.toString(), positionText);
    //   currentTime += 1;
    //   maxHeightLayers += 150;
    // });
  } 

  setPositionLayer(layer, maxHeightLayers){
    layer.root.children.forEach(object => {
      // Height
      object.position.z += maxHeightLayers;
      const centroidBB = new udviz.THREE.Vector3();
      object.boundingVolume.box.getCenter(centroidBB);
      object.updateMatrixWorld();
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
    let height = this.delta;

    this.removeAllTransactionsCylinders();
    let indexCO = 0;
    for (let i = 0 ; i < this.temporalProviders.length - 1; i+=3) {
      const temporalProvider = this.temporalProviders[i];
      const CO = listOfCityObjects[indexCO];
      if (!CO)
        return;
      
      // let transactionType = temporalProvider.COStyles.get(this.temporalProviders[i].currentTime).get(CO.cityObjectId.tileId)[CO.cityObjectId.batchId];
      // this.createTransactionLine(transactionType, CO, height);
      let tilesManager;
      let cityObjectBefore;
      if (indexCO != 0){
        tilesManager = this.temporalProviders[i].tilesManager;
        cityObjectBefore = listOfCityObjects[indexCO - 1];
      }

      let transactionType = this.temporalProviders[i + 1].COStyles.get(this.temporalProviders[i + 1].currentTime).get(CO.cityObjectId.tileId)[CO.cityObjectId.batchId];
      this.createTransactionLine(transactionType, CO, height, tilesManager, cityObjectBefore);

      transactionType = this.temporalProviders[i + 2].COStyles.get(this.temporalProviders[i + 2].currentTime).get(CO.cityObjectId.tileId)[CO.cityObjectId.batchId];
      this.createTransactionLine(transactionType, CO, height, tilesManager, cityObjectBefore);

      height += this.delta;
      indexCO++;
    }
  }

  /**
   * Display all the transaction lines
   */
  displayAllTransaction(){
    let height = this.delta;
    for (let j = 0; j < this.temporalProviders.length - 1; j+=3){
      // let tiles = this.temporalProviders[j].COStyles.get(this.temporalProviders[j].currentTime);
      // this.loopTiles(tiles);

      let tiles = this.temporalProviders[j + 1].COStyles.get(this.temporalProviders[j + 1].currentTime);
      this.loopTiles(tiles, height);

      tiles = this.temporalProviders[j + 2].COStyles.get(this.temporalProviders[j + 2].currentTime);
      this.loopTiles(tiles, height);

      height+=this.delta;
    }
    
  }

  loopTiles(tiles, height) {
    for ( let tileId = 0 ; tileId < tiles.size; tileId++) {
      const tileDisplayStates = tiles.get(tileId + 1);
      for (let i = 0; i < tileDisplayStates.length; i++) {
        this.layerManager.tilesManagers.forEach( tileManager => {
          const cityObject = tileManager.getCityObject(new CityObjectID(tileId + 1, i));
          // tileManager.tiles[tileId]
          if (cityObject){
            this.createAllTransactionsLine(tileDisplayStates[i], cityObject, height);   
          }
        });
      }
    }
  }

  /**
   * With the transaction types create the corect line with color
   * @param {string} transactionType 
   * @param {CityObject} cityObject
   * @param {number} height
   * @param {TilesManager} tilesManages_before
   * @param {CityObject} CO_before
   */
  createTransactionLine(transactionType, cityObject, height, tilesManager_before, CO_before){
    
    let material;  
    let styleTransaction;
    
    switch (transactionType) {
      case 'creation':
        material = new udviz.THREE.MeshPhongMaterial( {color: 'green', opacity: 0.2} );
        this.addCyclinderTransaction(cityObject, material, height);
        break;
      case 'demolition':
        material = new udviz.THREE.MeshPhongMaterial( {color: 'red', opacity: 0.2} );
        // positionTransaction = -75;
        this.addCyclinderTransaction(cityObject, material, height);
        styleTransaction = this.redFill;
        break;
      case 'modification':
        material = new udviz.THREE.MeshPhongMaterial( {color: 'yellow', opacity: 1} );
        this.addCyclinderTransaction(cityObject, material, height);
        styleTransaction = this.modifyFill;
        break;
      case 'noTransaction':
        material = new udviz.THREE.MeshPhongMaterial( {color: 'white', opacity: 1} );
        this.addCyclinderTransaction(cityObject, material, height);
        break;
      case 'hide':
        material = new udviz.THREE.MeshPhongMaterial( {color: 'white', opacity: 0} );
        material.transparent = true;
        this.addCyclinderTransaction(cityObject, material, height);
        break;
      default:
        break;
    }
    // console.log(tilesManager_before, styleTransaction);
    if (tilesManager_before && styleTransaction){
      this.applyStyletoCOTemporalLevel(CO_before, tilesManager_before, styleTransaction);
    }
  }

  /**
   * 
   * @param {CityObject} cityObject 
   * @param {TilesManager} tilesManager 
   * @param {CityObjectStyle} style
   */
  applyStyletoCOTemporalLevel(cityObject, tilesManager, style){
    tilesManager.setStyle(cityObject.cityObjectId, style);
    tilesManager.applyStyles(); 
  }

  addCyclinderTransaction(cityObject, material, height){
    // const cylinderDistance = Math.abs(c height);
    const geometry = new udviz.THREE.CylinderGeometry( 2, 2, this.delta , 16);
    
    const cylinder = new udviz.THREE.Mesh( geometry, material );
    cylinder.position.set(cityObject.centroid.x, cityObject.centroid.y, (height - (this.delta / 2)) + cityObject.centroid.z);
    cylinder.setRotationFromAxisAngle(new udviz.THREE.Vector3(1, 0, 0), 1.5708);
    cylinder.updateMatrixWorld();
    this.transactionsCylinders.push(cylinder);
    this.view3D.getScene().add( cylinder );
  }

  createAllTransactionsLine(transactionType, cityObject, height){
    let material;
    const geometry = new udviz.THREE.CylinderGeometry( 2, 2, height - 10, 16);

    if (transactionType == 'demolition' && this.checkDestruction){
      material = new udviz.THREE.MeshPhongMaterial( {color: 'red', opacity: 1} );
      const cylinder = new udviz.THREE.Mesh( geometry, material );
      this.destructionTransactionsCylinders.push(cylinder);

      cylinder.position.set(cityObject.centroid.x, cityObject.centroid.y, (height  / 2) + cityObject.centroid.z);
      cylinder.setRotationFromAxisAngle(new udviz.THREE.Vector3(1, 0, 0), 1.5708);
      cylinder.updateMatrixWorld();
      this.view3D.getScene().add( cylinder );

    } else if (transactionType == 'modification' && this.checkModification){
      material = new udviz.THREE.MeshPhongMaterial( {color: 'yellow', opacity: 1} );
      const cylinder = new udviz.THREE.Mesh( geometry, material );
      this.modificationTransactionsCylinders.push(cylinder);

      cylinder.position.set(cityObject.centroid.x, cityObject.centroid.y, (height  / 2) + cityObject.centroid.z);
      cylinder.setRotationFromAxisAngle(new udviz.THREE.Vector3(1, 0, 0), 1.5708);
      cylinder.updateMatrixWorld();
      this.view3D.getScene().add( cylinder );

    } else if (transactionType == 'creation' && this.checkConstruction){
      material = new udviz.THREE.MeshPhongMaterial( {color: 'green', opacity: 1} );
      const cylinder = new udviz.THREE.Mesh( geometry, material );
      this.constructionTransactionsCylinders.push(cylinder);

      cylinder.position.set(cityObject.centroid.x, cityObject.centroid.y, (height  / 2) + cityObject.centroid.z);
      cylinder.setRotationFromAxisAngle(new udviz.THREE.Vector3(1, 0, 0), 1.5708);
      cylinder.updateMatrixWorld();
      this.view3D.getScene().add( cylinder );
    } 
  }

  /**
   * @param {CityObject} cityObjectSelected 
   * @returns {Array<CityObject>} cityObjects
   */
  getGmlIdsfromSelectedCO(cityObjectSelected){
    let cityObjects = [];
    this.layerManager.tilesManagers.forEach( tiles => {
      cityObjects = cityObjects.concat(tiles.pickCityObjectsByBatchTable('gml_id', cityObjectSelected.props.gml_id));
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
      // if (currentTime == 2018) //To-Do hard coded value / need to be a variable
      //   return;
      transactionsFromGmlId.set(currentTime + 1, gml_id);
      transactionsFromGmlId.set(currentTime + 2, gml_id);
      currentTime += 3;
    });
    // console.log(transactionsFromGmlId);
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
    
    return listCOTransaction;
  }

  removeAllTransactionsCylinders(){
    if (this.transactionsCylinders){
      this.transactionsCylinders.forEach(cylinder => {
        this.view3D.getScene().remove(cylinder);
      });
    }
    this.removeAllConstructionTransactionsCylinders();
    this.removeAllDestructionTransactionsCylinders();
    this.removeAllModificationTransactionsCylinders();
  }

  removeAllConstructionTransactionsCylinders(){
    if (this.constructionTransactionsCylinders){
      this.constructionTransactionsCylinders.forEach(cylinder => {
        this.view3D.getScene().remove(cylinder);
      });
    }
  }

  removeAllDestructionTransactionsCylinders(){
    if (this.destructionTransactionsCylinders){
      this.destructionTransactionsCylinders.forEach(cylinder => {
        this.view3D.getScene().remove(cylinder);
      });
    }
  }
  removeAllModificationTransactionsCylinders(){
    if (this.modificationTransactionsCylinders){
      this.modificationTransactionsCylinders.forEach(cylinder => {
        this.view3D.getScene().remove(cylinder);
      });
    }
  }
}