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


/*document.addEventListener("DOMContentLoaded", function () {

    let startDate = new Date(window.taskData.startDate);
    let endDate = new Date(window.taskData.endDate);

    if (!startDate || isNaN(startDate.getTime()) || !endDate || isNaN(endDate.getTime())) {
        console.error("Invalid project start or end date", window.projectData.startDate, window.projectData.endDate);
        document.getElementById("no-tasks").innerText = "Invalid project timeline";
        document.getElementById("no-tasks").style.display = "block";
        return;
    }

    //console.log("Project Start Date:", startDate);
    //console.log("Project End Date:", endDate);

    let tasks = [];

    if (tasks.length === 0) {
        console.log("No tasks found");
        document.getElementById("no-tasks").style.display = "block";
    }

    let gantt = new Gantt("#gantt", tasks, {
        view_mode: "Day",
        date_format: "YYYY-MM-DD",
        start: startDate,
        end: endDate
    });
    gantt.render();
});*/

function progress() {
    const u = window.location.href
    const parts = u.split("/");
    const url = parts[parts.length - 1];
    var x = document.getElementById("progress");
    fetch(`/update-task/${url}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            progress: x.value
        })
    }).then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Request failed.');
    }).then(data => {
        console.log("Success:", data);
        window.location.reload();
    }).catch(error => {
        console.error("Error:", error);
    });

}

document.getElementById('addMem').addEventListener('click', function () {
    //console.log("Add member button clicked");
    const dropdown = document.getElementById('members');
    //console.log("Dropdown:", dropdown);
    const selectedValue = dropdown.options[dropdown.selectedIndex].value;
    if (selectedValue === "0") {
        alert("Please select a member");
        return;
    }
    const selectedText = dropdown.options[dropdown.selectedIndex].text;
    const list = document.getElementById('memList');
    const listItem = document.createElement('li');
    console.log("List:", list);
    if (selectedValue) {
        console.log("Selected value:", selectedValue);

        // Check if the member is already in the list
        var existingItems = list.getElementsByTagName("li");
        for (var i = 0; i < existingItems.length; i++) {
            /*console.log("Existing item:", existingItems)
            console.log("Selected text:", selectedText);*/
            if (existingItems[i].getAttribute("data-value") === selectedValue) {
                alert("Member is already added!");
                return;
            }
        }
    }
    listItem.setAttribute("data-value", selectedValue);
    listItem.textContent = selectedText;

    // Create a hidden input field to submit the value
    var hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.id = "HMember";
    hiddenInput.name = "members"; // Allow multiple selections
    hiddenInput.value = selectedValue;
    listItem.appendChild(hiddenInput);
    //console.log("List item:", listItem);
    //console.log("Hidden input:", hiddenInput);

    // Add a remove button
    var removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.classList.add("button1");
    removeButton.onclick = function () {
        list.removeChild(listItem);
    };

    listItem.appendChild(removeButton);
    list.appendChild(listItem);
});

document.getElementById('FSubmit').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent default form submission behavior

    const hiddenInput = document.getElementById('HMember');
    console.log(hiddenInput);
    let form = document.getElementById('form');
    let formData = new FormData(form);
    let formObject = {};

    let isValid = true;
    let errorMessage = "";

    // Convert form data to an object
    formData.forEach((value, key) => {
        if (key === "members") {
            if (!Array.isArray(formObject[key])) {
                formObject[key] = []; // Initialize as an array if it doesn't exist
            }
            formObject[key].push(value.trim()); // Add value to the array
        } else {
            formObject[key] = value.trim(); // Directly assign other values
        }
        console.log("Key:", key, "Value:", value);

        // Check if any field is empty
        if (!formObject[key]) {
            isValid = false;
            errorMessage += `The field ${key} is required.\n`;
        }
    });

    // Ensure 'members' is greater than '0'
    if (parseInt(formObject.members, 10) <= 0) {
        isValid = false;
        errorMessage += 'Members must be greater than 0.\n';
    }

    // Validate start date and end date
    let startDate = new Date(formObject.startDate);
    let endDate = new Date(formObject.endDate);

    if (isNaN(startDate) || isNaN(endDate)) {
        isValid = false;
        errorMessage += "Invalid date format. Please select valid dates.\n";
    } else if (startDate >= endDate) {
        isValid = false;
        errorMessage += "Start date must be before the end date.\n";
    }

    if (!isValid) {
        alert(errorMessage); // Show validation error
        return; // Stop submission if validation fails
    }

    // If validation passes, proceed with form submission
    fetch(`/add-Sub_task/${window.taskData.id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formObject)
    }).then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Request failed.');
    }).then(data => {
        console.log("Success:", data);
        alert("Sub Task Added Successfully");
        window.location.reload();
    }).catch(error => {
        console.error("Error:", error);
        alert("An error occurred while submitting the form.");
    });
});

function update(id, todo) {
    /*console.log("Update button clicked");
    console.log("ID:", id);
    console.log("Todo:", todo);*/

    fetch(`/update-Sub_Task/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Progress: todo })
    }).then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Request failed.');
    }).then(data => {
        console.log("Success:", data);
        alert("Sub Task Updated Successfully");
        window.location.reload();
    }).catch(error => {
        console.error("Error:", error);
    });
}


function change(id) {
    const cover = document.getElementById('cover')
    cover.classList.add('cover')
    cover.classList.remove('hide')
}

function closeCover() {
    console.log("Close button clicked");
    const cover = document.getElementById('cover')
    cover.classList.add('hide')
    cover.classList.remove('cover')
}