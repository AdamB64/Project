function invite() {
    // Prevent default form submission
    event.preventDefault();

    // Select the form
    const form = document.getElementById('form');

    // Collect form data
    const formData = {
        role: document.querySelector("input[name='role']").value,
        firstName: document.querySelector("input[name='first']").value,
        lastName: document.querySelector("input[name='last']").value,
        email: document.querySelector("input[name='email']").value,
        password: document.querySelector("input[name='password']").value,
        type: document.querySelector("select[name='drop']").value,
    };

    // Validate Email
    if (!validateEmail(formData.email)) {
        alert("Please enter a valid email address.");
        return;
    }

    // Send POST request to /add-worker
    fetch("/add-worker", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Worker successfully added!");
                form.reset(); // Reset form fields
            } else {
                alert("Error: " + data.message);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("An error occurred. Please try again.");
        });
}

// Function to validate email format
function validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}
