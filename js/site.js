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