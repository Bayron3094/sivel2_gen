// Mapa de casos sobre OpenStreetMap
// Desarrollado por Luis Alejandro Cruz luisalejo@unicauca.edu.co
// Financiado por CINEP/PPP con recursos de la Universidad de Sheffield
// Cedido al dominio publico de acuerdo a la legislacion colombiana

var markers;
var mapa;
var osmBaldosas;
var controlCapas;

function presentar_mapaosm() {

  //borrar clase container y ocultar footer
  $('.navbar').addClass('navbarosm');
  $('.card-body').addClass('cardbodyosm');
  $('.card').addClass('cardosm');
  $('.page-header').remove();
  $('.container').addClass('divcontenido');
  $('#div_contenido').css({'position': 'relative'});
  $('#div_contenido').removeClass("container");
  $('.divcontenido').removeClass("container");
  $('.divcontenido').removeClass("master-container");
  $('#div_contenido').addClass("container-fluid");
  $('#pie_pagina').css({'display': 'none'});

  //creacion de mapa y sus capas
  osmBaldosas = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; Contribuyentes de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  });

  var filtro = L.control({position: 'topleft'});
  filtro.onAdd = function (mapa) {
    this._div = L.DomUtil.get('filtro-osm');
    return this._div;
  };

  var capasBase= {
    //  "Mapbox" : mapboxTiles,
    "OpenStreetMap" : osmBaldosas,
    "Satelite (ArcGIS)": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'),
    "Oscuro (CartoDB)" : L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png')

  };
  var capasSuperpuestas= {
    "Transporte (OpenPtmap)" : L.tileLayer('http://www.openptmap.org/tiles/{z}/{x}/{y}.png'),
  };
  controlCapas = L.control.layers(capasBase, capasSuperpuestas, 
    {position: 'topleft'});


  if (L.DomUtil.get('agrega-capa') != null && 
    L.DomUtil.get('descarga-capa') != null) {
    // Con Mapbox sería: mapa = L.mapbox.map('mapa-osm', null, {zoomControl: false, minZoom: 2})
    var descargamapaBtn = L.control({position:'bottomleft'});
    descargamapaBtn.onAdd = function (mapa){
      this._div = L.DomUtil.get('descarga-mapa');
      return this._div;
    };

    var agregaCapaBtn = L.control({position: 'bottomleft'});
    agregaCapaBtn.onAdd = function (mapa) {
      this._div = L.DomUtil.get('agregaCapa');
      return this._div;
    };

    mapa = L.map('mapa-osm', {zoomControl: false, minZoom: 2})
    //  .addLayer(mapboxTiles) seria con Mapbox
      .addLayer(osmBaldosas)
      .addControl(filtro)
      .addControl(L.control.zoom({position:'topleft'}))
      .setView([4.6682, -74.071], 6)
      .addControl(controlCapas)
      .addControl(agregaCapaBtn)
      .addControl(descargamapaBtn);
  } else {
    mapa = L.map('mapa-osm', {zoomControl: false, minZoom: 2})
      .addLayer(osmBaldosas)
      .addControl(filtro)
      .addControl(L.control.zoom({position:'topleft'}))
      .setView([4.6682, -74.071], 6)
      .addControl(controlCapas);
  }



  L.control.scale({imperial: false}).addTo(mapa);

  //Crea los clusers de casos y agrega casos
  markers = L.markerClusterGroup();
  window.setTimeout(agregarCasosOsm, 0);

  // Cierra el info al hacer zoom in/out
  mapa.on('zoom', function() {
    if (info != undefined) {
      info.remove(mapa);
    }
  });
}

function mostrarCargador() {
  $('#cargador').show();
}

function ocultarCargador() {
  $('#cargador').hide();
}

function downloadUrl(url, callback) {
  var request = window.ActiveXobject ?
    new ActiveXObject('Microsoft.XMLHTTP') : new XMLHttpRequest;
  request.onreadystatechange = function() {
    if (request.readyState == 4) {
      callback(request);
    }
  };
  request.open('GET', url, true);
  request.send(null);
}

