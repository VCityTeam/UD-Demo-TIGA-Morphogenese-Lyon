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
  const selectionStyle = { materialProps: { color: 0x13ddef } };
  app.view3D.layerManager.registerStyle('grow', selectionStyle);

  let scale = 100;
  app.viewerDivElement.addEventListener( 'click', onTileSelect );
  // debugger
  //Event to select a tile set
  function onTileSelect( event ) {    
    event.preventDefault();
    //selected objects
    let cityObject = app.view3D.layerManager.pickCityObject(event, 1, app.view3D.scene);
    
    if (cityObject){

      let indexCount = cityObject.indexCount;
      let indexStart = cityObject.indexStart;
      let meshId = cityObject.meshId;

      //----------------------------------Apply style
      let selectedTilesManager = app.view3D.layerManager.getTilesManagerByLayerID(
        cityObject.tile.layer.id
      );
      selectedTilesManager.setStyle(
        cityObject.cityObjectId,
        'grow'
      );
      selectedTilesManager.applyStyles({
        updateFunction: selectedTilesManager.view.notifyChange.bind(
          selectedTilesManager.view
        ),
      });

      //----------------------------------Change geometry
      let cityObject3D = cityObject.tile.getObject3D(); // Object THREE of the CityObject
      let meshCityObject = cityObject3D.content.children[meshId]; // Mesh of the cityObject picked
      let arrayCityObject = meshCityObject.geometry.attributes.position.array; // Array of the full mesh of te tile
      let arrayWithOnlyGeometryMesh = []; // Array of Vector3 with only the geometry of the cityObject picked
      let centroide = new udviz.THREE.Vector3(0, 0, 0);

      /* Looping through the array of the mesh of the cityObject picked. */
      for (let i = 0; i < indexCount; i+=3){
        let position = new udviz.THREE.Vector3(
          arrayCityObject[indexStart + i],
          arrayCityObject[indexStart + i + 1],
          arrayCityObject[indexStart + i + 2]);
        centroide.add(position);
        
        arrayWithOnlyGeometryMesh.push(position);
      }
      
      console.log(arrayWithOnlyGeometryMesh);
      // debugger
      centroide.divideScalar(arrayWithOnlyGeometryMesh.length);
      console.log(arrayCityObject[indexStart]);
      console.log(centroide);

      // for (let i = 0; i < indexCount; i+=3){
      //   let directionVector = position.sub(centroide);
      //   arrayCityObject[indexStart+ i] += 5000.0;
      //   arrayCityObject[indexStart+ i + 1] += 5000.0;
      //   arrayCityObject[indexStart+ i + 2] += 5000.0; 
      // }

      // let meshWithScale = [];
      let index = 0; 
      for (let  i = 0; i < indexCount; i+=3){
        let directionVector = arrayWithOnlyGeometryMesh[index].sub(centroide);
        directionVector.normalize();
        arrayCityObject[indexStart + i] += directionVector.x * scale;
        arrayCityObject[indexStart + i + 1] += directionVector.y * scale;
        arrayCityObject[indexStart + i + 2] += directionVector.z * scale;
        index++;
      }

      // console.log(arrayCityObject[indexStart+1]);
      // debugger
      // cityObject.tile.getObject3D().content.children[meshId].geometry.attributes.position.array = arrayCityObject;
      cityObject.tile.getObject3D().content.children[meshId].geometry.attributes.position.needsUpdate = true;
      
      app.view3D.getItownsView().notifyChange();
    }
  }
});
