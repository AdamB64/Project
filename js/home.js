if (window.location.search) {
    const url = new URL(window.location);
    url.search = ''; // Remove all query parameters
    window.history.replaceState({}, document.title, url);
};
