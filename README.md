# Webkiosk-Wrapper

[![Release](https://img.shields.io/badge/Release-1.0.0-green.svg)](https://github.com/ngudbhav/Webkiosk-Wrapper/releases)
[![Dependencies](https://img.shields.io/david/ngudbhav/Webkiosk-Wrapper.svg)](https://github.com/ngudbhav/Webkiosk-Wrapper/blob/master/package.json)
[![Downloads](https://img.shields.io/github/downloads/ngudbhav/Webkiosk-Wrapper/total.svg)](https://github.com/ngudbhav/Webkiosk-Wrapper/releases)
[![Last-Release](https://img.shields.io/github/release-date/ngudbhav/Webkiosk-Wrapper.svg)](https://github.com/ngudbhav/Webkiosk-Wrapper/releases)
[![Platforms](https://img.shields.io/badge/platform-win%20%7C%20deb%20%7C%20rpm-green.svg)](https://github.com/ngudbhav/Webkiosk-Wrapper/releases)

This software is made for students of Jaypee Institute of Information Technology(JIIT). The software is made to ease the process of browsing https://webkiosk.jiit.ac.in. Webkiosk is a one-stop portal where every student gets his academic/personal records including but not limited to grades, attendance and marks.

# Important

Please do not enter invalid credentials 3 times or more. This may lock down your account.

# Installing The App
```sh
Setup(64).exe => Full Windows install for 64-bit PCs
Setup(32).exe => Full Windows install for 32-bit PCs
Portable(64).exe => Unzip and run the exe (64-bit).
Portable(32).exe => Unzip and run the exe (32-bit).
Setup.deb => Installable on Debian distributions (Ubuntu, Kali, etc.)
Setup.rpm => Installable on Red Hat distributions (Fedora, etc.) 
```
# Installing on debian
```sh
//Install the software
sudo dpkg -i setup.deb
//Fix dependencies if any
sudo apt-get install -f
```

# Installing on fedora
```sh
//Install the software
sudo dnf install setup.rpm
```

# Running on Mac OS
```sh
//Directly run the software
Double click Webkiosk-Wrapper.app inside the extracted directory
```

# Starting The App
```sh
sudo npm install -g electron
git clone https://github.com/ngudbhav/Webkiosk-Wrapper.git
cd Webkiosk-Wrapper
npm install
npm start
```

# Do rate and give Feedback!

P.S. This app saves the credentials and all of the users data in System's %APPDATA% directory. NOTHING is collected by me.
