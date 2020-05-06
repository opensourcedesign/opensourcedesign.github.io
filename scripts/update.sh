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
# :authors: Brennan Novak, AA0B28294A637731AD529F34E3E838B0D4EBE62A
# :license: BSD license
# :date 16 November 2016
# :version: 0.0.1
# -----------------------------------------------------------------------------

MSG_START="\e[36m 1. Fetching and rebasing code\e[0m"
MSG_DONE="\e[34m 2. Done updating repo\e[0m"
MSG_EXISTS="\e[34m That repo is already installed\e[0m"

declare -a REPOS=(
	"organization"
	"patterns"
	"talks"
)
LINE="--------------------------------------------------------------------------------"

# GH username
if [[ $1 == "" ]]; then
    USERNAME="opensourcedesign"
else
    USERNAME=$1
fi

# Start It Up
printf "\n"
echo -e "\e[34m                                 OPEN SOURCE DESIGN\e[0m"
printf "\n"
echo -e "\e[34m           Bringing great design to free software one pixel at a time.\e[0m"
printf "\n"
echo -e "\e[34m                         Wewbsite Repo Updater - v0.0.1\e[0m"
printf "\n"
echo -e "\e[94m$LINE\e[0m"
sleep 1
echo -e "\e[34m Using username: ${USERNAME}\e[0m"
echo -e "\e[94m$LINE\e[0m"
sleep 1

echo -e "\e[36m Updating opensourcedesign.net now\e[0m"
git fetch
git rebase
echo -e $MSG_DONE
echo -e $LINE

# Special paths

cd jobs
echo -e $MSG_START
git fetch
git rebase
echo -e $MSG_DONE
echo -e $LINE
cd ../

# Actually Clone Things
for REPO in "${REPOS[@]}"
do
	if [[ ! -d "_$REPO" ]]; then
		echo -e "\e[34m The _\"$REPO\" repo is not installed\e[0m"
	else
		cd "_$REPO"
		echo -e $MSG_START
        git fetch
		git rebase
        echo -e $MSG_DONE
        cd ../
	fi
	echo -e "\e[94m$LINE\e[0m"
	sleep 1
done

# Print output
printf "\n"
echo -e "\e[34m  All OSD website repos updated, now get back to coding ;-)\e[0m"
printf "\n"
