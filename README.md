# YNAB Applet for Linux Mint's Cinnamon UI

## Overview
This applet will sit in your panel and notify you when transactions require your approval.

![image](https://user-images.githubusercontent.com/3085772/157668040-c12779bb-4fdc-4437-a0ec-67364ea925f1.png)

## Installation

- Download the zip from this page
- Unzip and extract into ~/.local/share/cinnamon/applets/ynab@kogs
- Enable the applet in System Settings -> Applets
- You can also access the Settings Screen from System Settings -> Applets or from the Applet's Context menu

## Configuration
- Open your [YNAB Developer Settings](https://app.youneedabudget.com/settings/developer) and generate a new Personal Access Token.
- Right-click on the YNAB Applet and enter your API Key
![image](https://user-images.githubusercontent.com/3085772/157667668-3ff1ea34-432f-41d3-9fcb-96f25028952e.png)

- You can either get the budget key from the URL when you open your budget in YNAB, or left-click on the YNAB Applet and pick your budget from the "Select Budget" list.

- You're good! This applet will connect to YNAB every hour and notify you if transactions require your approval.
