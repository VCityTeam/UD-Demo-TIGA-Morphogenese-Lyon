/** @format */

import * as udviz from 'ud-viz';
import jQuery from 'jquery';
import '../styles.css';

udviz.Components.SystemUtils.File.loadJSON(
  './assets/config/config.json'
).then(function (config) { 

  let districtSelection = false;

  //Get extents coordinates
  let min_x = parseInt(config['extents']['min_x']);
  let max_x = parseInt(config['extents']['max_x']);
  let min_y = parseInt(config['extents']['min_y']);
  let max_y = parseInt(config['extents']['max_y']);
  const extent = new udviz.itowns.Extent(
    config['projection'],
    min_x,
    max_x,
    min_y,
    max_y
  );

  //pass the projection which was used to compute extent
  const view3D = new udviz.Views.View3D({
    itownsControls: true,
    config: config,
  });

  //pass the extent
  view3D.initItownsView(extent);

  //Setup skybox
  udviz.Game.Shared.Components.THREEUtils.addEquiRectangularMap(
    './assets/img/sky.jpg',
    view3D.getRenderer(),
    view3D.getScene()
  );


  const scene3D = view3D.getScene();
  const itownsView =  view3D.getItownsView();

  //Lighting
  const directionalLight = new udviz.THREE.DirectionalLight(0xffffff, 0.7);
  const ambientLight = new udviz.THREE.AmbientLight(0xffffff, 0.7);
  udviz.Game.Shared.Components.THREEUtils.addLights(view3D.getScene());
  udviz.Game.Shared.Components.THREEUtils.bindLightTransform(
    10,
    Math.PI / 4,
    Math.PI / 4,
    view3D.getScene(),
    directionalLight,
    ambientLight
  );

  //Init camera to center
  udviz.Components.CameraUtils.focusCameraOn(itownsView,
    itownsView.controls,
    new udviz.THREE.Vector3(view3D.extent.center().x, view3D.extent.center().y, view3D.extent.center().z),
    { duration: 1,
      verticalDistance : 4200,
      horizontalDistance : 4800}
  );

  // Clamp camera
  view3D.itownsView.controls.minZenithAngle = 40;
  view3D.itownsView.controls.maxZenithAngle = 180;
  view3D.itownsView.controls.maxAltitude = 6000;
  view3D.itownsView.controls.groundLevel = 500;
  view3D.itownsView.controls.handleCollision = true;

  const viewerDivElement = document.getElementById('webgl_View3D');
  const rootDivElement = document.getElementById('root_View3D');

  // Setup planar view
  viewerDivElement.style.position = 'absolute';
  viewerDivElement.style.left = '0%';
  viewerDivElement.style.width = '50%';
  viewerDivElement.style.height = '100%';

  // Setup globe view
  const globeViewElement =  document.createElement('div');
  globeViewElement.id = 'GlobeView';
  globeViewElement.style.position = 'absolute';
  globeViewElement.style.right = '0%';
  globeViewElement.style.width = '50%';
  globeViewElement.style.height = '100%';

  rootDivElement.append(globeViewElement);

  let placement = {
    coord: new udviz.itowns.Coordinates('EPSG:4326', 4.838, 45.756),
    range: 1000,
  };

  let globeView = new udviz.itowns.GlobeView(globeViewElement, placement);
  var promises = [];
  promises.push(udviz.itowns.Fetcher.json('https://raw.githubusercontent.com/iTowns/itowns/master/examples/layers/JSONLayers/Ortho.json').then(function _(config) {
    config.source = new udviz.itowns.WMTSSource(config.source);
    var layer = new udviz.itowns.ColorLayer(config.id, config);
    globeView.addLayer(layer);
  }));

  
  const uiViewElement =  document.createElement('div');
  uiViewElement.id = 'UI_categories';
  uiViewElement.className = 'divCategories';
  rootDivElement.append(uiViewElement);
  
  new Promise((resolve, reject) => {
    jQuery.ajax({
      type: 'GET',
      url: '../assets/html/categorie.html',
      datatype: 'html',
      success: (data) => {
        uiViewElement.innerHTML += data;
        resolve();
      },
      error: (e) => {
        console.error(e);
        reject();
      },
    });
  });

  /* ------------------------------------ Start of the application ------------------------------------ */
  viewerDivElement.addEventListener( 'pointermove', onTileMouseMove );
  viewerDivElement.addEventListener( 'click', onTileSelect );

  //Event to select a tile set
  function onTileMouseMove( event ) {    
    event.preventDefault();
    let intersects = itownsView.pickObjectsAt(event, 1, scene3D);
    if ( intersects.length > 0) {
      for (let index = 0; index < intersects.length; index++) {
        const objectIntersect = intersects[index];
        if (objectIntersect.layer.isC3DTilesLayer) {
          objectIntersect.object.material[1].color.set('rgb(255, 0, 0)');
          // app.update3DView();
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
          console.log(udviz.Components.CameraUtils);
          udviz.Components.CameraUtils.focusCameraOn(view3D.getItownsView(),
            itownsView.controls,
            objectIntersect.point,
            {duration: 1,
              verticalDistance : 1200,
              horizontalDistance : 1800});

          objectIntersect.object.material[1].color.set('rgb(255, 225, 225)');

          //Disable all neighbours layers    
          view3D.layerManager.tilesManagers.forEach(element => {
            if (element.layer.name != objectIntersect.layer.name)
              element.layer.visible = false;
          });

          //Display temporal UI
          // temporalModule.view.enableView();

          //Setup state
          districtSelection = true;
        }   
      }
    }
  }

  // Escape input to reset view on center
  view3D.inputManager.addKeyInput('Escape','keydown', function () {
    if (districtSelection){
      //reset camera to center
      udviz.Components.CameraUtils.focusCameraOn(itownsView,
        itownsView.controls,
        new udviz.THREE.Vector3(view3D.extent.center().x, view3D.extent.center().y, view3D.extent.center().z),
        { duration: 1,
          verticalDistance : 4200,
          horizontalDistance : 4800});
      // temporalModule.view.disableView();

      //Enable all neighbours layers    
      view3D.layerManager.tilesManagers.forEach(element => {
        element.layer.visible = true;
        console.log(element.layer.color = 16777555);
        //element.object.material[1].color.set('rgb(255, 225, 225)');
      });
      // app.update3DView();
      console.log('escape input');
    }
  });
});
