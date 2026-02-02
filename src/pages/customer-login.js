// Handle form submission
document.getElementById("customerLoginForm").addEventListener("submit", function(event) {
  event.preventDefault(); // prevent page reload
  // Redirect to next page after login
  window.location.href = "nextpage.html";
});

// Handle Google login button
document.getElementById("googleLogin").addEventListener("click", function() {
  // Redirect to next page (replace with actual Google auth later)
  window.location.href = "nextpage.html";
});