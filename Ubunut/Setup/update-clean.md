# Ubuntu Developer Machine — Update & Safe Cleanup Guide

A safe maintenance guide for a fresh Ubuntu development machine used for:

* Next.js / React development
* KeyDir
* Keebforge
* Docker / Docker Compose
* Node.js / npm
* VS Code
* OpenCode
* Ponytail

---

## 1. Update Ubuntu

Update the package lists:

```bash
sudo apt update
```

Upgrade installed packages:

```bash
sudo apt full-upgrade -y
```

Remove packages that are no longer required:

```bash
sudo apt autoremove -y
```

Clean obsolete downloaded packages:

```bash
sudo apt autoclean
```

---

## 2. Check Whether a Reboot Is Required

Run:

```bash
[ -f /var/run/reboot-required ] && echo "REBOOT REQUIRED" || echo "No reboot required"
```

If a reboot is required:

```bash
sudo reboot
```

---

## 3. Clean APT Cache

Check the current cache size:

```bash
du -sh /var/cache/apt
```

Clean the APT cache:

```bash
sudo apt clean
```

> `apt clean` removes downloaded package files from the APT cache. It does not uninstall your applications.

---

# 4. Find Large Directories

Before deleting anything, inspect where disk space is being used.

## Home directory

```bash
du -h --max-depth=1 ~ | sort -h
```

Important directories to inspect:

```text
~/WORKSTATION
~/.cache
~/.npm
~/.config
~/.local
```

## System directories

```bash
sudo du -h --max-depth=1 / | sort -h
```

Do **not** blindly delete files from:

```text
/usr
/var
/opt
/etc
```

---

# 5. Check npm Cache

Verify the npm cache:

```bash
npm cache verify
```

Normally, do **not** run:

```bash
npm cache clean --force
```

The npm cache is useful and npm normally manages it automatically.

---

# 6. Check NVM and Node.js Versions

List installed Node versions:

```bash
nvm ls
```

Example:

```text
       v24.19.0
default -> lts/* -> v24.19.0
```

Check the active version:

```bash
node --version
npm --version
nvm current
```

Current setup:

```text
NVM     → 0.40.3
Node.js → 24.19.0
npm     → 11.17.0
```

## Remove unused Node versions

If old versions exist:

```bash
nvm uninstall VERSION
```

Example:

```bash
nvm uninstall 22
```

Do **not** remove the currently used Node version.

---

# 7. Docker Disk Usage

Docker can consume significant disk space when working with databases, Supabase, KeyDir, Keebforge, etc.

First inspect usage:

```bash
docker system df
```

List containers:

```bash
docker ps -a
```

List images:

```bash
docker images
```

List volumes:

```bash
docker volume ls
```

List networks:

```bash
docker network ls
```

## Important

Do **not** blindly run:

```bash
docker system prune -a --volumes
```

This can remove:

* unused images
* stopped containers
* unused networks
* unused volumes

A volume may contain important development database data.

Always inspect Docker usage first.

---

# 8. Check Snap Packages

List installed Snap packages:

```bash
snap list
```

To see disabled/old revisions:

```bash
snap list --all
```

Do not manually remove Snap packages unless you know they are unnecessary.

---

# 9. Check Failed System Services

Run:

```bash
systemctl --failed
```

Ideally, there should be no unexpected failed services.

If something appears, inspect it before attempting to remove or disable it.

---

# 10. Check Disk Space

Check all mounted filesystems:

```bash
df -h
```

Check the `/home` filesystem:

```bash
df -h /home
```

For a more readable overview:

```bash
df -hT
```

---

# 11. Check Your Developer Tools

After cleanup, verify the important development tools.

## Git

```bash
git --version
```

Check Git identity:

```bash
git config --global user.name
git config --global user.email
```

---

## Node.js

```bash
node --version
npm --version
nvm --version
```

---

## Docker

```bash
docker --version
docker compose version
```

Test Docker:

```bash
docker run hello-world
```

This should work without `sudo`.

