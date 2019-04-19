/**
 * AJAX CALLS
 */
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const logoutButton = document.getElementById("logoutButton");

loginForm && loginForm.addEventListener("submit", handleLogin);
signupForm && signupForm.addEventListener("submit", handleSignup);
logoutButton && logoutButton.addEventListener("click", handleLogout);

function getFormData(formEl) {
  const formData = new FormData(formEl);
  const data = {};
  for (var entry of formData.entries()) {
    data[entry[0]] = entry[1];
  }
  return data;
}

function resetErrorMessages() {
  document.querySelectorAll(".error-message").forEach(el => {
    el.style.display = "none";
  });
}

function handleLogout(event) {
  // disconnect and refresh page
  axios.get("/logout").then(res => {
    window.location.reload(); // refresh page
  });
}

function handleLogin(event) {
  event.preventDefault();
  const usernameErrorMessage = document.getElementById("username-error");
  const passwordErrorMessage = document.getElementById("password-error");
  const form = event.target;
  const data = getFormData(form);

  if (!data.username.trim() || !data.password.trim()) return;

  resetErrorMessages();

  axios
    .post("/login", data)
    .then(res => {
      window.location.reload(true); // force page refresh (no cache allowed)
    })
    .catch(err => {
      console.log(err.response.data.message);
      if (err.response.data.message === "invalid username") {
        usernameErrorMessage.style.display = "block";
      }
      if (err.response.data.message === "invalid password") {
        passwordErrorMessage.style.display = "block";
      }
    });
}

function handleSignup(event) {
  event.preventDefault();
  const usernameSignupErrorMessage = document.getElementById(
    "username-signup-error"
  );
  const form = event.target;
  const data = getFormData(form);

  resetErrorMessages();

  axios
    .post("/signup", data)
    .then(res => {
      window.location.reload(true); // force page refresh (no cache allowed)
    })
    .catch(err => {
      console.log(err.response.data.message);
      if (err.response.data.message === "user already exists") {
        usernameSignupErrorMessage.style.display = "block";
      }
    });
}

export function updateUserInfo() {
  axios
    .get("/me")
    .then(res => {
      const me = res.data;
      if (!me) return;

      document.getElementById("user-info-last-score").innerHTML =
        me.stats && me.stats.last_score;
      document.getElementById("user-info-max-score").innerHTML =
        me.stats && me.stats.max_score;
      document.getElementById("user-info-max-kills").innerHTML =
        me.stats && me.stats.max_kills;
    })
    .catch(err => {
      console.log(err);
    });
}
