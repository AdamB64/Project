document.getElementById('ComInfo').style.display = "block";

function openTab(evt, cityName) {
    document.getElementById('Help').style.display = "none";
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
}

function generateInputs() {
    const numInputs = parseInt(document.getElementById('numInputs').value);
    const inputContainer = document.getElementById('inputContainer');

    // Clear any previous inputs
    inputContainer.innerHTML = '';

    if (isNaN(numInputs) || numInputs <= 0) {
        alert('Please enter a valid number greater than 0.');
        return;
    }

    for (let i = 1; i <= numInputs; i++) {
        const userContainer = document.createElement('div');
        userContainer.className = 'form-group';

        userContainer.innerHTML = `
                                <h3>Supervisor ${i}</h3>
                                <label for="firstName${i}">First Name:</label>
                                <input type="text" id="firstName${i}" name="firstName${i}" placeholder="Enter first name">
                                <br>
                                <label for="lastName${i}">Last Name:</label>
                                <input type="text" id="lastName${i}" name="lastName${i}" placeholder="Enter last name">
                                <br>
                                <label for="email${i}">Email:</label>
                                <input type="email" id="email${i}" name="email${i}" placeholder="Enter email address">
                                <br>
                                <label for="role${i}">Role:</label>
                                <input type="text" id="role${i}" name="role${i}" placeholder="Enter role">
                                <br>
                                <label for="password${i}">Password:</label>
                                <input type="password" id="password${i}" name="password${i}" placeholder="Enter password">
                            `;

        inputContainer.appendChild(userContainer);
    }
}

function generateInput() {
    const numInputs = parseInt(document.getElementById('numInput').value);
    const inputContainer = document.getElementById('inputContainers');

    // Clear any previous inputs
    inputContainer.innerHTML = '';

    if (isNaN(numInputs) || numInputs <= 0) {
        alert('Please enter a valid number greater than 0.');
        return;
    }

    for (let i = 1; i <= numInputs; i++) {
        const userContainer = document.createElement('div');
        userContainer.className = 'form-mem-group';

        userContainer.innerHTML = `
                                <h3>Members ${i}</h3>
                                <label for="MemfirstName${i}">First Name:</label>
                                <input type="text" id="MemfirstName${i}" name="firstName${i}" placeholder="Enter first name">
                                <br>
                                <label for="MemlastName${i}">Last Name:</label>
                                <input type="text" id="MemlastName${i}" name="lastName${i}" placeholder="Enter last name">
                                <br>
                                <label for="Mememail${i}">Email:</label>
                                <input type="email" id="Mememail${i}" name="email${i}" placeholder="Enter email address">
                                <br>
                                <label for="Memrole${i}">Role:</label>
                                <input type="text" id="Memrole${i}" name="role${i}" placeholder="Enter role">
                                <br>
                                <label for="Mempassword${i}">Password:</label>
                                <input type="password" id="Mempassword${i}" name="password${i}" placeholder="Enter password">
                            `;

        inputContainer.appendChild(userContainer);
    }
}

function validateInputs() {
    // Validate Company Information
    const companyName = document.getElementById('name').value.trim();
    const companyAddress = document.getElementById('address').value.trim();
    const companyEmail = document.getElementById('email').value.trim();
    const companyPassword = document.getElementById('password').value.trim();
    const companyIndustry = document.getElementById('industry').value.trim();

    if (!companyName || !companyAddress || !validateEmail(companyEmail) || !companyIndustry || !companyPassword) {
        alert("Please fill out all company information fields with valid data.");
        return false;
    }

    // Validate Supervisors
    const numSupervisors = parseInt(document.getElementById('numInputs').value) || 0;
    if (numSupervisors < 1) {
        alert("You must add at least one supervisor.");
        return false;
    }
    for (let i = 1; i <= numSupervisors; i++) {
        const firstName = document.getElementById(`firstName${i}`).value.trim();
        const lastName = document.getElementById(`lastName${i}`).value.trim();
        const email = document.getElementById(`email${i}`).value.trim();
        const role = document.getElementById(`role${i}`).value.trim();
        const password = document.getElementById(`password${i}`).value.trim();

        if (!firstName || !lastName || !validateEmail(email) || !role || !password) {
            alert(`Please fill out all fields for Supervisor ${i} with valid data.`);
            return false;
        }
    }

    // Validate Team Members
    const numMembers = parseInt(document.getElementById('numInput').value) || 0;
    if (numMembers < 1) {
        alert("You must add at least one team member.");
        return false;
    }
    for (let i = 1; i <= numMembers; i++) {
        const firstName = document.getElementById(`MemfirstName${i}`).value.trim();
        const lastName = document.getElementById(`MemlastName${i}`).value.trim();
        const email = document.getElementById(`Mememail${i}`).value.trim();
        const role = document.getElementById(`Memrole${i}`).value.trim();
        const password = document.getElementById(`Mempassword${i}`).value.trim();

        if (!firstName || !lastName || !validateEmail(email) || !role || !password) {
            alert(`Please fill out all fields for Member ${i} with valid data.`);
            return false;
        }
    }

    return true;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

document.getElementById('CreateCompany').addEventListener('click', async (e) => {
    if (validateInputs()) {
        // Gather company information
        const company = {
            name: document.getElementById('name').value.trim(),
            address: document.getElementById('address').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value.trim(),
            industry: document.getElementById('industry').value.trim()
        };

        // Gather supervisors information
        const numSupervisors = parseInt(document.getElementById('numInputs').value) || 0;
        const supervisors = [];
        for (let i = 1; i <= numSupervisors; i++) {
            supervisors.push({
                firstName: document.getElementById(`firstName${i}`).value.trim(),
                lastName: document.getElementById(`lastName${i}`).value.trim(),
                email: document.getElementById(`email${i}`).value.trim(),
                role: document.getElementById(`role${i}`).value.trim(),
                password: document.getElementById(`password${i}`).value.trim()
            });
        }

        // Gather team members information
        const numMembers = parseInt(document.getElementById('numInput').value) || 0;
        const members = [];
        for (let i = 1; i <= numMembers; i++) {
            members.push({
                firstName: document.getElementById(`MemfirstName${i}`).value.trim(),
                lastName: document.getElementById(`MemlastName${i}`).value.trim(),
                email: document.getElementById(`Mememail${i}`).value.trim(),
                role: document.getElementById(`Memrole${i}`).value.trim(),
                password: document.getElementById(`Mempassword${i}`).value.trim()
            });
        }

        // Output JSON objects
        //console.log("Company:", JSON.stringify(company, null, 2) + "Supervisor:" + JSON.stringify(supervisors, null, 2) + "Member:" + JSON.stringify(members, null, 2));
        response = fetch('/add-company', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                company,
                supervisors,
                members
            }) // Send a properly structured JSON object
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to send data to the server');
                }
                return response.json();
            })
            .then(data => {
                console.log('Response from server:', data);
                if (data.message === 'Company already exists') {
                    alert("Company email already in use \n Please try again with a different email");
                } else if (data.message === 'Supervisor already exists') {
                    alert("Supervisor email already in use \n Please try again with a different email");
                } else if (data.message === 'Member already exists') {
                    alert("Member email already in use \n Please try again with a different email");
                } else {
                    console.log("Data has been logged to the console.");
                    alert("Company account created successfully!");
                    window.location.href = '/home';
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        //alert("Data has been logged to the console.");
        //redirect: window.location.href = '/home';
    } else {
        e.preventDefault();
    }
});
