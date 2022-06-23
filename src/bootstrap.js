/** @format */

import * as udviz from 'ud-viz';
import '../styles.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Deck} from '@deck.gl/core';
import {GeoJsonLayer, ArcLayer} from '@deck.gl/layers';
import * as proj4 from 'proj4';

udviz.Components.SystemUtils.File.loadJSON(
  './assets/config/config.json'
).then(function (config) { 

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

  
  let deckGlCanvas = document.createElement('canvas');
  deckGlCanvas.id = 'deck-canvas';
  deckGlCanvas.style.zIndex = 2;
  document.getElementById('root_View3D').appendChild(deckGlCanvas);
  

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

  // // Initialize itowns view
  // view3D.getCamera().position.set(4.838991, 45.748826, 5);
  // view3D.getCamera().rotation.set(1.0619838785677609,-0.3043337605398328, -0.16561814175954986);

  const AIR_PORTS =
    'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson';

  const INITIAL_VIEW_STATE = {
    latitude: 45.740873,
    longitude: 4.838963,
    zoom: 10,
    bearing: 0,
    pitch: 30
  };
  // # Orthographic viewer

  // `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
  // var viewerDiv = document.getElementById('map');

  // Instanciate PlanarView
  // By default itowns' tiles geometry have a "skirt" (ie they have a height),
  // but in case of orthographic we don't need this feature, so disable it
  // var view = new udviz.itowns.PlanarView(viewerDiv, extent, { disableSkirt: false, maxSubdivisionLevel: 10,
  //   placement: new udviz.itowns.Extent('EPSG:3857', -20000000, 20000000, -8000000, 20000000),
  // });

  // view.controls.addInputListenersToElement(document.getElementById('deckCanvas'));

  // Add a TMS imagery source
  var ignSource = new udviz.itowns.VectorTilesSource({
    style: 'https://wxs.ign.fr/static/vectorTiles/styles/PLAN.IGN/standard.json', 
    zoom: {
      min: 2,
      max: 18,
    },
  });


  // Add a TMS imagery layer
  var colorLayer = new udviz.itowns.ColorLayer('OPENSM', {
    updateStrategy: {
      type: udviz.itowns.STRATEGY_DICHOTOMY,
    },
    source: ignSource,
    opacity: 0.5,
  });

  itownsView.addLayer(colorLayer);


  const deck = new Deck({
    canvas: 'deck-canvas',
    width: '100%',
    height: '100%',
    initialViewState: INITIAL_VIEW_STATE,
    map: false,
    controller: true,
    onViewStateChange: ({viewState}) => {
      const cam3D = itownsView.camera.camera3D;
      const prev = udviz.itowns.CameraUtils.getTransformCameraLookingAtTarget(itownsView, cam3D);
      const newPos = prev;
      newPos.coord = new udviz.itowns.Coordinates('EPSG:4326', viewState.longitude, viewState.latitude, 0);
      // console.log(itownsView.camera);
      // console.log(viewState);
      console.log(newPos);
      // let factory = new udviz.proj4;
      // let fromProj = proj4.default.defs('EPSG:3414');
      // let toProf = proj4.default.defs();
      // let x;
      // console.log(proj4);
      /* Converting the coordinates from one projection to another. */
      // console.log(cam3D.position.clone());
      // const o = proj4.default('EPSG:3857').inverse(cam3D.position.clone());
      // console.log(o);
      // console.log([x, y]);
      /* Converting the coordinates from one projection to another. */
      // 
      // CoordinateReferenceSystem srcCrs = factory.createFromName("EPSG:4326");
      // CoordinateReferenceSystem dstCrs = factory.createFromName("EPSG:4141");

      // BasicCoordinateTransform transform = new BasicCoordinateTransform(srcCrs, dstCrs);

      newPos.coord = new udviz.itowns.Coordinates('EPSG:4326', viewState.longitude, viewState.latitude, 0);

      // newPos.range = 64118883.098724395 / (2**(viewState.zoom-1));
      newPos.range = 64118883 / (2**(viewState.zoom-1)); // 64118883 is Range at Z=1 
      newPos.heading = viewState.bearing;
      // for some reason I cant access Math.clamp
      function clamp(val, min, max){
        if( val >= max ) val = max;
        else if(val <= min) val = min;
        return val; 
      }
      newPos.tilt = clamp((90 - viewState.pitch), 0, 90); 

      udviz.itowns.CameraUtils.transformCameraToLookAtTarget(itownsView, cam3D, newPos);
      itownsView.notifyChange();
      cam3D.updateMatrixWorld();
      // We can set pitch and bearing to 0 to disable tilting and turning 
      // viewState.pitch = 0;
      // viewState.bearing = 0;


      return viewState;
    },
    layers: [
      new GeoJsonLayer({
        id: 'airports',
        data: AIR_PORTS,
        // Styles
        filled: true,
        pointRadiusMinPixels: 2,
        pointRadiusScale: 2000,
        getPointRadius: f => 11 - f.properties.scalerank,
        getFillColor: [200, 0, 80, 180],
        // Interactive props
        pickable: true,
        autoHighlight: true,
        onClick: info =>
          // eslint-disable-next-line
          info.object && alert(`${info.object.properties.name} (${info.object.properties.abbrev})`)
      }),
      new ArcLayer({
        id: 'arcs',
        data: AIR_PORTS,
        dataTransform: d => d.features.filter(f => f.properties.scalerank < 4),
        // Styles
        getSourcePosition: f => [-0.4531566, 51.4709959], // London
        getTargetPosition: f => f.geometry.coordinates,
        getSourceColor: [0, 128, 200],
        getTargetColor: [200, 0, 80],
        getWidth: 1
      })
    ]
  });

  itownsView.notifyChange();
});
