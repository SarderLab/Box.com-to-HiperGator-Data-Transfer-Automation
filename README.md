# Box.com to HiperGator Data Transfer (Automation)

# Description

- This project automates transfer of files from box.com to HiPerGator. It has 1 Node.js file  "App.js" which when executed transfers all the content from the specified box folder to HiPerGator. This Node.js script utilizes the Box Node SDK to recursively download files and folders from specified Box folders. The script is designed to handle API rate limits gracefully by implementing a retry mechanism. It reads configuration from a JSON file and accepts folder IDs as command line arguments.

# Features
__Dynamic Configuration:__ The script reads and parses configuration from a specified JSON file, ensuring flexibility and easy maintenance.

__API Rate Limit Handling:__ In the event of API rate limit exceedance, the script intelligently retries the download after the specified waiting period, ensuring robust and reliable execution.

__Command Line Interface:__ Users can input folder IDs as command line arguments, allowing for seamless integration and customization.

__Recursive Download:__ It recursively downloads files and subfolders, maintaining the folder structure locally.

# Prerequisites
Before using this script, ensure you have the following:
- __Node.js:__ Make sure you have [Node.js](https://nodejs.org/en/download) installed on your machine.
- __Box Developer Account:__ You need a Box developer account with 2 Factor Authentication enabled and an application configured to use the Box API.
- __Configuration File:__ This is provided in the repository, alternatively it can be downloaded when creating a new application.

#  (Optional) To create an application in box.com use the following steps:
__NOTE:__ I have already created an application with the below settings which is configured to use the Box APIs.
- If you want to create a new application, follow the below steps. If not, directly proceed to __Setup__ section at the end of the file.  

## Setting up a new box application
### Setup with JWT
#### Prerequisites
To set up a Custom App using server-side authentication, you will need to ensure you have access the [Developer Console](https://trailblazer.app.box.com/developers/console) from your Box enterprise account.

### App creation steps
#### Navigate to the Developer Console
- Log into Box and go to the [Developer Console](https://trailblazer.app.box.com/developers/console). Select __Create New App__.
  
 #### Select application type
- Select Custom App from the list of application types. A modal will appear to prompt a selection for the next step.
  
![image](https://github.com/nikhilyerra/Box.com-to-HiperGator-Data-Transfer-Automation-/assets/43171275/1aeb8a36-42fa-463b-832f-a1ee28c7334a)

#### Provide basic application information
- Enter App Name.
- Select __Purpose__ as Automation or Integration.
- 
#### Select application authentication
- Select Server Authentication (with JWT) to verify application identity with a key pair and confirm with Create App.

![image](https://github.com/nikhilyerra/Box.com-to-HiperGator-Data-Transfer-Automation-/assets/43171275/1130f55a-6554-49c7-b15d-66ab3f09ef25)

#### Get the service account ID
- Make a note of the service account ID under the __Service Account Info__ from the  __General Settings__ tab of the newly created app.

<img width="563" alt="image" src="https://github.com/nikhilyerra/Box.com-to-HiperGator-Data-Transfer-Automation-/assets/43171275/413ba682-2dfa-40f3-8ea6-75de73a48ee0">

#### Public and Private key pair
- Once a Custom App is created using Server Authentication with JWT, a key pair can be generated via the configuration tab within the [Developer Console](https://trailblazer.app.box.com/developers/console).
- Navigate to the Developer Console where you can generate a configuration file. This file includes a public/private keypair and a number of other application details that are necessary for authentication.
- To generate this file, navigate to the Configuration tab of the Developer Console and scroll down to the __Add and Manage Public Keys__ section.

![image](https://github.com/nikhilyerra/Box.com-to-HiperGator-Data-Transfer-Automation-/assets/43171275/718373e0-9738-4233-9413-d3757947397f)

- Click the __Generate a Public/Private Keypair__ button to have Box generate a keypair you. This will trigger the download of a JSON configuration file that you can move to your application code.


### App Authorization
- Before the application can be used, a Box Admin (In our case it is 
_sarderp14@gmail.com_) needs to authorize the application within the Box Admin Console.
- Navigate to the Authorization tab for your application within the Developer Console.

![image](https://github.com/nikhilyerra/Box.com-to-HiperGator-Data-Transfer-Automation-/assets/43171275/c39676fa-ff65-4ce0-8070-a3920cac5faa)

- Click Review and Submit to send an email to your Box enterprise Admin for approval.

### Basic configuration 
#### Application Access
- Select __App Access Level__ as __App Access Only__.

#### Application Scopes
- Enable all the checkboxes under Application Scopes as follows:
  <img width="954" alt="image" src="https://github.com/nikhilyerra/Box.com-to-HiperGator-Data-Transfer-Automation-/assets/43171275/ec4ac00c-640e-4072-b08d-003fc0a0153a">


# Setup
- Clone the repository:

```
git clone https://github.com/SarderLab/Box.com-to-HiperGator-Data-Transfer-Automation.git
```
- Navigate to box_node folder in the repo.
```
cd Box.com-to-HiperGator-Data-Transfer-Automation/box_node
```

- Install dependencies:

```
npm install
```

# Usage
- Ensure that you have the necessary permissions to access and download files from the specified Box folders.
- For the folder you want to download, click on __Share__ button and add _AutomationUser_2190898_agAhA43IFF@boxdevedition.com_ (or any other service account ID) as a __Collaborator__ with Viewer Uploader or Editor Access.

<img width="384" alt="image" src="https://github.com/nikhilyerra/Box.com-to-HiperGator-Data-Transfer-Automation-/assets/43171275/9b90bba0-1c30-48c9-8c16-aff8bc30310c">

- Run the script using the following command:

```
node App.js folder_id_1 folder_id_2 folder_id_3 ... folder_id_n


```

The script will download files and folders recursively from the specified root folders on Box.


# Important Note

- Ensure that you have the necessary permissions to access and download files from the specified Box folders.



# Contributing
- Contributions are welcome! If you find issues or have suggestions for improvements, please open an issue or submit a pull request.


