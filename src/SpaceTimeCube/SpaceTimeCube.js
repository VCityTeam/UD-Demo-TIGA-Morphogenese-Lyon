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

    this.tilesManagersSTC = [];

    this.tilesDates = [];
    let date = 2009; // hard coded value should be a parameter
    this.temporalLevels.forEach( temporalLevel => {
      this.tilesDates.push([temporalLevel.temporalProvider.tilesManager,date]);
      this.tilesManagersSTC.push(temporalLevel.temporalProvider.tilesManager);
      date+=1;
    });

    this.rangeData = Math.abs(this.tilesDates[0][1] - this.tilesDates[this.tilesDates.length - 1][1]) / 100;

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

    //Register Style
    this.unSelectedStyle = new CityObjectStyle({
      materialProps: { opacity: 0.2, color: 0xffffff },
    });

    this.view3D.layerManager.registerStyle(
      'unSelected',
      this.unSelectedStyle
    );

    //Ground layer
    this.whiteStyle = new CityObjectStyle({
      materialProps: { opacity: 1, color: 0xffffff },
    });

    this.view3D.layerManager.registerStyle(
      'whiteGround',
      this.whiteStyle
    );

  }

  /**
   * Create layer in height
   */
  createSpaceTimeCube(){
    let maxHeightLayers = 0;
    let currentTime = 2009;

    //Set style layer 0
    this.tilesManagersSTC[0].tiles.forEach( tile => {
      this.tilesManagersSTC[0].setStyleToTile(tile.tileId, this.whiteStyle);
      this.tilesManagersSTC[0].applyStyles(); 
    });

    this.temporalLevels.forEach(temporalLevel => {
      const layer = temporalLevel.temporalProvider.tilesManager.layer;
      layer.root.children.forEach(object => {
        // Height
        object.position.z += maxHeightLayers;
        const centroidBB = new udviz.THREE.Vector3();
        object.boundingVolume.box.getCenter(centroidBB);
        object.updateMatrixWorld();
      });
      const objectLayer = this.layerManager.tilesManagers[0].tiles[0].layer.root.children[0];
      const positionText = new udviz.THREE.Vector3(objectLayer.position.x - 600 , objectLayer.position.y, objectLayer.position.z + maxHeightLayers);
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

    this.removeAllTransactionsCylinders();

    for (let i = 0 ; i < this.temporalLevels.length - 1; i++) {
      const temporalLevel = this.temporalLevels[i].temporalProvider;
      const CO = listOfCityObjects[i];
      if (!CO)
        return;

      temporalLevel.changeTileState(temporalLevel.tilesManager);
      // this.setStyleSelectionSTC(listOfCityObjects, temporalLevel.tilesManager); //Apply style
      
      const transactionType = temporalLevel.COStyles.get(temporalLevel.currentTime).get(CO.cityObjectId.tileId)[CO.cityObjectId.batchId];
      this.createTransactionLine(transactionType, CO, height);

      height += 150;
    }
  }

  /**
   * Display all the transaction lines
   */
  displayAllTransaction(){
    let height = 0;
    for (let j = 0; j < this.temporalLevels.length - 1; j++){
      const tiles = this.temporalLevels[j].temporalProvider.COStyles.get(this.temporalLevels[j].temporalProvider.currentTime);
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
    }
  }

  /**
   * With the transaction types create the corect line with color
   * @param {string} transactionType 
   * @param {CityObject} cityObject
   * @param {number} height
   */
  createTransactionLine(transactionType, cityObject, height){
    
    // let geometry;
    let material;
    let positionTransaction = 75;
    
    switch (transactionType) {
      case 'creation':
        material = new udviz.THREE.MeshPhongMaterial( {color: 'green', opacity: 0.2} );
        this.addCyclinderTransaction(cityObject, material, height);
        break;
      case 'demolition':
        material = new udviz.THREE.MeshPhongMaterial( {color: 'red', opacity: 0.2} );
        // positionTransaction = -75;
        this.addCyclinderTransaction(cityObject, material, height);
        break;
      case 'modification':
        material = new udviz.THREE.MeshPhongMaterial( {color: 'yellow', opacity: 1} );
        this.addCyclinderTransaction(cityObject, material, height);
        break;
      case 'noTransaction':
        material = new udviz.THREE.MeshPhongMaterial( {color: 'white', opacity: 1} );
        this.addCyclinderTransaction(cityObject, material, height);
        break;
      // case 'union':
      //   material = new udviz.THREE.MeshPhongMaterial( {color: 'white', opacity: 0.2} );
      //   material.transparent = true;
      //   break;
      // case 'division':
      //   material = new udviz.THREE.MeshPhongMaterial( {color: 'white', opacity: 0.2} );
      //   break;
      case 'hide':
        material = new udviz.THREE.MeshPhongMaterial( {color: 'white', opacity: 0} );
        material.transparent = true;
        this.addCyclinderTransaction(cityObject, material, height);
        break;
      default:
        break;
    }
    // if (transactionType == 'construction'){
    // material = new udviz.THREE.MeshPhongMaterial( {color: 'green', opacity: 1} );
    // positionTransaction = -75;
    // const cylinder = new udviz.THREE.Mesh( geometry, material );
    // cylinder.position.set(cityObject.centroid.x, cityObject.centroid.y, cityObject.centroid.z + positionTransaction + height);
    // cylinder.setRotationFromAxisAngle(new udviz.THREE.Vector3(1, 0, 0), 1.5708);
    // cylinder.updateMatrixWorld();
    // this.transactionsCylinders.push(cylinder);
    // this.view3D.getScene().add( cylinder );
    // }
  }

  addCyclinderTransaction(cityObject, material, height){
    // const cylinderDistance = Math.abs(c height);
    const geometry = new udviz.THREE.CylinderGeometry( 2, 2, 150, 16);
    
    const cylinder = new udviz.THREE.Mesh( geometry, material );
    cylinder.position.set(cityObject.centroid.x, cityObject.centroid.y, (height - 75) + cityObject.centroid.z);
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
  }
}