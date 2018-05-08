---
layout: default
title: Submit a Job
permalink: /people-form/
---

<link href="/jobs/css/bootstrap.min.css" rel="stylesheet">
<link href="/jobs/css/custom.css" rel="stylesheet">

<div class="container">
  <div class="row">
  <div class="col-md-10 col-md-offset-1">
  <h1>List Yourself on Our Site</h1>
  <p class="lead">If you work on a free / open source project and you want to be listed on our site. You'll join our listing on <a
href="/people/">the people page</a>.</p>
  <p class="lead"><a href="http://opensourcedesign.net/code-of-conduct/">We have a code of conduct</a>. Please read it before submitting your profile.</p>
  <form method="POST" action="https://api.staticman.net/v2/entry/opensourcedesign/opensourcedesign.net/master">
    <!-- <input name="options[redirect]" type="hidden" value="http://opensourcedesign.net/jobs/thank-you/"> -->
    <input name="fields[status]" type="hidden" value="searching">
    <input name="fields[title]" type="hidden" value="">
    <input name="fields[layout]" type="hidden" value="jobs">
    <input name="options[slug]" type="hidden" id="slug" value="">
    <fieldset>
    <legend>About you</legend>
    <div class="form-group">
      <label for="organization">Your name</label>
      <input type="text"
      class="form-control"
      id="name"
      placeholder="e.g. Jane McDuck"
      name="fields[name]"
      required>
    </div>
    <div class="form-group">
      <label for="url">Website</label>
      <input type="url"
      class="form-control"
      id="url"
      placeholder="e.g. https://acmeprojects.org"
      name="fields[url]"
      required>
    </div>
    <div class="form-group">
      <label>Availability</label>
      <div class="radio">
      <label>
        <input type="radio"
        name="fields[availability]"
        id="gratis"
        value="available"
        checked>
        Available
      </label>
      </div>
      <div class="radio">
      <label>
        <input type="radio"
        name="fields[availability]"
        id="paid"
        value="booked">
        Booked
      </label>
      </div>
    </div>
    <div class="form-group">
      <label for="rate">
      What's your rate?
      <small>(optional)</small>
      </label>
      <p class="help-block">Give some information about how you usually charge. Try to be specific. A fixed amount or a range are good. </p>
      <input type="text"
      class="form-control"
      id="fields[rate]"
      placeholder="e.g. $50 / Gratis"
      name="rate">
    </div>
    <div class="form-group">
      <label for="skills">
      Skillset
      <small>(optional)</small>
      </label>
      <p class="help-block">In one word "tags" describe your skillset.</p>
      <textarea class="form-control"
      id="tags"
      rows="3"
      name="fields[tags]"
      placeholder="e.g. A logo & a set of icons, or a usability review document"></textarea>
    </div>
    <div class="form-group">
      <label for="description">
      About yourself
      <small>(optional)</small>
      </label>
      <p class="help-block">Tell us a little about yourself:</p>
      <textarea class="form-control"
      id="tags"
      rows="3"
      name="fields[description]"
      placeholder=""></textarea>
    </div>
    </fieldset>
    <button type="submit" href="thankyou.html" class="btn btn-primary btn-lg">Submit your profile to Open Source Design</button>
  </form>
  </div>
  </div>
</div>

<script src="/jobs/js/jquery.min.js"></script>
<script src="/jobs/js/bootstrap.min.js"></script>
<script>

  function compensation() {
    if ( $("#gratis").is(":checked") ) {
    $("#paid_details").parent().slideUp();
    }
    else {
    $("#paid_details").parent().slideDown();
    }
  }

  function slug (str) {
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();

    // remove accents, swap ñ for n, etc
    var from = "ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;";
    var to   = "aaaaaeeeeeiiiiooooouuuunc------";
    for (var i=0, l=from.length ; i<l ; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

    return str;
  }

  $(document).ready(function() {

    $('input#title').keyup(function (e) {
    $('input#slug').val(slug(e.target.value));
    });

    compensation();

    $("input:radio").click(function(){
    compensation();
    });

    var date = new Date();
    var day = ("0" + date.getDate()).slice(-2);
    var month = ("0"+(date.getMonth()+1)).slice(-2);
    var year = date.getFullYear();

    var datestring = year + "-" + month + "-" + day;

    $('[name="fields[date_posted]"]').val(datestring);

  });
</script>
