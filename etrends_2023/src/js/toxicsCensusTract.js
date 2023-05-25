//stashing stuff in etrends so i don't have to clutter window object
//then stashing naaqs stuff in etrends.naaqs
if (! etrends) var etrends = {};
if (! etrends.toxicsCensusTract) etrends.toxicsCensusTract = {};

etrends.toxicsCensusTract.maps = {};

//This is a function that is called to create the naaqs stuff.
//The execution can be delayed until some setup stuff is done, ie download US map that will be reused
etrends.toxicsCensusTract.init = function (D3QueueCallback) {

//Place to store all the Esri Modules  
var EsriModules = {};

var pollutantTypes = {
  Arsenic: {fullName:'Arsenic'},
  Benzene: {fullName:'Benzene'},
  Cadmium: {fullName:'Cadmium'},
  Coke: {fullName:'Coke Oven Emissions'},
  Chloroprene: {fullName:'Chloroprene'},
  Chromium: {fullName:'Chromium (VI)'},
  Ethylene: {fullName:'Ethylene Oxide'},
  Formaldehyde: {fullName:'Formaldehyde'},
  Nickel: {fullName:'Nickel'},
  Diesel: {fullName:'Diesel PM'}
};

d3_queue.queue(1)
//Don't wrap Esri Module loading function so that error won't continue to map creation
  .defer(loadEsri)
  .defer(wrapQueueFn.bind(null,makeMapRisks))
  .defer(wrapQueueFn.bind(null,makeMapHazard))
//  .defer(wrapQueueFn.bind(null,makeMapAmbient))
  .await(function (error) {
    console.log("toxics by tract map loaded");
    if (error) console.error(error);
    if (D3QueueCallback) D3QueueCallback(error);    
  });
  
function makeMapRisks(callback) {
  var numberLine = new etrends.library.NumberLine({
    container: '#toxics-tract-risks-numberline',
    logScale: true,
    breaks: [
      {text:'<= 1 in a million',value:1},
      {text:'10 in a million',value:10},
      {text:'>= 100 in a million',value:100},
//Matt Woody only want it up to 100 per million
      //      {text:'1000 in a million',value:1000}
    ]
  });
  numberLine.draw();
  //  return callback();

  var defaultClass = {
    symbol: {outline: {style: "none"}} 
  };

  var definitionExpression;
  //        definitionExpression = "FIPS=17043845805"
  //        definitionExpression = "FIPS=17043845811"
  //        definitionExpression = "FIPS=17043845902"
  //definitionExpression = "FIPS=17043845902 OR FIPS=17043845811 OR FIPS=17043845805"
  
  var zoomedOutLayer = {
    onSelect: onSelect,
//    onHitTest: onHitTest,
    layerArgs: {
      definitionExpression:definitionExpression,
      maxScale: 9000000
    },
    defaultClass: defaultClass,
    symbol: defaultClass.symbol
  };
  var zoomedInLayer = {
    onSelect: onSelect,
//    onHitTest: onHitTest,
    layerArgs: {
      definitionExpression:definitionExpression,
      minScale:9000001
    },
    symbol: {style2: "none",outline:{color2:"red"}} 
  };

  /*
  var sourceLayer = {
    onHitTest: onHitTestSource,
    layerArgs: {
    },
    symbol: {
      outline:{color:"green"}
    } 
  };
  */

  //GPO item for Full Nata 2017 Feature service
  //https://epa.maps.arcgis.com/home/item.html?id=2fc20a027f1d47678d25c6208d4edddc  
  // Nata 2018 Steven Jetts
  //https://epa.maps.arcgis.com/home/item.html?id=3aa281d59de6491cbc96b77d5ec28303
  // NATA18AC_CRP_CRSG_HI
  // Nata 2018 Doug Solos
  //https://epa.maps.arcgis.com/home/item.html?id=9a342901087a4c78ac52040a2606a324
  //Nata 2019 Steven Jetts
  //https://epa.maps.arcgis.com/home/item.html?id=3ac611b9b09949d683a61f3733adafc6
  //  NATA19AC_CRP_CRSG

  var layerSetup = {
//    custom:[zoomedOutLayer,zoomedInLayer,sourceLayer],
    custom:[zoomedOutLayer,zoomedInLayer],
    default:{
//      service: "NATA2017",
//  Steven Jetts
//2018
//      service: "NATA18AC_CRP_CRSG_HI",
//2019
      service: "NATA19AC_CRP_CRSG",
//  Doug Solos
//      service: "Tract_Changes_2018",       
      key: "FIPS",
      layerArgs: {
//For Steven Jetts Have to use custom layerId here instead of just setting service name since we are using layer 1 instead of 0        
//        url:"https://services.arcgis.com/cJ9YHowT8TU7DUyn/ArcGIS/rest/services/NATA18AC_CRP_CRSG_HI/FeatureServer/1",
// For 2018 layer is layer 1 instead of 0. just weird thing that ESRI does where doesn't start with 0 if other layers were in there or something that were removed or not used??
//        layerId: 1
//For 2019 layer is 6
        layerId: 6
      },
      legendInfo: {
        title: "Cancer Risk (in a million)"
      }
    }
  };

  var totalBreaks = [
    [0,25, "#bce6f9"],
    [25,50, "#74bbed"],
    [50,75, "#4d96ce"],
    [75,100, "#48799d"],
    [100,10000000, "#033a57","> 100"]
  ];
  //      return callback();
  layerSetup.default.breaks = totalBreaks;

  var types = {
    Total: {gpoField:'CR_Total_Risk',fullName:'Total Cancer Risk',breaks: totalBreaks}
  }
  
  var gpoFields = {
    Arsenic: {gpoField:'AC_AsCompoundsInorgInclArsine',breaksScale2:.1},
    Benzene: {gpoField:'CR_Benzene'},
    Cadmium: {gpoField:'CR_Cadmium_compounds',breaksScale2:.1},
    Coke: {gpoField:'CR_Coke_oven_emissions',breaksScale2:.1},
    Chloroprene: {gpoField:'CR_Chloroprene',breaksScale2:.01},
    Chromium: {gpoField:'CR_Chromium_VI_hexavalent'},
    Ethylene: {gpoField:'CR_Ethylene_oxide'},
    Formaldehyde: {gpoField:'CR_Formaldehyde',breaksScale2:10},
    Nickel: {gpoField:'CR_Nickel_compounds',breaksScale2:.1}
  };
  /* 2014 Fields
  var gpoFields = {
    Arsenic: {gpoField:'Arsenic_Compounds_Inorganic_Inc',breaksScale2:.1},
    Benzene: {gpoField:'Benzene_Risk'},
    Cadmium: {gpoField:'Cadmium_Compounds_Risk',breaksScale2:.1},
    Coke: {gpoField:'Coke_Oven_Emissions_Risk',breaksScale2:.1},
    Chloroprene: {gpoField:'Chloroprene_Risk',breaksScale2:.01},
    Chromium: {gpoField:'Chromium_VI__Hexavalent__Risk'},
    Ethylene: {gpoField:'Ethylene_Oxide_Risk'},
    Formaldehyde: {gpoField:'Formaldehyde_Risk',breaksScale2:10},
    Nickel: {gpoField:'Nickel_Compounds_Risk',breaksScale2:.1}
  };
  */

  //clone pollutant type adding gpo field for risks and don't show Diesel
  clone({
    source:pollutantTypes,
    target: types,
    black: ['Diesel'],
    merge: gpoFields
  });

  var mapInfo = {
    name: "risks",
    types: types,
    outFields: ["FIPS","County_Nam","State","Risk_Change","Popup_Note"],
    numberLine: numberLine,
    layerSetup: layerSetup,
    postSwitchType:postSwitchType
  };

  function postSwitchType(args) {
    var gpoField = args.typeInfo.gpoField || args.type;

    mapInfo.layersInfo.some(function (layerInfo) {
      var keyValues = Object.keys(layerInfo.highlightGraphics);
      if (!keyValues || !keyValues.length) return false;
      var graphic = layerInfo.highlightGraphics[keyValues[0]].graphic;
      var args = {
        gpoField: gpoField,
        attributes: graphic.attributes,
        results: {features:[graphic]}
      }
      onSelect(args);
      return true;
    })

  }
  function onSelect(args) {
    var $fips = $("#toxics-tract-risks-label-fips");
    var $county = $("#toxics-tract-risks-label-county");    
    var $caveat = $("#toxics-tract-risks-label-caveat");

    //if no results found then clear number line and return
    if (args.results.features.length<1) {
      numberLine.hideValue();
      $fips.text("None Selected");
      $county.hide();
      $caveat.hide();
      return;
    } 
    $fips.text(args.attributes.FIPS);
    $county.show();
    $county.html(args.attributes.County_Nam + ', ' + args.attributes.State + '<br/>');
    var caveat_text = args.attributes.Popup_Note;
    if (caveat_text) {
      $caveat.show();
      var caveat_link_type;
      /* In 2018 the caveat link doesn't depend on Risk Change
      if (args.attributes.Risk_Change==="E") {
        caveat_link_type = "2017-airtoxscreen-emissions-update-document";
      } else if (args.attributes.Risk_Change==="F"){
        caveat_link_type = "airtoxscreen-frequent-questions#fire2";
      }
      */

      //In 2018 caveat_link is same for all caveats
//      caveat_link_type = "2018-airtoxscreen-emissions-update-document";
      caveat_link_type = "2019-airtoxscreen-emissions-update-document";

      var caveat_link = " <a href='https://www.epa.gov/AirToxScreen/" + caveat_link_type + "' target='_blank'>here</a>"

      $caveat.html(caveat_text + caveat_link);
    } else {
      $caveat.hide();
      $caveat.html('');
    }

    var value = args.attributes[args.gpoField];
    //round value passed to number line
    var roundValue;
    var text = '';
    if (value===undefined || value===null) {
      var roundValue = value;
      text = 'Zero Population';
    } else {
//      var roundValue = etrends.library.utilities.round(value,0);
      //Keep just one significant digit
      var roundValue = Number(value.toPrecision(1));
      text = roundValue + ' in a million';  
    }

    numberLine.setValue({value:roundValue,text:text});
  }

  function onHitTest(args) {
//    console.log(args);
//    console.log(args.response.results[0].graphic.attributes.FIPS);
    $("#toxics-tract-risks-label-fips-hitTest").text(args.response.results[0].graphic.attributes.FIPS);
  }

  return makeMap(mapInfo,callback);
  /*
  function onHitTestSource(args) {
      console.log(args);
    //    console.log(args.response.results[0].graphic.attributes.FIPS);
      $("#toxics-tract-risks-label-fips-hitTestSource").text(args.response.results[0].graphic.attributes.FIPS);
  }
  
  var outFields = Object.keys(types).map(function (type) {
    return types[type].gpoField;
  });
  outFields.push("FIPS");
  outFields.push("OBJECTID");
  
  var url = "https://services.arcgis.com/cJ9YHowT8TU7DUyn/ArcGIS/rest/services/NATA2017/FeatureServer/0/query?returnCentroid=true&f=json";
  url += "&outFields=" + outFields.join(",");
  url += "&where=" + (definitionExpression || "1=1");
  return loadFeatureToSource({
      url:url,
      layerInfo:sourceLayer,
      outFields: outFields,
      transform: function (args) {        
        args.item.geometry.type="polygon";
//        args.item.geometry = args.item.centroid;
//        args.item.geometry.type="point";
      }
    })
    .then(function () {
      return makeMap(mapInfo,callback);
    });
  */  
}

function makeMapHazard(callback) {
  var pointLayer = {
    onHitTest: onHitTest,
    layerArgs: {
      opacity: 1,
//      maxScale: 9000001
      maxScale: 1200001
                
    },
    highlightSymbol: {
      type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
      style: "circle",
      size: "8px",  // pixels    
      color: [255,255,0,1],
      outline: {
        color: [5,113,176,1],
        width: "1px"
      }
    }
};
  pointLayer.symbol =  {
    type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
    style: "circle",
    size: "8px",  // pixels
    outline: {style:"none",width:"0px"}
  };
  var polygonLayer = {
    onHitTest: onHitTest,
    layerArgs: {
//      minScale:9000000      
    minScale: 1200000
}
  };

  //GPO item for 2017 NATA Hazard Feature service View
  //https://epa.maps.arcgis.com/home/item.html?id=a885b9bf7e3f498aad2f1870a80b279f  
  //GPO item for 2018 NATA Hazard Feature service View
  //Stevens
  //https://epa.maps.arcgis.com/home/item.html?id=e9b1cf127e3f40108a2b546156fb1b7d
  //GPO item for 2019 NATA Hazard Feature service View
  //https://epa.maps.arcgis.com/home/item.html?id=5274e23923d740f58898d7631d696dad
  //Dougs
  //https://epa.maps.arcgis.com/home/item.html?id=3e19bca585fb4ced8b6e84dcab2e3c08      

  var layerSetup = {
    custom:[pointLayer,polygonLayer],
    default:{
//      service: "HI_2017_NATA_Hazard_Index_Above_1_View",
      //Steven Jetts 2018
      //service: "HI_2018_NATA_Hazard_Index_Above_1_View",
      //Steven Jetts 2019
      service: "HI_2019_NATA_Hazard_Index_Above_1_View",
      //Doug Solos
      //service: "HI_Tract_Changes_2018_Hazard_Index_Above_1_View",
      key: "FIPS",
      defaultClass: null,
      layerArgs: {
//For Steven Jetts Have to use custom layerId here instead of just setting service name since we are using layer 1 instead of 0
//        layerId: 1
//For 2019 the layer id equals 6
        layerId: 6
      },
      legendInfo: {
        title: "Hazard Index"
      }
    }
  };

  //      return callback();
  var breaks = [
    [1,10000000, "#4d96ce","> 1"]
  ];
  layerSetup.default.breaks = breaks;

  pointLayer.breaks = $.extend(true,[],breaks);
  pointLayer.breaks[0][2] = "#0571B0";

  //gpo field defaults to name of key
  //also re scale breaks to see variation if needed
  var types = {
    Respiratory : {gpoField:'Respiratory_HI',fullName:'Respiratory'},
    Developmental: {gpoField:'Developmental_HI',fullName:'Developmental'},
    Neurological : {gpoField:'Neurological_HI',fullName:'Neurological'},
//    Liver: {gpoField:'Liver_HI',fullName:'Liver'},
    Reproductive: {gpoField:'Reproductive_HI',fullName:'Reproductive'},
//    Kidney: {gpoField:'Kidney_HI',fullName:'Kidney'},
    Immunological : {gpoField:'Immunological_HI',fullName:'Immunological'},
// Don't need WholeBody for the 2018 data (only 2017) since there are no Whole Body HI > 1 in 2018
//    WholeBody: {gpoField:'Whole_Body_HI',fullName:'Whole Body'},
    Thyroid: {gpoField:'Thyroid_HI',fullName:'Thyroid'}
  };
  
  var mapInfo = {
    name: "hazard",
    types: types,    
    outFields: ['FIPS','County_Nam','State'],
    layerSetup: layerSetup,
    preSwitchType: preSwitchType
  };

  function preSwitchType(args) {
    //Don't really need to do this since renderer filters out
    // but this allows unselecting items that are filtered out
    var gpoField = args.typeInfo.gpoField || args.type;
    mapInfo.layersInfo.forEach(function (layerInfo) {
      layerInfo.layer_view.filter = {where: gpoField + ' >= 1'};
    })
  }

  function onHitTest(args) {
    console.log('onHitTest');
    console.log(args);
    var $table = $("#toxics-tract-hazard-table");
    var $tbody = $("#toxics-tract-hazard-table tbody");
    var $fips = $("#toxics-tract-hazard-label-fips");
    var $county = $("#toxics-tract-hazard-label-county");
    
    $tbody.empty();
    var results = args.response.results;
    if (results.length) {
      var graphic = results[0].graphic;
      $fips.text(graphic.attributes.FIPS);
      $county.show();
      $county.html(graphic.attributes.County_Nam + ', ' + graphic.attributes.State + '<br/>');
      Object.keys(types).forEach(function (type) {
        var gpoField = types[type].gpoField;          
        var hazardIndex = graphic.attributes[gpoField];
        //convert hazard index to only 1 sig digit
        hazardIndex = etrends.library.utilities.round(hazardIndex,0);
        //Keep just one significant digit
        //hazardIndex = Number(hazardIndex.toPrecision(1));

        if (hazardIndex < 1) return;
        var row = "<td>" + type + "</td>";      
        row += "<td>" + hazardIndex + "</td>";
        $tbody.append("<tr>" + row + "</tr>");
      }); 
      $table.show()
    } else {
      $fips.text("None Selected");
      $county.hide();
      $table.hide()
    }
  }
  
//  var url = "https://services.arcgis.com/cJ9YHowT8TU7DUyn/ArcGIS/rest/services/HI_2017_NATA_Hazard_Index_Above_1_View/FeatureServer/0/query?returnGeometry=false&returnCentroid=true&f=json";
// Steven Jetts 2018 Hazard View
//  var url = "https://services.arcgis.com/cJ9YHowT8TU7DUyn/ArcGIS/rest/services/HI_2018_NATA_Hazard_Index_Above_1_View/FeatureServer/1/query?returnGeometry=false&returnCentroid=true&f=json";
// Steven Jetts 2019 Hazard View
var url = "https://services.arcgis.com/cJ9YHowT8TU7DUyn/ArcGIS/rest/services/HI_2019_NATA_Hazard_Index_Above_1_View/FeatureServer/6/query?returnGeometry=false&returnCentroid=true&f=json";
// Doug Solos 2018 Hazard View
//  var url = "https://services.arcgis.com/cJ9YHowT8TU7DUyn/ArcGIS/rest/services/HI_Tract_Changes_2018_Hazard_Index_Above_1_View/FeatureServer/0/query?returnGeometry=false&returnCentroid=true&f=json";
  url += "&outFields=*";
  url += "&where=1=1";
  return loadFeatureToSource({
      url:url,
      layerInfo:pointLayer,
      transform: function (args) {  
//        args.item.geometry.type="polygon";
        args.item.geometry = args.item.centroid;
        args.item.geometry.type="point";
      }
    })
    .then(function () {
      return makeMap(mapInfo,callback);
    });

  /*    
  var serverToClientFieldTypeMap = {
    esriFieldTypeOID: 'oid',
    esriFieldTypeString: 'string',
    esriFieldTypeDouble: 'double'
  };
  var url = 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/ArcGIS/rest/services/HI_2017_NATA_Hazard_Index_Above_1_View/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&returnCentroid=true&f=json';
  return etrends.library.utilities.requestEndpoint(url,{dataType:'json'})
    .then(function (response) {
      console.log(response);
      pointLayer.layerArgs.objectIdField = response.objectIdField;
      //field types returned by service need to be translated to client format
      pointLayer.layerArgs.fields = response.fields.map(function (item) {
        //make copy before changing
        var new_item = $.extend(true,{},item);
        new_item.type = serverToClientFieldTypeMap[item.type];
        return new_item;
      });
      //centroid returned by returned by service need to be translated to client format
      pointLayer.layerArgs.source = response.features.map(function (item) {
        //make copy before changing
        var new_item = $.extend(true,{},item);
        new_item.geometry = item.centroid;
        new_item.geometry.type = 'point';
        return new_item;
      });
      return makeMap(mapInfo,callback);
    });
  */
}
  
function makeMapAmbient(callback) {
  //    return callback();
  
  //     Array.concat(tier1pollutants,tier2pollutants)
  
      var breaks = [
        createFillSymbol([0,.25, "#9E559C"]),
        createFillSymbol([.25,.50, "#149ECE"]),
        createFillSymbol([.50,.75, "#A7C636"]),
        createFillSymbol([.75,1, "#ffff00"]),
        createFillSymbol([1,10000000, "#ED5151",{label:"> 1"}])
      ];
  
      //gpo field defaults to name of key
      //also re scale breaks to see variation if needed
      var gpoFields = {
        Arsenic: {breaksScale:.0001},
        Cadmium: {breaksScale:.0001},
        Coke: {gpoField:'COKEOVEN',breaksScale:.0001},
        Chloroprene: {breaksScale:.0001},
        Chromium: {gpoField:'CHROMHEX',breaksScale:.0001},
        Ethylene: {gpoField:'ETOX',breaksScale:.0001},
        Formaldehyde: {gpoField:'FORMALD'},
        Nickel: {fullName:'Nickel',breaksScale:.0001},
        Diesel: {gpoField:'DIESEL_PM10'}
      };
    
      //clone pollutant type adding gpo field for exposure
      var types = clone({
        source:pollutantTypes,
        merge: gpoFields
      });
  
      var mapInfo = {
        name: "ambient",
        service: "2014_NATA_Ambient",
        types: types,
        breaks: breaks
      };
    
      return makeMap(mapInfo,callback);
}

  
function clone(args) {  
  var newObj = args.target || {};
  Object.keys(args.source).forEach(function (key) {    
    if (args.white) {
      if (args.white.indexOf(key)<0) return;
    } else if (args.black) {
      if (args.black.indexOf(key)>=0) return;
    }
    var item = args.source[key];
    var newItem = typeof(item)==="object" ? clone({source:item}) : item;

    if (args.merge && key in args.merge) {
      Object.keys(args.merge[key]).forEach(function (mergeKey) {
        newItem[mergeKey] = args.merge[key][mergeKey];
      });        
    }

    newObj[key] = newItem;
  });
  return newObj;
}

//so we can keep one map crashing the entire series of maps
function wrapQueueFn(QueueFn,callback) {
  try {
    var out = QueueFn(callback);
    return out;
  } catch(ex) {
    console.error(ex);
    return callback();
  }
}

function createFillSymbol(args,options) {  
  var minValue = args[0];
  var maxValue = args[1];
  var color = args[2];
  if (!options) options = {};

  var symbol = {
    type: "simple-fill",
    style: "solid",
    outline: {
        style: "solid",
        color: "#333333",
        width: .5
    }
  };  

  if (options.symbol) {
    $.extend(true,symbol,options.symbol);
  }
  //now set the color of the symbol
  if (color) symbol.color = color;

  return {
    minValue: minValue,
    maxValue: maxValue,
    symbol: symbol,
    label: options.label  
  };
}

function loadEsri(callback) {
  var modulePathMap = {
    Map: "esri/Map",
    MapView: "esri/views/MapView",
    FeatureLayer: "esri/layers/FeatureLayer",
    esriConfig: "esri/config",
    Home: "esri/widgets/Home",
    ClassBreaksRenderer: "esri/renderers/ClassBreaksRenderer",
    MapImageLayer: "esri/layers/MapImageLayer",
    VectorTileLayer: "esri/layers/VectorTileLayer",
    Legend: "esri/widgets/Legend",
    Expand: "esri/widgets/Expand",
    Query: "esri/rest/support/Query",
    Field: "esri/layers/support/Field",
    Graphic: 'esri/Graphic',
    Collection: 'esri/core/Collection'
  };

  var indices = {};
  var paths = [];
  var i=0;
  Object.keys(modulePathMap).forEach(function (name) {
    var path = modulePathMap[name];
    indices[name] = i;
    paths.push(path);
    i+=1;
  });

  esriLoader.loadModules(paths)
  .then(function (modules) {
      Object.keys(indices).forEach(function (name) {
          var index = indices[name];
          //this is object that all function  have access to
          EsriModules[name] = modules[index]
      });
    
    callback()
  });  

}

function makeMap(mapInfo,callback) {
//  callback();
//  return;
  etrends.toxicsCensusTract.maps[mapInfo.name] = mapInfo; 

  //Add item to type drop down
  mapInfo.initialType=null;
  var outFields = 'outFields' in mapInfo ? mapInfo.outFields : [];
  Object.keys(mapInfo.types || {}).forEach(function (type,index) {
    var value = mapInfo.types[type];
    var field = value.gpoField || type;
    outFields.push(field);
    if (!mapInfo.initialType) mapInfo.initialType = type;
    $("#toxics-tract-" + mapInfo.name + "-dropdown").append('<option value="' + type + '">' + value.fullName + '</option>');
    if (index===0) mapInfo.currentType = type;
  });
  if (!mapInfo.layerSetup.default) mapInfo.layerSetup.default = {};
  if (!mapInfo.layerSetup.default.layerArgs) mapInfo.layerSetup.default.layerArgs = {};
  //If outFields not already set up then add them from types
  if (!('outFields' in mapInfo.layerSetup.default.layerArgs)) {
    mapInfo.layerSetup.default.layerArgs.outFields = outFields;
  }

  setUpLayers();

    mapInfo.switchType  = function (type) {
      var typeInfo = mapInfo.types[type] || {};

      if (mapInfo.preSwitchType) mapInfo.preSwitchType({type:type,typeInfo:typeInfo});

//      var where = typeInfo.gpoField + ">=1";
//      view.allLayerViews.items[1].filter = {where:where};

      mapInfo.layersInfo.forEach(function (layerInfo,index) {
//        var typeInfo = mapInfo.types[type];
        var layer = mapInfo.layers[index];
      //Have to total recreate the render to trigger legend update
        layer.renderer = createClassBreaksRenderer(type,layerInfo);
      });

      removeHiddenSelectedKeyValues();

      mapInfo.currentType = type;

      if (mapInfo.postSwitchType) mapInfo.postSwitchType({type:type,typeInfo:typeInfo});
    };

    function removeHiddenSelectedKeyValues() {
      //if no filters set then don't need to do this 
      var hasFilters = mapInfo.layersInfo.some(function (layerInfo,index) {
        var filter = layerInfo.layer_view.filter;
        if (filter && filter.where) return true;
      });
      if (!hasFilters) return;

      var availableKeyValues = {};
      var promise = $.when(true);
      mapInfo.layersInfo.forEach(function (layerInfo,index) {
        //if layer scale is out of view then don't need to even do this
        if (!layerScaleInView(layerInfo,mapInfo.view.scale)) return;

        promise = promise.then(function () {
          var defer = $.Deferred();
          var keyValues = availableKeyValues[layerInfo.key];
          if (!keyValues) keyValues = availableKeyValues[layerInfo.key] = new EsriModules.Collection();
          var selectedKeyValues = mapInfo.selectedKeyValues[layerInfo.key].toArray();
          selectedKeyValues = selectedKeyValues.map(function (value) {
            return "'" + value + "'";
          });
  
          var query = {where: layerInfo.key + ' IN (' + selectedKeyValues.join(',') + ')'};
          var filter = layerInfo.layer_view.filter;
          if (filter && filter.where) {
            query.where += ' AND ' + layerInfo.layer_view.filter.where;
          } 
          layerInfo.layer_view.queryFeatures(query)
          .then(function (response) {
            response.features.forEach(function (feature) {
              var value = feature.attributes[layerInfo.key];
              if (!keyValues.includes()) keyValues.add(value);
            });
            defer.resolve();
          });
          return defer.promise();
        });
      });

      var removedKeyValues = {};
      //this fired after all the features are ready
      return promise.then(function () {
        //Have to go through and remove selected key values that are no longer showing
        Object.keys(mapInfo.selectedKeyValues).forEach(function (keyField) {
          var keyValues = mapInfo.selectedKeyValues[keyField];
          removedKeyValues[keyField] = [];
          keyValues.toArray().forEach(function (keyValue) {
            if (!availableKeyValues[keyField].includes(keyValue)) {
              keyValues.remove(keyValue);
              removedKeyValues[keyField].push(keyValue);              
            } 
          });                      
        });
        //Now clear highlights for features no longer visible 
        mapInfo.layersInfo.forEach(function (layerInfo,index) {
          /*
          removedKeyValues[layerInfo.key].forEach(function (keyValue) {
            var item = layerInfo.highlightGraphics[keyValue];
            mapInfo.view.graphics.remove(item.graphic);
            delete layerInfo.highlightGraphics[keyValue];      
          });
          */
          removedHighlightGraphics = {};
          removedKeyValues[layerInfo.key].forEach(function (keyValue) {
            var item = layerInfo.highlightGraphics[keyValue];
            if (item) removedHighlightGraphics[keyValue] = item;
          });
          clearHighlights(layerInfo,removedHighlightGraphics);
        });

      });

    }

    mapInfo.showHazardTract = function (type) {
      var typeInfo = mapInfo.types[type] || {};

      var where = typeInfo.gpoField + ">=1";
      var params = {
        returnGeometry: true,
        where:where
      }

//      layers[0].queryFeatures({returnGeometry: true,where:where})
      view.allLayerViews.items[1].queryFeatures(params)
      .then(function (response) {
        console.log(response.features);
      })
    }
    
		var map = new EsriModules.Map({
//      basemap: "streets-vector",
// use gray map to be consistent with nata dashboard
      basemap: "gray-vector",      
      layers: mapInfo.layers
    });
    mapInfo.map = map;

    var viewDiv = "toxics-tract-" + mapInfo.name + "-mapdiv";

    var view = new EsriModules.MapView({
      map: map,
      center: [-98.5,40],
      zoom: 2,
      container: viewDiv // Div element
    });	
    mapInfo.view = view;

    var homeWidget = new EsriModules.Home({ view: view });
    view.ui.add(homeWidget, "bottom-left",0);

    var legend = new EsriModules.Expand({
      content: new EsriModules.Legend({
        view: view,
        declaredClass: 'test-legend-widget-class',
        layerInfos: mapInfo.legendLayerInfo,
        style: 'classic'
      }),
      view: view,
      expanded: false
    });

    mapInfo.legend=legend;
    view.ui.add(legend, "top-right");

    view.on("click", handleViewClick);
    view.watch("stationary", function (stationary) {
      mapInfo.layersInfo.forEach(function (layerInfo,index) {
        if (!layerInfo.layer_view) return;
        var ready = !layerInfo.layer_view.updating && stationary;
        if (ready) watchViewLayerReady(layerInfo);
      });  
    });

    mapInfo.layersInfo.forEach(function (layerInfo,index) {
      view.whenLayerView(layerInfo.layer)
      .then(function (layer_view) {
        layerInfo.layer_view = layer_view;
        layer_view.watch("updating", function(updating){
          var ready = !updating && view.stationary;
          if (ready) watchViewLayerReady(layerInfo);
        });
      });
    });

    mapInfo.selectedKeyValues = {};

    function handleViewClick(event){
      var params = {
          geometry: event.mapPoint,
          spatialRelationship: "intersects",
    //          returnGeometry: true,
          returnGeometry: false,
    //          outFields: outFields
      }
    
      var typeInfo = mapInfo.types[mapInfo.currentType];
      var gpoField = typeInfo.gpoField || mapInfo.currentType;
    
      //clear out the selected keys each click because multiple selection using like shift or control click not set up yet
      Object.keys(mapInfo.selectedKeyValues).forEach(function (field) {
        mapInfo.selectedKeyValues[field].removeAll();
      });
      mapInfo.layersInfo.forEach(function (layerInfo,index) {
        //first off remove all highlighted graphics for this layerInfo
        clearHighlights(layerInfo);

        if (!layerInfo.onSelect && !layerInfo.onHitTest) return;
        //if layer is out of scale then don't do anything regarding this layer
        if (!layerScaleInView(layerInfo,mapInfo.view.scale)) return;

        if (layerInfo.onSelect) {
          view.layerViews.items[index].queryFeatures(params)
          .then(function (results) {
        //        console.log(results);
            var attributes = results.features.length ? results.features[0].attributes : null;
            //console.log(attributes[gpoField]);    
            var args = {
              mapInfo:mapInfo,
              layerInfo: layerInfo,
              results:results,
              typeInfo:typeInfo,
              gpoField: gpoField,
              attributes: attributes
            };
            layerInfo.onSelect(args);  
          });
        }

        if (layerInfo.onHitTest || layerInfo.highlight!==false) {
          var screenPoint = {x: event.x,y: event.y};
          view.hitTest(screenPoint,{include:mapInfo.layers[index]})
          .then(function (response) {  
            if (layerInfo.highlight!==false) {
              response.results.forEach(function (item) {
                highlightGeometry({item:item.graphic,layerInfo:layerInfo,symbol:layerInfo.highlightSymbol});
              });
            }
            if (!layerInfo.onHitTest) return;
            var args = {
              mapInfo:mapInfo,
              layerInfo: layerInfo,
              response:response,
              typeInfo:typeInfo,
              gpoField: gpoField,
      //            attributes: attributes
            };
            layerInfo.onHitTest(args);
          });
        }
      });
    }

    function clearHighlights(layerInfo,highlightGraphics){
      //Allow custom list of highlighted graphics if we don't want to clear all
//      if (!highlightGraphics) highlightGraphics = layerInfo.highlightGraphics.toArray();
      if (!highlightGraphics) highlightGraphics = layerInfo.highlightGraphics;
      //first off remove all highlighted graphics since for now we won't allow multiple selections      
      Object.keys(highlightGraphics).forEach(function (keyField) {
        var item = highlightGraphics[keyField];
//      highlightGraphics.forEach(function (item) {  
        //item in highlightGraphics is {graphic,layerInfo}
        mapInfo.view.graphics.remove(item.graphic);
//        layerInfo.highlightGraphics.remove(item);
        delete layerInfo.highlightGraphics[keyField];
      });
    }

    function highlightGeometry(args) {
      if (!args) return;
      //this can be graphic item or feature item
      var item = args.item;
      var geometry = item && ! args.geometry ? item.geometry : args.geometry;
      var attributes = item && ! args.attributes ? item.attributes : args.attributes;
      var layerInfo = args.layerInfo;

      //save the selected key values for key field in this layer      
      var keyField = layerInfo.key;
      var keyValues = mapInfo.selectedKeyValues[keyField];
      if (!keyValues) keyValues = mapInfo.selectedKeyValues[keyField] = new EsriModules.Collection();

      var keyValue = attributes[keyField];
      if (!keyValues.includes(keyValue)) {
        keyValues.add(keyValue);
      }

      var default_symbol = {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: [0,0,0,0],
        outline: {  // autocasts as new SimpleLineSymbol()
          color: [255,255,0,1],
          width: "1px"
        }
      };
      var symbol = $.extend(true,default_symbol,args.symbol);

      var highlight_graphic = new EsriModules.Graphic({geometry:geometry,attributes:attributes, symbol:symbol});
      
      view.graphics.add(highlight_graphic);
//      layerInfo.highlightGraphics.add({graphic:highlight_graphic});
      layerInfo.highlightGraphics[keyValue] = {graphic:highlight_graphic};

      return highlight_graphic;
    }

    function refreshHighlights(layerInfo) {
      /*
      //group key values from keyfields
      //because when zooming new visible layer won't have key values since it wasn't selected before
      var keyValues = {};
      var keyField = layerInfo.key;
      //save current high lights so we can hide after adding refreshed highlights if desired
      var currentHighlightGraphics = layerInfo.highlightGraphics.toArray();
      currentHighlightGraphics.forEach(function (item,index) {
        if (!keyValues[keyField]) keyValues[keyField] = [];
        var keyValue = item.graphic.attributes[keyField];
        if (keyValues[keyField].indexOf(keyValue)<0) {
          keyValues[keyField].push("'" + keyValue + "'");
        }
      });
//      console.log('keyValues: ' + layerInfo.layerIndex);
//      console.log('clearHighlights' + layerInfo.layerIndex);
      */

      //Now that we go key values we can remove old high light graphics and add new
      clearHighlights(layerInfo);

      //Would think view query wouldn't return a view out of scale 
      // but it is so don't add highlight for view out of scale
      if (layerScaleInView(layerInfo,mapInfo.view.scale)) {
//        console.log('layer scale IS in view: ' + layerInfo.layerIndex);
//        console.log(layerInfo);

        var keyField = layerInfo.key;
        var keyValues = mapInfo.selectedKeyValues[keyField];
        if (!keyValues || keyValues.length<1) return;
        keyValues = keyValues.map(function (value) {
          return "'" + value + "'";
        });
        var params = {
          returnGeometry: true,
          where: keyField + ' IN (' + keyValues.join(',') + ')'
        };
 //       console.log('params');
 //       console.log(params);
 
        //mapInfo.layers[index].queryFeatures(params)
        layerInfo.layer_view.queryFeatures(params)
        .then(function (results) {
          results.features.forEach(function (feature) {
            highlightGeometry({item:feature,layerInfo:layerInfo,symbol:layerInfo.highlightSymbol});
          });
        })          
      } else {
 //       console.log('layer scale not in view: ' + layerInfo.layerIndex);
      }
    }
    function watchViewLayerReady(layerInfo) {
        refreshHighlights(layerInfo);
    }

    function setUpLayers() {
      mapInfo.layersInfo = [];
      (mapInfo.layerSetup.custom || [{}]).forEach(function (customLayerSetup) {
        var layerInfo = $.extend(true,{},mapInfo.layerSetup.default,customLayerSetup);
        mapInfo.layersInfo.push(layerInfo);
      });
    
      mapInfo.layers = [];
      mapInfo.legendLayerInfo = [];
      mapInfo.layersInfo.forEach(function (layerInfo,index) {
        layerInfo.layerIndex = index;
        var layer = setUpSingleLayer(layerInfo);
        mapInfo.layers.push(layer);
        var legendInfo = $.extend(true,{},layerInfo.legendInfo);
        legendInfo.layer = layer;
        mapInfo.legendLayerInfo.push(legendInfo);  
      });
      
      function setUpSingleLayer(layerInfo) {
        var defaultlayerInfo = {
          layerArgs: {
            layerId: 0,
            opacity: .5,
            outFields: '*'  
          }
        }
        //have to merge custom layer info over default layer info
        //and then merge that back into original layer info because
        //we need reference to layer info to make change to layers eg. change symbology field
        $.extend(true,defaultlayerInfo,layerInfo);
        $.extend(true,layerInfo,defaultlayerInfo);
    
        //collection to store highlighted graphics so we can remove
//        layerInfo.highlightGraphics = new EsriModules.Collection();
        layerInfo.highlightGraphics = {};

        var layerArgs = layerInfo.layerArgs;
        if (!layerArgs.source && !layerArgs.url) {
          layerArgs.url = 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/' + layerInfo.service + '/FeatureServer/';
        }
    
        if (!layerArgs.renderer) {
//          var typeInfo = mapInfo.types[mapInfo.initialType];
          layerArgs.renderer = createClassBreaksRenderer(mapInfo.initialType,layerInfo); 
        }

        var layerClass = layerInfo.layerClass || EsriModules.FeatureLayer; 
        //for convenience add layer to layerInfo item
        layerInfo.layer = new layerClass(layerArgs);
    
        return layerInfo.layer;
      }                  
    }
    
    function createClassBreaksRenderer(type,layerInfo) {
      var typeInfo = mapInfo.types[type] || {};
  
      var breaks  = typeInfo.breaks ? typeInfo.breaks : layerInfo.breaks;
      //create the fill from shorthand passing base layer symbol if set
      classBreakInfos = [];
      typeInfo.breaksRange = {};
      breaks.forEach(function (break_args) {
        //just need the first 3 args for createFill and makes copy of args
        args = break_args.slice(0,3);
        var options = {};
        //items in breaks are arrays like [min,max,color or symbol,label]
        //createFillSymbol function expects [min,max,color],{label,symbol}
        //Therefore if break items array second item is symbol,
        //then need to set 3rd item to null in the array passed as first argument to createFillSymbol
        if (typeof args[2]!=="string") {
          options.symbol = args[2];
          args[2] = null;
        } else {
          options.symbol = typeInfo.symbol ? typeInfo.symbol : layerInfo.symbol;
        }
        if (break_args[3]) options.label = break_args[3];

        classBreakInfos.push(createFillSymbol(args,options));
        //find min max in class breaks and add to typeInfo which can be useful
        if ('min' in typeInfo.breaksRange) {
          typeInfo.breaksRange.min = args[0];
        } else {
          typeInfo.breaksRange.min = Math.min(args[0],typeInfo.breaksRange.min);
        }
        if ('max' in typeInfo.breaksRange) {
          typeInfo.breaksRange.max = args[1];
        } else {
          typeInfo.breaksRange.max = Math.max(args[1],typeInfo.breaksRange.min);
        }
      });
  
      //allow class breaks to be scaled by constant factor for a type
      if (typeInfo.breaksScale) {
        classBreakInfos = classBreakInfos.map(function (breakItem,index) {
          breakItem = clone({source:breakItem});
          breakItem.minValue = typeInfo.breaksScale*breakItem.minValue;
          breakItem.maxValue = typeInfo.breaksScale*breakItem.maxValue;
          //reset custom label for last class
          if (index==classBreakInfos.length-1) {
            breakItem.label = ">= " + breakItem.minValue;
          }
          return breakItem;
        });
      }
  
      var baseDefaultClass = {
        label: "Zero Population",
        symbol: createFillSymbol([0,0,"#aaaaaa"]).symbol
      };
      
      if (typeInfo.defaultClass===null) {
        defaultClass = null;
      } else {
        if (layerInfo.defaultClass===null && !typeInfo.defaultClass) {
          defaultClass = null;
        } else {
          defaultClass = $.extend(true,baseDefaultClass,layerInfo.defaultClass);
          defaultClass = $.extend(true,defaultClass,typeInfo.defaultClass);
        }
      }

/*      
      [typeInfo,layerInfo].forEach(function (info) {
        if (!('defaultClass' in info)) return;
        ['symbol','label'].forEach(function (field) {
          //if defaultClass exists in info object but set to empty then symbol and label should be empty
          if (!info.defaultClass) {
            defaultClass[field] = undefined;
            return;
          }
          //field not already set and field set on info object then set field using info object
          if (!(field in defaultClass) && field in info.defaultClass) {
            defaultClass[field] = info.defaultClass[field];
          }
        });
      });        
  
      //if symbol or label is not in defaultClass from config then use defaults
      //to not have any symbol or label set it to undefined
      if (!('symbol' in defaultClass)) defaultClass.symbol = {};
      //now merge custom default class symbol into a base default class symbol
      var baseDefaultClass = createFillSymbol([0,0,"#aaaaaa"]);
      defaultClass.symbol = $.extend(true,baseDefaultClass.symbol,defaultClass.symbol);
      if (!('label' in defaultClass)) defaultClass.label = "Zero Population";
  */
  
      //Have to total recreate the render to trigger legend update
      var args = {
        type: "class-breaks",
        field: typeInfo.gpoField || type,
        classBreakInfos: classBreakInfos,
        legendOptions: {
          title: typeInfo.fullName
        }
      };
      //Add default symbol and/or label if configured to do so
      if (defaultClass) {
        if (defaultClass.symbol!==undefined) args.defaultSymbol = defaultClass.symbol;
        if (defaultClass.label!==undefined) args.defaultLabel = defaultClass.label;  
      }
  
      var renderer = new EsriModules.ClassBreaksRenderer(args);    
      return renderer;
    }
      
    // use MapView and WebMap classes as shown above
    callback();

}

function loadFeatureToSource(args) {
  var url = args.url;
  var layerInfo = args.layerInfo;
  var outFields = args.outFields;
  var transform = args.transform;

  var serverToClientFieldTypeMap = {
    esriFieldTypeOID: 'oid',
    esriFieldTypeString: 'string',
    esriFieldTypeDouble: 'double'
  };
  return etrends.library.utilities.requestEndpoint(url,{dataType:'json'})
    .then(function (response) {
      console.log(response);
      layerInfo.layerArgs.objectIdField = response.objectIdField;
      //field types returned by service need to be translated to client format
      layerInfo.layerArgs.fields = response.fields
      .filter(function (item) {
        if (!outFields) return true;
        return outFields.indexOf(item.name)>=0;
      })
      .map(function (item) {
        //make copy before changing
        var new_item = $.extend(true,{},item);
        new_item.type = serverToClientFieldTypeMap[item.type];
        return new_item;
      });
      //centroid returned by returned by service need to be translated to client format
      layerInfo.layerArgs.source = response.features.map(function (item) {
        //make copy before changing
        var new_item = $.extend(true,{},item);
        if (transform) {
          transform({item:new_item});
        }
//        new_item.geometry = item.centroid;
//        new_item.geometry.type = 'point';
        return new_item;
      });
    });

}

function layerScaleInView(layerInfo,scale) {
        //if layer is out of scale then don't fire the on select
        var minScale = layerInfo.layerArgs.minScale;
        var maxScale = layerInfo.layerArgs.maxScale;
        //Note: < and > seemed flipped since view.scale and max/min is really 1/scale eg. view.scale = 24000 is really 1/24000
        if (minScale && scale>minScale) return false;
        if (maxScale && scale<maxScale) return false;
        return true;
}
/*
function makeMapOld(mapInfo,callback) {
//  callback();
//  return;
  etrends.toxicsCensusTract.maps[mapInfo.name] = mapInfo; 

  //Add item to type drop down
  var initialType;
  var outFields = 'outFields' in mapInfo ? mapInfo.outFields : [];
  Object.keys(mapInfo.types || {}).forEach(function (type,index) {
    var value = mapInfo.types[type];
    var field = value.gpoField || type;
    outFields.push(field);
    if (!initialType) initialType = type;
    $("#toxics-tract-" + mapInfo.name + "-dropdown").append('<option value="' + type + '">' + value.fullName + '</option>');
    if (index===0) mapInfo.currentType = type;
  });

  var isMapImage = false;
  var isVectorTile = false;
  var isScaleDependent = false;

//    esriConfig.request.proxyUrl = "https://gisint1.rtpnc.epa.gov/gp_proxy/proxy.ashx";
  var layerInfo = {
        layerId: 0,
        opacity: 'opacity' in mapInfo ? mapInfo.opacity : .5,
//        definitionExpression: 'Respiratory_HI>=1 OR Whole_Body_HI>=1',
//        where: 'Respiratory_HI>=1',
//        returnGeometry: false,
//        returnCentroid: true,
//        outFields: "*",
        outFields: outFields
//        outFields: ["Total_Risk","Fire_Risk","Point_Risk"]
  }
  
//GPO feature service item url
//https://epa.maps.arcgis.com/home/item.html?id=2fc20a027f1d47678d25c6208d4edddc  
  var service = mapInfo.service || '2014_NATA_' + mapInfo.name;
  if (isVectorTile)  {
    layerInfo.url = 'https://vectortileservices.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/' + service + '_Feature_Tile_Layer/VectorTileServer';
  } else if (isMapImage) {  
    layerInfo.url = 'https://gispub.epa.gov/arcgis/rest/services/OAR_OAQPS/' + service + '/MapServer/';
  } else {
//    layerInfo.url = 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/' + service + '/FeatureServer/';
//    layerInfo.url = 'https://blt.epa.gov/arcgis/rest/services/BLT/PesticideUsageLimitationAreas/MapServer';
//    layerInfo.url = 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/NATA2017/FeatureServer';
    if (mapInfo.source) {
      layerInfo.source = mapInfo.source;
      layerInfo.objectIdField = mapInfo.objectIdField;      
      layerInfo.fields = mapInfo.fields;      
    } else {
      layerInfo.url = 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/' + service + '/FeatureServer/';
    }
//    layerInfo.url = 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/HI_2017_NATA_Hazard_Index_Above_1_View/FeatureServer';
  }

  if (isScaleDependent) layerInfo.minScale=9000001;

    var pointLayerInfo = {
      layerId: 0,
      url: 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/2014_NATA_Monitors/FeatureServer',
      maxScale: 9000000
  }

    var renderer = createClassBreaksRenderer(initialType);
    
    layerInfo.renderer = renderer;

    var sublayers = [
      {
        id: 10,
//        renderer: renderer,
        source: {
          mapLayerId: 0
        }
      },      
    ];

//    layerInfo.sublayers = sublayers;
  
    var legendlayer;

    var layers = [      
    ];

    var legendLayerInfos = [];
    if (isVectorTile) {
      layers.push(new EsriModules.VectorTileLayer(layerInfo))
    } else if (isMapImage) {
        layers.push(new EsriModules.MapImageLayer(layerInfo))
    } else { 
      legendlayer = new EsriModules.FeatureLayer(layerInfo);     
      legendlayer.on("graphic-add", function(graphic) {
        console.log(graphic);
      });      
      layers.push(legendlayer);
      var legendInfo = {
        title: "Legend",
        layer: legendlayer
      }
      legendLayerInfos.push(legendInfo);
    }

    if (isScaleDependent) layers.push(new EsriModules.FeatureLayer(pointLayerInfo));

    mapInfo.switchType  = function (type) {
      var typeInfo = mapInfo.types[type] || {};
//      var where = typeInfo.gpoField + ">=1";
//      view.allLayerViews.items[1].filter = {where:where};


      //Have to total recreate the render to trigger legend update
      legendlayer.renderer = createClassBreaksRenderer(type);
      mapInfo.currentType = type;
      if (mapInfo.numberLine) mapInfo.numberLine.hideValue();
    };

    mapInfo.showHazardTract = function (type) {
      var typeInfo = mapInfo.types[type] || {};

      var where = typeInfo.gpoField + ">=1";
      var params = {
        returnGeometry: true,
        where:where
      }

//      layers[0].queryFeatures({returnGeometry: true,where:where})
      view.allLayerViews.items[1].queryFeatures(params)
      .then(function (response) {
        console.log(response.features);
      })
    }
    
		var map = new EsriModules.Map({
//      basemap: "streets-vector",
// use gray map to be consistent with nata dashboard
      basemap: "gray-vector",      
      layers: layers
    });
    mapInfo.map = map;

    var viewDiv = "toxics-tract-" + mapInfo.name + "-mapdiv";

    var view = new EsriModules.MapView({
      map: map,
      center: [-98.5,40],
      zoom: 2,
      container: viewDiv // Div element
    });	
    mapInfo.view = view;

    var homeWidget = new EsriModules.Home({ view: view });
    view.ui.add(homeWidget, "bottom-left",0);

    var legend = new EsriModules.Expand({
      content: new EsriModules.Legend({
        view: view,
        declaredClass: 'test-legend-widget-class',
        layerInfos: legendLayerInfos,
        style: 'classic'
      }),
      view: view,
      expanded: false
    });

    mapInfo.legend=legend;
    view.ui.add(legend, "top-right");

    view.on("click", handleViewClick);

    // use MapView and WebMap classes as shown above
    callback();

}
*/
};
//# sourceURL=toxicsCensusTract.js
