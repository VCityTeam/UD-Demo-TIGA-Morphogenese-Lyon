/** @format */

import * as udviz from '@ud-viz/browser/src';
import { TilesManager } from '@ud-viz/browser/src/Component/Itowns/Itowns';
import { CityObject, CityObjectID } from '@ud-viz/browser/src/Component/Itowns/3DTiles/Model/CityObject';
import { CityObjectStyle } from '@ud-viz/browser/src/Component/Itowns/3DTiles/Model/CityObjectStyle';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { getUriLocalname } from '@ud-viz/browser/src/Component/Widget/Server/SPARQL/Model/URI';
import { SparqlWidgetView } from '@ud-viz/browser/src/Component/Widget/Server/Server';
import { TemporalLevel } from './TemporalLevel';


export class SpaceTimeCube {
  /**
   * Creates the layer choice windows
   *
   * @param {udviz.Frame3DPlanar} view3D
   * @param {Array<TemporalLevel>} temporalLevels
   * @param {SparqlWidgetView}  sparqlWidgetView
   */
  constructor(view3D, temporalLevels, sparqlWidgetView) {
    this.layerManager = view3D.layerManager;
    this.view3D = view3D;

    this.temporalLevels = temporalLevels;

    this.transactionsCylinders = [];
    this.constructionTransactionsCylinders = [];
    this.modificationTransactionsCylinders = [];
    this.destructionTransactionsCylinders = [];


    this.tilesManagersSTC = [];

    this.tilesDated = [];

    this.checkConstruction = false;
    this.checkDestruction = false;
    this.checkModification = false;

    this.delta = 300;
    let date = 2009; // hard coded value should be a parameter

    this.tilesManagersSTC.push(temporalLevels[0].temporalProvider.tilesManager);
    this.tilesDated.push([temporalLevels[0].temporalProvider.tilesManager, date]);

    this.initCOStyle();

    for(let i = 3; i < this.temporalLevels.length; i+=3){
      date+=3;
      this.tilesDated.push([temporalLevels[i].temporalProvider.tilesManager, date]);
      this.tilesManagersSTC.push(temporalLevels[i].temporalProvider.tilesManager);

      this.tilesDated.push([temporalLevels[i - 1].temporalProvider.tilesManager, date]);
      this.tilesManagersSTC.push(temporalLevels[i - 1].temporalProvider.tilesManager);

      this.tilesDated.push([temporalLevels[i - 2].temporalProvider.tilesManager, date]);
      this.tilesManagersSTC.push(temporalLevels[i - 2].temporalProvider.tilesManager);
    }

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
  }

