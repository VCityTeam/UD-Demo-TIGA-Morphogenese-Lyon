/** @format */

import * as udviz from 'ud-viz';

const app = new udviz.Templates.AllWidget();

app.start('../assets/config/config.json').then((config) => {
  app.addBaseMapLayer();

  app.addElevationLayer();

  app.setupAndAdd3DTilesLayers();

  const itownsView = app.view;
  const scene3D = itownsView.scene;
  const cameraItowns = itownsView.camera.camera3D;
  const inputManager = new udviz.Components.InputManager();

  let districtSelection = false;

  // Clamp camera
  itownsView.controls.minZenithAngle = 40;
  itownsView.controls.maxZenithAngle = 180;
  itownsView.controls.maxAltitude = 6000;
  itownsView.controls.groundLevel = 500;
  itownsView.controls.handleCollision = true;

  ////// ABOUT MODULE
  const about = new udviz.Widgets.AboutWindow();
  app.addModuleView('about', about);

  ////// HELP MODULE
  const help = new udviz.Widgets.Extensions.HelpWindow(config.helpWindow);
  app.addModuleView('help', help);

  ////// LAYER CHOICE MODULE
  const layerChoice = new udviz.Widgets.LayerChoice(app.layerManager);
  app.addModuleView('layerChoice', layerChoice);

  ////// TEMPORAL MODULE
  const temporalModule = new udviz.Widgets.TemporalModule(
    app.layerManager.tilesManagers[0],
    app.config.temporalModule
  );
  app.addModuleView('temporal', temporalModule.view);

  /* ------------------------------------ Start of the application ------------------------------------ */
  app.viewerDivElement.addEventListener( 'pointermove', onTileMouseMove );
  app.viewerDivElement.addEventListener( 'click', onTileSelect );

  //Event to select a tile set
  function onTileMouseMove( event ) {    
    event.preventDefault();
    let intersects = itownsView.pickObjectsAt(event, 1, scene3D);
    if ( intersects.length > 0) {
      for (let index = 0; index < intersects.length; index++) {
        const objectIntersect = intersects[index];
        if (objectIntersect.layer.isC3DTilesLayer) {
          objectIntersect.object.material[1].color.set('rgb(255, 0, 0)');
          app.update3DView();
          //Reset color
          setTimeout(function() {
            objectIntersect.object.material[1].color.set('rgb(255, 255, 255)');
          }, 100);
        }  
      }
    }
  }

  //Event to select a tile set
  function onTileSelect( event ) {    
    event.preventDefault();
    //selected objects
    let intersects = itownsView.pickObjectsAt(event, 1, scene3D);
    if ( intersects.length > 0) {
      for (let index = 0; index < intersects.length; index++) {
        const objectIntersect = intersects[index];
        //Get only 3DTiles layer
        if (objectIntersect.layer.isC3DTilesLayer){
          
          //Travel to the centroid
          udviz.Components.focusCameraOn(itownsView,
            itownsView.controls,
            objectIntersect.point,
            {duration: 1,
              verticalDistance : 1200,
              horizontalDistance : 1800});

          objectIntersect.object.material[1].color.set('rgb(255, 225, 225)');

          //Disable all neighbours layers    
          app.layerManager.tilesManagers.forEach(element => {
            if (element.layer.name != objectIntersect.layer.name)
              element.layer.visible = false;
          });

          //Display temporal UI
          temporalModule.view.enableView();

          //Setup state
          districtSelection = true;
        }   
      }
    }
  }

  // Escape input to reset view on center
  inputManager.addKeyInput('Escape','keydown', function () {
    if (districtSelection){
      //reset camera to center
      udviz.Components.focusCameraOn(itownsView,
        itownsView.controls,
        new udviz.THREE.Vector3(app.extent.center().x, app.extent.center().y, app.extent.center().z),
        {duration: 1,
          verticalDistance : 4200,
          horizontalDistance : 4800});
      temporalModule.view.disableView();

      //Enable all neighbours layers    
      app.layerManager.tilesManagers.forEach(element => {
        element.layer.visible = true;
        console.log(element.layer.color = 16777555);
        //element.object.material[1].color.set('rgb(255, 225, 225)');
      });
      app.update3DView();
      console.log('escape input');
    }
  });

  //DEBUG
  console.log(cameraItowns);
  console.log(app.layerManager);
});
