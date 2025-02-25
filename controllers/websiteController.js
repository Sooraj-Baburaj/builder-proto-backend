import {
  AmplifyClient,
  GetDomainAssociationCommand,
  UpdateDomainAssociationCommand,
  GetAppCommand,
} from "@aws-sdk/client-amplify";
import {
  Route53Client,
  ChangeResourceRecordSetsCommand,
} from "@aws-sdk/client-route-53";
import dotenv from "dotenv";
dotenv.config();
import Subdomain from "../models/Subdomain.js";
import WebsiteContent from "../models/WebsiteContent.js";
import AdminTemplate from "../models/AdminTemplate.js";

// Initialize AWS Clients
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

const DOMAIN_NAME = process.env.AWS_ROUTE_53_HOSTED_DOMAIN; // e.g., thequickanswers.online
const HOSTED_ZONE_ID = process.env.AWS_ROUTE_53_HOSTED_ZONE_ID;

export const createWebsite = async (req, res) => {
  const { amplifyApp, subdomain } = req.body;
  const userId = req.user.id;

  try {
    // Fetch the template associated with the Amplify app
    const template = await AdminTemplate.findOne({ amplifyAppId: amplifyApp });
    if (!template) {
      return res.status(400).json({ error: "Invalid Amplify app" });
    }

    // Check if subdomain already exists in database
    const existingSubdomain = await Subdomain.findOne({ subdomain });
    if (existingSubdomain) {
      return res.status(400).json({ error: "Subdomain already exists" });
    }

    // Create new Subdomain entry
    const newSubdomain = await Subdomain.create({
      user: userId,
      template: template._id,
      subdomain,
    });

    // Create Website Content from template structure
    await WebsiteContent.create({
      user: userId,
      subdomain: newSubdomain._id,
      template: template._id,
      content: template.structure,
    });

    // Validate subdomain format
    if (!subdomain || !/^[a-zA-Z0-9-]+$/.test(subdomain)) {
      return res.status(400).json({
        error:
          "Invalid subdomain. Use only alphanumeric characters and hyphens",
      });
    }

    // Construct the full domain
    const fullDomain = `${subdomain}.${DOMAIN_NAME}`; // e.g., app1.thequickanswers.online

    // Step 1: Get the Amplify app details to retrieve the default domain
    const getAppCommand = new GetAppCommand({ appId: amplifyApp });
    const appDetails = await amplifyClient.send(getAppCommand);
    const amplifyDefaultDomain = appDetails.app.defaultDomain; // e.g., d123456789abcd.amplifyapp.com

    if (!amplifyDefaultDomain) {
      return res.status(400).json({
        error: "Could not retrieve Amplify app default domain",
      });
    }

    // Step 2: Get existing domain association
    let domainDetails;
    try {
      const getDomainCommand = new GetDomainAssociationCommand({
        appId: amplifyApp,
        domainName: DOMAIN_NAME,
      });
      domainDetails = await amplifyClient.send(getDomainCommand);
    } catch (error) {
      if (error.name === "NotFoundException") {
        return res.status(400).json({
          error:
            "Domain not associated with this Amplify app. Please associate it manually first.",
        });
      }
      throw error;
    }

    // Step 3: Update domain association to include the new subdomain
    const existingSubdomains = domainDetails.domainAssociation.subDomains.map(
      (entry) => ({
        prefix: entry.subDomainSetting.prefix,
        branchName: entry.subDomainSetting.branchName,
      })
    );

    // #FIXME: Only 500 subdomains are allowed
    const newSubdomains = [
      ...existingSubdomains,
      { prefix: subdomain, branchName: "main" }, // Adjust branchName if needed
    ];

    const updateDomainCommand = new UpdateDomainAssociationCommand({
      appId: amplifyApp,
      domainName: DOMAIN_NAME,
      subDomainSettings: newSubdomains,
    });

    const updateResponse = await amplifyClient.send(updateDomainCommand);

    // Step 4: Update Route 53 with CNAME record for the new subdomain
    const route53Params = {
      HostedZoneId: HOSTED_ZONE_ID,
      ChangeBatch: {
        Changes: [
          {
            Action: "UPSERT",
            ResourceRecordSet: {
              Name: fullDomain, // e.g., app1.thequickanswers.online
              Type: "CNAME",
              TTL: 300,
              ResourceRecords: [
                {
                  Value: amplifyDefaultDomain, // Points to Amplify app domain (e.g., *.amplifyapp.com)
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

    res.json({
      message: `Website created at ${fullDomain}`,
      amplifyDomainTarget: amplifyDefaultDomain,
      amplifyAssociationArn:
        updateResponse.domainAssociation.domainAssociationArn,
      route53ChangeId: route53Response.ChangeInfo.Id,
      status: route53Response.ChangeInfo.Status,
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
