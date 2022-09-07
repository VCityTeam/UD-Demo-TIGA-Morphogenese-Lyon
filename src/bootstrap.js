/** @format */
import * as udviz from 'ud-viz';

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

  app.viewerDivElement.addEventListener( 'click', onTileSelect );

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
      for (let i = indexStart; i < indexCount/3; i+=3){
        let position = new udviz.THREE.Vector3(arrayCityObject[i],arrayCityObject[i + 1],arrayCityObject[i + 2]);
        debugger;
        arrayWithOnlyGeometryMesh.push(position);
      }

      let tileManager = app.view3D.layerManager.getTilesManagerByLayerID(
        cityObject.tile.layer.id
      );
      
      cityObject3D.scale.set(1.2, 1.2, 1.2);
      // debugger;
      cityObject3D.updateMatrixWorld();

    }
  }

  console.log(app.view3D.layerManager);

  //Event to select a tile set
  function onObjectSelect( event ) {    
    event.preventDefault();
    //selected objects
    let raycaster =  new udviz.THREE.Raycaster();
    let mouse3D = new udviz.THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1,   
      -( event.clientY / window.innerHeight ) * 2 + 1,  
      0.5 );                                        
    raycaster.setFromCamera( mouse3D, app.view3D.getCamera() );
     
    // let intersects = raycaster.intersectObjects()
  }
});
