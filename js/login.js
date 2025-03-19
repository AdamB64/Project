function openTab(evt, cityName) {
  //console.log(evt + cityName);
  let elements = document.getElementsByClassName('info');
  // Loop through each element and hide it
  for (let i = 0; i < elements.length; i++) {
    elements[i].style.display = "none";
  }
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(cityName).style.display = "block";
  evt.currentTarget.className += " active";
}