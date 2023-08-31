/** @format */
import * as udvizBrowser  from '@ud-viz/browser';
// import { $3DTemporalExtension } from '@ud-viz/browser/src/Component/Widget/Temporal/Model/3DTemporalExtension';
// import { TemporalProvider } from '@ud-viz/browser/src/Component/Widget/Temporal/ViewModel/TemporalProvider';
// import { SpaceTimeCubeWindow } from './SpaceTimeCube/SpaceTimeCubeWindow.js';
// import { SpaceTimeCube } from './SpaceTimeCube/SpaceTimeCube.js';
// import { TemporalLevel } from './SpaceTimeCube/TemporalLevel.js';
// import { TilesManager } from '@ud-viz/browser/src/Component/Itowns/Itowns';

udvizBrowser.loadMultipleJSON([
  '../assets/config/extent_lyon.json',
  '../assets/config/frame3D_planars.json',
  '../assets/config/layer/3DTiles_temporal.json',
  '../assets/config/layer/base_maps.json',
  '../assets/config/layer/elevation.json',
  '../assets/config/crs.json',
  '../assets/config/widget/temporal.json',
  '../assets/config/widget/sparql_widget.json',
  '../assets/config/server/sparql_server.json',
]).then((configs) => {
  udvizBrowser.proj4.default.defs(
    configs['crs'][0].name,
    configs['crs'][0].transform
  );
  // http://proj4js.org/
  // define a projection as a string and reference it that way
  // the definition of the projection should be in config TODO_ISSUE
  // udvizBrowser.proj4.default.defs(
  //   configs['extent_lyon'].crs,
  //   '+proj=lcc +lat_1=45.25 +lat_2=46.75' +
  //     ' +lat_0=46 +lon_0=3 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
  // );

  const extent = new udvizBrowser.itowns.Extent(
    configs['extent_lyon'].crs,
    parseInt(configs['extent_lyon'].west),
    parseInt(configs['extent_lyon'].east),
    parseInt(configs['extent_lyon'].south),
    parseInt(configs['extent_lyon'].north)
  );

  const frame3DPlanar = new udvizBrowser.Frame3DPlanar(
    extent,
    configs['frame3D_planars'][2]
  );

  frame3DPlanar.itownsView.addLayer(
    new udvizBrowser.itowns.ColorLayer(
      configs['base_maps'][0]['layer_name'],
      {
        updateStrategy: {
          type: udvizBrowser.itowns.STRATEGY_DICHOTOMY,
          options: {},
        },
        source: new udvizBrowser.itowns.WMSSource({
          extent: extent,
          name: configs['base_maps'][0]['name'],
          url: configs['base_maps'][0]['url'],
          version: configs['base_maps'][0]['version'],
          crs: extent.crs,
          format: configs['base_maps'][0]['format'],
        }),
        transparent: true,
      }
    )
  );

  const isTextureFormat =
    configs['elevation']['format'] == 'image/jpeg' ||
    configs['elevation']['format'] == 'image/png';
  frame3DPlanar.itownsView.addLayer(
    new udvizBrowser.itowns.ElevationLayer(
      configs['elevation']['layer_name'],
      {
        useColorTextureElevation: isTextureFormat,
        colorTextureElevationMinZ: isTextureFormat
          ? configs['elevation']['colorTextureElevationMinZ']
          : null,
        colorTextureElevationMaxZ: isTextureFormat
          ? configs['elevation']['colorTextureElevationMaxZ']
          : null,
        source: new udvizBrowser.itowns.WMSSource({
          extent: extent,
          url: configs['elevation']['url'],
          name: configs['elevation']['name'],
          crs: extent.crs,
          heightMapWidth: 256,
          format: configs['elevation']['format'],
        }),
      }
    )
  );
  // const frame3DPlanar = app.getFrame3DPlanar();

  // /// ADD LAYERS

  // udvizBrowser.Widget.Temporal.add3DTilesTemporalFromConfig(
  //   configs['3DTiles_temporal'],
  //   frame3DPlanar.itownsView
  // );

  // TEMPORAL MODULE
  // const temporalDateSelector =
  //   new udvizBrowser.Widget.Temporal.DateSelector(
  //     frame3DPlanar.itownsView,
  //     configs['temporal']
  //   );

  // temporalDateSelector.domElement.style.zIndex = 2;
  // temporalDateSelector.domElement.style.position = 'relative';
  // frame3DPlanar.domElementUI.appendChild(
  //   temporalDateSelector.domElement
  // );
  udvizBrowser.Widget.Temporal.add3DTilesTemporalFromConfig(
    configs['3DTiles_temporal'],
    frame3DPlanar.itownsView
  );

  // TEMPORAL MODULE
  const temporalDateSelector =
  new udvizBrowser.Widget.Temporal.DateSelector(
    frame3DPlanar.itownsView,
    configs['temporal']
  );

  temporalDateSelector.domElement.style.zIndex = 2;
  temporalDateSelector.domElement.style.position = 'relative';
  frame3DPlanar.domElementUI.appendChild(
    temporalDateSelector.domElement
  );
    
  //Temporal levels
  // const temporalLevels = [];
  // const tilesManagers = app.getFrame3DPlanar().getLayerManager().tilesManagers;

  // temporalLevels.push(new TemporalLevel(2009, [  new TemporalProvider(
  //   new $3DTemporalExtension(),
  //   tilesManagers[0],
  //   2009
  // )])); //Initialize ground temporal layer

  // for( let i = 1; i < tilesManagers.length - 1; i+=3) {
  //   if (!tilesManagers[i].layer.registeredExtensions['3DTILES_temporal'])
  //     return;
  
  //   const dataTemporal = new TemporalProvider(
  //     new $3DTemporalExtension(),
  //     tilesManagers[i],
  //     2009 + i
  //   );
  //   const dataTemporalConstruction = new TemporalProvider(
  //     new $3DTemporalExtension(),
  //     tilesManagers[i + 1],
  //     2009 + i + 1
  //   );
  //   const dataTemporalDestruction = new TemporalProvider(
  //     new $3DTemporalExtension(),
  //     tilesManagers[i + 2],
  //     2009 + i + 2
  //   );
  //   temporalLevels.push(new TemporalLevel(2009 + i + 2, [dataTemporal, dataTemporalConstruction, dataTemporalDestruction]));
  // }


  // new udvizBrowser.Widget.Server.SparqlEndpointResponseProvider(
  //   configs['sparql_server']
  // );

  
  
  // //// SPARQL MODULE
  // const sparqlWidgetView = new udvizBrowser.Widget.Server.SparqlWidgetView(
  //   new udvizBrowser.Widget.Server.SparqlEndpointResponseProvider(
  //     configs['sparql_server']
  //   ),
  //   cityObjectProvider,
  //   app.getFrame3DPlanar().getLayerManager(),
  //   configs['sparql_widget']
  // );
  // app.addWidgetView('sparqlModule', sparqlWidgetView, {
  //   name: 'SPARQL Query',
  // });

  // // const temporalExtension = new LayerExtension(app.getFrame3DPlanar(), listTemporalProvider, sparqlWidgetView);

  // const spaceTimeCube = new SpaceTimeCube(app.getFrame3DPlanar(), temporalLevels, sparqlWidgetView);

  // app.getFrame3DPlanar().layerManager.tilesManagers.forEach(element => {
  //   element.addEventListener(
  //     TilesManager.EVENT_TILE_LOADED, () => {
  //       if (app.getFrame3DPlanar().layerManager.getTotal3DTilesTileCount() == app.getFrame3DPlanar().layerManager.getLoaded3DTilesTileCount()){
  //         spaceTimeCube.createSpaceTimeCube();

  //         //EVENT
  //         const clickListener = (event) => {
  //           const cityObject = app.getFrame3DPlanar().layerManager.pickCityObject(event);

  //           if (cityObject){
  //             // Get transaction chain
  //             sparqlWidgetView.window.sparqlProvider.addEventListener(udvizBrowser.Widget.Server.SparqlEndpointResponseProvider.EVENT_ENDPOINT_RESPONSE_UPDATED,
  //               (response) =>
  //                 spaceTimeCube.selectionCityObjectSTC(spaceTimeCube.parseSPARQLrequete(response))
  //             );
  //             sparqlWidgetView.window.getTransactionChain(cityObject.props.gml_id);
  //           }

  //         };
  //         const viewerDiv = document.getElementById('viewerDiv');
  //         viewerDiv.addEventListener('mousedown', clickListener);   
  //       }
  //     }
  //   );
  // });

  // new SpaceTimeCubeWindow(app.getFrame3DPlanar(), spaceTimeCube);


});
