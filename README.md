# moonraker-spectoda-connector

## Instalation

### Prerequisites

- nodejs

# get the current directory + the name of the binary

```
#!/bin/bash

sudo -v

NU=$(logname)

cd /home/pi/

sudo -u $NU git clone https://github.com/fragaria/moonraker-spectoda-connector.git
cd /home/pi/moonraker-spectoda-connector
sudo -u $NU npm ci

content='[Unit]
Description=Bridge for connecting to Moonraker events Spectoda REST API
After=network.target

[Service]
User=pi
Group=pi
WorkingDirectory=/home/pi/moonraker-spectoda-connector
ExecStart=node index.js
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=default.target'

# create the service file
echo "$content" |  tee /etc/systemd/system/moonraker-spectoda-connector.service > /dev/null

# reload the daemon
systemctl daemon-reload

# enable the service
systemctl enable --now moonraker-spectoda-connector
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

[update_manager moonraker-spectoda-connector]
type: git_repo
path: ~/moonraker-spectoda-connector
origin: https://github.com/fragaria/moonraker-spectoda-connector.git
primary_branch: main
enable_node_updates: True
managed_services:
    moonraker-spectoda-connector
```
