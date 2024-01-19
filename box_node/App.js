"use strict";
const box = require("box-node-sdk");
const fs = require("fs");
const path = require("path");

// Read and parse configuration file
let configFile = fs.readFileSync("886013191_bsg1z1ys_config.json");
configFile = JSON.parse(configFile);

// Create a Box session
let session = box.getPreconfiguredInstance(configFile);
let client = session.getAppAuthClient("enterprise");
client._useIterators = true;

// Get folder IDs from the command line arguments (excluding the first two arguments which are node and script file paths)
const rootFolderIds = process.argv.slice(2);

function fetchFolderInfo(folderId, offset = 0, limit = 1000) {
  return client.folders.get(folderId, { limit, offset })
    .then((folderInfo) => {
      return folderInfo;
    });
}

function downloadFilesRecursively(folderId, localFolderPath) {
  function downloadFiles(files) {
    let downloadPromises = files.map((file) => {
      return client.files.getReadStream(file.id, null).then((stream) => {
        let output = fs.createWriteStream(path.join(localFolderPath, file.name));
        stream.pipe(output);
      });
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

      console.log(`Downloading files from folder ID ${folderId}`);

      // Download files in the current folder
      let downloadFilesPromise = downloadFiles(files);

      // Recursively download files from subfolders with their respective root folder
      let subfolderPromises = folders.map((subfolder) => {
        let subfolderLocalPath = path.join(localFolderPath, subfolder.name);
        if (!fs.existsSync(subfolderLocalPath)) {
          fs.mkdirSync(subfolderLocalPath);
        } 

        return downloadFilesRecursively(subfolder.id, subfolderLocalPath);
      });

      return Promise.all([downloadFilesPromise, ...subfolderPromises]);
    });
}

// Function to handle API rate limit errors and retry after the specified time
function handleRateLimitError(rootFolderId, retryAfter) {
  console.log(`Rate limit exceeded for root folder ID ${rootFolderId}. Retrying after ${retryAfter} seconds.`);
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
      const localRootPath = path.join(__dirname, rootFolderInfo.name);
      fs.mkdirSync(localRootPath);

      // Start downloading recursively with retry
      const retryDownload = () => {
        return downloadFilesRecursively(rootFolderId, localRootPath)
          .then(() => {
            console.log(`Download completed successfully for root folder ID ${rootFolderId}`);
          })
          .catch((error) => {
            if (error.statusCode === 429 && error.response.headers['retry-after']) {
              // Retry after the specified time
              const retryAfter = parseInt(error.response.headers['retry-after'], 10);
              return handleRateLimitError(rootFolderId, retryAfter)
                .then(() => retryDownload());
            } else {
              // Log other errors
              console.error(`Error downloading files for root folder ID ${rootFolderId}:`, error);
            }
          });
      };

      return retryDownload();
    })
    .catch((error) => {
      console.error(`Error fetching root folder info for ID ${rootFolderId}:`, error);
    });
});