// una colección GeoJson vacía
var coleccion = {
  "type": "FeatureCollection",
  "features": []
};
var marcadoresCreados;

function agregarCasosOsm() {
  var desde = $('#campo-desde').val();
  var hasta = $('#campo-hasta').val();
  var departamento = $('#departamento').val();
  var prresp = $('#presponsable').val();
  var tvio = $('#tvio').val();
  var root = window;
  sip_arregla_puntomontaje(root);
  var ruta = root.puntomontaje + 'casos.json';
  fechainicial = Date.parse(desde);
  fechafinal = Date.parse(hasta);
  const hoy = new Date();
  const maniana = new Date(hoy);
  maniana.setDate(maniana.getDate() + 1);
  if ( +fechainicial <= +maniana && +fechafinal <= +maniana){
    if ( +fechainicial <= +fechafinal){
      var requestUrl = ruta + '?filtro[q]=&filtro[fechaini]='+ desde +'&filtro[fechafin]='+ hasta +'&filtro[disgenera]=reprevista.json&idplantilla=reprevista&commit=Enviar';

      if (departamento != undefined && departamento != 0){
        requestUrl += '&filtro[departamento_id]=' + departamento;
      }
      if (prresp != undefined && prresp != 0){
        requestUrl += '&filtro[presponsable_id]=' + prresp;
      }
      if (tvio != undefined && tvio != 0){
        requestUrl += '&filtro[categoria_id]=' + tvio;
      }
      mostrarCargador();
      downloadUrl(requestUrl, function(req) {
        var data = req.responseText;
        if (data == null || data.substr(0, 1) != '{'){
          ocultarCargador();
          $('#nrcasos').html("0");
          window.alert("El URL" + requestUrl + "no retorno informacion JSON.\n\n" + data);
          return;
        }
        var o = jQuery.parseJSON(data);
        var numResult = 0;
        for(var codigo in o) {
          var lat = o[codigo].latitud;
          var lng = o[codigo].longitud;
          var titulo= o[codigo].titulo;
          var fecha = o[codigo].fecha;
          if (lat != null || lng != null){
            numResult++;
            var point= new L.LatLng(parseFloat(lat), parseFloat(lng));
            var title = fecha + ": " + titulo;

            marcadoresCreados = createMarker(point, codigo, title);
            actualizaGeoJson(marcadoresCreados);
          }
        }
        $('#nrcasos').html(numResult + ' Casos mostrados!');
        ocultarCargador();
      });
    }
    else{
      alert("La fecha Final debe ser mas antigua que la inicial");
      window.location.reload();
    } 
  }
  else{
    alert("La fecha Final e Inicial debe existir");
    window.location.reload();
  } 
}

function actualizaGeoJson(datosMarcadores){
  var geojson = marcadoresCreados.toGeoJSON();
  coleccion.features.push(geojson);
  $('#descargar-mapa').on('click', function(){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(coleccion));
    var descargaGeo = document.getElementById('enlace-descarga');
    descargaGeo.setAttribute("href",     dataStr     );
    descargaGeo.setAttribute("download", "casos.geojson");
  });
}

