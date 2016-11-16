#! /bin/bash
# -----------------------------------------------------------------------------
# update.sh
# -----------------------------------------------------------------------------
# Updates all Open Source Design repositories used for the website.
#
# NOTE: Make sure you have nothing stagged in any of the repos or things might 
# now work out so well for you... hope to better handle this :/
#
# To add/remove repos simply edit the "repos" array that starts on line 16
# 
# :dependencies:
#  * git-core
#
# :authors: Brennan Novak, 01AEEADB9EED1B5B4280E5B6C4CAA23B0F8C68B2
# :license: BSD license
# :date 16 November 2016
# :version: 0.0.1
# -----------------------------------------------------------------------------

declare -a repos=(
	"_events"
	"_jobs"
	"_organization"
	"_patterns"
	"_resources"
	"_talks"
)
line="--------------------------------------------------------------------------------"

# Start It Up
printf "\n"
echo -e "\e[34m                                 OPEN SOURCE DESIGN                    "
printf "\n"
echo -e "\e[34m           Bringing great design to free software one pixel at a time."
sleep 1
printf "\n"
echo -e "\e[34m                         Wewbsite Repo Updater - v0.0.1"
printf "\n"
sleep 1
echo -e "\e[94m$line"
sleep 1

echo -e "\e[36m Updating opensourcedesign.github.io now"
git fetch
git rebase

# Actually Clone Things
for repo in "${repos[@]}"
do 
	if [[ ! -d $repo ]]; then
		echo -e "\e[34m The \"$repo\" repo is not installed"
	else
		echo -e "\e[36m 1. Changing to \"$repo\" directory"
		cd $repo
		echo -e "\e[94m 2. Now fetching and rebasing"
		git fetch
		git rebase
		echo -e "\e[34m 3. Done updating \"$repo\", now leaving"
		cd ../
	fi
	echo -e "\e[94m$line"
	sleep 1
done

# Print output
printf "\n"
echo -e "\e[34m  All OSD website repos updated, now get back to coding ;-)"
printf "\n"
