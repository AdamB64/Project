document.addEventListener('DOMContentLoaded', async function () {
  try {
    const response = await fetch('/users', {
      method: 'POST',
      credentials: 'include', // Ensures cookies are sent
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Response:', response);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('User Data:', data);
  } catch (error) {
    console.error('Error fetching user:', error.message);
  }

});

function changePassword(userId) {
  const newPassword = prompt("Enter new password:");
  console.log("New password:");
  if (newPassword) {
    fetch(`/change-password/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password: newPassword })
    })
      .then(response => response.json())
      .then(data => {
        alert(data.message);
      })
      .catch(error => console.error("Error:", error));
  }
}

function changeProfile(userId) {
  document.getElementById('fileInput').click();
}

function uploadImage(event, userId) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.readAsDataURL(file); // Convert to Base64

  reader.onload = async () => {
    const base64Image = reader.result;

    const response = await fetch("/upload-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, profileImage: base64Image })
    });

    const data = await response.json();
    console.log("Upload Profile:", data);
    if (data.success) {
      document.getElementById("profileImage").src = data.profileImage;
      alert("Profile picture updated successfully!");
    } else {
      alert("Failed to update profile picture.");
    }
  };

  reader.onerror = (error) => console.error("Error converting image:", error);
}

function logout() {
  fetch('/logout', {
    method: 'POST',
    credentials: 'include'
  })
    .then(response => {
      if (response.redirected) {
        window.location.href = response.url; // Redirects to the login page
      } else {
        console.error("Logout failed.");
      }
    })
    .catch(error => console.error('Error logging out:', error));
}