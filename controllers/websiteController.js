import { AmplifyClient, GetAppCommand } from "@aws-sdk/client-amplify";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";
dotenv.config();
import WebsiteContent from "../models/WebsiteContent.js";
import AdminTemplate from "../models/AdminTemplate.js";
import { toUrlFriendly } from "../utils/functions/url.js";

const amplifyClient = new AmplifyClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

const dynamoDBClient = new DynamoDBClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: "us-east-1", //dynamo location for subdomain mapping is different
});

const DOMAIN_NAME = process.env.AWS_ROUTE_53_HOSTED_DOMAIN;
const DYNAMODB_TABLE_NAME =
  process.env.DYNAMODB_TABLE_NAME || "SubdomainMappings";

export const createWebsite = async (req, res) => {
  const { amplifyApp, subdomain: subdomainFromBody, name, content } = req.body;
  const userId = req.user.id;

  try {
    const template = await AdminTemplate.findOne({ amplifyAppId: amplifyApp });
    if (!template) {
      return res.status(400).json({ error: "Invalid Amplify app" });
    }

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const subdomain = subdomainFromBody || toUrlFriendly(name);

    const existingWebsite = await WebsiteContent.findOne({ subdomain });
    if (existingWebsite) {
      return res.status(400).json({ error: "Subdomain already exists" });
    }

    if (!subdomain || !/^[a-z0-9-]+$/.test(subdomain)) {
      return res.status(400).json({
        error:
          "Invalid subdomain. Use only alphanumeric characters and hyphens",
      });
    }

    const fullDomain = `${subdomain}.${DOMAIN_NAME}`;

    const getAppCommand = new GetAppCommand({ appId: amplifyApp });
    const appDetails = await amplifyClient.send(getAppCommand);
    const amplifyDefaultDomain = `${appDetails.app.productionBranch.branchName}.${appDetails.app.defaultDomain}`;

    if (!amplifyDefaultDomain) {
      return res.status(400).json({
        error: "Could not retrieve Amplify app default domain",
      });
    }

    // Save to DynamoDB
    const dynamoParams = {
      TableName: DYNAMODB_TABLE_NAME,
      Item: {
        subdomain: { S: subdomain },
        amplifyUrl: { S: amplifyDefaultDomain },
      },
    };

    const dynamoCommand = new PutItemCommand(dynamoParams);
    await dynamoDBClient.send(dynamoCommand);

    const websiteContent = await WebsiteContent.create({
      name,
      user: userId,
      subdomain,
      template: template._id,
      content: content || template.structure,
    });

    res.json({
      domain: fullDomain,
      data: {
        websiteContent: websiteContent,
        amplifyDomainTarget: amplifyDefaultDomain,
      },
    });
  } catch (error) {
    console.error("Error creating website:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getWebsiteContent = async (req, res) => {
  const { subdomain } = req.params;

  try {
    if (!subdomain) {
      return res.status(400).json({ error: "Subdomain is required" });
    }

    const websiteContent = await WebsiteContent.findOne({ subdomain });

    if (!websiteContent) {
      return res.status(404).json({ error: "Website content not found" });
    }

    res.json({
      message: "Website content retrieved successfully",
      websiteContent,
    });
  } catch (error) {
    console.error("Error retrieving website content:", error);
    res.status(500).json({ error: error.message });
  }
};
