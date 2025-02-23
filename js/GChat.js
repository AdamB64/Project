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
    console.log("Submit clicked");

    const formData = new FormData(this);
    var message = formData.get("msg");
    const time = getCurrentTime();
    const date = getCurrentDate();
    for (let i = 0; i < selectedFiles.length - 1; i++) {
        formData.append("files", selectedFiles[i]); // ✅ Name must match multer's "files"
    }
    formData.append("message", message)
    formData.append("time", time)
    formData.append("date", date);
    console.log(formData);
    for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
    }

    const msg = document.getElementById("msg");
    msg.value = "";
    // Reset everything after sending
    selectedFiles = [];
    fileInput.value = "";
    updateFileDisplay();

    const url = window.location.pathname.split("/")[2];
    console.log(url);

    fetch(`/addGChat/${url}`, {
        method: "POST",
        body: formData,
    }).then(function (response) {
        return response.json();
    }).then(function (json) {
        console.log(json);
    });

});

$(document).ready(function () {
    const url = window.location.pathname.split("/")[2];
    let lastMessageId = null; // Store last message ID to avoid duplicate messages

    function fetchMessages() {
        const url = window.location.pathname.split("/")[2];
        console.log(url);
        let lastMessageId = null;
        $.ajax({
            url: '/get-Gmessages/' + url,
            method: 'POST',
            contentType: 'application/json',
            success: function (response) {
                console.log(response);
                let shouldScroll = isScrolledToBottom();
                // 🔹 Check if the message has attached files

                response.forEach(function (message) {
                    if (!document.getElementById(`msg-${message._id}`)) {
                        //console.log(message);
                        let messageClass = window.chatData.chatId === message.id ? "sent" : "received";

                        // 🔹 Check if the message has attached files
                        let filesHtml = `<div class="message-files" id="msg-${message._id}-files"></div>`;

                        if (message.file && message.file.length > 0) {
                            // 🔹 Send POST request to get file details
                            fetch("/getFiles", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ fileIds: message.file }), // Sending an array of file IDs
                            })
                                .then(response => response.json())
                                .then(files => {
                                    console.log("Files Received:", files);
                                    let fileDisplayHtml = "";

                                    files.forEach(file => {
                                        let fileUrl = `/file/${file._id}`; // URL to fetch the file

                                        if (file.contentType.startsWith("image")) {
                                            // ✅ Display images as previews
                                            fileDisplayHtml += `
                                            <div class="file-preview">
                                                <a href="${fileUrl}" target="_blank">
                                                    <img src="${fileUrl}" alt="Attached Image" class="chat-image">
                                                </a>
                                            </div>`;
                                        } else {
                                            // ✅ Provide a download link for documents, scripts, and other files
                                            fileDisplayHtml += `
                                            <div class="file-download">
                                                <a href="${fileUrl}" download="${file.filename}">
                                                    📄 <strong>${file.filename}</strong>
                                                </a>
                                            </div>`;
                                        }
                                    });

                                    // Insert into a div with id="fileContainer"
                                    document.getElementById(`msg-${message._id}-files`).innerHTML = fileDisplayHtml;
                                })
                                .catch(error => console.error("Error fetching files:", error));

                        }

                        // 🔹 Message HTML
                        let messageHtml = `
    <div class="message-container ${messageClass}" id="msg-${message._id}">
        <p class="message-time">${message.timestamp} <br>on the ${new Date(message.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        <div class="message-content">
            <img src="${message.profile}" alt="Profile Picture" class="message-profile">
            <strong class="message-sender">${message.firstName} ${message.lastName}:</strong>
            <span class="message-text">${message.message}</span>
            ${filesHtml} <!-- 🔹 Placeholder for file attachments -->
        </div>
    </div>`;
                        $('#chat-box').append(messageHtml);
                    }
                });

                if (shouldScroll) {
                    scrollToBottom();
                }

                if (response.length > 0) {
                    lastMessageId = response[response.length - 1]._id;
                }
            },
            error: function (err) {
                console.error("Error fetching messages:", err);
            }
        });
    }

    function isScrolledToBottom() {
        let chatBox = document.getElementById("chat-box");
        return chatBox.scrollHeight - chatBox.scrollTop <= chatBox.clientHeight + 50;
    }

    function scrollToBottom() {
        let chatBox = document.getElementById("chat-box");
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Fetch messages every 3 seconds
    setInterval(fetchMessages, 3000);

    // Fetch messages on page load
    fetchMessages();
});

const headerList = document.getElementById('HDList');

const li = document.createElement('li');
li.className = "HDLitem";
headerList.appendChild(li);

const url = window.location.pathname.split("/")[2];
const a = document.createElement('a');
a.href = "/GInvite/" + url;
a.textContent = "Invite";  // Sets the visible text of the link
a.className = "HDLitemLink";  // Sets the class attribute of the link
li.appendChild(a);

