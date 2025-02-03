document.addEventListener('DOMContentLoaded', async function () {
    try {
        const response = await fetch('/users', {
            method: 'POST',
            credentials: 'include', // Ensures cookies are sent
            headers: {
                'Content-Type': 'application/json'
            }
        });

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