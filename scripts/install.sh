#! /bin/bash
# -----------------------------------------------------------------------------
# install.sh
# -----------------------------------------------------------------------------
# Clones all Open Source Design repositories used for the website and renames
# the repos as per what _config-dev.yml wants them to be named.
#
# To add/remove repos simply edit the "repos" array that starts on line 16
#
# :authors: Brennan Novak, AA0B28294A637731AD529F34E3E838B0D4EBE62A
# :license: BSD license
# :date 16 November 2016
# :version: 0.0.1
# -----------------------------------------------------------------------------

MSG_START="\e[36m 1. Getting code now\e[0m"
MSG_DONE="\e[34m 2. Done installing repo\e[0m"
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
echo -e "\e[97m                                     00xxxxxxx00                       "
echo -e "\e[97m                                  0x@@@@@@@@@@@@@x0                    "
echo -e "\e[97m                              0x@@@@@@@@@@@@@@@@@@@@x0                 "
sleep 1
echo -e "\e[37m                            x@@@@@@@@@@@@@@@@@@@@@@@@@@x0              "
echo -e "\e[37m                         0x@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@0            "
echo -e "\e[37m                        x@@@@@@@@@@@@@x0 @@@@@@@@@@@@@@@@@@@0          "
sleep 1
echo -e "\e[96m                      0@@@@@@@@@@@@@@0   @@@@@@@@@@@@@@@@@@@@0         "
echo -e "\e[96m                     0@@@@@@@@@@@@@@     0@@@@@@@@@@@@@@@@@@@@x        "
echo -e "\e[96m                     @@@@@@@@@@@@@@0       x@@@@@@@@@@@@@@@@@@@0       "
sleep 1
echo -e "\e[36m                    x@@@@@@@@@@@@@x           0x@@@@@@@@@@@@@@@@       "
echo -e "\e[36m                    @@@@@@@@@@@@@@0              @@@@@@@@@@@@@@@0      "
echo -e "\e[36m                    @@@@@@@@@@@@@@0              0@@@@@@@@@@@@@@0      "
sleep 1
echo -e "\e[94m                    @@@@@@@@@@@@@@x              0@@@@@@@@@@@@@@0      "
echo -e "\e[94m                    @@@@@@@@@@@@@@@0             x@@@@@@@@@@@@@@       "
echo -e "\e[94m                    0@@@@@@@@@@@@@@@0          0x@@@@@@@@@@@@@@x       "
echo -e "\e[94m                     x@@@@@@@@@@@@@@@@x      0@@@@@@@@@@@@@@@@@        "
sleep 1
echo -e "\e[34m                      x@@@@@@@@@@@@@@@0       @@@@@@@@@@@@@@@@0        "
echo -e "\e[34m                       x@@@@@@@@@@@@@0        0@@@@@@@@@@@@@x          "
echo -e "\e[34m                        0x@@@@@@@@@@x          0@@@@@@@@@@@0           "
echo -e "\e[34m                          0x@@@@@@@@            x@@@@@@@@0             "
echo -e "\e[34m                             0x@@@@              x@@@@x0               "
echo -e "\e[34m                               0x0                x0                   "
printf "\n"
sleep 1
echo -e "\e[34m                                 OPEN SOURCE DESIGN\e[0m"
printf "\n"
echo -e "\e[34m           Bringing great design to free software one pixel at a time.\e[0m"
sleep 1
printf "\n"
echo -e "\e[34m                  Now, let's get started cloning some repos!\e[0m"
printf "\n"
echo -e "\e[94m$LINE\e[0m"
sleep 1
echo -e "\e[34m Using username: ${USERNAME}\e[0m"
echo -e "\e[94m$LINE\e[0m"
sleep 1

# Special paths
if [[ ! -d "jobs" ]]; then
	echo -e $MSG_START
    git clone git@github.com:${USERNAME}/jobs.git jobs
    echo -e $MSG_DONE
else
    echo -e $MSG_EXISTS
fi

# Normal paths
for REPO in "${REPOS[@]}"
do
	if [[ ! -d "_${repo}" ]]; then
		repo_url="git@github.com:${USERNAME}/${REPO}.git"
		echo -e $MSG_START
		git clone $repo_url "_${REPO}"
		echo -e $MSG_DONE
	else
		echo -e $MSG_EXISTS
	fi
	echo -e "\e[94m$line\e[0m"
	sleep 1
done

# Print output
printf "\n"
echo -e "\e[34mHooray, you now have all OSD repos, now get coding ;-)\e[0m"
printf "\n"
