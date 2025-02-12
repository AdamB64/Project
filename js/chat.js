function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0'); // Get hours (00-23)
    const minutes = now.getMinutes().toString().padStart(2, '0'); // Get minutes (00-59)
    const seconds = now.getSeconds().toString().padStart(2, '0'); // Get seconds (00-59)

    return `${hours}:${minutes}:${seconds}`;
}

function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear().toString(); // Get year (YYYY)
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Get month (01-12)
    const day = now.getDate().toString().padStart(2, '0'); // Get date (01-31)

    return `${year}-${month}-${day}`;
}

document.getElementById("form").addEventListener("submit", function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const user = window.chatData.user._id
    const chatter = window.chatData.chatter._id
    const profile = window.chatData.user.profile;
    const message = formData.get("msg");
    const time = getCurrentTime();
    const date = getCurrentDate();
    let data = { user, message, time, profile, chatter, date };
    data = JSON.stringify(data);
    const msg = document.getElementById("msg");
    msg.value = "";
    fetch("/addChat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: data,
    }).then(function (response) {
        return response.json();
    }).then(function (json) {
        console.log(json);
    });
});