function foo(response) {
  var data = response.data;

  var items_html = '';
  var template_item = _.template($('#template-activity-item').html());

  // FIXME: make more detailed https://developer.github.com/v3/activity/events/types/
  var events = {
    CommitCommentEvent: "commented on a commit",
    CreateEvent: "created something",
    DeleteEvent: "deleted something",
    DeploymentEvent: "deployment event",
    DeploymentStatusEvent: "deployment status",
    DownloadEvent: "new download created",
    FollowEvent: "followed user",
    ForkEvent: "forked the repo",
    ForkApplyEvent: "fork applied",
    GistEvent: "gist created",
    GollumEvent: "wiki page created or edited",
    IssueCommentEvent: "wrote a clever comment",
    IssuesEvent: "made or closed an issue",
    MemberEvent: "added a new user",
    MembershipEvent: "added or remobed someone",
    PageBuildEvent: "tried to build a page",
    PublicEvent: "hooray moar open source codez",
    PullRequestEvent: "sent a great pull request",
    PullRequestReviewCommentEvent: "asked for a code review",
    PushEvent: "pushed some sweet code",
    ReleaseEvent: "made an awesome release",
    RepositoryEvent: "made a rad new repo",
    StatusEvent: "changed a git commit",
    TeamAddEvent: "added a repo to a team",
    WatchEvent: "watched or starred this"
  }

  var count = 0;

  _.each(data, function(item, key) {
    if (count <= 8) {
      count++;

      item['event_type'] = events[item.type]
      item['link'] = 'https://github.com/' + item.actor.login;
      if (item.type == 'IssueCommentEvent') {
        item['link'] = item.payload.comment.html_url;
        item['event_type'] = excerpt_text(item.payload.comment.body, 20);
      };

      items_html += template_item(item);
    }
  });

  $('#activity-feed').html(items_html);
}

$(document).ready(function() {
  $.ajax({
    url: 'https://api.github.com/repos/opensourcedesign/opensourcedesign.github.io/events',
    success: foo
  })
})

/*
 * parse_link_header()
 *
 * Parse the GitHub Link HTTP header used for pagination
 * https://developer.github.com/v3/#pagination
 */
function parse_link_header(header) {
  if (header.length == 0) {
    throw new Error("input must not be of zero length");
  }

  // Split parts by comma
  var parts = header.split(',');
  var links = {};
  // Parse each part into a named link
  _.each(parts, function(p) {
    var section = p.split(';');
    if (section.length != 2) {
      throw new Error("section could not be split on ';'");
    }
    var url = section[0].replace(/<(.*)>/, '$1').trim();
    var name = section[1].replace(/rel="(.*)"/, '$1').trim();
    links[name] = url;
  });

  return links;
}

/**
 * I take a string and create an excerpt from it
 *
 * @param int limit - the limit of characters
 */
function excerpt_text( str, limit ) {
  if (limit == null) {
    limit = 20
  };
  return str.substring(0, limit) + ' ...';
}

/*!
 * Start Bootstrap - Grayscale Bootstrap Theme (https://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see https://www.apache.org/licenses/LICENSE-2.0.
 */

// jQuery to collapse the navbar on scroll
$(window).scroll(function() {
  if ($(".navbar").offset().top > 50) {
    $(".navbar-fixed-top").addClass("top-nav-collapse");
  } else {
    $(".navbar-fixed-top").removeClass("top-nav-collapse");
  }
});

// jQuery for page scrolling feature - requires jQuery Easing plugin
$(function() {
  $('a.page-scroll').bind('click', function(event) {
    var $anchor = $(this);
    $('html, body').stop().animate({
      scrollTop: $($anchor.attr('href')).offset().top
    }, 1500, 'easeInOutExpo');
    event.preventDefault();
  });
});

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function() {
  $('.navbar-toggle:visible').click();
});

// Fetch Jobs

$(document).ready(function() {
  var template_item = _.template($('#template-events-item').html());
  var url = 'https://opensourcedesign.net/jobs/feed.xml';

  var items_html = '';
  $.ajax({
    url: url,
    success: function(d){
      $('#jobs-snapshot').html('');
      $(d).find('item').each(function(idx) {
        if (idx <= 5) {
          var $ev = $(this);
          var item = {
            title: $ev.find('title').text(),
            link: $ev.find('link').text()
          };
          items_html = template_item(item);
          $('#jobs-snapshot').append(items_html);
        }
      });
    },
    error: function() {
      $('#jobs-snapshot').text('On the job board you can post and find open source design jobs!');
    }
  });
});

// to resize the backer Image
function screenChange(screenW) {
  if (screenW.matches) { // If media query matches
    $("#lastOne").attr("data","https://opencollective.com/opensourcedesign/tiers/backer.svg?avatarHeight=50&width=320"); 
  } else {
    $("#lastOne").attr("data","https://opencollective.com/opensourcedesign/tiers/backer.svg?avatarHeight=50&width=400");
  }
}

var screenW = window.matchMedia("(max-width: 400px)");
screenChange(screenW); // Call listener function at run time
screenW.addListener(screenChange);