---

## VS Code

```bash
code --version
```

---

## OpenCode

```bash
opencode --version
```

---

# 12. Recommended Developer Baseline

For this machine, keep the global environment relatively minimal:

```text
Ubuntu
├── Git
├── GitHub SSH
├── NVM
│   └── Node.js LTS
├── npm
├── Docker
├── Docker Compose
├── VS Code
├── OpenCode
└── Ponytail
```

Install project-specific dependencies inside the project rather than globally.

For example, avoid globally installing:

```text
Next.js
React
Prisma
Tailwind
TypeScript
ESLint
```

These should normally be managed by each project's `package.json`.

---

# 13. Next.js Projects

For an existing project such as Keebforge:

```bash
cd ~/WORKSTATION/GITHUB/KEEBFORGE/keebforge.in
```

Install its dependencies:

```bash
npm install
```

Then run:

```bash
npm run dev
```

Do not globally install Next.js just to fix:

```text
next: not found
```

That error normally means the project's dependencies have not been installed yet.

---

# 14. General Safe Cleanup Sequence

For normal Ubuntu maintenance, this is the recommended sequence:

```bash
sudo apt update
sudo apt full-upgrade -y
sudo apt autoremove -y
sudo apt autoclean
sudo apt clean
```

Then inspect:

```bash
df -h
```

Check Node:

```bash
nvm ls
```

Check Docker:

```bash
docker system df
```

Check failed services:

```bash
systemctl --failed
```

---

# 15. Things NOT to Blindly Delete

Avoid commands that aggressively delete system or development data, especially:

```bash
sudo rm -rf /usr/*
sudo rm -rf /var/*
sudo rm -rf /etc/*
```

Also avoid blindly running:

```bash
docker system prune -a --volumes
```

or:

```bash
rm -rf ~/.config/*
```

or:

```bash
rm -rf ~/.local/*
```

These locations can contain important application, Docker, development, or user configuration data.

---

# 16. Final Health Check

Run the following after maintenance:

```bash
echo "=== SYSTEM ==="
lsb_release -ds

echo
echo "=== KERNEL ==="
uname -r

echo
echo "=== GIT ==="
git --version

echo
echo "=== NODE ==="
node --version

echo
echo "=== NPM ==="
npm --version

echo
echo "=== NVM ==="
nvm --version

echo
echo "=== DOCKER ==="
docker --version

echo
echo "=== DOCKER COMPOSE ==="
docker compose version

echo
echo "=== VS CODE ==="
code --version | head -n 1

echo
echo "=== OPENCODE ==="
opencode --version

echo
echo "=== DISK ==="
df -h /

echo
echo "=== FAILED SERVICES ==="
systemctl --failed
```

---

# 17. Current Setup

The development machine currently has:

| Component      | Status         |
| -------------- | -------------- |
| Git            | Installed      |
| Git identity   | Configured     |
| NVM            | 0.40.3         |
| Node.js        | 24.19.0        |
| npm            | 11.17.0        |
| Docker         | 29.7.2         |
| Docker Compose | 5.5.0          |
| VS Code        | 1.134.0        |
| OpenCode       | 1.18.23        |
| Ponytail       | Cloned locally |

Ponytail is located at:

```text
~/WORKSTATION/GITHUB/ponytail
```

Its OpenCode plugin is:

```text
~/WORKSTATION/GITHUB/ponytail/.opencode/plugins/ponytail.mjs
```

For OpenCode, Ponytail supports using this local plugin checkout through `opencode.json`.

---

# Recommended Maintenance Philosophy

Keep the system clean, but **don't delete something simply because it looks unused**.

The preferred workflow is:

```text
UPDATE
   ↓
INSPECT
   ↓
IDENTIFY UNUSED DATA
   ↓
REMOVE ONLY WHAT IS SAFE
   ↓
VERIFY DEVELOPMENT TOOLS
```

This is especially important for Docker volumes and development databases used by KeyDir, Keebforge, and Supabase.