function createMarker(point, codigo, title) {
  // Exportar los casos a formato GeoJson
  var capaCasos = L.layerGroup();
  var casoMarker = new L.Marker(point).addTo(capaCasos);
  markers.addLayer(capaCasos);
  mapa.addLayer(markers);

  //Acción al hacer clic en caso en el mapa
  casoMarker.on('click', clicMarcadorCaso);
  function clicMarcadorCaso() {
    mostrarCargador();
    var root = window;
    sip_arregla_puntomontaje(root);
    var ruta = root.puntomontaje + 'casos/';
    var requestUrl = ruta + codigo + ".json";  
    downloadUrl(requestUrl, function(req) {
      data = req.responseText;
      if (data == null || data.substr(0, 1) != '{') {
        ocultarCargador();
        window.alert("El URL " + requestUrl +
          " no retorno detalles del caso\n " + data);
        return;
      }
      var o = jQuery.parseJSON(data);
      var id = (typeof o['caso'].id != 'undefined') ? o['caso'].id : -1;
      var titulo = (typeof o['caso'].titulo != 'undefined') ? 
        o['caso'].titulo : '';
      var hechos = (typeof o['caso'].hechos != 'undefined') ? 
        o['caso'].hechos : '--';
      var fecha = o['caso'].fecha; 
      var hora = o['caso'].hora; 
      var departamento = o['caso'].departamento; 
      var municipio = o['caso'].municipio; 
      var centro_poblado = o['caso'].centro_poblado;
      var lugar = o['caso'].lugar;
      var victimas = o['caso'].victimas;
      var prresp = o['caso'].presponsables;
      var descripcionCont = '<div>' +
        '<h3>' + titulo + '</h3>' + '</div>' + '<div>' + hechos + '</div>';
      var hechosCont = '<div><table>';
      hechosCont += ((typeof fecha != 'undefined') && fecha != "") ? 
        '<tr><td>Fecha:</td><td>' + fecha + '</td></tr>' : '';
      hechosCont += ((typeof hora != 'undefined') && hora != "") ? 
        '<tr><td>Hora:</td><td>' + hora + '</td></tr>' : '';
      hechosCont += ((typeof departamento != 'undefined') && 
        departamento != "") ?  '<tr><td>Departamento:</td><td>' +
        departamento + '</td></tr>' : '';
      hechosCont += ((typeof municipio != 'undefined') && 
        municipio != "") ?  '<tr><td>Municipio:</td><td>' +
        municipio + '</td></tr>' : '';
      hechosCont += ((typeof centro_poblado != 'undefined') && 
        centro_poblado != "") ?  '<tr><td>Centro Poblado:</td><td>' +
        centro_poblado + '</td></tr>' : '';
      hechosCont += ((typeof lugar != 'undefined') && 
        lugar != "") ?  '<tr><td>Vereda:</td><td>' +
        lugar + '</td></tr>' : '';
      hechosCont += ((typeof codigo != 'undefined') && codigo != "") ? 
        '<tr><td>Codigo:</td><td>' + codigo + '</td></tr>' : '';
      hechosCont += '</table></div>';
      var victimasCont = '<div><table>' +
        '<tr><td>Victimas:</td><td>';
      for(var cv in victimas) {
        var victima = victimas[cv];
        victimasCont += ((typeof victima != 'undefined') && 
          victima != "") ? victima + '<br />' : 'SIN INFORMACIÓN';
      }

      victimasCont += '</td></tr><tr>' +
        '<td>Presuntos Responsables:</td><td>';
      for(var cp in prresp) {
        var prrespel = prresp[cp];
        victimasCont += ((typeof prrespel != 'undefined') && prrespel != "") ? 
          prrespel + '<br />' : 'SIN INFORMACIÓN';
      }
      victimasCont += '</td></tr></table></div>';
      capa(descripcionCont, hechosCont, victimasCont);
      ocultarCargador();
    });
  }

  return capaCasos;
}

// variable que guarda los detalles del marker al que se le dio click
var eventBackup;
// variable global donde se carga la capa flotante
var info;
// capa flotante donde se muestra la info al darle click sobre un maker
function capa(des, hec, vic){
  if (info != undefined) { // se valida si existe informacion en la capa, si es borra la capa
    info.remove(mapa); // esta linea quita la capa flotante
  }
  info = L.control();
  info.onAdd = function (mapa) {
    this._div = L.DomUtil.create('div', 'info');
    this.update(des, hec, vic);
    return this._div;
  };
  info.update = function (des, hec, vic) {
    this._div.innerHTML = '<button type="button" id="closeBtn" class="close" aria-label="Close">'+
      '<span aria-hidden="true">&times;</span>'+
      '</button><div id="infow">'+
      '<ul class="nav nav-tabs" id="myTab" role="tablist">'+
      '<li class="nav-item active"><a class="nav-link" id="infodes-tab" data-toggle="tab" href="#infodes" role="tab" aria-controls="infodes" aria-selected="true">Descripción</a></li>'+
      '<li class="nav-item"><a class="nav-link" id="infodatos-tab" data-toggle="tab" href="#infodatos" role="tab" aria-controls="infodatos" aria-selected="false">Datos</a></li>'+
      '<li class="nav-item"><a class="nav-link" id="infovictima-tab" data-toggle="tab" href="#infovictima" role="tab" aria-controls="infovictima" aria-selected="false">Víctimas</a></li>'+
      '</ul>'+
      '<div class="tab-content" id="myTabContent">'+
      '<div class="tab-pane fade show active in panel-infomapa" id="infodes" role="tabpanel" aria-labelledby="infodes-tab">'+ des +'</div>'+
      '<div class="tab-pane fade panel-infomapa" id="infodatos" role="tabpanel" aria-labelledby="infodatos-tab">'+ hec +'</div>'+
      '<div class="tab-pane fade panel-infomapa" id="infovictima" role="tabpanel" aria-labelledby="infovctima-tab">'+ vic +'</div>'+
      '</div>'+
      '</div>';
  };
  info.addTo(mapa);
}

