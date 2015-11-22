# == Dependencies ==============================================================

require 'rake'
require 'html/proofer'

# == Configuration =============================================================

# Set "rake watch" as default task
task :default => :test

# rake test
desc "build and test website"
task :test do
  sh "bundle exec jekyll build"
  HTML::Proofer.new("./_site", {:url_ignore=> ["#", "/events/", "/jobs/",/^https:\/\/botbot\.me\/freenode\/opensourcedesign\/[\w\/]*/], :typhoeus => { :followlocation => true, :headers => { 'User-Agent' => 'html-proofer' } }}).run
end
