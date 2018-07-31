var app = {

  model: {
    "hectometros": [{"fecha": "11/05/2108", "hectometros": "21793", "comentario": "Este día a estado todo el tiempo nublado"}]
  },

  firebaseConfig: {
    apiKey: "AIzaSyB7gZ2pZXmck2lppzMfqDQKZN-ooTBjmaM",
    authDomain: "control-vinedo.firebaseapp.com",
    databaseURL: "https://control-vinedo.firebaseio.com",
    projectId: "control-vinedo",
    storageBucket: "control-vinedo.appspot.com",
    messagingSenderId: "717408376301"
  },

  inicio: function(){
    this.iniciaFastClick();
    //this.iniciaFirebase();
    this.iniciaBotones();
    this.refrescarLista();
    this.mostrarOffline();
  },

  iniciaFastClick: function() {
    FastClick.attach(document.body);
  },

  iniciaFirebase: function() {
    firebase.initializeApp(this.firebaseConfig);
  },

  iniciaBotones: function() {
    var salvar = document.querySelector('#salvar');
    var ocultar = document.querySelector('#ocultar');
    var anadir = document.querySelector('#anadir');
    var borrarTodo= document.querySelector('#borrarTodo');

    anadir.addEventListener('click' ,this.mostrarEditor ,false);
    salvar.addEventListener('click' ,this.salvarNota ,false);   
    ocultar.addEventListener('click' ,this.ocultarEditor ,false);     
    borrarTodo.addEventListener('click', this.borrarTodo, false);
  },

  mostrarEditor: function() {
    document.getElementById('hectometros').value = "";
    document.getElementById('comentario').value = "";
    document.getElementById('fecha').value = "";
    document.getElementById("note-editor").style.display = "block";
    document.getElementById('fecha').focus();
  },

  mostrarOffline: function(){
    if(app.hayWifi()) {
      document.getElementById("siWifi").style.display = "block";
    }else if(!app.hayWifi()) {
      document.getElementById("wifi").style.display = "block";
      if(!app.hayDatos()) {
        document.getElementById("datos").style.display = "block";
      }
    } 
  },

  salvarNota: function() {
    app.construirNota();
    app.ocultarEditor();
    app.refrescarLista();
    app.grabarDatos();
  },

  construirNota: function() {
    var hectometros = app.model.hectometros;
    hectometros.push({"hectometros": app.extraerTitulo() , "comentario": app.extraerComentario() , "fecha": app.extraerFecha() });
  },

  extraerTitulo: function() {
    return document.getElementById('hectometros').value;
  },

  extraerComentario: function() {
    return document.getElementById('comentario').value;
  },

  extraerFecha: function() {
    return document.getElementById('fecha').value;
  },

  ocultarEditor: function() {
    document.getElementById("note-editor").style.display = "none";
  },

  refrescarLista: function() {
    var div = document.getElementById('notes-list');
    var div2 = document.getElementById('anadirhtml');
    
    div.innerHTML = this.anadirhectometrosALista();
    div2.innerHTML = this.anadirhtml();

  },

  anadirhectometrosALista: function() {
    var hectometros = this.model.hectometros;
    var hectometrosDivs = '';
    var totalhecto=0;
    for (var i in hectometros) {
      var hecto = hectometros[i].hectometros;
      var fechasinformato= hectometros[i].fecha;
      var fecha = this.formatof(fechasinformato);
      var comentario= hectometros[i].comentario;
      var totalmediciones=hectometros.length;
      //totalhecto+=hecto;
      totalhecto=parseInt(hectometros[i].hectometros)-parseInt(hectometros[0].hectometros);
      hectometrosDivs = hectometrosDivs + this.anadirNota(i, hecto, comentario, fecha, totalhecto) ;
    }
    
    hectometrosDivs = hectometrosDivs+this.anadirhtml(totalhecto, totalmediciones);
    return hectometrosDivs;

  },

  anadirNota: function(id, hectometros, comentario, fecha, totalhecto) {

    return "<div class='note-item' id='note-itemas[" + id + "]'>" +id+ "&nbsp;-" + hectometros +"&nbsp;->" + fecha + "<br>" + comentario + "<br>Hc3 consumidos hasta ahora: <b>"+ totalhecto +"</b><button class='borrar' onclick='app.borrarNota("+ id +")'>Borrar</button></div>";

  },

  anadirhtml: function(totalhecto, totalmediciones){
    return "<div class='card-panel teal'>"+totalmediciones+" Mediciones tomadas. Total de los hectometros cúbicos consumidos: <b>" + totalhecto +" Hc<sup>3</sup></b>, total en litros de agua: <b>" + totalhecto*1000 + " litros.</b></div>";//"<div class='note-item'" + totalhecto+"</div>";
  },


  formatof: function(texto){
    return texto.replace(/^(\d{4})-(\d{2})-(\d{2})$/g,'$3/$2/$1');
  },

  grabarDatos: function() {
    window.resolveLocalFileSystemURL(cordova.file.externalApplicationStorageDirectory, this.gotFS, this.fail);
  },

  gotFS: function(fileSystem) {
    fileSystem.getFile("files/"+"hectometros.json", {create: true, exclusive: false}, app.gotFileEntry, app.fail);
  },

  gotFileEntry: function(fileEntry) {
    fileEntry.createWriter(app.gotFileWriter, app.fail);
  },

  gotFileWriter: function(writer) {
    writer.onwriteend = function(evt) {
      console.log("datos grabados en externalApplicationStorageDirectory");
      if(app.hayWifi()) {
        app.salvarFirebase();
      }
    };
    writer.write(JSON.stringify(app.model));
  },

  salvarFirebase: function() {
    if (!firebase.apps.length) {
       app.iniciaFirebase(  );//console.log("inicializado firebase")
    }
    var ref = firebase.storage().ref('hectometros.json');
    //ref.putString(JSON.stringify(app.model));
    ref.putString(JSON.stringify(app.model)).then(function(snapshot) {
       console.log('Subido a firebase');
    
    }).catch(app.fail);
  },

  hayWifi: function() {
    return navigator.connection.type==='wifi';
  },
  hayDatos: function() {
    return navigator.connection.type==='cell';
  },

  leerDatos: function() {
    if (app.hayWifi() || app.hayDatos()) {
      app.iniciaFirebase();
      var ref = firebase.storage().ref('hectometros.json');
      ref.getDownloadURL().then(function(url) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {  // Cuando termine la descarga
          var res = xhr.response;
          if (res !== "") { // Si model.js de FireBase no está vacio: 
            app.model = JSON.parse(res); // Recupero las hectometros guardadas en FireBase
            app.grabarDatos();
          }
        };
        xhr.open('GET', url); 
        xhr.send(); 
        console.log('leido de firabase')
      });
    }
    setTimeout(function() { // Si model.js de FireBase está vacio cargo las hectometros desde el Dispositivo
      window.resolveLocalFileSystemURL(cordova.file.externalApplicationStorageDirectory, app.obtenerFS, app.fail);
    }, 0);
  },

  obtenerFS: function(fileSystem) {
    fileSystem.getFile("files/"+"hectometros.json", null, app.obtenerFileEntry, app.noFile);
  },

  obtenerFileEntry: function(fileEntry) {
    fileEntry.file(app.leerFile, app.fail);
  },

  leerFile: function(file) {
    var reader = new FileReader();
    reader.onloadend = function(evt) {
      var data = evt.target.result;
      app.model = JSON.parse(data);
      app.inicio();
    };
    reader.readAsText(file);
  },

  noFile: function(error) {
    app.inicio();
  },

  fail: function(error) {
    console.log(error.code);
  },

  borrarNota: function(id){
    var hectometros=this.model.hectometros;
    hectometros.splice(id,1);
    app.refrescarLista(); 
    app.grabarDatos();
  },

  borrarTodo: function(){
    
    var r = confirm("Seguro que deseas borrar todo?");
    if (r == true) {
      var hectometros = app.model.hectometros;
      hectometros.splice(0,hectometros.length);
      app.refrescarLista();
      app.grabarDatos();
    } else {
        app.refrescarLista();
    }
    
  },


};

if ('addEventListener' in document) {
  document.addEventListener("deviceready", function() {
    app.leerDatos();
  }, false);
};


