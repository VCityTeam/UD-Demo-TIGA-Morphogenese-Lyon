/** @format */

import * as udviz from 'ud-viz';

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
  // document.getElementById('root_View3D').innerHTML += 
  // '<!-- Menu  -->\
  //   <nav class="navbar fixed-top navbar-light bg-light">\
  //     <ul class="nav nav-pills" id="pills-tab" role="tablist">\
  //       <li class="nav-item ">\
  //         <a class="btn btn-light " type="button" href="home.html" role="tab">Accueil</a>\
  //       </li>\
  //       <li class="nav-item">\
  //         <a class="btn btn-light mybtn" type="button" href="home.html#visite" >Visite guidee</a>\
  //       </li>\
  //       <li class="nav-item">\
  //         <a class="btn btn-light" type="button" href="index.html">Carte interactive</a>\
  //       </li>\
  //       <li class="nav-item">\
  //           <a class="btn btn-light" type="button" href="home.html#contact">Contact</a>\
  //       </li>\
  //       <li class="nav-item disabled">\
  //         <button class="btn btn-light disabled" type="button" aria-disabled="true">Profil</button>\
  //       </li>\
  //     </ul>\
  //     <!-- Sous menu carte -->\
  //     <ul class="nav  navCategories" >\
  //       <li id="categorie1" >Categorie 1</li>\
  //       <li id="categorie2">Categorie 2</li>\
  //       <li id="categorie3">Categorie 3</li>\
  //       <li id="categorie4">Categorie 4</li>\
  //       <li id="categorie5">Categorie 5</li>\
  //       <li id="categorie6">Categorie 6</li>\
  //     </ul>\
  //   </nav>\
  //   <script src="./libs/v6.0.0-dist/ol.js">\
  //   </script>\
  //   <script src="carte.js"></script>\
  //   <!--Jquery-->\
  //   <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>\
  //   <!-- JS Boostrap -->\
  //   <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>\
  //   <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>\
  //   ';

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
