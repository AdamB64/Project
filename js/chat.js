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
  const user = window.chatData.user._id;
  const chatter = window.chatData.chatter._id;
  const profile = window.chatData.user.profile;
  const message = formData.get("msg");
  const time = getCurrentTime();
  const date = getCurrentDate();
  formData.append("user", user);
  formData.append("message", message);
  formData.append("time", time);
  formData.append("profile", profile);
  formData.append("chatter", chatter);
  formData.append("date", date);
  for (let i = 0; i < selectedFiles.length - 1; i++) {
    formData.append("files", selectedFiles[i]); // ✅ Name must match multer's "files"
  }

  for (let pair of formData.entries()) {
    console.log("loop " + pair[0] + ": " + pair[1]);
    console.log(selectedFiles.length);
  }


  const msg = document.getElementById("msg");
  msg.value = "";
  // Reset everything after sending
  selectedFiles = [];
  fileInput.value = "";
  updateFileDisplay();


  fetch("/addChat", {
    method: "POST",
    body: formData,
  }).then(function (response) {
    return response.json();
  }).then(function (json) {
    console.log(json);
  });
});


$(document).ready(function () {
  let lastMessageId = null; // Store last message ID to avoid duplicate messages

  function fetchMessages() {
    $.ajax({
      url: '/get-messages',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        user: window.chatData.user._id,
        chatter: window.chatData.chatter._id,
        lastMessageId: lastMessageId
      }),
      success: function (response) {
        let shouldScroll = isScrolledToBottom();

        response.forEach(function (message) {
          if (!document.getElementById(`msg-${message._id}`)) {
            //console.log(message);
            let messageClass = (message.sender === window.chatData.user._id) ? 'sent' : 'received';
            let senderName = (message.sender === window.chatData.user._id) ? 'You' : window.chatData.chatter.firstName;
            let profileImage = (message.sender === window.chatData.user._id) ? window.chatData.user.profile : window.chatData.chatter.profile;

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
                <img src="${profileImage}" alt="Profile Picture" class="message-profile">
                <strong class="message-sender">${senderName}:</strong>
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