// Cierra la capa flotante desde el boton cerrar
$(document).on('click','#closeBtn', function() {
  if (info != undefined) {
    info.remove(mapa);
  }
});

// Cierra la capa flotante desde el boton cerrar
$(document).on('click','#btnCerrarAgCapa', function() {
  if (agregaCapaDiv != undefined) {
    agregaCapaDiv.remove(mapa);
  }
});

//limpia el mapa de casos cada que se filtra
$(document).on('click', '#agregar-casos-osm', function(){
  markers.clearLayers(); 
  coleccion.features = [];
  agregarCasosOsm();
});

//Funciones de agregar supercapas
$(document).on('click', '#agregar-capa', function(){
  agregarCapa();
  var contenidoGeoJson;

  // Función que sube la capa del usuario
  document.getElementById('archivoGeo').addEventListener('change', leerArchivo, false);
  function leerArchivo(e){
    var archivo = e.target.files[0];
    if (!archivo) {
      return;
    }
    var lector = new FileReader();
    lector.onload = function(e) {
      contenidoGeoJson = e.target.result;
    };
    lector.readAsText(archivo);
  }
  $('#subirCapa').on('click', function(){
    nombreCapanueva = $('#nombreCapaNueva').val();
    var geoJsonParseado = jQuery.parseJSON(contenidoGeoJson);
    var capaGeoJson = L.geoJSON(geoJsonParseado);
    mapa.addLayer(capaGeoJson);
    controlCapas.addOverlay(capaGeoJson, nombreCapanueva);
    agregaCapaDiv.remove(mapa);
    alert("Capa agregada con éxito");
  });
});

// Boton agregar capas
var agregaCapaDiv;
function agregarCapa(){
  if (agregaCapaDiv != undefined) { // se valida si existe informacion en la capa, si es borra la capa
    agregaCapaDiv.remove(mapa); // esta linea quita la capa flotante
  }
  agregaCapaDiv = L.control();
  agregaCapaDiv.onAdd = function (mapa) {
    this._div = L.DomUtil.create('div', 'agregaCapaDiv');
    this.updateAgregaCapaDiv();
    return this._div;
  };

  agregaCapaDiv.updateAgregaCapaDiv = function () {
    this._div.innerHTML = '<div class="card border-primary"> <div class="card-body"><button type="button" id="btnCerrarAgCapa" class="close" aria-label="Close">'+ 
      '<span aria-hidden="true">&times;</span></button>'+
      '<h5>Agregar capa al mapa</h5>' +
      '<input id="nombreCapaNueva" class="form-group form-control campo-subir" type="text" placeholder="Nombre de la Capa">'+
      '<div class="form-group custom-file campo-subir"><input id="archivoGeo" type="file" class="custom-file-input" id="customFileLang" lang="es"><label class="custom-file-label" for="customFileLang">Seleccionar archivo GeoJSON</label></div>' +
      '<button id="subirCapa" class="form-group btn btn-primary">Subir</button></div></div>';
  };
  agregaCapaDiv.addTo(mapa);
}
