console.log("About page script loaded!");

const response = fetch('/api/hello')
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to send data to the server');
        }
        return response.json();
    })
    .then(data => {
        console.log('Response from server:', data);
        const api = document.getElementById("api").textContent = data;
    }
    ).catch(error => {
        console.error('Error:', error);
    });