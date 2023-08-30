/** @format */
import * as udvizBrowser  from '@ud-viz/browser';
import { $3DTemporalExtension } from '@ud-viz/browser/src/Component/Widget/Temporal/Model/3DTemporalExtension';
import { TemporalProvider } from '@ud-viz/browser/src/Component/Widget/Temporal/ViewModel/TemporalProvider';
import { SpaceTimeCubeWindow } from './SpaceTimeCube/SpaceTimeCubeWindow.js';
import { SpaceTimeCube } from './SpaceTimeCube/SpaceTimeCube.js';
import { TemporalLevel } from './SpaceTimeCube/TemporalLevel.js';
import { TilesManager } from '@ud-viz/browser/src/Component/Itowns/Itowns';

udvizBrowser.FileUtil.loadMultipleJSON([
  '../assets/config/all_widget.json',
  '../assets/config/extent_lyon.json',
  '../assets/config/frame3D_planars.json',
  '../assets/config/layer/3DTiles_temporal.json',
  '../assets/config/layer/3DTiles.json',
  '../assets/config/layer/base_maps.json',
  '../assets/config/layer/elevation.json',
  '../assets/config/widget/about.json',
  '../assets/config/widget/help.json',
  '../assets/config/widget/sparql_widget.json',
  '../assets/config/server/sparql_server.json',
  '../assets/config/styles.json',
]).then((configs) => {
  // http://proj4js.org/
  // define a projection as a string and reference it that way
  // the definition of the projection should be in config TODO_ISSUE
  udvizBrowser.proj4.default.defs(
    configs['extent_lyon'].crs,
    '+proj=lcc +lat_1=45.25 +lat_2=46.75' +
      ' +lat_0=46 +lon_0=3 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
  );

  const extent = new udvizBrowser.itowns.Extent(
    configs['extent_lyon'].crs,
    parseInt(configs['extent_lyon'].west),
    parseInt(configs['extent_lyon'].east),
    parseInt(configs['extent_lyon'].south),
    parseInt(configs['extent_lyon'].north)
  );

  const app = new udvizBrowser.AllWidget(
    extent,
    configs['all_widget'],
    configs['frame3D_planars'][0]
  );

  const frame3DPlanar = app.getFrame3DPlanar();

  // /// ADD LAYERS
  udvizBrowser.add3DTilesLayers(
    configs['3DTiles_temporal'],
    frame3DPlanar.layerManager,
    frame3DPlanar.itownsView
  );

  udvizBrowser.addBaseMapLayer(
    configs['base_maps'][0],
    frame3DPlanar.itownsView,
    extent
  );

  udvizBrowser.addElevationLayer(
    configs['elevation'],
    frame3DPlanar.itownsView,
    extent
  );

  // //// ABOUT MODULE
  const about = new udvizBrowser.Widget.AboutWindow(configs['about']);
  app.addWidgetView('about', about);

  // //// HELP MODULE
  new udvizBrowser.Widget.HelpWindow(configs['help']); // => help window should be add with addWidgetView

  // //// 3DTILES DEBUG
  const debug3dTilesWindow = new udvizBrowser.Widget.Debug3DTilesWindow(
    app.getFrame3DPlanar().getLayerManager()
  );
  app.addWidgetView('3dtilesDebug', debug3dTilesWindow, {
    name: '3DTiles Debug',
  });

  // //// CAMERA POSITIONER
  const cameraPosition = new udvizBrowser.Widget.CameraPositionerView(
    app.getFrame3DPlanar().getItownsView()
  );
  app.addWidgetView('cameraPositioner', cameraPosition);

  // //// LAYER CHOICE MODULE
  const layerChoice = new udvizBrowser.Widget.LayerChoice(
    app.getFrame3DPlanar().getLayerManager()
  );
  app.addWidgetView('layerChoice', layerChoice);

  //Temporal levels
  const temporalLevels = [];
  const tilesManagers = app.getFrame3DPlanar().getLayerManager().tilesManagers;
  let indexDate = 0;
  for( let i = 0; i < tilesManagers.length - 1; i+=3) {
    if (!tilesManagers[i].layer.registeredExtensions['3DTILES_temporal'])
      return;

    // let model = new $3DTemporalExtension();
  
    const dataTemporal = new TemporalProvider(
      new $3DTemporalExtension(),
      tilesManagers[i],
      2009
    );
    const dataTemporalConstruction = new TemporalProvider(
      new $3DTemporalExtension(),
      tilesManagers[i + 1],
      2009 + indexDate
    );
    const dataTemporalDestruction = new TemporalProvider(
      new $3DTemporalExtension(),
      tilesManagers[i + 2],
      2009 + indexDate + 1
    );
    temporalLevels.push(new TemporalLevel(2009 + i, [dataTemporal, dataTemporalConstruction, dataTemporalDestruction]));
    indexDate++;
    console.log(i);
  }
  console.log(temporalLevels);

  // //// CITY OBJECTS PROVIDER
  const cityObjectProvider = new udvizBrowser.Widget.CityObjectProvider(
    app.getFrame3DPlanar().getLayerManager(),
    configs['styles']
  );


  new udvizBrowser.Widget.Server.SparqlEndpointResponseProvider(
    configs['sparql_server']
  );

  
  
  // //// SPARQL MODULE
  const sparqlWidgetView = new udvizBrowser.Widget.Server.SparqlWidgetView(
    new udvizBrowser.Widget.Server.SparqlEndpointResponseProvider(
      configs['sparql_server']
    ),
    cityObjectProvider,
    app.getFrame3DPlanar().getLayerManager(),
    configs['sparql_widget']
  );
  app.addWidgetView('sparqlModule', sparqlWidgetView, {
    name: 'SPARQL Query',
  });

  // const temporalExtension = new LayerExtension(app.getFrame3DPlanar(), listTemporalProvider, sparqlWidgetView);

  const spaceTimeCube = new SpaceTimeCube(app.getFrame3DPlanar(), temporalLevels, sparqlWidgetView);

  app.getFrame3DPlanar().layerManager.tilesManagers.forEach(element => {
    element.addEventListener(
      TilesManager.EVENT_TILE_LOADED, () => {
        if (app.getFrame3DPlanar().layerManager.getTotal3DTilesTileCount() == app.getFrame3DPlanar().layerManager.getLoaded3DTilesTileCount()){
          spaceTimeCube.createSpaceTimeCube();

          //EVENT
          const clickListener = (event) => {
            const cityObject = app.getFrame3DPlanar().layerManager.pickCityObject(event);

            if (cityObject){
              // Get transaction chain
              sparqlWidgetView.window.sparqlProvider.addEventListener(udvizBrowser.Widget.Server.SparqlEndpointResponseProvider.EVENT_ENDPOINT_RESPONSE_UPDATED,
                (response) =>
                  spaceTimeCube.selectionCityObjectSTC(spaceTimeCube.parseSPARQLrequete(response))
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

  new SpaceTimeCubeWindow(app.getFrame3DPlanar(), spaceTimeCube);


});
