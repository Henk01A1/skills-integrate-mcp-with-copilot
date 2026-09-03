document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const authForm = document.getElementById("auth-form");
  const profileForm = document.getElementById("profile-form");
  const authStatus = document.getElementById("auth-status");
  const authToggle = document.getElementById("auth-toggle");
  const authSubmit = document.getElementById("auth-submit");
  const nameGroup = document.getElementById("name-group");
  const gradeGroup = document.getElementById("grade-group");
  const logoutButton = document.getElementById("logout-btn");
  let loginMode = false;

  function authHeaders() {
    const token = localStorage.getItem("studentToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");
  }

  function setAuthenticated(student) {
    authForm.classList.add("hidden");
    profileForm.classList.remove("hidden");
    authStatus.textContent = `Signed in as ${student.name} (${student.email})`;
    authStatus.className = "info";
    document.getElementById("profile-name").value = student.name;
    document.getElementById("profile-grade").value = student.grade_level;
    signupForm.querySelector("button").disabled = false;
  }

  function setLoggedOut() {
    authForm.classList.remove("hidden");
    profileForm.classList.add("hidden");
    authStatus.textContent = "Sign in to register or unregister for activities.";
    authStatus.className = "info";
    signupForm.querySelector("button").disabled = true;
  }

  async function loadCurrentStudent() {
    if (!localStorage.getItem("studentToken")) {
      setLoggedOut();
      return;
    }

    const response = await fetch("/auth/me", { headers: authHeaders() });
    if (response.ok) {
      setAuthenticated(await response.json());
    } else {
      localStorage.removeItem("studentToken");
      setLoggedOut();
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        showMessage(result.detail || "An error occurred", "error");
      }

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup`,
        {
          method: "POST",
          headers: authHeaders(),
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        showMessage(result.detail || "An error occurred", "error");
      }

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  authToggle.addEventListener("click", () => {
    loginMode = !loginMode;
    nameGroup.classList.toggle("hidden", loginMode);
    gradeGroup.classList.toggle("hidden", loginMode);
    document.getElementById("name").required = !loginMode;
    document.getElementById("grade-level").required = !loginMode;
    authSubmit.textContent = loginMode ? "Log in" : "Create account";
    authToggle.textContent = loginMode
      ? "I need to create an account"
      : "I already have an account";
  });

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      email: document.getElementById("auth-email").value,
      password: document.getElementById("password").value,
    };
    if (!loginMode) {
      payload.name = document.getElementById("name").value;
      payload.grade_level = Number(document.getElementById("grade-level").value);
    }

    try {
      const response = await fetch(loginMode ? "/auth/login" : "/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        showMessage(result.detail || "Unable to authenticate", "error");
        return;
      }
      localStorage.setItem("studentToken", result.token);
      setAuthenticated(result.student);
      authForm.reset();
      showMessage("You are signed in.", "success");
    } catch (error) {
      showMessage("Authentication failed. Please try again.", "error");
      console.error("Error authenticating:", error);
    }
  });

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const response = await fetch("/auth/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        name: document.getElementById("profile-name").value,
        grade_level: Number(document.getElementById("profile-grade").value),
      }),
    });
    const result = await response.json();
    showMessage(
      response.ok ? "Profile updated." : result.detail || "Unable to update profile",
      response.ok ? "success" : "error"
    );
    if (response.ok) setAuthenticated(result);
  });

  logoutButton.addEventListener("click", async () => {
    await fetch("/auth/logout", { method: "POST", headers: authHeaders() });
    localStorage.removeItem("studentToken");
    setLoggedOut();
    showMessage("You are logged out.", "success");
  });

  // Initialize app
  loadCurrentStudent();
  fetchActivities();
});
