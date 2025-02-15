
document.addEventListener("DOMContentLoaded", function () {
    let startDate = new Date(window.projectData.startDate);
    let endDate = new Date(window.projectData.endDate);

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
});

function showAddTaskModal() {
    //console.log("Showing add task modal");
    const close = document.getElementById("close");
    const form = document.getElementById("form");
    const cover = document.getElementById("cover")
    //console.log(cover);
    form.style.display = "block";
    close.style.display = "inline-block";
    cover.classList.add("cover");
}

function hideAddTaskModal() {
    //console.log("Hiding add task modal");
    const form = document.getElementById("form");
    const close = document.getElementById("close");
    const cover = document.getElementById("cover")
    //console.log(cover);
    form.style.display = "none";
    close.style.display = "none";
    cover.classList.remove("cover");
};


function addMember() {
    var dropdown = document.getElementById("taskMembers");
    var selectedValue = dropdown.value;
    var selectedText = dropdown.options[dropdown.selectedIndex].text;

    if (selectedValue) {


        var list = document.getElementById("memberList");

        // Check if the member is already in the list
        var existingItems = list.getElementsByTagName("li");
        for (var i = 0; i < existingItems.length; i++) {
            if (existingItems[i].getAttribute("data-value") === selectedValue) {
                alert("Member is already added!");
                return;
            }
        }

        // Create a new list item
        var listItem = document.createElement("li");
        listItem.setAttribute("data-value", selectedValue);
        listItem.textContent = selectedText;
        console.log("List item", listItem);

        // Create a hidden input field to submit the value
        var hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.name = "members";
        hiddenInput.id = "member";
        hiddenInput.value = selectedValue;
        listItem.appendChild(hiddenInput);

        // Add a remove button
        var removeButton = document.createElement("button");
        removeButton.classList.add("button");
        removeButton.textContent = "Remove";
        removeButton.onclick = function () {
            list.removeChild(listItem);
        };

        listItem.appendChild(removeButton);
        list.appendChild(listItem);
    } else {
        alert("Please select a member first!");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("form").addEventListener("submit", function (event) {
        event.preventDefault();
        console.log("Form submitted");

        const formData = new FormData(this);
        let task = {};
        let mem = [];
        for (let [key, value] of formData.entries()) {
            if (key === "members") {
                mem.push(value);
            } else {
                task[key] = value;
            }
        }
        task["members"] = mem;
        console.log("Task with members:", task);
        u = window.location.href
        const parts = u.split("/");
        const url = parts[parts.length - 1];
        task["url"] = url

        fetch('/add-task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(task),
        })
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);
                hideAddTaskModal();
                window.location.reload();
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    })
});