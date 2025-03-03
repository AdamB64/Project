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


document.addEventListener("DOMContentLoaded", function () {
    let startDate = new Date(window.taskData.startDate);
    let endDate = new Date(window.taskData.endDate);
    console.log("Task Start Date:", startDate);
    console.log("Task End Date:", endDate);

    if (!startDate || isNaN(startDate.getTime()) || !endDate || isNaN(endDate.getTime())) {
        console.error("Invalid project start or end date", window.projectData.startDate, window.projectData.endDate);
        document.getElementById("no-tasks").innerText = "Invalid project timeline";
        document.getElementById("no-tasks").style.display = "block";
        return;
    }

    console.log("Project Start Date:", startDate);
    console.log("Project End Date:", endDate);

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
});

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
    }).catch(error => {
        console.error("Error:", error);
    });

}

function addMem() {
    const dropdown = document.getElementById('members');
    const selectedValue = dropdown.options[dropdown.selectedIndex].value;
    const selectedText = dropdown.options[dropdown.selectedIndex].text;
    const list = document.getElementById('memList');
    const listItem = document.createElement('li');
    if (selectedValue) {
        console.log("Selected value:", selectedValue);

        // Check if the member is already in the list
        var existingItems = list.getElementsByTagName("li");
        for (var i = 0; i < existingItems.length; i++) {
            console.log("Existing item:", existingItems)
            if (existingItems[i].innerText === selectedText) {
                alert("Member is already added!");
                return;
            }
        }
    }
    listItem.appendChild(document.createTextNode(selectedText));
    list.appendChild(listItem);

    // Create a hidden input field to submit the value
    var hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.name = "members"; // Allow multiple selections
    hiddenInput.value = selectedValue;
    listItem.appendChild(hiddenInput);
    console.log("List item:", listItem);
    console.log("Hidden input:", hiddenInput);
}


document.getElementById('submit').addEventListener('click', function () {
    console.log("Submit button clicked");

    let form = document.getElementById('form');
    let formData = new FormData(form);
    let formObject = {};

    formData.forEach((value, key) => {
        formObject[key] = value;
    });

    console.log("Form Data:", formObject); // Log the entire form as an object
});

addMem();