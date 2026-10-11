
"use strict";

// 1. Select the HTML elements
const loadButton = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusMessage = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

// 2. Store the users returned by the API
let users = [];

// 3. Display a list of users
function renderUsers(list) {
  // Clear the current list
  usersList.replaceChildren();

  // Show a message when no users match the filter
  if (list.length === 0) {
    const message = document.createElement("li");
    message.textContent = "No users match your filter.";
    usersList.append(message);
    return;
  }

  // Create a list item for each user
  list.forEach(function (user) {
    const userItem = document.createElement("li");

    const name = document.createElement("h3");
    name.textContent = user.name;

    const email = document.createElement("p");
    email.textContent = "Email: " + user.email;

    const city = document.createElement("p");
    city.textContent = "City: " + user.address.city;

    const company = document.createElement("p");
    company.textContent = "Company: " + user.company.name;

    userItem.append(name, email, city, company);
    usersList.append(userItem);
  });
}

// 4. Fetch users from the API
async function loadUsers() {
  // Prevent repeated clicks while loading
  loadButton.disabled = true;
  statusMessage.textContent = "Loading users...";
  usersList.replaceChildren();

  try {
    const response = await fetch(
      "https://jsonplaceholder.typicode.com/users"
    );

    // Check whether the request succeeded
    if (!response.ok) {
      throw new Error("Request failed with status " + response.status);
    }

    // Convert the response to JavaScript data
    const data = await response.json();

    // Store the users
    users = data;

    // Display all users
    renderUsers(users);

    statusMessage.textContent =
      "Successfully loaded " + users.length + " users.";
  } catch (error) {
    // Handle network and HTTP errors
    users = [];
    usersList.replaceChildren();
    statusMessage.textContent =
      "Unable to load users. Please try again.";
    console.error("Error loading users:", error);
  } finally {
    // Re-enable the button whether the request succeeds or fails
    loadButton.disabled = false;
  }
}

// 5. Load users when the button is clicked
loadButton.addEventListener("click", loadUsers);

// 6. Filter the stored users as the user types
filterInput.addEventListener("input", function () {
  const searchTerm = filterInput.value.trim().toLowerCase();

  const filteredUsers = users.filter(function (user) {
    return user.name.toLowerCase().includes(searchTerm);
  });

  renderUsers(filteredUsers);
});
