#!/bin/bash
# Wait for NetworkManager to fully initialize
sleep 5
# Force Wi-Fi on
nmcli radio wifi on
# Bring up the hotspot connection
nmcli connection up Hotspot
