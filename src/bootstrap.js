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

  //Start of the application

  //temporalModule.view.enableView();

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

          //Display temporal UI
          temporalModule.view.enableView();
        }   
      }
    }
  }

  //DEBUG
  console.log(cameraItowns);
});
