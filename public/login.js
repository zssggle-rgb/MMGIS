let toggleState = "login";

function login() {
  if (
    document.getElementById("username").value === "" ||
    document.getElementById("pwd").value === ""
  ) {
    document.getElementById("msg").textContent = MMGISAuth.text("Missing username or password.");
    document.getElementById("msg").style.opacity = 1;
    return;
  }

  if (toggleState === "login") {
    $.ajax({
      type: "POST",
      url: MMGISAuth.link("api/users/login"),
      data: {
        username: document.getElementById("username").value,
        password: document.getElementById("pwd").value,
      },
      success: function (data) {
        if (
          !data.hasOwnProperty("status") ||
          (data.hasOwnProperty("status") && data.status === "success")
        ) {
          //success
          document.cookie = "MMGISUser=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
          document.cookie = `MMGISUser=${JSON.stringify({
            username: data.username,
            token: data.token,
          })}${data.additional}`;
          window.location.reload();
        } else {
          //error
          document.getElementById("msg").textContent =
            MMGISAuth.message(data) || MMGISAuth.text("Invalid username or password");
          document.getElementById("msg").style.opacity = 1;
        }
      },
      error: function (xhr) {
        //error
        document.getElementById("msg").textContent = MMGISAuth.message(xhr.responseJSON || { status: "failure", message: xhr.statusText || "Server error." });
        document.getElementById("msg").style.opacity = 1;
      },
    });
  } else if (toggleState === "signup") {
    if (
      document.getElementById("pwd").value !=
      document.getElementById("pwd_retype").value
    ) {
      document.getElementById("msg").textContent = MMGISAuth.text("Passwords don't match.");
      document.getElementById("msg").style.opacity = 1;
      return;
    }

    $.ajax({
      type: "POST",
      url: MMGISAuth.link("api/users/signup"),
      data: {
        username: document.getElementById("username").value,
        email: document.getElementById("email").value,
        password: document.getElementById("pwd").value,
      },
      success: function (data) {
        if (
          !data.hasOwnProperty("status") ||
          (data.hasOwnProperty("status") && data.status === "success")
        ) {
          //success
          document.cookie = "MMGISUser=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
          document.cookie = `MMGISUser=${JSON.stringify({
            username: data.username,
            token: data.token,
          })}${data.additional}`;
          window.location.reload();
        } else {
          //error
          document.getElementById("msg").textContent =
            MMGISAuth.message(data) || MMGISAuth.text("Something went wrong.");
          document.getElementById("msg").style.opacity = 1;
        }
      },
      error: function (xhr) {
        //error
        document.getElementById("msg").textContent = MMGISAuth.message(xhr.responseJSON || { status: "failure", message: xhr.statusText || "Server error." });
        document.getElementById("msg").style.opacity = 1;
      },
    });
  }
}
function toggle() {
  if (toggleState === "login") {
    document.getElementById("container").style.height = "635px";
    document.getElementById("login").textContent = MMGISAuth.text("Sign Up");
    document.getElementById("toggle").textContent = MMGISAuth.text("Or Log In");

    document.getElementById("email_label").style.display = "block";

    document.getElementById("email").style.display = "block";
    document.getElementById("email_description").style.display = "block";
    document.getElementById("pwd_description").style.display = "block";
    document.getElementById("pwd_retype_label").style.display = "block";
    document.getElementById("pwd_retype").style.display = "block";
    document.getElementById("pwd_label").style.top = "348px";

    toggleState = "signup";
  } else {
    document.getElementById("container").style.height = "440px";
    document.getElementById("login").textContent = MMGISAuth.text("Log In");
    document.getElementById("toggle").textContent = MMGISAuth.text("Or Sign Up");

    document.getElementById("email_label").style.display = "none";

    document.getElementById("email").style.display = "none";
    document.getElementById("email_description").style.display = "none";

    document.getElementById("pwd_description").style.display = "none";

    document.getElementById("pwd_retype_label").style.display = "none";

    document.getElementById("pwd_retype").style.display = "none";

    document.getElementById("pwd_label").style.top = "270px";

    toggleState = "login";
  }
}

$(document).ready(function () {
  if (allowSignup === true)
    document.getElementById("toggleWrapper").style.display = "flex";
  $(document).on("keypress", function (e) {
    if (e.which === 13) {
      login();
    }
  });
});
