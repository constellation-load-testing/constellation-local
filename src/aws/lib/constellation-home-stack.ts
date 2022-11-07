import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import { aws_timestream as timestream, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from 'constructs';
import * as path from "path"

export class ConstellationHomeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // ROLES
    // lambda role
    const lambdaRole = new iam.Role(this, "lambda-role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      roleName: "lambda-role"
    })

    // add dynamodb full access to lambdaRole - to review
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"))

    // add ECS full access to lambdaRole - to review
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonECS_FullAccess"))

    // create a timestream database
    const constellationTimestreamDB = new timestream.CfnDatabase(this, "constellation-timestream-db", {
      databaseName: "constellation-timestream-db",
      tags: [
        {
          key: "Name",
          value: "constellation-timestream-db",
        },
      ],
    });

    // resource policy for the database - removal upon cdk destroy
    constellationTimestreamDB.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // create an s3 bucket
    const constellationS3Bucket = new s3.Bucket(this, "constellation-s3-bucket", {
      bucketName: `constellation-s3-bucket-${this.account}-${this.region}`,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // create a dynamodb table
    const constellationDynamoDBTable = new dynamodb.Table(this, "constellation-dynamodb-table", {
      tableName: "constellation-dynamodb-table",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },

      // add other properties
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // resource policy for the table - removal upon cdk destroy
    constellationDynamoDBTable.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // create orchestrator lambda function
    const constellationOrchestratorLambda = new lambda.Function(this, "constellation-orchestrator-lambda", {
      functionName: "constellation-orchestrator-lambda",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../lambda/orchestrator")
      ),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
      timeout: Duration.seconds(30),
      environment: {
        HOME_REGION: this.region
      },
      // assign role
      role: lambdaRole,
    });
  }
}
