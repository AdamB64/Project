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