/*!
 * Start Bootstrap - Grayscale Bootstrap Theme (https://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see https://www.apache.org/licenses/LICENSE-2.0.
 */

// jQuery to collapse the navbar on scroll
$(window).scroll(function () {
  if ($(".navbar").offset().top > 50) {
    $(".navbar-fixed-top").addClass("top-nav-collapse");
  } else {
    $(".navbar-fixed-top").removeClass("top-nav-collapse");
  }
});

// jQuery for page scrolling feature - requires jQuery Easing plugin
$(function () {
  $("a.page-scroll").bind("click", function (event) {
    var $anchor = $(this);
    $("html, body")
      .stop()
      .animate(
        {
          scrollTop: $($anchor.attr("href")).offset().top,
        },
        1500,
        "easeInOutExpo"
      );
    event.preventDefault();
  });
});

// Closes the Responsive Menu on Menu Item Click
$(".navbar-collapse ul li a").click(function () {
  $(".navbar-toggle:visible").click();
});

// Fetch Jobs

$(document).ready(function () {
  var template_item = _.template($("#template-events-item").html());
  var url = "https://opensourcedesign.net/jobs/feed.xml";

  var items_html = "";
  $.ajax({
    url: url,
    success: function (d) {
      $("#jobs-snapshot").html("");
      $(d)
        .find("item")
        .each(function (idx) {
          if (idx <= 5) {
            var $ev = $(this);
            var item = {
              title: $ev.find("title").text(),
              link: $ev.find("link").text(),
            };
            items_html = template_item(item);
            $("#jobs-snapshot").append(items_html);
          }
        });
    },
    error: function () {
      $("#jobs-snapshot").text(
        "On the job board you can post and find open source design jobs!"
      );
    },
  });
});

// to resize the backer Image
function screenChange(screenW) {
  if (screenW.matches) {
    // If media query matches
    $("#lastOne").attr(
      "data",
      "https://opencollective.com/opensourcedesign/tiers/backer.svg?avatarHeight=50&width=320"
    );
  } else {
    $("#lastOne").attr(
      "data",
      "https://opencollective.com/opensourcedesign/tiers/backer.svg?avatarHeight=50&width=400"
    );
  }
}

var screenW = window.matchMedia("(max-width: 400px)");
screenChange(screenW); // Call listener function at run time
screenW.addListener(screenChange);
