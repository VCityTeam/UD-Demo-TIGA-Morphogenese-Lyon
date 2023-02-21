/** @format */
import * as udviz from 'ud-viz';
import {LayerExtension} from './TemporelExtension/LayerExtension.js';
import { $3DTemporalExtension } from 'ud-viz/src/Widgets/Temporal/Model/3DTemporalExtension';
import { TemporalProvider } from 'ud-viz/src/Widgets/Temporal/ViewModel/TemporalProvider';

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

  //Temporal PROVIDER
  const listTemporalProvider = [];
  const tilesManagers = app.view3D.getLayerManager().tilesManagers;
  for( let i = 0; i < tilesManagers.length; i++) {
    
    let model = new $3DTemporalExtension();

    const dataTemporal = new TemporalProvider(
      model,
      tilesManagers[i],
      2009 + i
    );
    listTemporalProvider.push(dataTemporal);
  }

  const temporalExtension = new LayerExtension(app.view3D, listTemporalProvider);
 
  //// TEMPORAL MODULE
  // const temporalModule = new udviz.Widgets.TemporalModule(
  //   app.view3D.getLayerManager().tilesManagers[0],
  //   app.config.temporalModule
  // );
  // app.addModuleView('temporal', temporalModule.view);
  

  // // 2010
  // model = new $3DTemporalExtension();

  // new TemporalProvider(
  //   model,
  //   app.view3D.getLayerManager().tilesManagers[1],
  //   2010
  // );

  // this.view = new TemporalView(this.provider, temporalOptions);

});
