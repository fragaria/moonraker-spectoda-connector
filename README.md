# moonraker-spectoda-connector

## Instalation

### Prerequisites

- nodejs

# get the current directory + the name of the binary

```
#!/bin/bash

cd /home/pi/

git clone git@github.com:fragaria/moonraker-spectoda-connector.git

path=$(pwd)/moonraker-spectoda-connector/npm start
GROUP=$(id -gn)

content='[Unit]
Description=Bridge for connecting to Moonraker events Spectoda REST API
After=network.target

[Service]
User='"$USER"'
Group='"$GROUP"'
ExecStart='"$path"'
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=default.target'

# create the service file
echo "$content" |  tee /etc/systemd/system/moonraker-spectoda-node-connector.service > /dev/null

# reload the daemon
systemctl daemon-reload

# enable the service
systemctl enable --now moonraker-spectoda-node-connector
```

## Emited labels

### Klipper events

- kread - klipper ready
- kdisc - klipper disconnected
- kerro - klipper error
- kstup - klipper startup, klipper will be ready in a while

### Printer events

- stdby - printer is in standby
- print - printer is printing
- pause - printer is paused
- error - printer is in error state
- done - print is finished
- progr - percentage of print progress

### Conector event

- init - connector is initialized

## Moonraker config

```
# to moonraker.conf add this:

[update_manager moonraker-spectoda-node-connector]
type: git_repo
path: ~/moonraker-spectoda-node-connector
origin: https://github.com/fragaria/moonraker-spectoda-node-connector.git
primary_branch: main
enable_node_updates: True
managed_services:
    moonraker-spectoda-node-connector
```