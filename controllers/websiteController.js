import { AmplifyClient, GetAppCommand } from "@aws-sdk/client-amplify";
import {
  Route53Client,
  ChangeResourceRecordSetsCommand,
} from "@aws-sdk/client-route-53";
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

const route53Client = new Route53Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

const DOMAIN_NAME = process.env.AWS_ROUTE_53_HOSTED_DOMAIN;
const HOSTED_ZONE_ID = process.env.AWS_ROUTE_53_HOSTED_ZONE_ID;

export const createWebsite = async (req, res) => {
  const { amplifyApp, subdomain: subdomainFromBody, name } = req.body;
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
    const amplifyDefaultDomain = appDetails.app.defaultDomain;

    if (!amplifyDefaultDomain) {
      return res.status(400).json({
        error: "Could not retrieve Amplify app default domain",
      });
    }

    const route53Params = {
      HostedZoneId: HOSTED_ZONE_ID,
      ChangeBatch: {
        Changes: [
          {
            Action: "UPSERT",
            ResourceRecordSet: {
              Name: fullDomain,
              Type: "CNAME",
              TTL: 300,
              ResourceRecords: [
                {
                  Value: amplifyDefaultDomain,
                },
              ],
            },
          },
        ],
        Comment: `Added subdomain ${subdomain} via API for user ${userId}`,
      },
    };

    const route53Command = new ChangeResourceRecordSetsCommand(route53Params);
    const route53Response = await route53Client.send(route53Command);

    const websiteContent = await WebsiteContent.create({
      name,
      user: userId,
      subdomain,
      template: template._id,
      content: template.structure,
    });

    res.json({
      message: `Website created at ${fullDomain}`,
      data: {
        websiteContent: websiteContent,
        amplifyDomainTarget: amplifyDefaultDomain,
        route53ChangeId: route53Response.ChangeInfo.Id,
        status: route53Response.ChangeInfo.Status,
      },
    });
  } catch (error) {
    console.error("Error creating website:", error);
    if (
      error.name === "InvalidChangeBatch" ||
      error.name === "BadRequestException"
    ) {
      return res.status(400).json({
        error: "Invalid subdomain configuration",
        details: error.message,
      });
    }
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
