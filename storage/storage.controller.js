// MODELS / TOOLS
const UserModel = require("../users/users.model");
const SetModel = require("../sets/sets.model");
const CardModel = require("../cards/cards.model");
const Validator = require("../tools/validator.tool");
const config = require("../config");
const _ = require("lodash");

// FILE MANAGEMENT STUFF 
const fs = require("fs"); 
const { promisify } = require("util");
const unlinkAsync = promisify(fs.unlink);

// AWS / DIGITAL OCEAN CONFIG
// Configure client for use with Spaces
const AWS = require("aws-sdk");
const spacesEndpoint = new AWS.Endpoint(config.storage_endpoint);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: config.storage_access_key,
  secretAccessKey: config.storage_secret_key,
});

exports.UploadFile = async (req, res) => {

  // console.log("UPLOAD FILE START");
  if (!req.body.path)
    return res.status(404).send({ error: `Missing File Path` });

  if (!req.file) return res.status(404).send({ error: "No file received" });
  
  // console.log("file received", {file: req.file});
  const digitalOceanFilePath = req.body.path; // change this to the relative path for sets, cards etc.

  // We need to read file as buffer in order to upload to S3
  fs.readFile(req.file.path, async (err, FileBuffer) => {
    if (err || !FileBuffer)
      return res.status(500).send({ error: "something is wrong with file" });

    const params = {
      Body: FileBuffer,
      Bucket: config.storage_bucket,
      ContentType: req.file.mimetype,
      Key: digitalOceanFilePath,
      ACL: "public-read",
    };
    try {
      await s3.putObject(params, function (err, data) {
        if (err) {
          console.log("ERROR: ", err, err.stack);
          return res
            .status(500)
            .send({
              error: "Something went wrong while uploading this file!",
            });
        } 

        unlinkAsync(req.file.path) // This deletes the temp file from local storage (which is stored as a buffer in the root/uploads folder)
        // Also incase an upload fails, the buffer gets saved in uploads so we can trace which files failed.

        //console.log("DATA: ", data);

        return res.status(200).send(
            {msg: "upload success:" + config.storage_bucket + "." + config.storage_endpoint + "/" + digitalOceanFilePath}
          );

      });
    } catch (e) {
      if (e) {
        console.log("ERROR: ", e, e.stack);
        return res.status(500)
          .send({ error: "Something went wrong while uploading this file!" });
      }
    }
  });
};

exports.DeleteFile = async (req, res) => {
  if (!req.body.path)
    return res.status(404).send({ error: `Missing File Path` });

  const digitalOceanFilePath = req.body.path; // change this to the relative path for sets, cards etc.
  
  const listingParams = {
    Bucket: config.storage_bucket,
  };

  const params = {
    Bucket: config.storage_bucket,
    Key: digitalOceanFilePath,
  };

  let checkImg = undefined;

  try {

     // check if file exists before trying to delete
     s3.listObjects(listingParams, async (err, data) => {
    
      // console.log(data.Contents.Key);
     checkImg = await _.find(data["Contents"], { Key: digitalOceanFilePath });

      if (err) {
        console.log(err, err.stack);
        return res.status(500).send({ error: "Failed To Delete File!" });
      } else if (!checkImg) {
        return res.status(404).send({ error: "That File Does Not Exist!" });
      }

      await s3.deleteObject(params, (e, deleteData) => {
        //console.log(e, deleteData);
        if (e) return res.status(500).send({ error: "Failed to delete!" });
        return res.status(200).send({msg: "Deleted File!"});
      });
      
    });

  } catch (e) {

    if (e) {
      console.log(e, e.stack);
      return res.status(500).send({ error: "Failed To Delete File!" });
    }

  }
  
};
