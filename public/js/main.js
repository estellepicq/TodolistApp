var socket = io.connect('http://localhost:8081/'); //Replace by http://www.yourdomain.com:8081/ once on server

var listeElt = document.getElementById("liste");

socket.on('send newtodo', function(data){
    listeElt.innerHTML = '';
    data.newtodolist.forEach(function(todo, index){
      var newtodoElt = document.createElement("li");
      newtodoElt.setAttribute("class", "list-group-item");
      newtodoElt.innerHTML = '<a class="btn btn-warning btn-xs active" role="button" href="/supprimer/'
                              + index + '">✘ </a> ' + todo;
      listeElt.appendChild(newtodoElt);
    });
});
