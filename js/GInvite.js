document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('BtnInv').addEventListener('click', function (event) {
    event.preventDefault();
    console.log("Invite clicked");

    const sel = document.getElementById("users");
    const opt = sel.options[sel.selectedIndex].value;
    if (opt == "Select User") {
      alert("Please select a user");
      return;
    }
    //console.log(opt);
    const url = window.location.pathname.split("/")[2];
    //console.log(url);

    fetch(`/addGInvite/${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId: opt })
    })
      .then(function (response) {
        const BBtn = document.getElementById('back');
        BBtn.click();
        return response.json();
      })
      .then(function (json) {
        console.log(json);
      })
      .catch(function (error) {
        console.error('Error:', error);
      });
  });
});