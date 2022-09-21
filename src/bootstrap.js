/** @format */
import * as udviz from 'ud-viz';
import {LayerExtension} from './LayerExtension.js';

const app = new udviz.Templates.AllWidget();

app.start('../assets/config/config.json').then((config) => {
  ////// REQUEST SERVICE
  const requestService = new udviz.Components.RequestService();

  ////// ABOUT MODULE
  const about = new udviz.Widgets.AboutWindow();
  app.addModuleView('about', about);

  ////// HELP MODULE
  const help = new udviz.Widgets.Extensions.HelpWindow(config.helpWindow);
  app.addModuleView('help', help);

  ////// CITY OBJECTS MODULE
  let cityObjectModule = new udviz.Widgets.CityObjectModule(
    app.view3D.layerManager,
    app.config
  );
  app.addModuleView('cityObjects', cityObjectModule.view);

  ////// 3DTILES DEBUG
  const debug3dTilesWindow = new udviz.Widgets.Debug3DTilesWindow(
    app.view3D.layerManager
  );
  app.addModuleView('3dtilesDebug', debug3dTilesWindow, {
    name: '3DTiles Debug',
  });

  ////// CAMERA POSITIONER
  const cameraPosition = new udviz.Widgets.CameraPositionerView(
    app.view3D.getItownsView()
  );
  app.addModuleView('cameraPositioner', cameraPosition);

  ////// LAYER CHOICE MODULE
  const layerChoice = new udviz.Widgets.LayerChoice(app.view3D.layerManager);
  app.addModuleView('layerChoice', layerChoice);

  // const layerLegend = new LayerExtension(app.view3D.layerManager);

  let scale = 200000;
  app.viewerDivElement.addEventListener( 'click', onTileSelect );
  debugger
  //Event to select a tile set
  function onTileSelect( event ) {    
    event.preventDefault();
    //selected objects
    let cityObject = app.view3D.layerManager.pickCityObject(event, 1, app.view3D.scene);
    
    if (cityObject){

      let indexCount = cityObject.indexCount;
      let indexStart = cityObject.indexStart;
      let meshId = cityObject.meshId;


      let cityObject3D = cityObject.tile.getObject3D(); // Object THREE of the CityObject
      let meshCityObject = cityObject3D.content.children[meshId]; // Mesh of the cityObject picked
      let arrayCityObject = meshCityObject.geometry.attributes.position.array; // Array of the full mesh of te tile
      let arrayWithOnlyGeometryMesh = []; // Array of Vector3 with only the geometry of the cityObject picked
      // debugger;
      let centroide = new udviz.THREE.Vector3(0, 0, 0);
      for (let i = indexStart; i < indexStart + indexCount; i+=3){
        let position = new udviz.THREE.Vector3(arrayCityObject[i],arrayCityObject[i + 1],arrayCityObject[i + 2]);
        centroide.add(position);
        arrayWithOnlyGeometryMesh.push(position);
      }

      centroide.divideScalar(arrayWithOnlyGeometryMesh.length);
      let meshWithScale = [];
      arrayWithOnlyGeometryMesh.forEach(position => {
        let directionVector = position.sub(centroide);
        directionVector.normalize();
        let newPosition = new udviz.THREE.Vector3(
          // position.x + 50,
          // position.y + 50,
          // position.z + 50
          position.x + (directionVector.x * scale),
          position.y + (directionVector.y * scale),
          position.z + (directionVector.z * scale));
        meshWithScale.push( newPosition);
      });

      let index = 0;
      let newArray = new Float32Array(arrayCityObject);
      for (let i = indexStart; i < indexStart + indexCount; i+=3){
        newArray[i] = meshWithScale[index].x;
        newArray[i + 1] = meshWithScale[index].y;
        newArray[i + 2] = meshWithScale[index].z;
      }
      // cityObject.tile.getObject3D().content.children[meshId].geometry.attributes.position.array = arrayCityObject;
      // cityObject.tile.getObject3D().content.children[meshId].geometry.attributes.position.needsUpdate = true;

      // cityObject.tile.getObject3D().content.children[meshId].geometry.computeBoundingBox();
      // cityObject.tile.getObject3D().content.children[meshId].geometry.computeBoundingSphere();

      arrayCityObject = newArray;
      // cityObject.tile.getObject3D().content.children[meshId].geometry.applyMatrix4();
      meshCityObject.matrix.applyToBufferAttribute(cityObject3D.content.children[meshId].geometry.attributes.position);

      // cityObject.tile.getObject3D().content.children[meshId].geometry.attributes.applyMatrix4(meshCityObject.matrix);
      // mesh
      cityObject.tile.getObject3D().content.children[meshId].geometry.attributes.position.applyMatrix4(meshCityObject.matrix);
      cityObject.tile.getObject3D().content.children[meshId].geometry.attributes.position.needsUpdate = true;
      
      // app.view3D.getItownsView().notifyChange();


      // const positionIdArray = new Float32Array(arrayCityObject).fill(arrayCityObject);
      // const positionIdBuffer = new udviz.THREE.BufferAttribute(positionIdArray, 1);
      // cityObject.tile.getObject3D().content.children[meshId].geometry.setAttribute('position', positionIdBuffer);
      // debugger;
      
      /* Scaling the object. */
      // cityObject3D.scale.set(1.2, 1.2, 1.2);

      // cityObject3D.updateMatrixWorld();
      // debugger;
      
      // debugger;
      // console.log(cityObject.tile.getObject3D());
    }
  }
});
