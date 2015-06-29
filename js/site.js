function foo(response) {
  var meta = response.meta;
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
      items_html += template_item(item);
    }
  });

  $('#activity-feed').html(items_html);

}

var script = document.createElement('script');
script.src = 'https://api.github.com/repos/opensourcedesign/opensourcedesign.github.io/events?callback=foo';

document.getElementsByTagName('head')[0].appendChild(script);


/*
 * parse_link_header()
 *
 * Parse the Github Link HTTP header used for pageination
 * http://developer.github.com/v3/#pagination
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
