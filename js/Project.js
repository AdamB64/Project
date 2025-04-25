window.addEventListener("DOMContentLoaded", function () {
  const navigationEntries = performance.getEntriesByType("navigation");

  if (navigationEntries.length > 0 && navigationEntries[0].type === "back_forward") {
    console.log("Page loaded via back or forward navigation.");
    // Reload the page if needed
    location.reload();
  }
});


document.addEventListener("DOMContentLoaded", function () {

  let startDate = new Date(window.projectData.startDate);
  let endDate = new Date(window.projectData.endDate);

  if (!startDate || isNaN(startDate.getTime()) || !endDate || isNaN(endDate.getTime())) {
    console.error("Invalid project start or end date", window.projectData.startDate, window.projectData.endDate);
    document.getElementById("no-tasks").innerText = "Invalid project timeline";
    document.getElementById("no-tasks").style.display = "block";
    return;
  }

  //console.log("Project Start Date:", startDate);
  //console.log("Project End Date:", endDate);


  let tasks = window.projectData.tasks;
  console.log("Tasks:", tasks);
  //console.log("window: " + window.projectData.tasks)

  if (!tasks || tasks.length === 0) {
    //console.log("No tasks found");
    document.getElementById("no-tasks").style.display = "block";
  }

  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].progress == 100) {
      console.log("Task is completed");
    }
  }

  tasks.forEach(task => {
    if (task.importance == 1) {
      task.custom_class = "low-importance";
    } else if (task.importance == 2) {
      task.custom_class = "medium-importance";
    } else {
      task.custom_class = "high-importance";
    }
  });


  let importance = null;
  if (tasks.importance == 1) {
    importance = "Low";
  } else if (tasks.importance == 2) {
    importance = "Medium";
  }
  else {
    importance = "High";
  }

  // Override the dates function to generate a timeline that spans the whole period
  function generateDates(startDate, endDate) {
    console.log("Generating dates from", startDate, "to", endDate);
    let dates = [];

    // Add the month before the start date
    let prevDate = new Date(startDate);
    prevDate.setMonth(prevDate.getMonth() - 1);
    dates.push(new Date(prevDate));

    // Now add one month at a time starting from the start date
    let currentDate = new Date(startDate);
    while (currentDate <= new Date(endDate)) {
      dates.push(new Date(currentDate));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Ensure the end date is included
    if (dates.length) {
      let lastDate = dates[dates.length - 1];
      let finalEndDate = new Date(endDate);

      if (
        lastDate.getFullYear() < finalEndDate.getFullYear() ||
        (lastDate.getFullYear() === finalEndDate.getFullYear() && lastDate.getMonth() < finalEndDate.getMonth())
      ) {
        dates.push(finalEndDate);
      } else {
        dates[dates.length - 1] = finalEndDate;
      }
    }

    return dates;
  }


  //console.log("Tasks:", tasks);
  let gantt = new Gantt("#gantt", tasks, {
    view_mode: "Month",
    date_format: "YYYY-MM-DD",
    lines: "both",
    start: startDate,
    end: endDate,
    custom_popup_html:
      function (task) {
        return ` 
            <div class="custom-tooltip"> 
            <h3>Progress: ${task.progress}%<h3>
             <h4>Importance: ${importance}</h4> 
             <p>Start: ${new Date(task._start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
             <p>End: ${new Date(task._end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p> 
        <p>Description: <em>${task.description}</em></p> </div > `;
      },
    on_render: () => {
      document.querySelectorAll('.bar').forEach(bar => {
        let taskName = bar.getAttribute('data-id'); // Get task ID
        let task = tasks.find(t => t.id === taskName); // Find the task object

        if (task) {
          if (task.importance == 1) {
            bar.style.fill = "green";  // Low Importance
          } else if (task.importance == 2) {
            bar.style.fill = "red"; // Medium Importance
          } else {
            bar.style.fill = "red";    // High Importance
          }
        }
      });
    }
  });


  gantt.gantt_end = endDate;
  gantt.gantt_start = startDate;
  gantt.dates = generateDates(startDate, endDate);

  //console.log(gantt.tasks);

  // Custom function to generate a timeline covering the full period.
  // It increments by one month starting from the defined start date.
  /*gantt.generateTimeline = function () {
        let dates = [];
        let currentDate = new Date(this.options.start);
        dates.push(new Date(currentDate)); // Ensure the timeline starts at the exact start date

        while (currentDate < this.options.end) {
            currentDate = new Date(currentDate);
            currentDate.setMonth(currentDate.getMonth() + 1);
            if (currentDate > this.options.end) {
                dates.push(new Date(this.options.end));
                break;
            } else {
                dates.push(new Date(currentDate));
            }
        }
        return dates;
    };*/



  //gantt.setup_dates();
  //gantt.dates();

  //console.log("Gantt dates:", gantt.dates);
  // Call the overridden setup_dates method to recalculate the dates array



  console.log("Gantt:", gantt);

  gantt.render();
});



setTimeout(() => {
  // Prevent dragging
  document.querySelectorAll('.bar-wrapper').forEach(el => {
    el.style.pointerEvents = 'none'; // Disable drag movement
  });

  // Allow clicking inside the task bars for popups
  document.querySelectorAll('.bar').forEach(el => {
    el.style.pointerEvents = 'auto';
  });

  // Hide resize handles to prevent resizing
  document.querySelectorAll('.handle').forEach(el => {
    el.style.display = 'none';
  });
}, 500);




function showAddTaskModal() {
  //console.log("Showing add task modal");
  const close = document.getElementById("close");
  const form = document.getElementById("form");
  const cover = document.getElementById("cover");
  //console.log(cover);
  form.style.display = "block";
  close.style.display = "inline-block";
  cover.classList.add("cover");
}

function hideAddTaskModal() {
  //console.log("Hiding add task modal");
  const form = document.getElementById("form");
  const close = document.getElementById("close");
  const cover = document.getElementById("cover");
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
    //console.log("Form submitted");

    const formData = new FormData(this);
    let task = {};
    let mem = [];
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
      if (key === "members") {
        mem.push(value);
      } else {
        task[key] = value;
      }
    }
    const importance = document.getElementById("taskWeight").value;
    console.log("Importance:", importance);
    const taskStart = document.getElementById("taskStartDate").value;
    const taskEnd = document.getElementById("taskEndDate").value;
    const projectStart = new Date(window.projectData.startDate);
    const projectEnd = new Date(window.projectData.endDate);

    if (taskStart > taskEnd) {
      alert("End date should be after the start date");
      return;
    } else if (new Date(taskStart) < projectStart || new Date(taskEnd) > projectEnd) {
      alert("Task dates should be within the project timeline");
      return;
    }

    task["members"] = mem;
    //console.log("Task with members:", task);
    u = window.location.href;
    const parts = u.split("/");
    const url = parts[parts.length - 1];
    task["url"] = url;

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
  });
});



