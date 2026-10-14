let setup = false;

function back() {
  window.location.href = MMGISAuth.link(document.documentElement.dataset.mmgisRoot || '/');
}

function login() {
  if (setup) {
    setupLogin();
    return;
  }

  if (
    document.getElementById("username").value == "" ||
    document.getElementById("pwd").value == ""
  ) {
    document.getElementById("msg").textContent = MMGISAuth.text("Missing username or password.");
    document.getElementById("msg").style.opacity = 1;
    return;
  }

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
        (data.hasOwnProperty("status") && data.status == "success")
      ) {
        //success
        document.cookie =
          "MMGISUser=" +
          JSON.stringify({
            username: data.username,
            token: data.token,
          });
        location.reload();
      } else {
        //error
        document.getElementById("msg").textContent =
          MMGISAuth.message(data) || MMGISAuth.text("Invalid username or password.");
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

function setupLogin() {
  if (
    document.getElementById("username").value == "" ||
    document.getElementById("pwd").value == "" ||
    document.getElementById("pwd_retype").value == ""
  ) {
    document.getElementById("msg").textContent = MMGISAuth.text("Missing username or password.");
    document.getElementById("msg").style.opacity = 1;
    return;
  }

  if (
    document.getElementById("pwd").value !=
    document.getElementById("pwd_retype").value
  ) {
    document.getElementById("msg").textContent = MMGISAuth.text("Passwords do not match.");
    document.getElementById("msg").style.opacity = 1;
    return;
  }

  $.ajax({
    type: "POST",
    url: MMGISAuth.link("api/users/first_signup"),
    data: {
      username: document.getElementById("username").value,
      password: document.getElementById("pwd").value,
    },
    success: function (data) {
      if (
        !data.hasOwnProperty("status") ||
        (data.hasOwnProperty("status") && data.status == "success")
      ) {
        //success
        location.reload();
      } else {
        //error
        document.getElementById("msg").textContent = MMGISAuth.message(data);
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

$(document).ready(function () {
  $(document).on("keypress", function (e) {
    if (e.which == 13) {
      login();
    }
  });

  $.ajax({
    type: "POST",
    url: MMGISAuth.link("api/users/has"),
    data: {},
    success: function (data) {
      if (data.status == "success") {
        if (data.has == false) {
          setup = true;
          $("#setup").css("opacity", "1");
          $(".container").css("height", "520px");
          $("#pwd_retype").css("display", "block");
          $(".btn1").css("top", "81%");
          $(".btn1").text(MMGISAuth.text("Create Administrator Account"));
        }
      }
    },
  });

  $("#backIcon").on("click", function () {
    // Remove last directory from pathname
    const path = window.location.pathname.split("/");
    window.location.href = MMGISAuth.link(path.slice(0, path.length - 1).join("/") || "/");
  });
});
