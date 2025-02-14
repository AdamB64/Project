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
    close.style.display = "flex";
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
}