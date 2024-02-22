"use strict";
const box = require("box-node-sdk");
const fs = require("fs");
const path = require("path");

// Ensure /log directory exists
const logDirectory = path.join(__dirname, 'log');
if (!fs.existsSync(logDirectory)){
    fs.mkdirSync(logDirectory);
}

// Read and parse configuration file
let configFile = fs.readFileSync("886013191_bsg1z1ys_config.json");
configFile = JSON.parse(configFile);

// Create a Box session
let session = box.getPreconfiguredInstance(configFile);
let client = session.getAppAuthClient("enterprise");
client._useIterators = true;

// Get folder IDs from the command line arguments (excluding the first two arguments which are node and script file paths)
let rootFolderIds = [];
let destinationPath = __dirname; // Default destination path is current directory

for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === "--destination") {
    if (process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) {
      destinationPath = process.argv[i + 1];
      i++; // Skip the next argument as it's the destination path
    }
  } else {
    rootFolderIds.push(process.argv[i]);
  }
}

// Get current timestamp for log file names
const timestamp = new Date().toISOString().replace(/[-:.]/g, '');

// Create log files for logs and errors in the /log directory
const logsFilePath = path.join(__dirname, `log/logs_${timestamp}.txt`);
let errorsFilePath; // Define errors file path

// Function to log messages to console and file
function log(message) {
  const formattedMessage = `[${new Date().toISOString()}] ${message}`;
  console.log(formattedMessage);
  fs.appendFileSync(logsFilePath, formattedMessage + '\n');
}

// Function to log errors to console and error file
function logError(error) {
  const formattedError = `[${new Date().toISOString()}] ${error}`;
  console.error(formattedError);
  if (!errorsFilePath) {
    errorsFilePath = path.join(__dirname, `log/errors_${timestamp}.txt`); // Define errors file path if not already defined
  }
  fs.appendFileSync(errorsFilePath, formattedError + '\n');
}

//Limit :The maximum number of items to return per page 
//Offset : The offset of the item at which to begin the response.
function fetchFolderInfo(folderId, offset = 0, limit = 1000) {
  return client.folders.get(folderId, { limit, offset })
    .then((folderInfo) => {
      return folderInfo;
    });
}

function downloadFilesRecursively(folderId, localFolderPath, downloadedFiles = []) {
  function downloadFiles(files) {
    let downloadPromises = files.map((file) => {
      if (!downloadedFiles.includes(file.id)) { // Check if file has already been downloaded
        return client.files.getReadStream(file.id, null).then((stream) => {
          let output = fs.createWriteStream(path.join(localFolderPath, file.name));
          stream.pipe(output);
          downloadedFiles.push(file.id); // Add file to downloaded files list
        });
      }
    });

    return Promise.all(downloadPromises);
  }

  function fetchAllFolderItems(folderId) {
    let allItems = [];

    function fetchItemsBatch(offset) {
      return fetchFolderInfo(folderId, offset, 1000)
        .then((folderInfo) => {
          let items = folderInfo.item_collection.entries;
          allItems = allItems.concat(items);

          if (items.length === 1000) {
            return fetchItemsBatch(offset + 1000);
          }
        });
    }

    return fetchItemsBatch(0)
      .then(() => allItems);
  }

  return fetchAllFolderItems(folderId)
    .then((allItems) => {
      let folders = allItems.filter((item) => item.type === "folder");
      let files = allItems.filter((item) => item.type === "file");

      log(`Downloading files from folder ID ${folderId}`);

      // Download only new files in the current folder
      let newFiles = files.filter((file) => !downloadedFiles.includes(file.id));
      let downloadFilesPromise = downloadFiles(newFiles);

      // Recursively download files from subfolders with their respective root folder
      let subfolderPromises = folders.map((subfolder) => {
        let subfolderLocalPath = path.join(localFolderPath, subfolder.name);
        if (!fs.existsSync(subfolderLocalPath)) {
          fs.mkdirSync(subfolderLocalPath);
        } 

        return downloadFilesRecursively(subfolder.id, subfolderLocalPath, downloadedFiles);
      });

      return Promise.all([downloadFilesPromise, ...subfolderPromises]);
    });
}

// Function to handle API rate limit errors and retry after the specified time
function handleRateLimitError(rootFolderId, retryAfter) {
  log(`Rate limit exceeded for root folder ID ${rootFolderId}. Retrying after ${retryAfter} seconds.`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, retryAfter * 1000);
  });
}

// Iterate through each root folder ID
rootFolderIds.forEach((rootFolderId) => {
  fetchFolderInfo(rootFolderId)
    .then((rootFolderInfo) => {
      // Create root local folder dynamically based on folder name
      const localRootPath = path.join(destinationPath, rootFolderInfo.name);
      fs.mkdirSync(localRootPath, { recursive: true });

      // Start downloading recursively with retry
      const retryDownload = (downloadedFiles) => { // Pass downloaded files list to retryDownload function
        return downloadFilesRecursively(rootFolderId, localRootPath, downloadedFiles)
          .then(() => {
            log(`Download completed successfully for root folder ID ${rootFolderId}`);
          })
          .catch((error) => {
            if (error.statusCode === 429 && error.response.headers['retry-after']) {
              // Retry after the specified time
              logError(`Rate Limit Exceeded: ${error}`);
              const retryAfter = parseInt(error.response.headers['retry-after'], 10);
              return handleRateLimitError(rootFolderId, retryAfter)
                .then(() => retryDownload(downloadedFiles)); // Pass downloaded files list to next retry attempt
            } else {
              // Log other errors
              logError(`Error downloading files for root folder ID ${rootFolderId}: ${error}`);
            }
          });
      };

      return retryDownload([]);
    })
    .catch((error) => {
      logError(`Error fetching root folder info for ID ${rootFolderId}: ${error}`);
    });
});

// Close the log files when the script ends
process.on('exit', () => {
  if (errorsFilePath) {
    fs.appendFileSync(errorsFilePath, '\n'); // Add an empty line at the end of the errors file
  }
});
