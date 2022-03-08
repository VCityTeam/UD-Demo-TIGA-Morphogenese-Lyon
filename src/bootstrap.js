/** @format */

import * as udviz from 'ud-viz';

const app = new udviz.Templates.AllWidget();

app.start('../assets/config/config.json').then((config) => {
  app.addBaseMapLayer();

  app.addElevationLayer();

  app.setupAndAdd3DTilesLayers();

  const itownsView = app.view;
  const scene3D = itownsView.scene;

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


  

  temporalModule.view.enableView();

  app.viewerDivElement.addEventListener( 'pointermove', onDocumentMouseLeave );

  //Event to select a tile set
  function onDocumentMouseLeave( event ) {    
    event.preventDefault();
    let intersects = itownsView.pickObjectsAt(event, 1, scene3D);
    //console.log(intersects);
    if ( intersects.length > 0) {
      for (let index = 0; index < intersects.length; index++) {
        const objectIntersect = intersects[index];
        if (objectIntersect.layer.isC3DTilesLayer) {
          console.log(objectIntersect);
          objectIntersect.object.material[1].color.set('rgb(255, 0, 0)');
          //Reset color
          setTimeout(function() {
            objectIntersect.object.material[1].color.set('rgb(255, 255, 255)');
          }, 500);
        }
        
      }
    }
    
  }
  


});
