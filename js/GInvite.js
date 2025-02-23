document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('BtnInv').addEventListener('click', function (event) {
        event.preventDefault();
        console.log("Invite clicked");

        const formData = new FormData(this);
        var email = formData.get("email");
        console.log(email);
        const url = window.location.pathname.split("/")[2];
        console.log(url);

        fetch(`/addGInvite/${url}`, {
            method: "POST",
            body: formData,
        }).then(function (response) {
            return response.json();
        }).then(function (json) {
            console.log(json);
        });
    });
});