const loginButton = document.getElementById("loginButton");
const signupButton = document.getElementById("signupButton");
const logoutButton = document.getElementById("logoutButton");
const loginModal = document.getElementById("loginModal");
const loginModalClose = document.querySelector("#loginModal .close");
const signupModal = document.getElementById("signupModal");
const signupModalClose = document.querySelector("#signupModal .close");

const loginNav = document.getElementById("");

window.addEventListener("click", function(event) {
  // show login modal
  if (event.target === loginButton) {
    loginModal.style.display = "block";
  }
  // show signup modal
  if (event.target === signupButton) {
    signupModal.style.display = "block";
  }
  // disconnect and refresh page
  if (event.target === logoutButton) {
    axios.get("/logout").then(res => {
      window.location.reload(); // refresh page
    });
  }
});

// When the user clicks on <span> (x), close the modal
loginModalClose.onclick = function() {
  loginModal.style.display = "none";
};

// When the user clicks on <span> (x), close the modal
signupModalClose.onclick = function() {
  signupModal.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == loginModal) {
    loginModal.style.display = "none";
  }
  if (event.target == signupModal) {
    signupModal.style.display = "none";
  }
};

/**
 * AJAX CALLS
 */
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const getFormData = formEl => {
  const formData = new FormData(formEl);
  const data = {};
  for (var entry of formData.entries()) {
    data[entry[0]] = entry[1];
  }
  return data;
};

function resetErrorMessages() {
  document.querySelectorAll(".error-message").forEach(el => {
    el.style.display = "none";
  });
}

loginForm.addEventListener("submit", event => {
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
});

signupForm.addEventListener("submit", event => {
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
});

window.animatedBackground.start();
