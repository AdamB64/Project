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