  /**
   * Create Space time cube representation
   */
  createSpaceTimeCube(){
    let temporalHeight = this.delta;
    let currentTime = this.temporalLevels[0].date; //older millesime data

    // Set the color of the ground layer in blank
    this.tilesManagersSTC[0].styleManager.registeredStyles.noTransaction.materialProps.opacity = 1;
    this.temporalLevels[0].temporalProvider.changeVisibleTilesStates();

    const objectLayer = this.layerManager.tilesManagers[0].tiles[0].layer.root.children[0];
    let positionText = new udviz.THREE.Vector3(objectLayer.position.x - 1200 , objectLayer.position.y, objectLayer.position.z);
    this.addTextInScene(currentTime.toString(), positionText);
    currentTime += 3; // Text integration

    for(let i = 3; i < this.temporalLevels.length; i+=3){

      let layer = this.temporalLevels[i].temporalProvider.tilesManager.layer;
      this.temporalLevels[i].setPosition(new udviz.THREE.Vector3(0, 0, temporalHeight));

      layer = this.temporalLevels[i - 1].temporalProvider.tilesManager.layer;
      this.temporalLevels[i - 1].setPosition(new udviz.THREE.Vector3(0, 0, temporalHeight));

      layer = this.temporalLevels[i - 2].temporalProvider.tilesManager.layer;
      this.temporalLevels[i - 2].setPosition(new udviz.THREE.Vector3(0, 0, temporalHeight));
      
      //Set millesime text in the 3D scene
      positionText = new udviz.THREE.Vector3(objectLayer.position.x - 1200 , objectLayer.position.y, objectLayer.position.z + temporalHeight);
      this.addTextInScene(currentTime.toString(), positionText);
      currentTime += 3;
      temporalHeight += this.delta;
    }
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
    for (let i = 0 ; i < this.temporalLevels.length - 1; i+=3) {

      const CO = listOfCityObjects[indexCO];
      if (!CO)
        return;
      
      // let transactionType = temporalProvider.COStyles.get(this.temporalProviders[i].currentTime).get(CO.cityObjectId.tileId)[CO.cityObjectId.batchId];
      // this.createTransactionLine(transactionType, CO, height);
      let tilesManager;
      let cityObjectBefore;
      if (indexCO != 0){
        tilesManager = this.temporalLevels[i].temporalProvider.tilesManager;
        cityObjectBefore = listOfCityObjects[indexCO - 1];
      }

      let transactionType = this.temporalLevels[i + 1].temporalProvider.COStyles.get(this.temporalLevels[i + 1].temporalProvider.currentTime).get(CO.cityObjectId.tileId)[CO.cityObjectId.batchId];
      this.createTransactionLine(transactionType, CO, height, tilesManager, cityObjectBefore);

      transactionType = this.temporalLevels[i + 2].temporalProvider.COStyles.get(this.temporalLevels[i + 2].temporalProvider.currentTime).get(CO.cityObjectId.tileId)[CO.cityObjectId.batchId];
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
    for (let j = 0; j < this.temporalLevels.length - 4; j+=3){
      // let tiles = this.temporalProviders[j].COStyles.get(this.temporalProviders[j].currentTime);
      // this.loopTiles(tiles);

      let tiles = this.temporalLevels[j + 1].temporalProvider.COStyles.get(this.temporalLevels[j + 1].temporalProvider.currentTime);
      this.loopTiles(tiles, height);

      tiles = this.temporalLevels[j + 2].temporalProvider.COStyles.get(this.temporalLevels[j + 2].temporalProvider.currentTime);
      this.loopTiles(tiles, height);

      height+=this.delta;
    }
  }

  /**
   * With the transaction types create the correct line with color
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
        styleTransaction = this.constructionTransparent;
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

    if (tilesManager_before && styleTransaction){
      this.applyStyletoCOTemporalLevel(CO_before, tilesManager_before, styleTransaction);
    }
  }

  addCyclinderTransaction(cityObject, material, height){

    const geometry = new udviz.THREE.CylinderGeometry( 2, 2, this.delta , 16);
    
    const cylinder = new udviz.THREE.Mesh( geometry, material );
    cylinder.position.set(cityObject.centroid.x, cityObject.centroid.y, (height - (this.delta / 2)) + cityObject.centroid.z);
    cylinder.setRotationFromAxisAngle(new udviz.THREE.Vector3(1, 0, 0), 1.5708);
    cylinder.updateMatrixWorld();
    this.transactionsCylinders.push(cylinder);
    this.view3D.getScene().add( cylinder );
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
      if (currentTime == 2015) //To-Do hard coded value / need to be a variable
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
   * @param {Map} listOfGmlId
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

  loopTiles(tiles, height) {
    for ( let tileId = 0 ; tileId < tiles.size; tileId++) {
      const tileDisplayStates = tiles.get(tileId + 1);
      for (let i = 0; i < tileDisplayStates.length; i++) {
        this.view3D.layerManager.tilesManagers.forEach( tileManager => {
          const cityObject = tileManager.getCityObject(new CityObjectID(tileId + 1, i));
          // tileManager.tiles[tileId]
          if (cityObject){
            this.createAllTransactionsLine(tileDisplayStates[i], cityObject, height);   
          }
        });
      }
    }
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
      this.applyStyletoCOTemporalLevel(cityObject, this.tilesManagersSTC[0], this.redFill);

    } else if (transactionType == 'modification' && this.checkModification){
      material = new udviz.THREE.MeshPhongMaterial( {color: 'yellow', opacity: 1} );
      const cylinder = new udviz.THREE.Mesh( geometry, material );
      this.modificationTransactionsCylinders.push(cylinder);

      cylinder.position.set(cityObject.centroid.x, cityObject.centroid.y, (height  / 2) + cityObject.centroid.z);
      cylinder.setRotationFromAxisAngle(new udviz.THREE.Vector3(1, 0, 0), 1.5708);
      cylinder.updateMatrixWorld();
      this.view3D.getScene().add( cylinder );
      this.applyStyletoCOTemporalLevel(cityObject, this.tilesManagersSTC[0], this.modifyFill);

    } else if (transactionType == 'creation' && this.checkConstruction){
      material = new udviz.THREE.MeshPhongMaterial( {color: 'green', opacity: 1} );
      const cylinder = new udviz.THREE.Mesh( geometry, material );
      this.constructionTransactionsCylinders.push(cylinder);

      cylinder.position.set(cityObject.centroid.x, cityObject.centroid.y, (height  / 2) + cityObject.centroid.z);
      cylinder.setRotationFromAxisAngle(new udviz.THREE.Vector3(1, 0, 0), 1.5708);
      cylinder.updateMatrixWorld();
      this.view3D.getScene().add( cylinder );
      this.applyStyletoCOTemporalLevel(cityObject, this.tilesManagersSTC[0], this.constructionTransparent);
    } 
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

  initCOStyle(){
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
  
    this.constructionTransparent = new CityObjectStyle({
      materialProps: { opacity: 0.5, color: 'green' },
    });
  
    this.view3D.layerManager.registerStyle(
      'constructionTransparent',
      this.constructionTransparent
    );
  }
}