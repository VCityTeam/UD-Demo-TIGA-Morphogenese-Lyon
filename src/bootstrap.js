/** @format */
import * as udviz from 'ud-viz';
import {LayerExtension} from './TemporelExtension/LayerExtension.js';

const app = new udviz.Templates.AllWidget();

app.start('../assets/config/config.json').then((config) => {
  ////// REQUEST SERVICE
  const requestService = new udviz.Components.RequestService();

  ////// ABOUT MODULE
  const about = new udviz.Widgets.AboutWindow();
  app.addModuleView('about', about);

  ////// HELP MODULE
  // const help = new udviz.Widgets.Extensions.HelpWindow(config.helpWindow);
  // app.addModuleView('help', help);

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

  const temporalExtension = new LayerExtension(app.view3D);
  // temporalExtension.createBurgerLayer();
  // temporalExtension.windowCreated();

  // Declare the source for the data on Ariege area
  // const batBerlietSource = new udviz.itowns.FileSource({
  //   url: 'https://raw.githubusercontent.com/VCityTeam/UD-Demo-TIGA-Morphogenese-Lyon/master/assets/Bat_Berliet_1993_l93_3946.geojson?token=GHSAT0AAAAAAB23Z4DBGR6KX5NAYGOJZANOY3574RQ',
  //   crs: 'EPSG:3946',
  //   format: 'application/json',
  // });
  // // Create a ColorLayer for the Ariege area
  // const berlierLayer = new udviz.itowns.ColorLayer('Berliet', {
  //   name: 'berliet',
  //   transparent: true,
  //   source: batBerlietSource,
  //   style: new udviz.itowns.Style({
  //     fill: {
  //       color: 'orange',
  //       opacity: 0.9,
  //     },
  //     stroke: {
  //       color: 'white',
  //     },
  //   })
  // });
  // app.view3D.getItownsView().addLayer(berlierLayer);

  ////// TEMPORAL MODULE
  // const temporalModule = new udviz.Widgets.TemporalModule(
  //   app.view3D.getLayerManager().tilesManagers[0],
  //   app.config.temporalModule
  // );
  // app.addModuleView('temporal', temporalModule.view);

});
