import * as cdk from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import { Construct } from "constructs";
import path = require("path");

import * as ecrdeploy from "cdk-ecr-deployment";

export class EcrStack extends cdk.Stack {
  public readonly ecrRepositoryUri: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repo = new ecr.Repository(this, "TestRepoId", {
      repositoryName: "test-server",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const image = new DockerImageAsset(this, "CDKDockerImage", {
      directory: path.join(__dirname, "../../"),
    });

    new ecrdeploy.ECRDeployment(this, "DeployDockerImage", {
      src: new ecrdeploy.DockerImageName(image.imageUri),
      dest: new ecrdeploy.DockerImageName(`${repo.repositoryUri}:latest`),
    });

    // Output the ECR repository URI
    new cdk.CfnOutput(this, "ECRRepositoryUri", {
      value: repo.repositoryUri,
    });

    this.ecrRepositoryUri = repo.repositoryUri
  }
}
