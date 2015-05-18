require "rubygems"
require 'rake'
require 'yaml'
require 'time'
require 'open-uri'

SOURCE = "."
CONFIG = {
  'version' => "0.2.13",
  'includes' => File.join(SOURCE, "_includes"),
  'themes' => File.join(SOURCE, "_includes", "themes"),
  'layouts' => File.join(SOURCE, "_layouts"),
  'posts' => File.join(SOURCE, "_posts"),
  'post_ext' => "markdown",
  'theme_package_version' => "0.1.0"
}

# Usage: rake post title="A Title" [date="2012-02-09"] [cat="Category"]
desc "Begin a new post in #{CONFIG['posts']}"
task :post do
  abort("rake aborted: '#{CONFIG['posts']}' directory not found.") unless FileTest.directory?(CONFIG['posts'])
  title = ENV['title'] || "new-post"
  slug = title.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
  begin
    date = (ENV['date'] ? Time.parse(ENV['date']) : Time.now).strftime('%Y-%m-%d')
    date_time = (ENV['date'] ? Time.parse(ENV['date']) : Time.now).strftime('%Y-%m-%d-%H-%M')
  rescue Exception => e
    puts "Error - date format must be YYYY-MM-DD, please check you typed it correctly!"
    exit -1
  end
  cat = ENV['cat'] || ""

  filename = File.join(CONFIG['posts'], "#{date}-#{slug}.#{CONFIG['post_ext']}")
  if File.exist?(filename)
    abort("rake aborted!") if ask("#{filename} already exists. Do you want to overwrite?", ['y', 'n']) == 'n'
  end

  puts "Creating new post: #{filename}"
  open(filename, 'w') do |post|
    post.puts "---"
    post.puts "layout: post"
    post.puts "date: #{date_time}"
    post.puts "title: \"#{title.gsub(/-/,' ')}\""
    post.puts "category: #{cat}"
    post.puts "---"
  end
end # task :post
