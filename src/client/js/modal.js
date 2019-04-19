window.addEventListener("click", function(event) {
  const loginButton = document.getElementById("loginButton");
  const signupButton = document.getElementById("signupButton");
  const loginModal = document.getElementById("loginModal");
  const loginModalClose = document.querySelector("#loginModal .close");
  const signupModal = document.getElementById("signupModal");
  const signupModalClose = document.querySelector("#signupModal .close");

  // show login modal
  if (event.target === loginButton) {
    loginModal.classList.add("is-open");
    document.body.classList.add("has-modal");
    return;
  }
  // show signup modal
  if (event.target === signupButton) {
    signupModal.classList.add("is-open");
    document.body.classList.add("has-modal");
    return;
  }
  // close login modal
  if (event.target == loginModal || event.target === loginModalClose) {
    loginModal.classList.remove("is-open");
    document.body.classList.remove("has-modal");
  }
  // close signup modal
  if (event.target == signupModal || event.target === signupModalClose) {
    signupModal.classList.remove("is-open");
    document.body.classList.remove("has-modal");
  }
});
